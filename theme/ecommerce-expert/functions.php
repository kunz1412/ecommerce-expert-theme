<?php
/**
 * Theme-Funktionen für ecommerce-expert.de (Child-Theme von Twenty Twenty-Five).
 *
 * Ziele: Pattern-Kategorie, Block-Stile, saubere Styles, keine externen Requests (DSGVO),
 * Honeypot und Assets für Contact Form 7.
 *
 * @package ecommerce-expert
 */

// Direktaufruf verhindern.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registriert die Pattern-Kategorie des Themes.
 *
 * @return void
 */
function ecommerce_expert_register_pattern_category() {
	register_block_pattern_category(
		'ecommerce-expert',
		array(
			'label'       => 'ecommerce-expert',
			'description' => 'Sektionen der One-Pager-Startseite.',
		)
	);
}
add_action( 'init', 'ecommerce_expert_register_pattern_category' );

/**
 * Registriert die Button-Varianten „Hell“ und „Ghost“ (CSS in style.css).
 *
 * @return void
 */
function ecommerce_expert_register_block_styles() {
	register_block_style(
		'core/button',
		array(
			'name'  => 'ee-light',
			'label' => 'Hell',
		)
	);
	register_block_style(
		'core/button',
		array(
			'name'  => 'ee-ghost',
			'label' => 'Ghost',
		)
	);
}
add_action( 'init', 'ecommerce_expert_register_block_styles' );

/**
 * Lädt style.css des Child-Themes (Frontend und Editor).
 *
 * @return void
 */
function ecommerce_expert_enqueue_styles() {
	wp_enqueue_style(
		'ecommerce-expert-style',
		get_stylesheet_uri(),
		array(),
		wp_get_theme()->get( 'Version' )
	);
}
add_action( 'wp_enqueue_scripts', 'ecommerce_expert_enqueue_styles' );

/**
 * Theme-Unterstützung: Editor-Styles; Remote-Patterns von wordpress.org abschalten.
 *
 * @return void
 */
function ecommerce_expert_setup() {
	add_editor_style( 'style.css' );
	remove_theme_support( 'core-block-patterns' );
}
add_action( 'after_setup_theme', 'ecommerce_expert_setup', 20 );

/* -------------------------------------------------------------------------
 * DSGVO: keine externen Requests aus dem Frontend
 * ---------------------------------------------------------------------- */

/**
 * Entfernt Emoji-Skripte/-Styles, oEmbed-Skripte, Gravatar und weitere Kopfzeilen-Einträge.
 *
 * @return void
 */
function ecommerce_expert_disable_external_requests() {
	// Emojis (laden sonst Skript, Styles und s.w.org-Grafiken).
	remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
	remove_action( 'admin_print_scripts', 'print_emoji_detection_script' );
	remove_action( 'wp_print_styles', 'print_emoji_styles' );
	remove_action( 'admin_print_styles', 'print_emoji_styles' );
	remove_filter( 'the_content_feed', 'wp_staticize_emoji' );
	remove_filter( 'comment_text_rss', 'wp_staticize_emoji' );
	remove_filter( 'wp_mail', 'wp_staticize_emoji_for_email' );
	add_filter( 'emoji_svg_url', '__return_false' );

	// oEmbed-Discovery und -Host-Skript.
	remove_action( 'wp_head', 'wp_oembed_add_discovery_links' );
	remove_action( 'wp_head', 'wp_oembed_add_host_js' );

	// Überflüssige Einträge im <head>.
	remove_action( 'wp_head', 'rsd_link' );
	remove_action( 'wp_head', 'wlwmanifest_link' );
	remove_action( 'wp_head', 'wp_generator' );
	remove_action( 'wp_head', 'wp_shortlink_wp_head' );
	remove_action( 'wp_head', 'rest_output_link_wp_head' );
	remove_action( 'template_redirect', 'rest_output_link_header', 11 );
}
add_action( 'init', 'ecommerce_expert_disable_external_requests' );

/**
 * Entfernt TinyMCE-Emoji-Plugin.
 *
 * @param array $plugins Aktive TinyMCE-Plugins.
 * @return array
 */
function ecommerce_expert_disable_emoji_tinymce( $plugins ) {
	return is_array( $plugins ) ? array_diff( $plugins, array( 'wpemoji' ) ) : array();
}
add_filter( 'tinymce_plugins', 'ecommerce_expert_disable_emoji_tinymce' );

/**
 * Entfernt dns-prefetch auf s.w.org (kommt vom Emoji-Feature).
 *
 * @param array  $urls          URLs der Resource Hints.
 * @param string $relation_type Art des Hints.
 * @return array
 */
function ecommerce_expert_remove_dns_prefetch( $urls, $relation_type ) {
	if ( 'dns-prefetch' !== $relation_type ) {
		return $urls;
	}
	return array_filter(
		$urls,
		static function ( $url ) {
			$host = is_array( $url ) && isset( $url['href'] ) ? $url['href'] : $url;
			return false === strpos( (string) $host, 's.w.org' );
		}
	);
}
add_filter( 'wp_resource_hints', 'ecommerce_expert_remove_dns_prefetch', 10, 2 );

// Keine Gravatar-Abfragen.
add_filter( 'pre_option_show_avatars', '__return_zero' );

/**
 * Entfernt Dashboard-Widgets, die Daten von wordpress.org laden (Neuigkeiten, Events).
 *
 * @return void
 */
function ecommerce_expert_clean_dashboard() {
	remove_meta_box( 'dashboard_primary', 'dashboard', 'side' );
	remove_meta_box( 'dashboard_site_health', 'dashboard', 'normal' );
}
add_action( 'wp_dashboard_setup', 'ecommerce_expert_clean_dashboard' );

/* -------------------------------------------------------------------------
 * Contact Form 7
 * ---------------------------------------------------------------------- */

// Keine automatischen <p>/<br>: das Formular-Markup steuert das Layout selbst.
add_filter( 'wpcf7_autop_or_not', '__return_false' );

// Die Meldungen und Felder werden im Theme gestylt (style.css), nicht mit dem Plugin-CSS.
add_filter( 'wpcf7_load_css', '__return_false' );

/**
 * Lädt das CF7-Skript nur dort, wo das Formular liegt (Startseite).
 *
 * @return bool
 */
function ecommerce_expert_load_cf7_assets() {
	return is_front_page();
}
add_filter( 'wpcf7_load_js', 'ecommerce_expert_load_cf7_assets' );

/**
 * Honeypot: Ist das unsichtbare Feld „website“ befüllt, gilt die Anfrage als Spam.
 *
 * @param bool                  $spam       Bisheriges Spam-Urteil.
 * @param WPCF7_Submission|null $submission Aktuelle Einsendung.
 * @return bool
 */
function ecommerce_expert_cf7_honeypot( $spam, $submission = null ) {
	if ( $spam || ! $submission instanceof WPCF7_Submission ) {
		return $spam;
	}

	$value = $submission->get_posted_data( 'website' );
	if ( is_array( $value ) ) {
		$value = implode( '', $value );
	}

	if ( '' !== trim( (string) $value ) ) {
		$submission->add_spam_log(
			array(
				'agent'  => 'honeypot',
				'reason' => 'Honeypot-Feld "website" wurde ausgefüllt.',
			)
		);
		return true;
	}

	return $spam;
}
add_filter( 'wpcf7_spam', 'ecommerce_expert_cf7_honeypot', 10, 2 );

/* -------------------------------------------------------------------------
 * Barrierefreiheit
 * ---------------------------------------------------------------------- */

/**
 * Macht den horizontal scrollbaren Tabellenbereich per Tastatur bedienbar (WCAG 2.1.1)
 * und stellt sicher, dass Spaltenköpfe ein scope-Attribut haben.
 *
 * @param string $block_content Gerenderter Block.
 * @param array  $block         Block-Daten.
 * @return string
 */
function ecommerce_expert_table_a11y( $block_content, $block ) {
	if ( empty( $block['attrs']['className'] ) || false === strpos( $block['attrs']['className'], 'ee-table' ) ) {
		return $block_content;
	}

	$label     = isset( $block['attrs']['ariaLabel'] ) ? $block['attrs']['ariaLabel'] : 'Plattformvergleich (horizontal scrollbar)';
	$processor = new WP_HTML_Tag_Processor( $block_content );

	if ( $processor->next_tag( 'figure' ) ) {
		$processor->set_attribute( 'tabindex', '0' );
		$processor->set_attribute( 'role', 'region' );
		$processor->set_attribute( 'aria-label', $label );
	}
	while ( $processor->next_tag( 'th' ) ) {
		if ( null === $processor->get_attribute( 'scope' ) ) {
			$processor->set_attribute( 'scope', 'col' );
		}
	}

	return $processor->get_updated_html();
}
add_filter( 'render_block_core/table', 'ecommerce_expert_table_a11y', 10, 2 );
