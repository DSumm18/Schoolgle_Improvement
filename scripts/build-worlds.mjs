import { spawnSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, realpath, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Rebuild the standalone games before Next enumerates public assets. The game
// document is served directly: platform auth, CSS and widgets stay outside it.
const root = fileURLToPath(new URL('../', import.meta.url));
const game = path.join(root, 'apps/learning-worlds');
const destination = path.join(root, 'apps/platform/public/worlds/play');
const build = spawnSync(process.execPath, [
  path.join(game, 'node_modules/vite/bin/vite.js'),
  'build', '--mode', 'hosted', '--base', '/worlds/play/',
], { cwd: game, env: { ...process.env, VITE_HOSTED_PLAYTEST: 'true' }, stdio: 'inherit' });
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

const output = path.join(game, 'dist');
const html = await readFile(path.join(output, 'index.html'), 'utf8');
if (!html.includes('/worlds/play/assets/')) {
  throw new Error('Worlds build is missing the hosted base path. Refusing to publish.');
}

await mkdir(path.dirname(destination), { recursive: true });
const parent = await realpath(path.dirname(destination));
const publicRoot = await realpath(path.join(root, 'apps/platform/public'));
if (parent !== path.join(publicRoot, 'worlds')) {
  throw new Error('Unexpected resolved Worlds output path.');
}
// Only this generated, fixed subdirectory may be replaced.
await rm(destination, { recursive: true, force: true });
await cp(output, destination, {
  recursive: true,
  // Exclude only old desktop WAVs; retain reviewed original MP3 recordings.
  filter: (source) => !source.toLowerCase().endsWith('.wav'),
});
// Verify the final publication folder, not just Vite's intermediate dist.
for (const world of ['nile', 'plot', 'fire']) {
  const bank = JSON.parse(await readFile(path.join(game, 'src/narration', world + '-audio.json'), 'utf8'));
  for (const clip of bank) {
    if (!/^audio\/voices\/[a-z0-9-]+\.mp3$/.test(clip.file)) throw new Error('Unexpected narration path');
    const published = await readFile(path.join(destination, clip.file));
    const reviewed = await readFile(path.join(game, 'public', clip.file));
    if (!published.equals(reviewed)) throw new Error('Published narration differs from reviewed audio: ' + clip.id);
  }
}
const files = await readdir(destination, { recursive: true });
if (files.some(file => file.toLowerCase().endsWith('.wav'))) throw new Error('Unlicensed WAV found in hosted output');
console.log(`Schoolgle Worlds ready at /worlds/play/index.html (${files.length} entries).`);
