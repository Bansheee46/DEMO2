(function(){
  const cryptoObj = window.crypto || window.msCrypto;
  function generateRequestId(){
    if (cryptoObj && cryptoObj.randomUUID) return cryptoObj.randomUUID();
    const rnd = (n)=>Math.floor(Math.random()*n).toString(16).padStart(4,'0');
    return `${Date.now().toString(16)}-${rnd(0xffff)}-${rnd(0xffff)}-${rnd(0xffff)}`;
  }

  function unique(arr){
    return Array.from(new Set(arr.filter(Boolean)));
  }

  const storedOrigins = (()=>{
    try { return JSON.parse(localStorage.getItem('api_origins')||'[]'); } catch { return []; }
  })();

  const configured = window.API_ORIGIN || window.location.origin;
  const fallbacks = Array.isArray(window.API_FALLBACK_ORIGINS) ? window.API_FALLBACK_ORIGINS : [];

  const ORIGINS = unique([configured, ...fallbacks, ...storedOrigins]);
  const MAX_RETRIES_PER_ORIGIN = 1; // без экспоненциального бэкапа для простоты

  const originalFetch = window.fetch.bind(window);

  async function tryFetchAcrossOrigins(path, init){
    let lastError;
    for (const origin of ORIGINS){
      // Формируем абсолютный URL
      const url = origin.replace(/\/$/, '') + path;
      for (let attempt=0; attempt<=MAX_RETRIES_PER_ORIGIN; attempt++){
        try {
          const res = await originalFetch(url, init);
          if (res.ok || (res.status && res.status !== 404 && res.status < 500)) {
            return res;
          }
          // 404/5xx — идем к следующему origin
          lastError = new Error(`HTTP ${res.status} for ${url}`);
          break;
        } catch (e){
          lastError = e;
          // сетевые ошибки — можно повторить попытку/перейти к следующему origin
        }
      }
    }
    throw lastError || new Error('Network error');
  }

  // Вспомогательная нормализация входа fetch, чтобы корректно обрабатывать URL-объекты и Request
  function normalizeToUrl(input){
    try {
      if (typeof input === 'string') {
        return new URL(input, window.location.origin);
      }
      if (input instanceof URL) {
        return input;
      }
      if (input && typeof input === 'object') {
        // Request
        if (typeof input.url === 'string') {
          return new URL(input.url, window.location.origin);
        }
        // Иные объекты
        if (typeof input.href === 'string') {
          return new URL(input.href, window.location.origin);
        }
      }
    } catch {}
    return null;
  }

  function jsonResponse(obj, status=200){
    const body = JSON.stringify(obj);
    return new Response(body, {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  function parseQuery(url){
    const params = {};
    url.searchParams.forEach((v, k) => { params[k] = v; });
    return params;
  }

  function getCustomCatalog(){
    try {
      const raw = localStorage.getItem('CUSTOM_CATALOG_V1');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const categories = Array.isArray(parsed.categories) ? parsed.categories : [];
      const subcategories = Array.isArray(parsed.subcategories) ? parsed.subcategories : [];
      const products = Array.isArray(parsed.products) ? parsed.products : [];
      return { categories, subcategories, products };
    } catch { return null; }
  }

  // Патчим глобальный fetch для путей, начинающихся с /api/
  window.fetch = async function(input, init={}){
    try {
      const method = (init && init.method ? init.method : 'GET').toUpperCase();
      // Добавляем X-Request-ID и X-Client-Version
      const headers = new Headers(init && init.headers || {});
      if (!headers.has('X-Request-ID')) headers.set('X-Request-ID', generateRequestId());
      if (!headers.has('X-Client-Version')) headers.set('X-Client-Version', 'frontend-1');
      if (!headers.has('Accept')) headers.set('Accept', 'application/json');
      const newInit = Object.assign({}, init, { headers });

      const urlObj = normalizeToUrl(input);
      const path = urlObj ? urlObj.pathname + (urlObj.search || '') : (typeof input === 'string' ? input : '');
      const isApi = urlObj ? urlObj.pathname.startsWith('/api/') : (typeof input === 'string' && input.startsWith('/api/'));

      // Офлайн-режим: обслуживаем некоторые GET эндпоинты локально
      if (isApi && window.USE_LOCAL_DATA === true && method === 'GET') {
        const pathname = urlObj.pathname;
        const query = parseQuery(urlObj);
        const custom = getCustomCatalog();

        if (pathname === '/api/site-status') {
          return jsonResponse({ enabled: true });
        }

        if (pathname === '/api/categories') {
          const categories = (custom && custom.categories && custom.categories.length)
            ? custom.categories
            : (Array.isArray(window.LOCAL_CATEGORIES) ? window.LOCAL_CATEGORIES : []);
          return jsonResponse({ success: true, categories });
        }

        if (pathname === '/api/subcategories') {
          const all = (custom && custom.subcategories && custom.subcategories.length)
            ? custom.subcategories
            : (Array.isArray(window.LOCAL_SUBCATEGORIES) ? window.LOCAL_SUBCATEGORIES : []);
          const categoryCode = (query.category || '').trim();
          const subcategories = categoryCode ? all.filter(s => (s.category_code||'').toLowerCase() === categoryCode.toLowerCase()) : all;
          return jsonResponse({ success: true, subcategories });
        }

        if (pathname === '/api/products') {
          const all = (custom && custom.products && custom.products.length)
            ? custom.products
            : (Array.isArray(window.LOCAL_PRODUCTS) ? window.LOCAL_PRODUCTS : []);
          const category = (query.category || '').trim().toLowerCase();
          const subcategory = (query.subcategory || '').trim();
          let products = all;
          if (category) {
            products = products.filter(p => (p.category||'').toLowerCase() === category);
          }
          if (subcategory) {
            products = products.filter(p => (p.subcategory_code||'') === subcategory);
          }
          return jsonResponse({ success: true, products });
        }

        const productMatch = pathname.match(/^\/api\/products\/(\d+)$/);
        if (productMatch) {
          const id = Number(productMatch[1]);
          const all = (custom && custom.products && custom.products.length)
            ? custom.products
            : (Array.isArray(window.LOCAL_PRODUCTS) ? window.LOCAL_PRODUCTS : []);
          const product = all.find(p => Number(p.id) === id);
          if (product) return jsonResponse({ success: true, product });
          return jsonResponse({ success: false, message: 'Товар не найден' }, 404);
        }
        // Неизвестный эндпоинт — возвращаем 404 в офлайн-режиме
        return jsonResponse({ success: false, message: 'Эндпоинт недоступен в офлайн-режиме' }, 404);
      }

      if (isApi){
        // Если офлайн-режим не включен — маршрутизируем по доступным origins
        return await tryFetchAcrossOrigins(urlObj ? urlObj.pathname + urlObj.search : (typeof input === 'string' ? input : ''), newInit);
      }

      // Для остальных запросов — как есть
      return await originalFetch(input, newInit);
    } catch (e){
      return Promise.reject(e);
    }
  };
})(); 