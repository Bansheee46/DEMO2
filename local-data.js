// Временный офлайн-режим данных. Использовать в случаях, когда сервер не работает. 
// Для включения измените значение на true
window.USE_LOCAL_DATA = false;

// Категории (соответствуют /api/categories: id, name, code, image_url)
window.LOCAL_CATEGORIES = [
  { id: 1, name: 'Категория1', code: 'electronics', image_url: '/images/cat-electronics.jpg' },
  { id: 2, name: 'Категория2', code: 'toys', image_url: '/images/cat-toys.jpg' },
  { id: 3, name: 'Категория3', code: 'clothing', image_url: '/images/cat-clothing.jpg' },
  { id: 4, name: 'Категория4', code: 'accessories', image_url: '/images/cat-accessories.jpg' }
];

// Подкатегории (соответствуют /api/subcategories: id, name, code, category_code)
window.LOCAL_SUBCATEGORIES = [
  { id: 1, name: 'Подкатегория1', code: 'phones', category_code: 'electronics' },
  { id: 2, name: 'Подкатегория2', code: 'laptops', category_code: 'electronics' },
  { id: 3, name: 'Подкатегория3', code: 'consoles', category_code: 'electronics' },

  { id: 4, name: 'Подкатегория1', code: 'plush', category_code: 'toys' },
  { id: 5, name: 'Подкатегория2', code: 'lego', category_code: 'toys' },

  { id: 6, name: 'Подкатегория1', code: 'tshirts', category_code: 'clothing' },
  { id: 7, name: 'Подкатегория2', code: 'jackets', category_code: 'clothing' },

  { id: 8, name: 'Подкатегория1', code: 'watches', category_code: 'accessories' },
  { id: 9, name: 'Подкатегория2', code: 'backpacks', category_code: 'accessories' }
];

// Товары (минимально необходимые поля: id, title/name, price, image_url, category, subcategory_code)
// Допустимо хранить любые другие поля, которые ваш фронт использует при рендере.
window.LOCAL_PRODUCTS = JSON.parse(localStorage.getItem('products') || '[]');

// Хелперы импорта/экспорта JSON для каталога
window.exportCatalogJson = function() {
  try {
    const data = {
      products: JSON.parse(localStorage.getItem('products') || '[]'),
      categories: JSON.parse(localStorage.getItem('categories') || '[]')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalog.json';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  } catch (e) {
    console.error('Экспорт JSON не удался', e);
  }
};

window.importCatalogJson = function(file, onDone) {
  const reader = new FileReader();
  reader.onload = function() {
    try {
      const data = JSON.parse(reader.result || '{}');
      if (Array.isArray(data.products)) {
        localStorage.setItem('products', JSON.stringify(data.products));
      }
      if (Array.isArray(data.categories)) {
        localStorage.setItem('categories', JSON.stringify(data.categories));
      }
      if (typeof onDone === 'function') onDone();
    } catch (e) {
      console.error('Импорт JSON не удался', e);
    }
  };
  reader.readAsText(file);
};