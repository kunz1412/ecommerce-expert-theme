// Kopiert die benötigten woff2-Dateien (Fontsource, Subset "latin") ins Theme.
// Aufruf: npm run fonts  – die Ergebnisse werden committet, das Theme braucht keinen Build.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'theme/ecommerce-expert/assets/fonts');
mkdirSync(target, { recursive: true });

const files = {
  '@fontsource/schibsted-grotesk': [400, 500, 600, 700, 800].map((w) => `schibsted-grotesk-latin-${w}-normal.woff2`),
  '@fontsource/jetbrains-mono': [400, 500].map((w) => `jetbrains-mono-latin-${w}-normal.woff2`),
};

for (const [pkg, list] of Object.entries(files)) {
  for (const name of list) {
    copyFileSync(join(root, 'node_modules', pkg, 'files', name), join(target, name));
    console.log('→', name);
  }
}
