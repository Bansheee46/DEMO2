window.SITE_CONFIG = {
  // Базовые данные сайта — управляются только из этого файла
  site_name: 'Damax',
  contact_email: '',
  contact_phone: '',
  address: '',

  // Соцсети — управляются только из этого файла
  social_instagram: '',
  social_facebook: '',
  social_twitter: '',
  social_youtube: '',
  social_telegram: '',
  social_whatsapp: ''
};

// Конфигурация источников API для api-client.js
// Основной origin API (по умолчанию — тот же домен)
window.API_ORIGIN = window.API_ORIGIN || window.location.origin;
// Резервные origin-ы, куда можно пробовать /api/* при ошибках/404
window.API_FALLBACK_ORIGINS = window.API_FALLBACK_ORIGINS || [
  // Примеры: добавьте нужные адреса ваших бэкендов/проксей
  // 'https://api.ooodamax.shop',
  // 'https://ooodamax.shop',
]; 