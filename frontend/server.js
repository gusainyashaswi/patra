const http = require('http');
const fs = require('fs');
const path = require('path');

let INITIAL_PORT = parseInt(process.env.PORT, 10) || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Serves static files from PUBLIC_DIR with safe path resolution
function requestHandler(req, res) {
  const safePath = path.normalize(req.url.split('?')[0]);
  let filePath = path.join(PUBLIC_DIR, safePath === '/' ? 'index.html' : safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    });

    fs.createReadStream(filePath).pipe(res);
  });
}

// Starts HTTP server with automatic fallback to the next open port on EADDRINUSE
function startServer(port) {
  const server = http.createServer(requestHandler);

  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && !process.env.PORT) {
      console.log(`[Frontend] Port ${port} is in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error(`[Frontend] Server error:`, err.message);
      process.exit(1);
    }
  });

  server.listen(port, () => {
    console.log('==============================================');
    console.log(`  Patra Frontend UI Client`);
    console.log(`  Running on: http://localhost:${port}`);
    console.log('==============================================');
  });
}

startServer(INITIAL_PORT);

