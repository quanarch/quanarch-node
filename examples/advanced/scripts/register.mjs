// Seals every built quan: hashes its file in the artifacts and writes the quanar's list.
// In a real system CI does this after uploading the file. With --open no hash is written,
// so a quan rebuilt by its watch is taken in as it is.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
const ARTIFACTS = process.env.ARTIFACTS_URL ?? 'http://localhost:4100';
const open = process.argv.includes('--open');

const list = fs.readdirSync(path.join(root, 'quans')).map((dir) => {
  const { name, version } = JSON.parse(fs.readFileSync(path.join(root, 'quans', dir, 'package.json'), 'utf8'));
  const file = path.join(root, 'artifacts', 'quans', name, version, `${name}.js`);
  const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  return {
    name,
    version,
    url: `${ARTIFACTS}/quans/${name}/${version}/${name}.js`,
    ...(open ? {} : { hash }),
    events: `${ARTIFACTS}/events/${name}`,
    quas: ['shop-qua'],
  };
});

fs.writeFileSync(path.join(root, 'quanar', 'data', 'quans.json'), JSON.stringify(list, null, 2) + '\n');
for (const q of list) console.log(`${q.name}@${q.version}  ${q.hash ? q.hash.slice(0, 12) + '…' : 'no hash'}`);
