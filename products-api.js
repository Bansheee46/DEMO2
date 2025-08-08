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

// Базовый URL API сервера
const API_BASE_URL = '';

/**
 * Получение всех товаров с сервера
 * @param {string} category - Категория товаров (опционально)
 * @returns {Promise<Array>} - Массив товаров
 */
async function getProducts(category = '') {
  try {
    const url = new URL(`${API_BASE_URL}/api/products`);
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
    const response = await fetch(`${API_BASE_URL}/api/products/${productId}`);
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
      imageUrl = `${API_BASE_URL}/${imageUrl}`;
    }
    
    productCard.innerHTML = `
      <div class="product-card__image">
        <img src="${imageUrl || 'https://via.placeholder.com/300x300?text=Нет+изображения'}" alt="${product.title}">
      </div>
      <div class="product-card__info">
        <h3 class="product-card__title">${product.title}</h3>
        <p class="product-card__price"><i class="fas fa-ruble-sign"></i> ${product.price}</p>
        ${product.sku ? `<p class="product-card__sku">Артикул: ${product.sku}</p>` : ''}
        <button class="product-card__button">В корзину</button>
      </div>
    `;
    
    // Добавляем карточку товара в сетку
    productsGrid.appendChild(productCard);
    
    // Добавляем анимацию появления с задержкой
    setTimeout(() => {
      productCard.classList.add('visible');
    }, index * 100);
    
    // Добавляем обработчик клика на кнопку "В корзину"
    const addToCartButton = productCard.querySelector('.product-card__button');
    addToCartButton.addEventListener('click', (event) => {
      event.preventDefault();
      
      // Проверяем наличие функции addToCart перед её вызовом
      if (typeof addToCart === 'function') {
        // Используем существующую функцию добавления в корзину
        addToCart(
          product.id,
          product.title,
          product.price,
          imageUrl || 'https://via.placeholder.com/300x300?text=Нет+изображения'
        );
      } else if (window.addToCart) {
        // Пробуем найти функцию в глобальном объекте window
        window.addToCart(
          product.id,
          product.title,
          product.price,
          imageUrl || 'https://via.placeholder.com/300x300?text=Нет+изображения'
        );
      } else {
        console.error('Функция addToCart не определена');
        showNotification('Не удалось добавить товар в корзину', 'error');
      }
      
      // Добавляем эффект при клике на кнопку
      if (typeof addCartButtonEffect === 'function') {
        addCartButtonEffect(addToCartButton);
      }
    });
    
    // Добавляем обработчик клика на карточку товара для открытия модального окна
    productCard.addEventListener('click', (event) => {
      // Если клик был не по кнопке "В корзину"
      if (!event.target.closest('.product-card__button')) {
        
        // Обновляем данные о товаре в модуле поиска перед открытием модального окна
        if (window.productSearch && typeof window.productSearch.updateProductsData === 'function') {
          // Обновляем только один товар
          window.productSearch.updateProductsData([product]);
        }
        
        if (typeof openProductModal === 'function') {
          openProductModal(product.id);
        } else if (window.openProductModal) {
          window.openProductModal(product.id);
        } else {
          console .error('Функция openProductModal не определена');
          showNotification('Не удалось открыть информацию о товаре', 'error');
        }
      }
    });
  });
  
  // Инициализируем AOS для новых элементов
  if (typeof AOS !== 'undefined') {
    AOS.refresh();
  }
  
  // Запускаем эффект пульсации для карточек товаров
  if (typeof addProductCardsPulseEffect === 'function') {
    addProductCardsPulseEffect();
  }
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