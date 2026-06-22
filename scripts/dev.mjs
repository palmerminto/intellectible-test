#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import { syncSupabaseEnv } from './sync-env.mjs';
import { getSupabaseBin, projectRoot } from './lib/paths.mjs';

const root = projectRoot;

function dockerAvailable() {
  const result = spawnSync('docker', ['info'], {
    stdio: 'ignore',
  });

  return result.status === 0;
}

function startSupabase() {
  const supabaseBin = getSupabaseBin();

  if (!supabaseBin) {
    console.error('[supabase] CLI not found. Run `npm install` first.');
    process.exit(1);
  }

  console.log('[supabase] Starting local stack (first run may download Docker images)…');

  const result = spawnSync(supabaseBin, ['start'], {
    cwd: root,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    console.error('[supabase] Failed to start. Is Docker Desktop running?');
    process.exit(result.status ?? 1);
  }
}

function startNextDev() {
  const child = spawn('npx', ['next', 'dev'], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

if (!dockerAvailable()) {
  console.error(
    '[supabase] Docker is required for local development.\n' +
      'Install Docker Desktop, start it, then run `npm run dev` again.',
  );
  process.exit(1);
}

startSupabase();
syncSupabaseEnv();
startNextDev();
