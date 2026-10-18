// Starts the artifacts store, the quanar and the web client; Ctrl+C stops all three.
import { spawn } from 'node:child_process';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
const parts = [
  ['artifacts', ['node', 'artifacts/server.mjs'], root],
  ['quanar', ['npm', 'start'], path.join(root, 'quanar')],
  ['web', ['npm', 'run', 'dev'], path.join(root, 'web')],
];

const children = parts.map(([name, [cmd, ...args], cwd]) => {
  const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  const prefix = `[${name}]`.padEnd(12);
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('data', (d) => String(d).split('\n').filter(Boolean).forEach((line) => console.log(prefix + line)));
  }
  return child;
});

const stop = () => {
  children.forEach((c) => c.kill('SIGINT'));
  setTimeout(() => process.exit(0), 500);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
