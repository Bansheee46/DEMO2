/**
 * API для работы с товарами
 * Этот модуль обеспечивает взаимодействие с серверным API для получения и отображения товаров
 */

// Базовый URL API сервера (измените на реальный адрес вашего сервера)
const API_BASE_URL = 'http://localhost:5000';

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
    console.error('Ошибка при получении товаров:', error);
    showNotification('Не удалось загрузить товары. Попробуйте позже.', 'error');
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
    console.error(`Ошибка при получении товара #${productId}:`, error);
    showNotification('Не удалось загрузить информацию о товаре', 'error');
    return null;
  }
}

/**
 * Отображение товаров на странице
 * @param {Array} products - Массив товаров для отображения
 */
function renderProducts(products) {
  const productsGrid = document.querySelector('.products__grid');
  
  if (!productsGrid) {
    console.error('Не найден контейнер для отображения товаров');
    return;
  }
  
  // Очищаем контейнер перед добавлением новых товаров
  productsGrid.innerHTML = '';
  
  // Если товаров нет, показываем сообщение
  if (!products || products.length === 0) {
    productsGrid.innerHTML = '<div class="no-products">Товары не найдены</div>';
    return;
  }
  
  // Определяем, на какой версии сайта мы находимся (мобильной или десктопной)
  const isMobile = window.location.href.includes('mobile.html');
  
  // Добавляем товары на страницу
  products.forEach((product, index) => {
    const productCard = document.createElement('article');
    productCard.className = 'product-card';
    productCard.dataset.id = product.id;
    productCard.dataset.category = product.category || 'other';
    
    if (!isMobile) {
      // Для десктопной версии
      productCard.dataset.aos = 'fade-up';
      
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
          <button class="product-card__button">В корзину</button>
        </div>
      `;
    } else {
      // Для мобильной версии
      productCard.setAttribute('role', 'listitem');
      
      // Формируем URL изображения
      let imageUrl = product.image_url;
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
        imageUrl = `${API_BASE_URL}/${imageUrl}`;
      }
      
      productCard.innerHTML = `
        <img src="${imageUrl || 'https://via.placeholder.com/300x300?text=Нет+изображения'}" alt="${product.title}" loading="lazy">
        <div class="product-card__info">
          <h3 class="product-card__title">${product.title}</h3>
          <p class="product-card__price"><span class="price-icon"><i class="fas fa-ruble-sign"></i></span> ${product.price}</p>
          <button class="product-card__button"><i class="fas fa-cart-plus"></i> В корзину</button>
        </div>
      `;
    }
    
    // Добавляем карточку товара в сетку
    productsGrid.appendChild(productCard);
    
    // Добавляем анимацию появления с задержкой (для десктопной версии)
    if (!isMobile) {
      setTimeout(() => {
        productCard.classList.add('visible');
      }, index * 100);
    }
    
    // Добавляем обработчик клика на кнопку "В корзину"
    const addToCartButton = productCard.querySelector('.product-card__button');
    addToCartButton.addEventListener('click', (event) => {
      event.preventDefault();
      
      // Используем существующую функцию добавления в корзину
      if (typeof addToCart === 'function') {
        const imageUrl = product.image_url 
          ? (product.image_url.startsWith('http') || product.image_url.startsWith('/') 
             ? product.image_url 
             : `${API_BASE_URL}/${product.image_url}`)
          : 'https://via.placeholder.com/300x300?text=Нет+изображения';
        
        addToCart(
          product.id,
          product.title,
          product.price,
          imageUrl
        );
      }
      
      // Добавляем эффект при клике на кнопку (для десктопной версии)
      if (!isMobile && typeof addCartButtonEffect === 'function') {
        addCartButtonEffect(addToCartButton);
      }
    });
    
    // Добавляем обработчик клика на карточку товара для открытия модального окна
    productCard.addEventListener('click', (event) => {
      // Если клик был не по кнопке "В корзину"
      if (!event.target.closest('.product-card__button')) {
        if (!isMobile && typeof openProductModal === 'function') {
          // Для десктопной версии
          openProductModal(product.id);
        } else if (isMobile) {
          // Для мобильной версии
          showProductPopup(product);
        }
      }
    });
  });
  
  // Инициализируем AOS для новых элементов (для десктопной версии)
  if (!isMobile && typeof AOS !== 'undefined') {
    AOS.refresh();
  }
  
  // Запускаем эффект пульсации для карточек товаров (для десктопной версии)
  if (!isMobile && typeof addProductCardsPulseEffect === 'function') {
    addProductCardsPulseEffect();
  }
}

/**
 * Показывает всплывающее окно с информацией о товаре (для мобильной версии)
 * @param {Object} product - Информация о товаре
 */
function showProductPopup(product) {
  // Проверяем, что мы на мобильной версии и есть всплывающее окно
  const popup = document.getElementById('productPopup');
  if (!popup) return;
  
  // Формируем URL изображения
  let imageUrl = product.image_url;
  if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
    imageUrl = `${API_BASE_URL}/${imageUrl}`;
  }
  
  // Заполняем данные во всплывающем окне
  const popupTitle = document.getElementById('popupTitle');
  const popupPrice = document.getElementById('popupPrice');
  const popupDescription = document.getElementById('popupDescription');
  const popupImage1 = document.getElementById('popupImage1');
  const popupImage2 = document.getElementById('popupImage2');
  const popupImage3 = document.getElementById('popupImage3');
  const popupAddToCart = document.getElementById('popupAddToCart');
  
  if (popupTitle) popupTitle.textContent = product.title;
  if (popupPrice) popupPrice.textContent = `${product.price} ₽`;
  if (popupDescription) popupDescription.textContent = product.description || 'Описание отсутствует';
  
  // Устанавливаем изображения
  if (popupImage1) popupImage1.src = imageUrl || 'https://via.placeholder.com/300x300?text=Нет+изображения';
  if (popupImage2) popupImage2.src = imageUrl || 'https://via.placeholder.com/300x300?text=Нет+изображения';
  if (popupImage3) popupImage3.src = imageUrl || 'https://via.placeholder.com/300x300?text=Нет+изображения';
  
  // Добавляем обработчик клика на кнопку "В корзину"
  if (popupAddToCart) {
    popupAddToCart.onclick = function() {
      if (typeof addToCart === 'function') {
        addToCart(
          product.id,
          product.title,
          product.price,
          imageUrl || 'https://via.placeholder.com/300x300?text=Нет+изображения'
        );
      }
      popup.setAttribute('aria-hidden', 'true');
    };
  }
  
  // Показываем всплывающее окно
  popup.setAttribute('aria-hidden', 'false');
  
  // Добавляем обработчик закрытия
  const closeButton = popup.querySelector('.product-popup__close');
  if (closeButton) {
    closeButton.onclick = function() {
      popup.setAttribute('aria-hidden', 'true');
    };
  }
  
  // Закрытие по клику на оверлей
  const overlay = popup.querySelector('.product-popup__overlay');
  if (overlay) {
    overlay.onclick = function() {
      popup.setAttribute('aria-hidden', 'true');
    };
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
    
    // Отображаем товары на странице
    renderProducts(products);
    
    // Обновляем заголовок раздела товаров для мобильной версии
    const isMobile = window.location.href.includes('mobile.html');
    if (isMobile) {
      const productsHeading = document.querySelector('.products__heading');
      if (productsHeading && category) {
        const categoryName = getCategoryName(category);
        productsHeading.textContent = `Товары - ${categoryName}`;
      } else if (productsHeading) {
        productsHeading.textContent = 'Все товары';
      }
    }
    
  } catch (error) {
    console.error('Ошибка при загрузке товаров:', error);
    showNotification('Не удалось загрузить товары', 'error');
  }
}

/**
 * Получает название категории по её идентификатору
 * @param {string} category - Идентификатор категории
 * @returns {string} - Название категории
 */
function getCategoryName(category) {
  const categories = {
    'electronics': 'Электроника',
    'toys': 'Игрушки',
    'accessories': 'Аксессуары',
    'clothes': 'Одежда',
    'appliances': 'Бытовая техника',
    'other': 'Другое'
  };
  
  return categories[category] || 'Все товары';
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
  
  // Определяем, на какой версии сайта мы находимся (мобильной или десктопной)
  const isMobile = window.location.href.includes('mobile.html');
  
  if (isMobile) {
    // Для мобильной версии добавляем обработчики для карусели категорий
    const carouselItems = document.querySelectorAll('.carousel__item');
    carouselItems.forEach(item => {
      item.addEventListener('click', () => {
        // Убираем активный класс со всех элементов
        carouselItems.forEach(i => i.removeAttribute('data-active'));
        
        // Добавляем активный класс к текущему элементу
        item.setAttribute('data-active', '');
        
        // Загружаем товары выбранной категории
        const category = item.dataset.category || '';
        loadAndRenderProducts(category);
      });
    });
  } else {
    // Для десктопной версии добавляем обработчики для кнопок категорий
    const categoryButtons = document.querySelectorAll('.island__category');
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