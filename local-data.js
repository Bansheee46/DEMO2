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
  { id: 101, title: 'iPhone 13', price: 69990, image_url: '/images/p-iphone13.jpg', category: 'electronics', subcategory_code: 'phones', description: 'Смартфон Apple' },
  { id: 102, title: 'MacBook Air', price: 119990, image_url: '/images/p-macbookair.jpg', category: 'electronics', subcategory_code: 'laptops', description: 'Ноутбук Apple' },
  { id: 103, title: 'PlayStation 5', price: 55990, image_url: '/images/p-ps5.jpg', category: 'electronics', subcategory_code: 'consoles', description: 'Игровая консоль Sony' },

  { id: 201, title: 'Медвежонок плюшевый', price: 1990, image_url: '/images/p-plushbear.jpg', category: 'toys', subcategory_code: 'plush', description: 'Мягкая игрушка' },
  { id: 202, title: 'Конструктор City', price: 4990, image_url: '/images/p-lego-city.jpg', category: 'toys', subcategory_code: 'lego', description: 'Конструктор' },

  { id: 301, title: 'Футболка базовая', price: 990, image_url: '/images/p-tshirt.jpg', category: 'clothing', subcategory_code: 'tshirts', description: 'Хлопок 100%' },
  { id: 302, title: 'Куртка демисезонная', price: 6990, image_url: '/images/p-jacket.jpg', category: 'clothing', subcategory_code: 'jackets', description: 'Легкая и тёплая' },

  { id: 401, title: 'Смарт-часы', price: 6990, image_url: '/images/p-watch.jpg', category: 'accessories', subcategory_code: 'watches', description: 'Уведомления и фитнес' },
  { id: 402, title: 'Рюкзак городской', price: 2990, image_url: '/images/p-backpack.jpg', category: 'accessories', subcategory_code: 'backpacks', description: '20 л' }
]; 