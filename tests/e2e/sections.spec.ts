import { expect, test } from '@playwright/test';

const sections = [
  { id: 'top', heading: /Online-Shops, die verkaufen/ },
  { id: 'leistungen', heading: /Vom ersten Entwurf bis zum laufenden Shop/ },
  { id: 'plattformen', heading: /Welche Plattform passt zu Ihrem Geschäft/ },
  { id: 'ablauf', heading: /Klar strukturiert, ohne Überraschungen/ },
  { id: 'rechtssicher', heading: /Technisch sauber nach EU-Vorgaben/ },
  { id: 'pakete', heading: /Transparente Preise als Orientierung/ },
  { id: 'ueber-mich', heading: /Hallo, ich bin Daniel/ },
  { id: 'faq', heading: /Häufige Fragen/ },
  { id: 'kontakt', heading: /Lassen Sie uns über Ihr Projekt sprechen/ },
];

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('Seite hat lang="de" und genau eine H1', async ({ page }) => {
  await expect(page.locator('html')).toHaveAttribute('lang', /^de/);
  await expect(page.locator('h1')).toHaveCount(1);
});

for (const { id, heading } of sections) {
  test(`Sektion #${id} rendert mit Überschrift`, async ({ page }) => {
    const section = page.locator(`#${id}`);
    await expect(section).toBeVisible();
    await expect(section.getByRole('heading', { name: heading })).toBeVisible();
  });
}

test('Header, Plattform-Leiste, Footer und Landmarks sind vorhanden', async ({ page }) => {
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
  const strip = page.locator('.ee-strip');
  for (const name of ['WordPress', 'WooCommerce', 'Shopify', 'Shopware', 'commercetools']) {
    await expect(strip.getByText(name, { exact: true })).toBeVisible();
  }
  const footer = page.getByRole('contentinfo');
  await expect(footer).toContainText('© 2026 Daniel Kunz · ecommerce-expert.de');
  await expect(footer.getByRole('navigation', { name: 'Rechtliches' }).getByRole('link')).toHaveText([
    'Impressum',
    'Datenschutz',
    'Barrierefreiheit',
  ]);
});

test('Überschriften-Hierarchie überspringt keine Ebene', async ({ page }) => {
  const levels = await page.$$eval('h1, h2, h3, h4, h5, h6', (els) => els.map((e) => Number(e.tagName[1])));
  expect(levels[0]).toBe(1);
  levels.slice(1).forEach((level, i) => expect(level - levels[i], `Sprung bei Überschrift ${i + 2}`).toBeLessThanOrEqual(1));
});

test('Platzhalter bleiben als Platzhalter stehen', async ({ page }) => {
  const text = await page.locator('main').innerText();
  for (const p of ['[PREIS]', '[ANZAHL]', '[E-MAIL]', '[ZEITRAUM]']) expect(text).toContain(p);
  const budget = await page.locator('#f-budget option').allInnerTexts();
  expect(budget).toEqual(['Noch unklar', '[BUDGET-STUFE 1]', '[BUDGET-STUFE 2]', '[BUDGET-STUFE 3]']);
});

test('Plattform-Tabelle: 5 Zeilen, Spaltenköpfe mit scope, per Tastatur scrollbar', async ({ page }) => {
  const table = page.locator('#plattformen table');
  await expect(table.locator('tbody tr')).toHaveCount(5);
  await expect(table.locator('thead th[scope="col"]')).toHaveCount(4);
  await expect(page.locator('#plattformen figure.ee-table')).toHaveAttribute('tabindex', '0');
});

test('FAQ: Details-Akkordeon, erste Frage offen, Umschalten funktioniert', async ({ page }) => {
  const items = page.locator('#faq details');
  await expect(items).toHaveCount(5);
  await expect(items.first()).toHaveAttribute('open', '');
  await items.nth(1).locator('summary').click();
  await expect(items.nth(1)).toHaveAttribute('open', '');
});

test('Porträt hat Alt-Text und ist in Graustufen', async ({ page }) => {
  const img = page.locator('#ueber-mich img');
  await expect(img).toHaveAttribute('alt', 'Porträt von Daniel Kunz');
  await expect(img).toHaveCSS('filter', /grayscale\(1\)/);
});
