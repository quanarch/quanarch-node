import { context } from 'esbuild';
import { readFileSync } from 'node:fs';

const { name, version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// One CommonJS file in the artifacts, under its version. shop-qua stays outside:
// at runtime the quanar hands the quan its own copy.
const ctx = await context({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'neutral',
  format: 'cjs',
  target: 'es2023',
  external: ['shop-qua'],
  outfile: `../../artifacts/quans/${name}/${version}/${name}.js`,
  logLevel: 'info',
});

if (process.argv.includes('--watch')) {
  await ctx.watch();
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
