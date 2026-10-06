import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function audit(page: Page, label: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const heavy = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const report = heavy.map((v) => `${v.impact} ${v.id}: ${v.help}\n   ${v.nodes.slice(0, 4).map((n) => n.target.join(' ')).join('\n   ')}`).join('\n');
  expect(heavy, `${label}: schwere WCAG-Verstöße\n${report}`).toEqual([]);
  const minor = violations.filter((v) => !heavy.includes(v));
  if (minor.length) console.log(`${label}: ${minor.length} leichte Hinweise:`, minor.map((v) => v.id).join(', '));
}

test.describe('Barrierefreiheit (axe, WCAG 2.1 A/AA)', () => {
  test('Startseite ohne schwere Verstöße', async ({ page }) => {
    await page.goto('/');
    await audit(page, 'Startseite');
  });

  test('Formular im Fehlerzustand', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Anfrage senden/ }).click();
    await expect(page.locator('#kontakt .wpcf7-response-output')).toBeVisible();
    await audit(page, 'Formular (Fehler)');
  });

  test('geöffnetes Mobil-Menü', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'nur mobil');
    await page.goto('/');
    await page.getByRole('button', { name: /öffnen|open/i }).click();
    await expect(page.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('link', { name: 'FAQ' })).toBeVisible();
    await audit(page, 'Mobil-Menü');
  });

  test('Fokus ist sichtbar (Outline) auf Links und Buttons', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Tastatur-Test nur Desktop');
    await page.goto('/');
    await page.keyboard.press('Tab'); // Skip-Link
    for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
    const style = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const s = getComputedStyle(el);
      return { tag: el.tagName, width: parseFloat(s.outlineWidth), style: s.outlineStyle };
    });
    expect(style.style).not.toBe('none');
    expect(style.width).toBeGreaterThanOrEqual(2);
  });

  test('Bilder haben Alt-Text, Formularfelder haben Labels, Icons sind versteckt', async ({ page }) => {
    await page.goto('/');
    expect(await page.locator('img:not([alt])').count()).toBe(0);
    const unlabeled = await page.$$eval('#kontakt input:not([type=hidden]), #kontakt select, #kontakt textarea', (els) =>
      els.filter((e) => !(e as HTMLInputElement).labels?.length && !e.getAttribute('aria-label')).map((e) => e.id || e.getAttribute('name')),
    );
    expect(unlabeled).toEqual([]);
    const svgs = await page.$$eval('main svg, header svg', (els) => els.filter((e) => e.getAttribute('aria-hidden') !== 'true' || e.getAttribute('focusable') !== 'false').length);
    expect(svgs).toBe(0);
  });
});
