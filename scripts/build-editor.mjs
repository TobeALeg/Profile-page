import fs from 'node:fs';

fs.mkdirSync('online-editor/public', { recursive: true });
for (const file of ['local-editor.js', 'local-editor.css', 'local-modules.mjs', 'module-copy.mjs']) {
  fs.copyFileSync(file, `online-editor/public/${file}`);
}
console.log('Prepared shared editor assets');
