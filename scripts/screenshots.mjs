// Erstellt Vergleichs-Screenshots (Theme vs. design/reference.html) bei 1440 px und 390 px.
// Aufruf: npm run screenshots   (WordPress muss unter WP_URL laufen)
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'screenshots');
mkdirSync(out, { recursive: true });
const baseURL = process.env.WP_URL || 'http://localhost:8080';

const browser = await chromium.launch();
for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(baseURL + '/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(out, `theme-${name}.png`), fullPage: true });
  console.log(`theme-${name}.png`);
  await ctx.close();
}
await browser.close();
