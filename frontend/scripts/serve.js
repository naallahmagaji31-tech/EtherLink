/**
 * scripts/serve.js
 * Lightweight zero-dependency static HTTP server for local preview and development.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const isDist = process.argv.includes('--dist');
const port = parseInt(process.env.PORT || '3000', 10);
const baseDir = isDist ? path.resolve(__dirname, '..', 'dist') : path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.normalize(path.join(baseDir, reqPath));

  if (!filePath.startsWith(baseDir)) {
    res.statusCode = 403;
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end(`404 Not Found: ${reqPath}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(port, () => {
  console.log(`🌐 Server running at http://localhost:${port}/`);
  console.log(`📂 Serving directory: ${baseDir}`);
  console.log(`   Landing page: http://localhost:${port}/`);
  console.log(`   Dashboard:    http://localhost:${port}/dashboard.html`);
  console.log('Press Ctrl+C to stop.');
});
