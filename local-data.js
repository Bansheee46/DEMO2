// Временный офлайн-режим данных. Включите флаг true, чтобы фронт работал без сервера.
window.USE_LOCAL_DATA = true;

// Категории (соответствуют /api/categories: id, name, code, image_url)
window.LOCAL_CATEGORIES = [
  { id: 1, name: 'Электроника', code: 'electronics', image_url: '/images/cat-electronics.jpg' },
  { id: 2, name: 'Игрушки', code: 'toys', image_url: '/images/cat-toys.jpg' },
  { id: 3, name: 'Одежда', code: 'clothing', image_url: '/images/cat-clothing.jpg' },
  { id: 4, name: 'Аксессуары', code: 'accessories', image_url: '/images/cat-accessories.jpg' }
];

// Подкатегории (соответствуют /api/subcategories: id, name, code, category_code)
window.LOCAL_SUBCATEGORIES = [
  { id: 1, name: 'Смартфоны', code: 'phones', category_code: 'electronics' },
  { id: 2, name: 'Ноутбуки', code: 'laptops', category_code: 'electronics' },
  { id: 3, name: 'Консоли', code: 'consoles', category_code: 'electronics' },

  { id: 4, name: 'Мягкие', code: 'plush', category_code: 'toys' },
  { id: 5, name: 'Конструкторы', code: 'lego', category_code: 'toys' },

  { id: 6, name: 'Футболки', code: 'tshirts', category_code: 'clothing' },
  { id: 7, name: 'Куртки', code: 'jackets', category_code: 'clothing' },

  { id: 8, name: 'Часы', code: 'watches', category_code: 'accessories' },
  { id: 9, name: 'Рюкзаки', code: 'backpacks', category_code: 'accessories' }
];

// Товары (минимально необходимые поля: id, title/name, price, image_url, category, subcategory_code)
// Допустимо хранить любые другие поля, которые ваш фронт использует при рендере.
window.LOCAL_PRODUCTS = [
  
]; 