import { expect, test } from '@playwright/test';

test.describe('Mobile Ansicht (390 px)', () => {
  test.skip(({ isMobile }) => !isMobile, 'nur im Projekt „mobile“');

  test('Seite hat kein horizontales Scrollen', async ({ page }) => {
    await page.goto('/');
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(clientWidth).toBe(390);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('alle Raster sind einspaltig', async ({ page }) => {
    await page.goto('/');
    for (const sel of ['.ee-grid-hero', '.ee-grid-2', '.ee-grid-3', '.ee-grid-4', '.ee-grid-about', '.ee-grid-contact', '.ee-form__grid']) {
      for (const el of await page.locator(sel).all()) {
        const cols = await el.evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(' ').length);
        expect(cols, `${sel} hat ${cols} Spalten`).toBe(1);
      }
    }
  });

  test('Navigation ist eingeklappt und lässt sich öffnen und schließen', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Hauptnavigation' });
    await expect(nav.getByRole('link', { name: 'Leistungen' })).toBeHidden();
    await page.getByRole('button', { name: /öffnen|open/i }).click();
    await expect(nav.getByRole('link', { name: 'Leistungen' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(nav.getByRole('link', { name: 'Leistungen' })).toBeHidden();
  });

  test('Tabelle scrollt horizontal im eigenen Container', async ({ page }) => {
    await page.goto('/');
    const fig = page.locator('#plattformen figure.ee-table');
    const { sw, cw } = await fig.evaluate((e) => ({ sw: e.scrollWidth, cw: e.clientWidth }));
    expect(sw).toBeGreaterThan(cw);
  });

  test('H1 und H2 haben die mobilen Größen (44 px / 34 px)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCSS('font-size', '44px');
    await expect(page.locator('#leistungen h2')).toHaveCSS('font-size', '34px');
  });

  test('Interaktive Elemente sind mindestens 44 px hoch', async ({ page }) => {
    await page.goto('/');
    const buttons = page.locator('.wp-block-button__link, .ee-btn, .wp-block-navigation__responsive-container-open');
    for (const b of await buttons.all()) {
      const h = await b.evaluate((e) => e.getBoundingClientRect().height);
      expect(h).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('Desktop Ansicht (1440 px)', () => {
  test.skip(({ isMobile }) => isMobile, 'nur im Projekt „desktop“');

  test('Container ist 1200 px breit, H1 76 px, H2 52 px, Sektionen 120 px Padding', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCSS('font-size', '76px');
    await expect(page.locator('#leistungen h2')).toHaveCSS('font-size', '52px');
    await expect(page.locator('#leistungen')).toHaveCSS('padding-top', '120px');
    await expect(page.locator('#leistungen')).toHaveCSS('padding-bottom', '120px');
    const box = await page.locator('#leistungen .ee-grid-4').boundingBox();
    expect(Math.round(box!.width)).toBe(1136); // 1200 px Container minus 2 × 32 px Gutter
  });

  test('Navigation ist ausgeklappt, Hamburger ist versteckt', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Hauptnavigation' });
    await expect(nav.getByRole('link')).toHaveText(['Leistungen', 'Plattformen', 'Ablauf', 'Über mich', 'FAQ']);
    await expect(page.locator('.wp-block-navigation__responsive-container-open')).toBeHidden();
  });

  test('Breakpoint 960 px: Navigation klappt ein, Raster werden zweispaltig', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await page.goto('/');
    await expect(page.locator('.wp-block-navigation__responsive-container-open')).toBeVisible();
    const cols = await page.locator('#leistungen .ee-grid-4').evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(' ').length);
    expect(cols).toBe(2);
    const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(sw).toBeLessThanOrEqual(cw);
  });
});
