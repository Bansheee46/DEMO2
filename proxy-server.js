const http = require('http');
const serveStatic = require('serve-static');
const finalhandler = require('finalhandler');
const { createProxyMiddleware } = require('http-proxy-middleware');

const serve = serveStatic('.', { index: ['desktop.html', 'index.html'] });

// Прокси для всех /api/* запросов
const apiProxy = createProxyMiddleware('/api', {
  target: 'http://localhost:5000',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[PROXY] ${req.method} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('Ошибка прокси:', err);
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });
    res.end('Ошибка прокси-сервера: ' + err.message);
  }
});

const server = http.createServer((req, res) => {
  // CORS для всех запросов
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Обработка preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url.startsWith('/api')) {
    apiProxy(req, res, finalhandler(req, res));
  } else {
    serve(req, res, finalhandler(req, res));
  }
});

server.listen(5500, () => {
  console.log('Proxy+Static server running at http://localhost:5500');
}); 