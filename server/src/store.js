import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(__dirname, '..');
export const dataDir = process.env.DATA_DIR ? path.join(root, 'data') : path.resolve(__dirname, '../data');
export const uploadDir = process.env.DATA_DIR ? path.join(root, 'uploads') : path.resolve(__dirname, '../uploads');
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });

const catalogue = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../shared/projects.json'), 'utf8'));
export const getCatalogue = () => catalogue;

// Append-only JSON lines: simple and crash-safe enough for a prototype. Swap for a database later.
export function append(file, record) {
  const row = { id: randomUUID(), createdAt: new Date().toISOString(), ...record };
  fs.appendFileSync(path.join(dataDir, file), JSON.stringify(row) + '\n');
  return row;
}

export function readAll(file) {
  const p = path.join(dataDir, file);
  if (!fs.existsSync(p)) return [];
  return fs
    .readFileSync(p, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l))
    .reverse();
}
