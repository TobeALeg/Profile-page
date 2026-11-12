import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

// One Node process owns this file. A save is acknowledged only after durable replacement.
export class DraftStore {
  constructor(filename) {
    if (!filename) throw new Error('A persistent draft file is required');
    this.filename = filename;
    fs.mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
    try { this.value = JSON.parse(fs.readFileSync(filename, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; this.value = null; }
  }

  update(change) {
    const next = change(structuredClone(this.value));
    const temporary = `${this.filename}.${randomUUID()}.tmp`;
    try {
      const file = fs.openSync(temporary, 'wx', 0o600);
      try { fs.writeFileSync(file, JSON.stringify(next)); fs.fsyncSync(file); }
      finally { fs.closeSync(file); }
      fs.renameSync(temporary, this.filename);
      const directory = fs.openSync(path.dirname(this.filename), 'r');
      try { fs.fsyncSync(directory); } finally { fs.closeSync(directory); }
      this.value = next;
    } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
    return this.value;
  }
}
