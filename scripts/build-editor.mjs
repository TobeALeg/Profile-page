import fs from 'node:fs';
import { EDITOR_ASSETS } from '../online-editor/config.mjs';

fs.mkdirSync('online-editor/public', { recursive: true });
for (const file of EDITOR_ASSETS) {
  fs.copyFileSync(file, `online-editor/public/${file}`);
}
console.log('Prepared shared editor assets');
