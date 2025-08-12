/**
 * API для работы с товарами
 * Этот модуль обеспечивает взаимодействие с серверным API для получения и отображения товаров
 */

// Импортируем функцию addToCart из desktop.js
// Эта функция будет доступна после загрузки desktop.js
let addToCart;
let openProductModal;
document.addEventListener('DOMContentLoaded', () => {
  // После загрузки DOM проверяем наличие функций в глобальном объекте
  if (typeof window.addToCart === 'function') {
    addToCart = window.addToCart;
  }
  if (typeof window.openProductModal === 'function') {
    openProductModal = window.openProductModal;
  }
});

// Базовый URL API сервера (не используется напрямую — fetch патчен api-client.js)
const API_BASE_URL = '';

/**
 * Получение всех товаров с сервера
 * @param {string} category - Категория товаров (опционально)
 * @returns {Promise<Array>} - Массив товаров
 */
async function getProducts(category = '') {
  try {
    const url = new URL('/api/products', window.location.origin);
    if (category) {
      url.searchParams.append('category', category);
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Ошибка при получении товаров');
    }
    
    return data.products;
  } catch (error) {
    showNotification('Не удалось загрузить товары. Попробуйте позже.', 'error');
    
    // В случае ошибки возвращаем пустой массив
    return [];
  }
}

/**
 * Получение информации о товаре по ID
 * @param {number} productId - ID товара
 * @returns {Promise<Object|null>} - Информация о товаре или null в случае ошибки
 */
async function getProductById(productId) {
  try {
    const response = await fetch(`/api/products/${productId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Товар не найден');
    }
    
    return data.product;
  } catch (error) {
    showNotification('Не удалось загрузить информацию о товаре', 'error');
    return null;
  }
}

/**
 * Отображение товаров на странице
 * @param {Array} products - Массив товаров для отображения
 * @param {string} activeCategory - Активная категория (опционально)
 */
function renderProducts(products, activeCategory = '') {
  const productsGrid = document.querySelector('.products__grid');
  
  if (!productsGrid) {
    return;
  }
  
  // Очищаем контейнер перед добавлением новых товаров
  productsGrid.innerHTML = '';
  
  // Если товаров нет, показываем сообщение
  if (!products || products.length === 0) {
    let message = 'Товары не найдены';
    if (activeCategory) {
      message = `В категории "${getCategoryName(activeCategory)}" нет товаров`;
    }
    productsGrid.innerHTML = `<div class="no-products">${message}</div>`;
    return;
  }
  
  // Добавляем товары на страницу
  products.forEach((product, index) => {
    const productCard = document.createElement('article');
    productCard.className = 'product-card';
    productCard.dataset.id = product.id;
    productCard.dataset.category = product.category || 'other';
    productCard.dataset.aos = 'fade-up';
    
    
    // Скрываем товары, не соответствующие активной категории
    if (activeCategory && product.category) {
      const productCategoryLower = product.category.toLowerCase();
      const activeCategoryLower = activeCategory.toLowerCase();
      if (productCategoryLower !== activeCategoryLower) {
        productCard.style.display = 'none';
      }
    }
    
    // Формируем URL изображения
    let imageUrl = product.image_url;
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
      imageUrl = `${window.location.origin}/${imageUrl}`;
    }
    
    // Создаем HTML для карточки товара
    const imageHtml = imageUrl ? `<img src="${imageUrl}" alt="${product.title || 'Товар'}" class="product-card__image">` : '';
    const priceHtml = `<div class="product-card__price">${(product.price || 0).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}</div>`;
    
    productCard.innerHTML = `
      <div class="product-card__content">
        ${imageHtml}
        <h3 class="product-card__title">${product.title || ''}</h3>
        ${priceHtml}
        <div class="product-card__actions">
          <button class="btn btn-primary" data-action="add-to-cart">Добавить в корзину</button>
          <button class="btn btn-secondary" data-action="details">Подробнее</button>
        </div>
      </div>
    `;

    // Обработчики кнопок
    const addBtn = productCard.querySelector('[data-action="add-to-cart"]');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (typeof addToCart === 'function') {
          addToCart(product.id);
        }
      });
    }

    const detailsBtn = productCard.querySelector('[data-action="details"]');
    if (detailsBtn) {
      detailsBtn.addEventListener('click', () => {
        if (typeof openProductModal === 'function') {
          openProductModal(product.id);
        }
      });
    }

    productsGrid.appendChild(productCard);
  });
}

/**
 * Загрузка и отображение товаров
 * @param {string} category - Категория товаров (опционально)
 */
async function loadAndRenderProducts(category = '') {
  try {
    // Показываем индикатор загрузки
    const productsGrid = document.querySelector('.products__grid');
    if (productsGrid) {
      productsGrid.innerHTML = '<div class="loading-indicator">Загрузка товаров...</div>';
    }
    
    // Получаем товары с сервера
    const products = await getProducts(category);
    
    // Отображаем товары на странице с учетом выбранной категории
    renderProducts(products, category);
    
  } catch (error) {
    showNotification('Не удалось загрузить товары', 'error');
  }
}

// Функция для инициализации загрузки товаров при загрузке страницы
function initProductsApi() {
  // Проверяем, загружена ли страница
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadAndRenderProducts();
    });
  } else {
    loadAndRenderProducts();
  }
  
  // Добавляем обработчики событий для категорий только если они еще не были добавлены
  const categoryButtons = document.querySelectorAll('.island__category');
  
  // Проверяем, есть ли уже обработчики для категорий
  if (!window.categoryHandlersInitialized) {
    categoryButtons.forEach(button => {
      button.addEventListener('click', () => {
        const category = button.dataset.category || '';
        
        // Обновляем активную категорию
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Загружаем товары выбранной категории
        loadAndRenderProducts(category);
      });
    });
    
    // Отмечаем, что обработчики уже инициализированы
    window.categoryHandlersInitialized = true;
  }
}

// Экспортируем функции для использования в других модулях
window.productsApi = {
  getProducts,
  getProductById,
  renderProducts,
  loadAndRenderProducts,
  initProductsApi
}; 