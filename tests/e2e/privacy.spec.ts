import { expect, test } from '@playwright/test';

/**
 * DSGVO: Die Startseite darf keine Requests an fremde Domains auslösen
 * (Google Fonts, Gravatar, s.w.org-Emojis, reCAPTCHA, CDNs, Tracking …) und keine Cookies setzen.
 */
test.describe('Datenschutz', () => {
  test('Startseite löst keine Requests an externe Domains aus (inkl. Formular-Interaktion)', async ({ page, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    const external: string[] = [];
    const all: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (!/^https?:/i.test(url)) return; // data:/blob: sind keine Netzwerk-Requests
      all.push(url);
      if (new URL(url).origin !== origin) external.push(url);
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    // Alles anstoßen, was lazy nachladen könnte
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 50));
      }
    });
    await page.getByLabel('Name *').fill('Test');
    await page.getByRole('button', { name: /Anfrage senden/ }).click();
    await page.waitForLoadState('networkidle');

    expect(all.length, 'es sollten Requests stattgefunden haben').toBeGreaterThan(5);
    expect(external, `Externe Requests:\n${external.join('\n')}`).toEqual([]);
  });

  test('Schriften kommen lokal als woff2 aus dem Theme', async ({ page }) => {
    const fonts: string[] = [];
    page.on('response', (res) => {
      if (/\.(woff2?|ttf|otf)(\?|$)/i.test(res.url())) fonts.push(res.url());
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    expect(fonts.length).toBeGreaterThan(0);
    for (const f of fonts) expect(f).toContain('/wp-content/themes/ecommerce-expert/assets/fonts/');
    const loaded = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')));
    expect(loaded).toEqual(expect.arrayContaining(['Schibsted Grotesk', 'JetBrains Mono']));
  });

  test('HTML enthält keine Verweise auf externe Hosts (außer SVG-Namespace)', async ({ page, baseURL }) => {
    const html = await (await page.request.get('/')).text();
    const hosts = new Set([...html.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map((m) => m[1].toLowerCase()));
    hosts.delete(new URL(baseURL!).hostname);
    hosts.delete('www.w3.org');
    expect([...hosts]).toEqual([]);
    for (const needle of ['fonts.googleapis.com', 'fonts.gstatic.com', 's.w.org', 'gravatar.com', 'recaptcha', 'wp-emoji']) {
      expect(html, needle).not.toContain(needle);
    }
  });

  test('keine Cookies und kein Web-Storage-Tracking → kein Cookie-Banner nötig', async ({ page, context }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    expect(await context.cookies()).toEqual([]);
    await expect(page.getByText(/Cookie(s)? (akzeptieren|zustimmen)/i)).toHaveCount(0);
  });
});
