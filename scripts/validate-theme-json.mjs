// Validiert theme/ecommerce-expert/theme.json gegen das offizielle WordPress-Schema (lokale Kopie).
// Schema aktualisieren: curl -L -o scripts/schema/theme.schema.json https://schemas.wp.org/trunk/theme.json
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const schema = JSON.parse(readFileSync(join(root, 'scripts/schema/theme.schema.json'), 'utf8'));
const data = JSON.parse(readFileSync(join(root, 'theme/ecommerce-expert/theme.json'), 'utf8'));

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

if (!validate(data)) {
  console.error('theme.json ist nicht schema-konform:');
  for (const e of validate.errors) console.error(` - ${e.instancePath || '/'} ${e.message}`, e.params ? JSON.stringify(e.params) : '');
  process.exit(1);
}
if (data.version !== 3) {
  console.error('theme.json: version muss 3 sein.');
  process.exit(1);
}
console.log('theme.json ist gültig (Schema trunk, version 3).');
