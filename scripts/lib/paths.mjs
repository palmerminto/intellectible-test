import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const projectRoot = root;

export function getSupabaseBin() {
  const candidates = [
    join(root, 'node_modules', 'supabase', 'dist', 'supabase.js'),
    join(root, 'node_modules', '.bin', 'supabase'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}
