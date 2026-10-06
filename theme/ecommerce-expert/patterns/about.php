<?php
/**
 * Title: Über mich
 * Slug: ecommerce-expert/about
 * Categories: ecommerce-expert
 * Description: Sektion 06 mit Porträt (Graustufen), Text und Skill-Chips.
 *
 * @package ecommerce-expert
 */

?>
<!-- wp:group {"tagName":"section","anchor":"ueber-mich","align":"full","className":"ee-section","backgroundColor":"soft","style":{"spacing":{"padding":{"top":"var:preset|spacing|90","bottom":"var:preset|spacing|90"}}},"layout":{"type":"constrained","contentSize":"1136px"}} -->
<section id="ueber-mich" class="wp-block-group alignfull ee-section has-soft-background-color has-background" style="padding-top:var(--wp--preset--spacing--90);padding-bottom:var(--wp--preset--spacing--90)"><!-- wp:group {"className":"ee-grid-about"} -->
<div class="wp-block-group ee-grid-about"><!-- wp:group {"className":"ee-about__media"} -->
<div class="wp-block-group ee-about__media"><!-- wp:image {"aspectRatio":"4/5","scale":"cover","sizeSlug":"full","linkDestination":"none","className":"ee-portrait"} -->
<figure class="wp-block-image size-full ee-portrait"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/portrait.jpg' ) ); ?>" alt="Porträt von Daniel Kunz" style="aspect-ratio:4/5;object-fit:cover" width="800" height="800"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph {"textColor":"paper","backgroundColor":"ink","className":"ee-portrait-label"} -->
<p class="ee-portrait-label has-paper-color has-ink-background-color has-text-color has-background">Fachinformatiker · Anwendungsentwicklung</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group -->
<div class="wp-block-group"><!-- wp:paragraph {"textColor":"muted","className":"ee-eyebrow"} -->
<p class="ee-eyebrow has-muted-color has-text-color">06 — Über mich</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"style":{"spacing":{"margin":{"bottom":"28px"}}}} -->
<h2 class="wp-block-heading" style="margin-bottom:28px">Hallo, ich bin Daniel.</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"textColor":"dark-line","fontSize":"18","style":{"spacing":{"margin":{"bottom":"18px"}}}} -->
<p class="has-dark-line-color has-text-color has-18-font-size" style="margin-bottom:18px">Ich entwickle seit 2016 Software für das Web. In einer E-Commerce-Agentur habe ich Online-Shops mit Shopware und commercetools umgesetzt, Microservices in der Google Cloud gebaut und REST-APIs für Frontend- und Mobile-Anwendungen entwickelt.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"textColor":"dark-line","fontSize":"18","style":{"spacing":{"margin":{"bottom":"36px"}}}} -->
<p class="has-dark-line-color has-text-color has-18-font-size" style="margin-bottom:36px">Diese Erfahrung bringe ich jetzt direkt zu Ihnen: ein fester Ansprechpartner statt wechselnder Teams, Code-Reviews und automatisierte Tests als Standard – und Projekte auf Deutsch, Englisch oder Spanisch.</p>
<!-- /wp:paragraph -->

<!-- wp:group {"className":"ee-chips"} -->
<div class="wp-block-group ee-chips">
<!-- wp:paragraph {"className":"ee-chip"} -->
<p class="ee-chip">PHP · Symfony</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"ee-chip"} -->
<p class="ee-chip">TypeScript</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"ee-chip"} -->
<p class="ee-chip">Next.js · React</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"ee-chip"} -->
<p class="ee-chip">Nuxt · Vue 3</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"ee-chip"} -->
<p class="ee-chip">Google Cloud</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"ee-chip"} -->
<p class="ee-chip">REST-APIs</p>
<!-- /wp:paragraph -->

</div>
<!-- /wp:group --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></section>
<!-- /wp:group -->
