// A stand-in for S3 or a CDN: serves the built quans, and announces a new build of a quan
// on /events/<quan> so a quanar following it picks the new file up at once.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.ARTIFACTS_PORT ?? 4100);
const root = path.join(import.meta.dirname, 'quans');
const streams = new Map(); // quan → Set<response>

fs.mkdirSync(root, { recursive: true });
let timer;
fs.watch(root, { recursive: true }, (_event, file) => {
  const quan = String(file ?? '').split(path.sep)[0];
  clearTimeout(timer);
  // A build writes in bursts; announce once it settles.
  timer = setTimeout(() => {
    for (const res of streams.get(quan) ?? []) res.write('event: change\ndata: {}\n\n');
  }, 150);
});

http
  .createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://artifacts');
    const events = /^\/events\/([a-z0-9-]+)$/.exec(url.pathname);
    if (events) {
      const quan = events[1];
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write(': connected\n\n');
      if (!streams.has(quan)) streams.set(quan, new Set());
      streams.get(quan).add(res);
      req.on('close', () => streams.get(quan).delete(res));
      return;
    }
    const file = path.join(root, path.normalize(decodeURIComponent(url.pathname)).replace(/^\/quans\b/, ''));
    if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => console.log(`artifacts on http://localhost:${PORT}`));
