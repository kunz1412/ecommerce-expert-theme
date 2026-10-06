<?php
/**
 * Plugin Name: ecommerce-expert Mailversand (SMTP)
 * Description: Versendet alle WordPress-Mails per SMTP (Zugangsdaten aus Umgebungsvariablen) und setzt den Formular-Empfänger.
 * Version: 1.0.0
 * Author: Daniel Kunz
 * License: GPL-2.0-or-later
 *
 * Umgebungsvariablen: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, CONTACT_MAIL_TO.
 * Ohne SMTP_HOST wird nichts versendet – es gibt bewusst keinen Fallback auf PHP mail().
 *
 * @package ecommerce-expert
 */

// Direktaufruf verhindern.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Liest eine Umgebungsvariable (leere Werte zählen als nicht gesetzt).
 *
 * @param string $name    Name der Variable.
 * @param string $fallback Rückgabewert, wenn nicht gesetzt.
 * @return string
 */
function ecommerce_expert_env( $name, $fallback = '' ) {
	$value = getenv( $name );
	return ( false === $value || '' === $value ) ? $fallback : $value;
}

/**
 * Konfiguriert PHPMailer für SMTP.
 *
 * Port 465 = implizites TLS (SMTPS), Port 587 = STARTTLS, andere Ports (z. B. Mailpit 1025) ohne Verschlüsselung.
 *
 * @param PHPMailer\PHPMailer\PHPMailer $phpmailer PHPMailer-Instanz.
 * @return void
 */
function ecommerce_expert_phpmailer_init( $phpmailer ) {
	$host = ecommerce_expert_env( 'SMTP_HOST' );
	if ( '' === $host ) {
		return; // Wird durch pre_wp_mail unten ohnehin nicht erreicht.
	}

	$port = (int) ecommerce_expert_env( 'SMTP_PORT', '587' );
	$user = ecommerce_expert_env( 'SMTP_USER' );
	$from = ecommerce_expert_env( 'SMTP_FROM' );

	$phpmailer->isSMTP();
	$phpmailer->Host     = $host; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	$phpmailer->Port     = $port; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	$phpmailer->SMTPAuth = '' !== $user; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

	if ( '' !== $user ) {
		$phpmailer->Username = $user; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$phpmailer->Password = ecommerce_expert_env( 'SMTP_PASS' ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	}

	if ( 465 === $port ) {
		$phpmailer->SMTPSecure = 'ssl'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	} elseif ( 587 === $port ) {
		$phpmailer->SMTPSecure = 'tls'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	} else {
		$phpmailer->SMTPSecure  = ''; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$phpmailer->SMTPAutoTLS = false; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	}

	// Absender immer von der eigenen Domain (SPF/DKIM/DMARC); Reply-To bleibt der Formular-Absender.
	if ( is_email( $from ) ) {
		$phpmailer->setFrom( $from, wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ), false );
		$phpmailer->Sender = $from; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	}
}
add_action( 'phpmailer_init', 'ecommerce_expert_phpmailer_init' );

/**
 * Kein Versand per mail(): Ist SMTP nicht konfiguriert, wird die Mail verworfen und protokolliert.
 *
 * @param null|bool $result Bisheriger Rückgabewert (null = weiter versenden).
 * @param array     $atts   Mail-Argumente.
 * @return null|bool
 */
function ecommerce_expert_block_mail_without_smtp( $result, $atts ) {
	if ( '' !== ecommerce_expert_env( 'SMTP_HOST' ) ) {
		return $result;
	}

	$subject = isset( $atts['subject'] ) ? $atts['subject'] : '';
	error_log( sprintf( '[ecommerce-expert] Mail "%s" nicht versendet: SMTP_HOST ist nicht gesetzt.', $subject ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	return false;
}
add_filter( 'pre_wp_mail', 'ecommerce_expert_block_mail_without_smtp', 10, 2 );

/**
 * Setzt den Empfänger des Kontaktformulars aus CONTACT_MAIL_TO (Env hat Vorrang vor dem Wert in der Datenbank).
 *
 * @param array $components Mail-Bestandteile (subject, sender, body, recipient, additional_headers, attachments).
 * @param mixed $form       Formular (WPCF7_ContactForm).
 * @param mixed $mail       Mail-Objekt (WPCF7_Mail).
 * @return array
 */
function ecommerce_expert_cf7_recipient( $components, $form = null, $mail = null ) {
	$to = ecommerce_expert_env( 'CONTACT_MAIL_TO' );
	if ( is_email( $to ) && is_object( $mail ) && method_exists( $mail, 'name' ) && 'mail' === $mail->name() ) {
		$components['recipient'] = $to;
	}
	return $components;
}
add_filter( 'wpcf7_mail_components', 'ecommerce_expert_cf7_recipient', 10, 3 );

/**
 * Platzhalter wie „[BUDGET-STUFE 1]“ stehen im Formular als HTML-Entities (eckige Klammern brechen CF7-Tags).
 * In Klartext-Mails werden sie wieder in Zeichen umgewandelt.
 *
 * @param string $replaced Ersetzter Wert.
 * @param string $submitted Abgesendeter Wert.
 * @param bool   $html      Ob die Mail als HTML versendet wird.
 * @param mixed  $mail_tag  Mail-Tag (WPCF7_MailTag).
 * @return string
 */
function ecommerce_expert_cf7_decode_budget( $replaced, $submitted, $html, $mail_tag ) {
	if ( ! $html && is_object( $mail_tag ) && method_exists( $mail_tag, 'field_name' ) && 'budget' === $mail_tag->field_name() ) {
		return html_entity_decode( $replaced, ENT_QUOTES, 'UTF-8' );
	}
	return $replaced;
}
add_filter( 'wpcf7_mail_tag_replaced', 'ecommerce_expert_cf7_decode_budget', 10, 4 );

/**
 * Standard-Absender (z. B. Passwort-Reset): SMTP_FROM statt „wordpress@<host>“, das PHPMailer lokal ablehnt.
 *
 * @param string $from_email Bisherige Absenderadresse.
 * @return string
 */
function ecommerce_expert_mail_from( $from_email ) {
	$from = ecommerce_expert_env( 'SMTP_FROM' );
	return is_email( $from ) ? $from : $from_email;
}
add_filter( 'wp_mail_from', 'ecommerce_expert_mail_from' );
