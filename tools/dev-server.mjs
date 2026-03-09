import fs from 'fs/promises';
import http from 'http';
import path from 'path';

function parseArgs(argv) {
  const out = {
    port: 3000,
    siteDir: process.cwd(),
    dataRoot: null
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg.startsWith('--port=')) out.port = Number(arg.slice('--port='.length)) || out.port;
    else if (arg === '--port') out.port = Number(argv[i + 1]) || out.port;

    else if (arg.startsWith('--site-dir=')) out.siteDir = arg.slice('--site-dir='.length);
    else if (arg === '--site-dir') out.siteDir = argv[i + 1] || out.siteDir;

    else if (arg.startsWith('--data-root=')) out.dataRoot = arg.slice('--data-root='.length);
    else if (arg === '--data-root') out.dataRoot = argv[i + 1] || out.dataRoot;
  }

  return out;
}

function mimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.js' || ext === '.mjs') return 'application/javascript; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.ico') return 'image/x-icon';
  return 'application/octet-stream';
}

function resolveFile(rootDir, pathname) {
  const normalizedPath = pathname === '/' ? '/index.html' : pathname;
  const resolved = path.resolve(rootDir, `.${normalizedPath}`);
  const absoluteRoot = path.resolve(rootDir);

  if (!resolved.startsWith(absoluteRoot)) {
    return null;
  }

  return resolved;
}

async function sendFile(res, filePath) {
  const data = await fs.readFile(filePath);
  res.statusCode = 200;
  res.setHeader('Content-Type', mimeType(filePath));
  res.setHeader('Cache-Control', 'no-store');
  res.end(data);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const siteDir = path.resolve(args.siteDir);
  const dataRoot = args.dataRoot ? path.resolve(args.dataRoot) : null;
  const dataDir = dataRoot ? path.join(dataRoot, 'data') : null;
  const carsDir = dataRoot ? path.join(dataRoot, 'assets', 'cars') : null;

  await fs.access(siteDir);
  if (dataDir) await fs.access(dataDir);
  if (carsDir) await fs.access(carsDir);

  const server = http.createServer(async (req, res) => {
    try {
      const urlObj = new URL(req.url || '/', 'http://127.0.0.1');
      const pathname = decodeURIComponent(urlObj.pathname || '/');

      let filePath = null;

      if (dataDir && pathname.startsWith('/data/')) {
        filePath = resolveFile(dataDir, pathname.slice('/data'.length));
      } else if (carsDir && pathname.startsWith('/assets/cars/')) {
        filePath = resolveFile(carsDir, pathname.slice('/assets/cars'.length));
      } else {
        filePath = resolveFile(siteDir, pathname);
      }

      if (!filePath) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }

      await sendFile(res, filePath);
    } catch (err) {
      if (err?.code === 'ENOENT') {
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }

      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  server.listen(args.port, '127.0.0.1', () => {
    console.log(`DipTrade site dev server: http://127.0.0.1:${args.port}`);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
