<?php
/**
 * Legt das Kontaktformular "Kontakt" (Contact Form 7) an bzw. aktualisiert es. Idempotent.
 * Aufruf: wp eval-file /scripts/wp/create-contact-form.php
 */

if ( ! class_exists( 'WPCF7_ContactForm' ) ) {
	WP_CLI::error( 'Contact Form 7 ist nicht aktiv.' );
}

$title    = 'Kontakt';
$template = file_get_contents( __DIR__ . '/contact-form.txt' );
$template = str_replace( '{{PRIVACY_URL}}', esc_url( home_url( '/datenschutz/' ) ), $template );
$recipient = getenv( 'CONTACT_MAIL_TO' ) ? getenv( 'CONTACT_MAIL_TO' ) : get_option( 'admin_email' );

$existing = get_posts(
	array(
		'post_type'   => 'wpcf7_contact_form',
		'title'       => $title,
		'post_status' => 'any',
		'numberposts' => 1,
	)
);

$form = $existing
	? WPCF7_ContactForm::get_instance( $existing[0]->ID )
	: WPCF7_ContactForm::get_template(
		array(
			'locale' => 'de_DE',
			'title'  => $title,
		)
	);

$mail = $form->prop( 'mail' );
$mail['subject']            = 'Neue Projektanfrage von [your-name]';
$mail['sender']             = '[_site_title] <wordpress@' . wp_parse_url( home_url(), PHP_URL_HOST ) . '>';
$mail['recipient']          = $recipient;
$mail['additional_headers'] = 'Reply-To: [your-email]';
$mail['body']               = "Name: [your-name]\nE-Mail: [your-email]\nUnternehmen: [company]\nProjektart: [project-type]\nBudgetrahmen: [budget]\n\nNachricht:\n[your-message]\n\n-- \nGesendet über das Kontaktformular von [_site_url]";
$mail['use_html']           = false;

$messages = $form->prop( 'messages' );
$messages['accept_terms'] = 'Bitte bestätigen Sie die Datenschutzerklärung, um die Anfrage zu senden.';

$form->set_properties(
	array(
		'form'                => $template,
		'mail'                => $mail,
		'mail_2'              => array_merge( $form->prop( 'mail_2' ), array( 'active' => false ) ),
		'messages'            => $messages,
		'additional_settings' => "acceptance_as_validation: on\n",
	)
);
$form->set_title( $title );
$form->set_locale( 'de_DE' );
$id = $form->save();

WP_CLI::success( sprintf( 'Kontaktformular "%s" gespeichert (ID %d).', $title, $id ) );
