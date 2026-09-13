import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('Running smoke test...');

if (!fs.existsSync(path.join(rootDir, 'index.html'))) {
  console.error('Missing index.html');
  process.exit(1);
}

if (!fs.existsSync(path.join(rootDir, 'package.json'))) {
  console.error('Missing package.json');
  process.exit(1);
}

console.log('Smoke test passed successfully.');
