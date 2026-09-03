import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const ROOT = '/Users/hugi/Desktop/Developer/maturita-app';
const T = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript',
  '.json':'application/json', '.webmanifest':'application/manifest+json', '.png':'image/png' };
createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = join(ROOT, normalize(p).replace(/^(\.\.[/\\])+/, ''));
  try {
    const buf = await readFile(f);
    res.writeHead(200, { 'content-type': T[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(buf);
  } catch { res.writeHead(404); res.end('404'); }
}).listen(8321, () => console.log('http://localhost:8321'));
