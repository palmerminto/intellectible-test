#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getSupabaseBin, projectRoot } from './lib/paths.mjs';

const root = projectRoot;

function runSupabase(args, options = {}) {
  const supabaseBin = getSupabaseBin();

  if (!supabaseBin) {
    console.error('[supabase] CLI not found. Run `npm install` first.');
    process.exit(1);
  }

  return spawnSync(supabaseBin, args, {
    cwd: root,
    encoding: 'utf8',
    ...options,
  });
}

function ensureSeedFile() {
  const seedPath = join(root, 'supabase', 'seed.sql');

  if (!existsSync(seedPath)) {
    writeFileSync(seedPath, '-- No seed data for local development.\n', 'utf8');
  }
}

function ensureSupabaseInit() {
  const configPath = join(root, 'supabase', 'config.toml');

  if (existsSync(configPath)) {
    return;
  }

  const result = runSupabase(['init'], { stdio: 'inherit' });

  if (result.status !== 0) {
    console.warn('[supabase] init failed; run `npm run supabase:init` manually.');
  }
}

ensureSeedFile();
ensureSupabaseInit();

console.log('[supabase] CLI ready. Local stack starts automatically with `npm run dev` (requires Docker).');
