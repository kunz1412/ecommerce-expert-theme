import { expect, test } from '@playwright/test';

const anchors = ['leistungen', 'plattformen', 'ablauf', 'ueber-mich', 'faq', 'kontakt'];

test.describe('Anker-Navigation', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto('/');
    // Auf kleinen Displays steckt die Navigation hinter dem Menü-Button
    if (testInfo.project.name === 'mobile') {
      await page.getByRole('button', { name: /Menü öffnen|Menu öffnen|open menu/i }).click();
    }
  });

  for (const id of anchors.filter((a) => a !== 'kontakt')) {
    test(`Link springt zu #${id}`, async ({ page }) => {
      const nav = page.getByRole('navigation', { name: 'Hauptnavigation' });
      await nav.locator(`a[href$="#${id}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect(page.locator(`#${id}`)).toBeInViewport();
      // Sticky Header darf die Überschrift nicht verdecken
      const headerBottom = await page.locator('.ee-site-header').evaluate((el) => el.getBoundingClientRect().bottom);
      const top = await page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().top);
      expect(top).toBeGreaterThanOrEqual(headerBottom - 2);
    });
  }
});

test('CTA „Projekt anfragen“ und Hero-Buttons führen zu den Zielen', async ({ page }) => {
  await page.goto('/');
  await page.locator('.ee-site-header').getByRole('link', { name: 'Projekt anfragen' }).click();
  await expect(page).toHaveURL(/#kontakt$/);
  await expect(page.locator('#kontakt')).toBeInViewport();

  await page.goto('/');
  await page.locator('#top').getByRole('link', { name: 'Leistungen ansehen' }).click();
  await expect(page).toHaveURL(/#leistungen$/);
  await expect(page.locator('#leistungen')).toBeInViewport();
});

test('Header bleibt beim Scrollen sichtbar (sticky)', async ({ page }) => {
  await page.goto('/');
  await page.locator('#faq').scrollIntoViewIfNeeded();
  await expect(page.locator('.ee-site-header')).toBeInViewport({ ratio: 1 });
});

test('Smooth Scroll ist aktiv, außer bei reduzierter Bewegung', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'smooth');
  await ctx.close();

  const ctx2 = await browser.newContext({ reducedMotion: 'reduce' });
  const page2 = await ctx2.newPage();
  await page2.goto('/');
  await expect(page2.locator('html')).toHaveCSS('scroll-behavior', 'auto');
  await ctx2.close();
});
