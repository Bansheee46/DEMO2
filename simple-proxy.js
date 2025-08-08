const http = require('http');
const httpProxy = require('http-proxy');
const fs = require('fs');
const path = require('path');

// Создаем прокси-сервер с настройками CORS
const proxy = httpProxy.createProxyServer({
  changeOrigin: true
});

// Обработчик ошибок прокси
proxy.on('error', function(err, req, res) {
  console.error('Ошибка прокси:', err);
  res.writeHead(500, {
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
  });
  res.end('Ошибка прокси-сервера: ' + err.message);
});

// Добавляем обработчик для добавления CORS заголовков
proxy.on('proxyRes', function(proxyRes, req, res) {
  console.log(`[PROXY RESPONSE] ${req.method} ${req.url} -> ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
  console.log('Response headers:', proxyRes.headers);
  
  proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
  proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept';
});

// Добавляем обработчик для логирования запросов
proxy.on('proxyReq', function(proxyReq, req, res, options) {
  console.log(`[PROXY REQUEST] ${req.method} ${req.url} -> ${options.target}`);
  console.log('Request headers:', req.headers);
  
  if (req.body) {
    console.log('Request body:', req.body);
  }
});

// Создаем HTTP-сервер
const server = http.createServer(function(req, res) {
  // Логируем запрос
  console.log(`[SERVER] ${req.method} ${req.url}`);

  // Добавляем CORS заголовки для всех ответов
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Client-Version, X-Platform');

  // Обрабатываем preflight OPTIONS запросы
  if (req.method === 'OPTIONS') {
    console.log('[OPTIONS] Обработка preflight запроса');
    res.writeHead(200);
    res.end();
    return;
  }

  // Если запрос к API
  if (req.url.startsWith('/api') || req.url.includes('/api/orders') || req.url.includes('/submit-order')) {
    console.log('[API] Проксирование запроса к API:', req.method, req.url);
    
    // Перенаправляем все запросы к orders на локальный сервер
    if (req.url.includes('/api/orders') || req.url.includes('/submit-order')) {
      console.log('[API] Перенаправление запроса к заказам на локальный сервер');
      req.url = '/api/orders';
    }
    
    // Собираем данные запроса для POST, PUT запросов
    if (req.method === 'POST' || req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        console.log('[API] Тело запроса:', body);
        // Сохраняем тело запроса для доступа в других обработчиках
        req.body = body;
        
        // Создаем новый запрос с собранным телом
        const options = {
          target: 'http://127.0.0.1:5000',
          buffer: Buffer.from(body),
          headers: {
            'Content-Type': req.headers['content-type'] || 'application/json'
          }
        };
        
        console.log('[API] Отправка запроса на целевой сервер с опциями:', options);
        proxy.web(req, res, options);
      });
    } else {
      // Для GET, DELETE и других запросов
      proxy.web(req, res, { target: 'http://127.0.0.1:5000' });
    }
  } else {
    // Для статических файлов
    let filePath = '.' + req.url;
    if (filePath === './') {
      filePath = './desktop.html';
    }

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
        contentType = 'image/jpg';
        break;
    }

    fs.readFile(filePath, function(error, content) {
      if (error) {
        if(error.code === 'ENOENT') {
          fs.readFile('./index.html', function(error, content) {
            if (error) {
              res.writeHead(500);
              res.end('Ошибка сервера: ' + error.code);
            } else {
              res.writeHead(200, { 'Content-Type': contentType });
              res.end(content, 'utf-8');
            }
          });
        } else {
          res.writeHead(500);
          res.end('Ошибка сервера: ' + error.code);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  }
});

// Запускаем сервер на порту 5000
server.listen(5000, () => {
  console.log('Proxy+Static server running at http://185.207.64.189:5000');
}); 