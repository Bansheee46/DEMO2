/**
 * Модуль поиска товаров
 * Этот модуль обеспечивает функциональность поиска товаров по различным критериям
 */

// Объект для хранения данных о товарах
const productsData = {};

// Отладочная функция для проверки содержимого productsData
function logProductsData() {
  console.log('=== СОДЕРЖИМОЕ PRODUCTSDATA ===');
  console.log('Всего товаров:', Object.keys(productsData).length);
  Object.entries(productsData).forEach(([id, product]) => {
    console.log(`ID: ${id}, Название: ${product.title}, Артикул: ${product.sku}`);
  });
  console.log('===============================');
}

/**
 * Инициализация поиска товаров
 * @param {Object} options - Настройки поиска
 * @param {string} options.searchInputSelector - CSS-селектор для поля ввода поиска
 * @param {string} options.productCardSelector - CSS-селектор для карточек товаров
 */
function initProductSearch(options = {}) {
  const {
    searchInputSelector = '.search-bar__input',
    productCardSelector = '.product-card'
  } = options;

  const searchInput = document.querySelector(searchInputSelector);
  
  if (!searchInput) {
    return;
  }
  
  // Удаляем существующий обработчик, если он был
  searchInput.removeEventListener('input', handleSearchInput);
  
  // Сохраняем ссылку на productCardSelector для использования в обработчике
  searchInput._productCardSelector = productCardSelector;
  
  // Добавляем обработчик ввода в поле поиска
  searchInput.addEventListener('input', handleSearchInput);
  
  // Проверяем, есть ли текст в поле поиска при инициализации
  if (searchInput.value.trim().length > 0) {
    // Если есть, вызываем обработчик поиска сразу
    handleSearchInput.call(searchInput);
  }
}

/**
 * Обработчик события ввода в поле поиска
 * Вынесен в отдельную функцию для возможности удаления обработчика
 */
function handleSearchInput() {
  try {
    const query = this.value.trim().toLowerCase();
    const productCardSelector = this._productCardSelector || '.product-card';
    
    console.log('Поисковый запрос:', query);
    
    // Если запрос пустой, показываем все товары
    if (query.length === 0) {
      showAllProducts(productCardSelector);
      return;
    }
    
    // Определяем тип поиска по префиксу
    let searchType = 'all';
    let searchQuery = query;
    
    // Проверяем наличие префиксов для разных типов поиска
    if (query.startsWith('название:')) {
      searchType = 'name';
      searchQuery = query.substring('название:'.length).trim();
    } else if (query.startsWith('артикул:')) {
      searchType = 'sku';
      searchQuery = query.substring('артикул:'.length).trim();
    } else if (query.startsWith('категория:')) {
      searchType = 'category';
      searchQuery = query.substring('категория:'.length).trim();
    } else if (query.startsWith('описание:')) {
      searchType = 'description';
      searchQuery = query.substring('описание:'.length).trim();
    }
    
    console.log('Тип поиска:', searchType, 'Запрос:', searchQuery);
    
    // Если после удаления префикса запрос пустой, показываем все товары
    if (searchQuery.length === 0) {
      showAllProducts(productCardSelector);
      return;
    }
    
    // Найдем все карточки товаров
    const productCards = document.querySelectorAll(productCardSelector);
    
    console.log('Найдено карточек товаров:', productCards.length);
    
    // Если карточек товаров нет, выходим
    if (productCards.length === 0) {
      return;
    }
    
    // Сначала скрываем все товары
    hideAllProducts(productCards);
    
    let visibleCardsCount = 0;
    
    productCards.forEach(card => {
      try {
        // Проверяем текст карточки напрямую для быстрого поиска
        // Только если тип поиска 'all', иначе используем более точный поиск
        if (searchType === 'all') {
          const cardText = card.textContent.toLowerCase();
          if (cardText.includes(searchQuery)) {
            card.style.display = '';
            card.classList.add('search-highlight');
            setTimeout(() => {
              card.classList.remove('search-highlight');
            }, 1500);
            visibleCardsCount++;
            return;
          }
        }
        
        const productId = card.getAttribute('data-id');
        if (!productId) {
          return;
        }
        
        // Получаем название товара из карточки
        const cardTitle = card.querySelector('.product-card__title')?.textContent || '';
        
        // Ищем соответствующий товар в productsData
        let product = productsData[productId];
        
        // Если товар не найден по ID, ищем по названию
        if (!product) {
          // Ищем товар по названию
          for (const [id, p] of Object.entries(productsData)) {
            if (p.title === cardTitle) {
              product = p;
              break;
            }
          }
          
          // Если товар все еще не найден, пропускаем карточку
          if (!product) {
            return;
          }
        }
        
        // Проверяем соответствие в зависимости от типа поиска
        let isMatch = false;
        
        switch (searchType) {
          case 'name':
            isMatch = (product.title || '').toLowerCase().includes(searchQuery);
            break;
          case 'sku':
            isMatch = (product.sku || '').toLowerCase().includes(searchQuery);
            console.log('Поиск по артикулу:', product.sku, 'Запрос:', searchQuery, 'Совпадение:', isMatch);
            break;
          case 'category':
            isMatch = (product.category || '').toLowerCase().includes(searchQuery);
            break;
          case 'description':
            isMatch = (product.description || '').toLowerCase().includes(searchQuery);
            break;
          default:
            // Для типа 'all' проверяем все поля
            const titleLower = (product.title || '').toLowerCase();
            const descLower = (product.description || '').toLowerCase();
            const categoryLower = (product.category || '').toLowerCase();
            const skuLower = (product.sku || '').toLowerCase();
            
            isMatch = titleLower.includes(searchQuery) || 
                     descLower.includes(searchQuery) || 
                     categoryLower.includes(searchQuery) || 
                     skuLower.includes(searchQuery);
        }
        
        // Если есть совпадение, показываем карточку товара
        if (isMatch) {
          card.style.display = '';
          card.classList.add('search-highlight');
          setTimeout(() => {
            card.classList.remove('search-highlight');
          }, 1500);
          visibleCardsCount++;
        }
      } catch (error) {
        // Удалить все вызовы .log, .error, .warn и т.д. из этого файла
      }
    });
    
    // Проверяем, есть ли видимые товары после фильтрации
    if (visibleCardsCount === 0) {
      showNoResultsMessage(query);
    } else {
      hideNoResultsMessage();
    }
  } catch (error) {
    // Удалить все вызовы .log, .error, .warn и т.д. из этого файла
    // В случае ошибки показываем все товары
    showAllProducts('.product-card');
  }
}

// Делаем функцию handleSearchInput доступной глобально
window.handleSearchInput = handleSearchInput;

/**
 * Обновление данных о товарах для поиска
 * @param {Array} products - Массив товаров с сервера
 */
function updateProductsData(products) {
  if (!products) {
    console.log('updateProductsData: products не переданы');
    return;
  }
  
  if (!Array.isArray(products)) {
    console.log('updateProductsData: products не является массивом');
    return;
  }
  
  if (products.length === 0) {
    console.log('updateProductsData: массив товаров пуст');
    return;
  }
  
  console.log('updateProductsData: обновляем данные для', products.length, 'товаров');
  
  // Обновляем productsData с данными с сервера, не удаляя существующие товары
  products.forEach(product => {
    if (!product.id) {
      console.log('updateProductsData: товар без ID пропущен:', product);
      return;
    }
    
    // Добавляем данные в productsData для использования в поиске
    productsData[product.id] = {
      title: product.title || '',
      price: product.price || '',
      category: product.category || '',
      description: product.description || '',
      sku: product.sku || '',
      image_url: product.image_url || ''
    };
    
    console.log('updateProductsData: добавлен товар', product.id, 'с артикулом:', product.sku);
  });
  
  console.log('updateProductsData: всего товаров в productsData:', Object.keys(productsData).length);
  
  // Вызываем отладочную функцию для проверки данных
  logProductsData();
}

/**
 * Скрыть все карточки товаров
 * @param {NodeList} productCards - Коллекция карточек товаров
 */
function hideAllProducts(productCards) {
  productCards.forEach(card => {
    card.style.display = 'none';
  });
}

/**
 * Показать все карточки товаров
 * @param {string} selector - CSS-селектор для карточек товаров
 */
function showAllProducts(selector) {
  const productCards = document.querySelectorAll(selector);
  productCards.forEach(card => {
    card.style.display = '';
  });
  hideNoResultsMessage();
}

/**
 * Показать сообщение об отсутствии результатов поиска
 * @param {string} query - Поисковый запрос
 */
function showNoResultsMessage(query) {
  let noResultsEl = document.querySelector('.no-search-results');
  
  if (!noResultsEl) {
    noResultsEl = document.createElement('div');
    noResultsEl.className = 'no-search-results';
    
    const productsContainer = document.querySelector('.products__grid') || 
                              document.querySelector('.products-container');
    
    if (productsContainer) {
      productsContainer.appendChild(noResultsEl);
    }
  }
  
  noResultsEl.innerHTML = `
    <div class="no-results-icon">
      <i class="fas fa-search"></i>
    </div>
    <h3>По запросу «${query}» ничего не найдено</h3>
    <p>Попробуйте изменить запрос или выбрать другую категорию</p>
  `;
  
  noResultsEl.style.display = 'flex';
}

/**
 * Скрыть сообщение об отсутствии результатов поиска
 */
function hideNoResultsMessage() {
  const noResultsEl = document.querySelector('.no-search-results');
  if (noResultsEl) {
    noResultsEl.style.display = 'none';
  }
}

/**
 * Получение данных о товаре по ID
 * @param {string|number} productId - ID товара
 * @returns {Object|null} - Данные о товаре или null, если товар не найден
 */
function getProductData(productId) {
  // Проверяем наличие товара по ID
  if (productId && productsData[productId]) {
    // Удалить все вызовы .log, .error, .warn и т.д. из этого файла
    return productsData[productId];
  }
  
  // Удалить все вызовы .log, .error, .warn и т.д. из этого файла
  
  // Если товар не найден по ID, пробуем найти его по другим параметрам
  
  // 1. Попробуем найти товар с таким же ID в виде строки или числа
  const allIds = Object.keys(productsData);
  const stringProductId = String(productId);
  const numericProductId = Number(productId);
  
  for (const id of allIds) {
    if (String(id) === stringProductId || Number(id) === numericProductId) {
      // Удалить все вызовы .log, .error, .warn и т.д. из этого файла
      return productsData[id];
    }
  }
  
  // 2. Попробуем найти товар по карточке на странице
  const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
  if (productCard) {
    const title = productCard.querySelector('.product-card__title')?.textContent;
    if (title) {
      // Ищем товар по названию
      for (const [id, product] of Object.entries(productsData)) {
        if (product.title === title) {
          // Удалить все вызовы .log, .error, .warn и т.д. из этого файла
          return product;
        }
      }
    }
  }
  
  // Удалить все вызовы .log, .error, .warn и т.д. из этого файла
  return null;
}

// Экспортируем функции для использования в других модулях
window.productSearch = {
  initProductSearch,
  updateProductsData,
  getProductData
}; 