// Vergleicht Sektionshöhen von design/reference.html und dem Theme (1440 px und 390 px).
// Die Referenz wird mit den lokalen woff2-Dateien gerendert (keine Google-Fonts-Requests).
// Aufruf: node scripts/compare-reference.mjs   (WordPress muss laufen)
import { chromium } from '@playwright/test';
import { dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fonts = pathToFileURL(join(root, 'theme/ecommerce-expert/assets/fonts')).href;
const refURL = pathToFileURL(join(root, 'design/reference.html')).href;
const themeURL = (process.env.WP_URL || 'http://localhost:8080') + '/';
const ids = ['top', 'leistungen', 'plattformen', 'ablauf', 'pakete', 'ueber-mich', 'faq', 'kontakt'];

const css = ['400', '500', '600', '700', '800']
  .map((w) => `@font-face{font-family:'Schibsted Grotesk';font-weight:${w};src:url('${fonts}/schibsted-grotesk-latin-${w}-normal.woff2')}`)
  .concat(['400', '500'].map((w) => `@font-face{font-family:'JetBrains Mono';font-weight:${w};src:url('${fonts}/jetbrains-mono-latin-${w}-normal.woff2')}`))
  .join('');

async function measure(page) {
  return page.evaluate((ids) => {
    const out = {};
    for (const id of ids) {
      const el = document.getElementById(id);
      out[id] = el ? Math.round(el.getBoundingClientRect().height) : null;
    }
    const sections = [...document.querySelectorAll('section, header, footer')];
    out.platformStrip = Math.round((document.querySelector('section[aria-label="Plattformen"], .ee-strip') || {getBoundingClientRect: () => ({height: 0})}).getBoundingClientRect().height);
    out.recht = Math.round((document.querySelector('section[aria-labelledby="recht-h"], #rechtssicher') || {getBoundingClientRect: () => ({height: 0})}).getBoundingClientRect().height);
    out.total = document.documentElement.scrollHeight;
    return out;
  }, ids);
}

const browser = await chromium.launch();
for (const [label, width] of [['1440 px', 1440], ['390 px', 390]]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  const ref = await ctx.newPage();
  await ref.route(/googleapis|gstatic/, (r) => r.abort());
  await ref.goto(refURL);
  await ref.addStyleTag({ content: css });
  await ref.evaluate(() => document.fonts.ready);
  await ref.evaluate(() => { document.querySelectorAll('details').forEach(() => {}); });
  const theme = await ctx.newPage();
  await theme.goto(themeURL, { waitUntil: 'networkidle' });
  const [a, b] = [await measure(ref), await measure(theme)];
  console.log(`\n== ${label} ==  (Höhe in px: Referenz | Theme | Δ)`);
  for (const k of [...ids, 'platformStrip', 'recht', 'total']) {
    const d = a[k] != null && b[k] != null ? b[k] - a[k] : '–';
    console.log(`${k.padEnd(14)} ${String(a[k]).padStart(6)} | ${String(b[k]).padStart(6)} | ${d}`);
  }
  await ctx.close();
}
await browser.close();
