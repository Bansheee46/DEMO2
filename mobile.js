// Глобальные настройки API URL
window.API_BASE_URL = '/api';
window.API_BACKUP_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded');
    document.body.classList.add('loaded');
  
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    let favoriteItems = JSON.parse(localStorage.getItem('favoriteItems')) || [];
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
    let products = {}; // Инициализируем глобальную переменную products пустым объектом
  
    const cartCount = document.querySelector('.cart-count');
    const cartWrapper = document.querySelector('.cart-wrapper');
    const productPopup = document.querySelector('#productPopup');
  
    const API_BASE_URL = '/api';
    
    // Функция для расширенного логирования
    function logDebug(context, message, data = null) {
        if (!window.API_DEBUG) return;
        
        const timestamp = new Date().toISOString();
        const logPrefix = `[${timestamp}] [${context}]`;
        
        console.log(`${logPrefix} ${message}`);
        
        if (data) {
            console.log(`${logPrefix} Data:`, data);
            
            // Сохраняем важные логи в localStorage для отладки
            try {
                const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
                logs.push({
                    timestamp,
                    context,
                    message,
                    data: typeof data === 'object' ? JSON.stringify(data) : data
                });
                
                // Ограничиваем количество логов до 100 записей
                if (logs.length > 100) {
                    logs.shift(); // Удаляем самую старую запись
                }
                
                localStorage.setItem('debug_logs', JSON.stringify(logs));
            } catch (e) {
                console.error('Ошибка при сохранении логов:', e);
            }
        }
    }
    
    // Делаем функцию logDebug доступной глобально
    window.logDebug = logDebug;
    
    // Функция для просмотра сохраненных логов
    function viewDebugLogs() {
        try {
            const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
            
            if (logs.length === 0) {
                console.log('%c[DEBUG VIEWER] Логи отсутствуют', 'color: #f44336; font-weight: bold;');
                return;
            }
            
            console.log('%c[DEBUG VIEWER] Сохраненные логи (' + logs.length + ')', 'color: #2196F3; font-weight: bold;');
            
            logs.forEach((log, index) => {
                const { timestamp, context, message, data } = log;
                
                console.group(`%c[${index + 1}] ${timestamp} [${context}]`, 'color: #2196F3;');
                console.log('%cСообщение: %c' + message, 'font-weight: bold;', 'font-weight: normal;');
                
                if (data) {
                    try {
                        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
                        console.log('%cДанные:', 'font-weight: bold;', parsedData);
                    } catch (e) {
                        console.log('%cДанные: %c' + data, 'font-weight: bold;', 'font-weight: normal;');
                    }
                }
                
                console.groupEnd();
            });
            
            console.log('%c[DEBUG VIEWER] Конец логов', 'color: #2196F3; font-weight: bold;');
        } catch (e) {
            console.error('Ошибка при чтении логов:', e);
        }
    }
    
    // Делаем функцию viewDebugLogs доступной глобально
    window.viewDebugLogs = viewDebugLogs;
    
    // Функция для очистки логов
    function clearDebugLogs() {
        localStorage.removeItem('debug_logs');
        console.log('%c[DEBUG VIEWER] Логи очищены', 'color: #4CAF50; font-weight: bold;');
    }
    
    // Делаем функцию clearDebugLogs доступной глобально
    window.clearDebugLogs = clearDebugLogs;
    
    // Перехватываем ошибки fetch для логирования
    const originalFetch = window.fetch;
    window.fetch = async function(url, options = {}) {
        const startTime = Date.now();
        logDebug('FETCH', `Запрос на ${url}`, options);
        
        try {
            const response = await originalFetch(url, options);
            const endTime = Date.now();
            
            logDebug('FETCH', `Ответ от ${url} получен за ${endTime - startTime}ms, статус: ${response.status}`);
            
            // Клонируем ответ, чтобы его можно было прочитать несколько раз
            const clone = response.clone();
            
            // Пытаемся прочитать тело ответа как JSON
            clone.text().then(text => {
                try {
                    const json = JSON.parse(text);
                    logDebug('FETCH', `Тело ответа:`, json);
                } catch (e) {
                    if (text.length < 500) {
                        logDebug('FETCH', `Тело ответа (не JSON):`, text);
                    } else {
                        logDebug('FETCH', `Тело ответа (не JSON, длина ${text.length}):`, text.substring(0, 500) + '...');
                    }
                }
            }).catch(e => {
                logDebug('FETCH', `Ошибка при чтении тела ответа:`, e.message);
            });
            
            return response;
        } catch (error) {
            logDebug('FETCH', `Ошибка запроса к ${url}:`, error.message);
            throw error;
        }
    };
  
    // Инициализация счетчика корзины при загрузке страницы
    updateCartCount();
    console.log('Инициализация корзины:', cartItems.length, 'товаров');
  
    // Функция для отображения уведомлений
    function showNotification(message, type = 'info', duration = 3000) {
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = type === 'success' ? '#4CAF50' : 
                                            type === 'error' ? '#f44336' : 
                                            type === 'warning' ? '#ff9800' : '#2196F3';
        notification.style.color = 'white';
        notification.style.padding = '12px 20px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        notification.style.zIndex = '10001';
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        
        // Добавляем иконку в зависимости от типа уведомления
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}" style="margin-right: 8px;"></i>
            <span>${message}</span>
        `;
        
        // Добавляем уведомление в DOM
        document.body.appendChild(notification);
        
        // Показываем уведомление с анимацией
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Автоматически скрываем уведомление через указанное время
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
  
    function updateCartCount(withAnim = false) {
      if (cartCount && cartWrapper) {
        let count = 0;
        cartItems.forEach(i => count += i.quantity || 1);
        cartCount.textContent = count;
        cartWrapper.classList.toggle('has-items', count > 0);
        if (count > 0 && withAnim) {
          cartWrapper.classList.add('active');
          setTimeout(() => cartWrapper.classList.remove('active'), 500);
        }
      }
    }
  
    // Делаем функцию updateCartCount доступной глобально
    window.updateCartCount = updateCartCount;
  
    if (window.location.pathname.includes('mobile.html') || window.location.pathname === '/') {
      console.log('Main page logic');
      
      // Инициализируем переменную products при загрузке страницы
      getProducts().then(() => {
        console.log('Products loaded');
      });
      
      const productCards = document.querySelectorAll('.product-card');
      productCards.forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.product-card__button')) return;
          const productId = card.getAttribute('data-id');
          const product = products[productId];
          updatePopup(product, productId);
          productPopup.setAttribute('aria-hidden', 'false');
        });
      });
  
      document.querySelector('.product-popup__close')?.addEventListener('click', () => productPopup.setAttribute('aria-hidden', 'true'));
      document.querySelector('#popupAddToCart')?.addEventListener('click', () => {
        const popup = document.querySelector('#productPopup');
        const id = popup?.getAttribute('data-id');
        if (!id) return;
        const product = products[id];
        if (!product) return;
        addToCart({
          id,
          title: product.title,
          price: product.price,
          image: product.image_url || product.image
        });
        productPopup.setAttribute('aria-hidden', 'true');
      });
      document.querySelector('#popupFavorite')?.addEventListener('click', () => {
        const popupTitle = document.querySelector('#popupTitle').textContent;
        const productId = Object.keys(products).find(id => products[id].title === popupTitle);
        if (!productId) return;
        toggleFavorite(productId);
      });
  
      document.querySelectorAll('.product-card__button').forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          const card = button.closest('.product-card');
          const item = {
            id: card.getAttribute('data-id'),
            title: card.querySelector('.product-card__title').textContent,
            price: parseInt(card.querySelector('.product-card__price').textContent.replace(/[^\d]/g, '')),
            image: card.querySelector('img').src
          };
          addToCart(item);
        });
      });
  
      loadCategoriesAndRenderCarousel();
      setupCardAnimation();
      setupSearch();
  
      // --- Открытие модального окна товара с подгрузкой подробной инфы ---
      const productsGrid = document.querySelector('.products__grid');
      if (productsGrid && productPopup) {
        productsGrid.addEventListener('click', async (e) => {
          const card = e.target.closest('.product-card');
          if (!card) return;
          const productId = card.dataset.id;
          if (!productId) return;
          // Показываем лоадер
          productPopup.setAttribute('aria-hidden', 'false');
          productPopup.querySelector('.product-popup__title').textContent = 'Загрузка...';
          productPopup.querySelector('.product-popup__price').textContent = '';
          productPopup.querySelector('.product-popup__description').textContent = '';
          productPopup.querySelectorAll('.product-popup__image').forEach(img => img.src = '');
          // Получаем подробную инфу с сервера
          try {
            const res = await fetch(`${API_BASE_URL}/products/${productId}`);
            const data = await res.json();
            if (!data.success || !data.product) throw new Error('Нет данных');
            const product = data.product;
            // Обновляем popup
            productPopup.setAttribute('data-id', product.id);
            productPopup.querySelector('.product-popup__title').textContent = product.title;
            productPopup.querySelector('.product-popup__price').textContent = `${product.price} ₽`;
            productPopup.querySelector('.product-popup__description').textContent = product.description || '';
            // Картинки
            const images = [product.image_url, ...(product.images || []).filter(Boolean)].filter(Boolean);
            productPopup.querySelectorAll('.product-popup__image').forEach((img, i) => {
              img.src = images[i] ? (images[i].startsWith('http') ? images[i] : `${API_BASE_URL}/${images[i]}`) : '';
              img.classList.toggle('active', i === 0);
            });
            // Избранное
            const isFavorite = favoriteItems.some(item => item.id == product.id);
            const popupFavorite = productPopup.querySelector('#popupFavorite');
            popupFavorite.classList.toggle('active', isFavorite);
            const icon = popupFavorite.querySelector('i');
            icon.classList.toggle('far', !isFavorite);
            icon.classList.toggle('fas', isFavorite);
          } catch (e) {
            productPopup.querySelector('.product-popup__title').textContent = 'Ошибка загрузки';
            productPopup.querySelector('.product-popup__price').textContent = '';
            productPopup.querySelector('.product-popup__description').textContent = '';
            productPopup.querySelectorAll('.product-popup__image').forEach(img => img.src = '');
          }
        });
      }
    }
  
    if (window.location.pathname.includes('cart.html')) {
      console.log('Cart page logic');
      const cartItemsList = document.querySelector('.cart-page__items');
      const totalElement = document.querySelector('.cart-page__total span');
      const checkoutButton = document.querySelector('.cart-page__checkout');
      const checkoutForm = document.querySelector('.cart-page__checkout-form');
      const cartFooter = document.querySelector('.cart-page__footer');
      const backButton = document.querySelector('.cart-page__back');
      const modal = document.querySelector('#customModal');
      const modalMessage = modal.querySelector('.custom-modal__message');
      const modalClose = document.querySelector('.custom-modal__close');
      const phoneInput = document.querySelector('#checkout-phone');
      
      // Элементы для пошаговой формы
      const progressSteps = document.querySelectorAll('.progress-step');
      const checkoutSteps = document.querySelectorAll('.checkout-step');
      const nextButtons = document.querySelectorAll('.checkout-next-btn');
      const backButtons = document.querySelectorAll('.checkout-back-btn');
      const summaryItems = document.getElementById('summary-items');
      const summaryTotal = document.getElementById('summary-total');
      
      // Обработка переключения способа доставки
      const deliveryOptions = document.querySelectorAll('.delivery-option input');
      const deliveryAddressGroup = document.querySelector('#delivery-address-group');
      const pickupPointsGroup = document.querySelector('#pickup-points-group');
      
      // Функция для переключения между шагами
      function goToStep(stepNumber) {
        // Скрываем все шаги
        checkoutSteps.forEach(step => step.classList.remove('active'));
        
        // Показываем нужный шаг
        const targetStep = document.querySelector(`.checkout-step[data-step="${stepNumber}"]`);
        if (targetStep) targetStep.classList.add('active');
        
        // Обновляем прогресс-бар
        progressSteps.forEach(step => {
          const stepNum = parseInt(step.dataset.step);
          step.classList.remove('active', 'completed');
          
          if (stepNum < stepNumber) {
            step.classList.add('completed');
          } else if (stepNum === stepNumber) {
            step.classList.add('active');
          }
        });
        
        // Если последний шаг, обновляем итоговую сумму
        if (stepNumber === 3) {
          updateOrderSummary();
        }
      }
      
      // Обновление итоговой суммы заказа
      function updateOrderSummary() {
        let total = 0;
        cartItems.forEach(item => {
          total += item.price * item.quantity;
        });
        
        const deliveryType = document.querySelector('input[name="delivery"]:checked').value;
        const deliveryCost = deliveryType === 'pickup' ? 0 : 300;
        
        summaryItems.textContent = `${total.toLocaleString()} ₽`;
        document.getElementById('summary-delivery').textContent = `${deliveryCost} ₽`;
        summaryTotal.textContent = `${(total + deliveryCost).toLocaleString()} ₽`;
      }
      
      // Валидация полей на каждом шаге
      function validateStep(stepNumber) {
        let isValid = true;
        const step = document.querySelector(`.checkout-step[data-step="${stepNumber}"]`);
        
        if (stepNumber === 1) {
          // Валидация контактных данных
          const name = document.getElementById('checkout-name').value.trim();
          const surname = document.getElementById('checkout-surname').value.trim();
          const email = document.getElementById('checkout-email').value.trim();
          const phone = document.getElementById('checkout-phone').value.trim();
          
          if (!name || !surname || !email || !phone) {
            isValid = false;
            showNotification('Пожалуйста, заполните все обязательные поля');
          } else if (!validateEmail(email)) {
            isValid = false;
            showNotification('Пожалуйста, введите корректный email');
          }
        } else if (stepNumber === 2) {
          // Валидация адреса доставки
          const deliveryType = document.querySelector('input[name="delivery"]:checked').value;
          if (deliveryType !== 'pickup') {
            const address = document.getElementById('checkout-address').value.trim();
            if (!address) {
              isValid = false;
              showNotification('Пожалуйста, укажите адрес доставки');
            }
          }
        }
        
        return isValid;
      }
      
      // Простая валидация email
      function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      }
      
      // Показать уведомление
      function showNotification(message) {
        modalMessage.textContent = message;
        modal.setAttribute('aria-hidden', 'false');
      }
      
      // Обработчики событий для кнопок навигации
      nextButtons.forEach(button => {
        button.addEventListener('click', () => {
          const currentStep = parseInt(button.closest('.checkout-step').dataset.step);
          if (validateStep(currentStep)) {
            const nextStep = parseInt(button.dataset.next);
            goToStep(nextStep);
            // Если переходим на шаг оплаты, инициализируем методы оплаты
            if (nextStep === 3) {
              console.log('Переход на шаг оплаты, вызываем initPaymentMethods');
              initPaymentMethods();
            }
          }
        });
      });
      
      backButtons.forEach(button => {
        button.addEventListener('click', () => {
          const stepToReturn = parseInt(button.dataset.back);
          if (stepToReturn === 0) {
            // Возвращаемся к списку товаров
            cartItemsList.style.display = 'block';
            cartFooter.style.display = 'block';
            checkoutForm.classList.remove('active');
          } else {
            // Переходим на предыдущий шаг
            goToStep(stepToReturn);
          }
        });
      });
      
      deliveryOptions.forEach(option => {
        option.addEventListener('change', function() {
          if (this.value === 'pickup') {
            deliveryAddressGroup.style.display = 'none';
            pickupPointsGroup.style.display = 'block';
          } else {
            deliveryAddressGroup.style.display = 'block';
            pickupPointsGroup.style.display = 'none';
          }
        });
      });

      if (phoneInput) {
        phoneInput.addEventListener('blur', (e) => e.target.value = formatPhoneNumber(e.target.value));
      }

      renderCartItems();

      // Добавляем проверку на null перед обращением к addEventListener
      if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
          if (cartItemsList && cartFooter && checkoutForm) {
            cartItemsList.style.display = 'none';
            cartFooter.style.display = 'none';
            checkoutForm.classList.add('active');
            goToStep(1); // Начинаем с первого шага
          }
        });
      }

      // Добавляем проверку на null перед обращением к addEventListener
      if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const name = document.querySelector('#checkout-name')?.value.trim() || '';
          const surname = document.querySelector('#checkout-surname')?.value.trim() || '';
          const email = document.querySelector('#checkout-email')?.value.trim() || '';
          const phone = document.querySelector('#checkout-phone')?.value.trim() || '';
          
          // Получаем выбранный способ доставки
          const deliveryTypeElement = document.querySelector('input[name="delivery"]:checked');
          const deliveryType = deliveryTypeElement ? deliveryTypeElement.value : '';
          
          // Получаем адрес в зависимости от способа доставки
          let address = '';
          if (deliveryType === 'pickup') {
            const pickupElement = document.querySelector('input[name="pickup"]:checked');
            address = pickupElement ? pickupElement.value : '';
          } else {
            const addressElement = document.querySelector('#checkout-address');
            address = addressElement ? addressElement.value.trim() : '';
          }
          
          // Получаем способ оплаты
          const paymentMethodElement = document.querySelector('input[name="payment"]:checked');
          const paymentMethod = paymentMethodElement ? paymentMethodElement.value : '';
          
          const commentElement = document.querySelector('#checkout-comment');
          const comment = commentElement ? commentElement.value.trim() : '';
          
          if (!name || !surname || !email || !phone || !address) {
            if (modalMessage && modal) {
              modalMessage.textContent = 'Пожалуйста, заполните все обязательные поля';
              modal.setAttribute('aria-hidden', 'false');
            }
            return;
          }
          
          fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer_name: name + ' ' + surname,
              customer_email: email,
              customer_phone: phone,
              shipping_address: address,
              delivery_type: deliveryType,
              payment_method: paymentMethod,
              comment: comment,
              items: cartItems.map(item => ({ product_id: item.id, quantity: item.quantity || 1 }))
            })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              cartItems = [];
              localStorage.setItem('cartItems', JSON.stringify(cartItems));
              renderCartItems();
              updateCartCount();
              checkoutForm.reset();
              cartItemsList.style.display = 'block';
              cartFooter.style.display = 'block';
              checkoutForm.classList.remove('active');
              modalMessage.textContent = `Заказ оформлен!\nНомер заказа: ${data.order_id || ''}`;
              modal.setAttribute('aria-hidden', 'false');
            } else {
              modalMessage.textContent = data.message || 'Ошибка оформления заказа';
              modal.setAttribute('aria-hidden', 'false');
            }
          })
          .catch(() => {
            modalMessage.textContent = 'Ошибка соединения с сервером';
            modal.setAttribute('aria-hidden', 'false');
          });
        });
      }
  
      // Добавляем проверку на null для modalClose
      if (modalClose) {
        modalClose.addEventListener('click', () => {
          if (modal) {
            modal.setAttribute('aria-hidden', 'true');
          }
        });
      }
  
      setupSearch();
  
      function renderCartItems() {
        const cartItemsList = document.querySelector('.cart-page__items');
        const totalElement = document.querySelector('.cart-page__total span');
        
        if (!cartItemsList || !totalElement) {
          console.log('Элементы корзины не найдены');
          return;
        }
        
        cartItemsList.innerHTML = '';
        let total = 0;
        
        // Получаем актуальные данные из localStorage
        cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        console.log('Загружено товаров из localStorage:', cartItems.length);
        
        if (cartItems.length === 0) {
          cartItemsList.innerHTML = '<li class="cart-empty">Ваша корзина пуста</li>';
          totalElement.textContent = '0 ₽';
        } else {
          cartItems.forEach((item, index) => {
            if (!item.quantity) item.quantity = 1;
            
            const li = document.createElement('li');
            li.setAttribute('data-id', item.id);
            li.innerHTML = `
              <img src="${item.image}" alt="${item.title}">
              <div class="cart-page__item-details">
                <div class="cart-page__item-title">${item.title}</div>
                <div class="cart-page__item-price">${item.price} ₽</div>
                <div class="cart-page__quantity-controls">
                  <button class="cart-page__quantity-btn" data-action="decrease">−</button>
                  <span class="cart-page__quantity-value">${item.quantity}</span>
                  <button class="cart-page__quantity-btn" data-action="increase">+</button>
                </div>
              </div>
              <button class="cart-page__remove-btn"><i class="fas fa-times"></i></button>
            `;
            
            li.querySelector('[data-action="decrease"]').addEventListener('click', () => {
              if (item.quantity > 1) {
                item.quantity--;
                showCartNotification('Количество уменьшено');
              } else {
                cartItems.splice(index, 1);
                showCartNotification('Товар удалён');
              }
              localStorage.setItem('cartItems', JSON.stringify(cartItems));
              renderCartItems();
              updateCartCount(true);
            });
            
            li.querySelector('[data-action="increase"]').addEventListener('click', () => {
              item.quantity++;
              localStorage.setItem('cartItems', JSON.stringify(cartItems));
              renderCartItems();
              updateCartCount(true);
              showCartNotification('Количество увеличено');
            });
            
            li.querySelector('.cart-page__remove-btn').addEventListener('click', () => {
              cartItems.splice(index, 1);
              localStorage.setItem('cartItems', JSON.stringify(cartItems));
              renderCartItems();
              updateCartCount(true);
              showCartNotification('Товар удалён');
            });
            
            cartItemsList.appendChild(li);
            total += item.price * item.quantity;
          });
          
          totalElement.textContent = `${total} ₽`;
        }
        
        // Обновляем счетчик корзины
        updateCartCount();
      }

      // Загружаем и применяем настройки методов оплаты
      async function initPaymentMethods() {
        // Получаем доступные методы оплаты из статических данных
        const paymentOptions = document.querySelector('.payment-options');
        if (!paymentOptions) return;
        
        // Очищаем контейнер
        paymentOptions.innerHTML = '';
        
        // Используем статические методы оплаты
        const paymentMethods = window.STATIC_PAYMENT_METHODS || [
          { value: 'card', label: 'Банковская карта' },
          { value: 'cash', label: 'Наличными при получении' },
          { value: 'online', label: 'Онлайн-оплата' }
        ];
        
        // Создаем элементы для каждого метода оплаты
        paymentMethods.forEach((method, index) => {
          const label = document.createElement('label');
          label.className = 'payment-option';
          
          const input = document.createElement('input');
          input.type = 'radio';
          input.name = 'payment';
          input.value = method.value;
          input.checked = index === 0; // Первый метод выбран по умолчанию
          
          const icon = document.createElement('span');
          icon.className = 'payment-option__icon';
          
          // Выбираем иконку в зависимости от типа оплаты
          let iconClass = '';
          switch(method.value) {
            case 'card':
              iconClass = 'fas fa-credit-card';
              break;
            case 'cash':
              iconClass = 'fas fa-money-bill-wave';
              break;
            case 'online':
              iconClass = 'fas fa-globe';
              break;
            default:
              iconClass = 'fas fa-credit-card';
          }
          
          icon.innerHTML = `<i class="${iconClass}"></i>`;
          
          const text = document.createElement('span');
          text.className = 'payment-option__text';
          text.textContent = method.label;
          
          label.appendChild(input);
          label.appendChild(icon);
          label.appendChild(text);
          
          paymentOptions.appendChild(label);
        });
      }

      // Вызываем функцию инициализации методов оплаты
      initPaymentMethods();
    }
  
    if (window.location.pathname.includes('favorites.html')) {
      console.log('Favorites page logic');
      const favoritesList = document.querySelector('.favorites-page__items');
      const totalElement = document.querySelector('.favorites-page__total span');
      const toCartButton = document.querySelector('.favorites-page__to-cart');
  
      renderFavoriteItems();
  
      toCartButton.addEventListener('click', () => {
        favoriteItems.forEach(item => {
          cartItems.push({ id: Date.now() + Math.random(), title: item.title, price: item.price, image: item.image });
        });
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        favoriteItems = [];
        localStorage.setItem('favoriteItems', JSON.stringify(favoriteItems));
        updateCartCount();
        window.location.href = 'cart.html';
      });
  
      setupSearch();
  
      function renderFavoriteItems() {
        favoritesList.innerHTML = '';
        favoriteItems = JSON.parse(localStorage.getItem('favoriteItems')) || [];
        toCartButton.disabled = favoriteItems.length === 0;
        if (favoriteItems.length === 0) {
          favoritesList.innerHTML = '<li>Избранное пусто</li>';
        } else {
          favoriteItems.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<img src="${item.image}" alt="${item.title}"><span>${item.title} - ${item.price} ₽</span><button>Удалить</button>`;
            li.querySelector('button').addEventListener('click', () => {
              favoriteItems.splice(index, 1);
              localStorage.setItem('favoriteItems', JSON.stringify(favoriteItems));
              renderFavoriteItems();
            });
            favoritesList.appendChild(li);
          });
        }
        totalElement.textContent = favoriteItems.length;
      }
    }
  
    if (window.location.pathname.includes('about.html')) {
        console.log('About page logic');
        const sections = document.querySelectorAll('.about-section');
      
        sections.forEach(section => {
          section.addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG') return;
      
            if (section.classList.contains('active')) {
              sections.forEach(s => {
                s.classList.remove('active');
                s.classList.remove('hidden');
              });
            } else {
              sections.forEach(otherSection => {
                if (otherSection !== section) {
                  otherSection.classList.add('hidden');
                  otherSection.classList.remove('active');
                }
              });
              // Добавляем active с небольшой задержкой для плавности
              setTimeout(() => {
                section.classList.remove('hidden');
                section.classList.add('active');
              }, 50); // 50ms задержка
            }
          });
        });
      
        setupSearch();
      }
  
    if (window.location.pathname.includes('account.html')) {
      console.log('Account page logic');
      const loginForm = document.querySelector('#loginForm');
      const registerForm = document.querySelector('#registerForm');
      const profileSection = document.querySelector('#profileSection');
      const loginSubmit = document.querySelector('#loginSubmit');
      const registerSubmit = document.querySelector('#registerSubmit');
      const showRegister = document.querySelector('#showRegister');
      const showLogin = document.querySelector('#showLogin');
      const accountName = document.querySelector('#accountName');
      const accountEmail = document.querySelector('#accountEmail');
      const editProfileButton = document.querySelector('#editProfile');
      const logoutButton = document.querySelector('#logout');
      const editForm = document.querySelector('#editForm');
      const editName = document.querySelector('#editName');
      const editEmail = document.querySelector('#editEmail');
      const cancelEdit = document.querySelector('#cancelEdit');
      const ordersList = document.querySelector('#ordersList');
      
      // Запрет вставки пароля в поле подтверждения
      const confirmPasswordField = document.querySelector('#registerPasswordConfirm');
      if (confirmPasswordField) {
        confirmPasswordField.addEventListener('paste', function(e) {
          e.preventDefault();
          
          // Создаем уведомление об ошибке
          const errorMessage = document.createElement('div');
          errorMessage.className = 'error-notification';
          errorMessage.textContent = 'Да, вот такие вот мы дотошные';
          document.body.appendChild(errorMessage);
          
          // Удаляем уведомление после задержки
          setTimeout(() => {
            errorMessage.classList.add('hide');
            setTimeout(() => errorMessage.remove(), 300);
          }, 3000);
        });
      }
  
      // Функция для переключения форм с удалением фокуса
      function showForm(formToShow, formToHide) {
        if (document.activeElement) document.activeElement.blur(); // Убираем фокус
        formToHide.setAttribute('aria-hidden', 'true');
        formToShow.setAttribute('aria-hidden', 'false');
      }
  
      // Проверяем, авторизован ли пользователь
      if (currentUser) {
        loginForm.setAttribute('aria-hidden', 'true');
        registerForm.setAttribute('aria-hidden', 'true');
        profileSection.setAttribute('aria-hidden', 'false');
        accountName.textContent = currentUser.name;
        accountEmail.textContent = currentUser.email;
        renderOrderHistory();
      } else {
        loginForm.setAttribute('aria-hidden', 'false');
        registerForm.setAttribute('aria-hidden', 'true');
        profileSection.setAttribute('aria-hidden', 'true');
      }
  
      showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        showForm(registerForm, loginForm);
      });
  
      showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showForm(loginForm, registerForm);
      });
  
      // Добавляем обработчик формы логина
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.querySelector('#loginEmail').value;
        const password = document.querySelector('#loginPassword').value;
        
        // Логиним пользователя через сервер
        const result = await loginUser(email, password);
        
        if (result.success) {
          // Успешный вход
          currentUser = { name: result.user.name, email: result.user.email };
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
          
          // Обновляем интерфейс профиля
          showForm(profileSection, loginForm);
          accountName.textContent = currentUser.name;
          accountEmail.textContent = currentUser.email;
          renderOrderHistory();
          
          // Показываем уведомление об успехе
          const successMessage = document.createElement('div');
          successMessage.className = 'success-notification';
          successMessage.textContent = 'Вход выполнен успешно!';
          document.body.appendChild(successMessage);
          
          setTimeout(() => {
            successMessage.classList.add('hide');
            setTimeout(() => successMessage.remove(), 300);
          }, 3000);
        } else {
          // Ошибка входа
          const errorMessage = document.createElement('div');
          errorMessage.className = 'error-notification';
          errorMessage.textContent = result.message || 'Ошибка при входе';
          document.body.appendChild(errorMessage);
          
          setTimeout(() => {
            errorMessage.classList.add('hide');
            setTimeout(() => errorMessage.remove(), 300);
          }, 3000);
        }
      });
  
      registerSubmit.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.querySelector('#registerName').value;
        const email = document.querySelector('#registerEmail').value;
        const password = document.querySelector('#registerPassword').value;
        const passwordConfirm = document.querySelector('#registerPasswordConfirm').value;
        
        // Проверяем совпадение паролей
        if (password !== passwordConfirm) {
          const errorMessage = document.createElement('div');
          errorMessage.className = 'error-notification';
          errorMessage.textContent = 'Пароли не совпадают';
          document.body.appendChild(errorMessage);
          
          setTimeout(() => {
            errorMessage.classList.add('hide');
            setTimeout(() => errorMessage.remove(), 300);
          }, 3000);
          
          return;
        }
        
        // Регистрируем пользователя через сервер
        const result = await registerUser(name, email, password);
        
        if (result.success) {
          // Успешная регистрация
          currentUser = { name, email };
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
          
          // Показываем форму контрагента
          showCounterpartyForm({ name, email });
          
          // Обновляем интерфейс профиля
          showForm(profileSection, registerForm);
          accountName.textContent = currentUser.name;
          accountEmail.textContent = currentUser.email;
          renderOrderHistory();
          
          // Показываем уведомление об успехе
          const successMessage = document.createElement('div');
          successMessage.className = 'success-notification';
          successMessage.textContent = 'Регистрация успешна!';
          document.body.appendChild(successMessage);
          
          setTimeout(() => {
            successMessage.classList.add('hide');
            setTimeout(() => successMessage.remove(), 300);
          }, 3000);
        } else {
          // Ошибка регистрации
          const errorMessage = document.createElement('div');
          errorMessage.className = 'error-notification';
          errorMessage.textContent = result.message || 'Ошибка при регистрации';
          document.body.appendChild(errorMessage);
          
          setTimeout(() => {
            errorMessage.classList.add('hide');
            setTimeout(() => errorMessage.remove(), 300);
          }, 3000);
        }
      });
  
      editProfileButton.addEventListener('click', () => {
        editName.value = currentUser.name;
        editEmail.value = currentUser.email;
        editForm.setAttribute('aria-hidden', 'false');
      });
  
      cancelEdit.addEventListener('click', () => {
        if (document.activeElement) document.activeElement.blur();
        editForm.setAttribute('aria-hidden', 'true');
      });
  
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = editName.value;
        const newEmail = editEmail.value;
        if (users.some(u => u.email === newEmail && u.email !== currentUser.email)) {
          alert('Этот email уже используется другим пользователем');
          return;
        }
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        users[userIndex].name = newName;
        users[userIndex].email = newEmail;
        currentUser.name = newName;
        currentUser.email = newEmail;
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        accountName.textContent = currentUser.name;
        accountEmail.textContent = currentUser.email;
        editForm.setAttribute('aria-hidden', 'true');
      });
  
      logoutButton.addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('currentUser');
        showForm(loginForm, profileSection);
        alert('Вы вышли из аккаунта');
      });
  
      setupSearch();
  
      async function fetchOrdersFromServer(email) {
        try {
          const res = await fetch(`${window.API_BASE_URL}/orders?email=${encodeURIComponent(email)}`);
          const data = await res.json();
          if (data.success) {
            return data.orders || [];
          }
        } catch (e) { console.error('Ошибка загрузки заказов с сервера', e); }
        return [];
      }

      // В функции renderOrderHistory:
      // Вместо фильтрации по localStorage, делаем так:
      async function renderOrderHistory() {
        ordersList.innerHTML = '';
        let userOrders = [];
        if (currentUser && currentUser.email) {
          userOrders = await fetchOrdersFromServer(currentUser.email);
        }
        if (userOrders.length === 0) {
          ordersList.innerHTML = '';
        } else {
          userOrders.forEach(order => {
            const li = document.createElement('li');
            li.innerHTML = `
              <strong>Заказ #${order.id}</strong> от ${order.date || order.created_at || ''}<br>
              Товаров: ${order.items ? order.items.length : 0}, Сумма: ${order.total || order.total_amount || 0} ₽<br>
              Доставка: ${order.address || order.shipping_address || ''}
            `;
            ordersList.appendChild(li);
          });
        }
      }
    }
  
    function updatePopup(product, productId) {
      document.querySelector('#popupTitle').textContent = product.title;
      document.querySelector('#popupPrice').textContent = `${product.price} ₽`;
      document.querySelector('#popupDescription').textContent = product.description;
      
      // Безопасная установка изображений с fallback
      const images = product.images || [];
      const imageUrl = product.image_url || '';
      
      // Первое изображение
      const popupImage1 = document.querySelector('#popupImage1');
      if (popupImage1) {
        popupImage1.src = images[0] || imageUrl || 'https://via.placeholder.com/300x300?text=Нет+изображения';
      }
      
      // Второе изображение
      const popupImage2 = document.querySelector('#popupImage2');
      if (popupImage2) {
        popupImage2.src = images[1] || imageUrl || 'https://via.placeholder.com/300x300?text=Нет+изображения';
      }
      
      // Третье изображение
      const popupImage3 = document.querySelector('#popupImage3');
      if (popupImage3) {
        popupImage3.src = images[2] || imageUrl || 'https://via.placeholder.com/300x300?text=Нет+изображения';
      }
      
      const isFavorite = favoriteItems.some(item => item.id === productId);
      const popupFavorite = document.querySelector('#popupFavorite');
      popupFavorite.classList.toggle('active', isFavorite);
      const icon = popupFavorite.querySelector('i');
      icon.classList.toggle('far', !isFavorite);
      icon.classList.toggle('fas', isFavorite);
    }
  
    function createCartItem() {
      return {
        id: Date.now(),
        title: document.querySelector('#popupTitle').textContent,
        price: parseInt(document.querySelector('#popupPrice').textContent.replace(/[^\d]/g, '')),
        image: document.querySelector('#popupImage1').src
      };
    }
  
    function toggleFavorite(productId) {
      const product = products[productId];
      if (!product) {
        console.error('Товар не найден:', productId);
        return;
      }
      
      const isFavorite = favoriteItems.some(item => item.id === productId);
      
      // Определяем изображение товара с fallback
      let productImage = '';
      if (product.images && product.images.length > 0 && product.images[0]) {
        productImage = product.images[0];
      } else if (product.image_url) {
        productImage = product.image_url;
      } else {
        productImage = 'https://via.placeholder.com/300x300?text=Нет+изображения';
      }
      
      if (!isFavorite) {
        favoriteItems.push({ 
          id: productId, 
          title: product.title, 
          price: product.price, 
          image: productImage 
        });
      } else {
        favoriteItems = favoriteItems.filter(item => item.id !== productId);
      }
      
      localStorage.setItem('favoriteItems', JSON.stringify(favoriteItems));
      const popupFavorite = document.querySelector('#popupFavorite');
      popupFavorite.classList.toggle('active', !isFavorite);
      const icon = popupFavorite.querySelector('i');
      icon.classList.toggle('far', isFavorite);
      icon.classList.toggle('fas', !isFavorite);
    }
  
    function formatPhoneNumber(value) {
      const digits = value.replace(/\D/g, '');
      let phoneNumber = digits.startsWith('8') ? '7' + digits.slice(1) : digits.length > 0 ? '7' + digits : digits;
      const match = phoneNumber.match(/^(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
      if (match) {
        const parts = [];
        if (match[1]) parts.push('+7');
        if (match[2]) parts.push(` (${match[2]}`);
        if (match[3]) parts.push(`) ${match[3]}`);
        if (match[4]) parts.push(`-${match[4]}`);
        if (match[5]) parts.push(`-${match[5]}`);
        return parts.join('');
      }
      return value;
    }
  
    function setupCarousel() {
      const track = document.querySelector('.carousel__track');
      const items = document.querySelectorAll('.carousel__item');
      const productsHeading = document.querySelector('.products__heading');
      if (!track || items.length === 0) return;
  
      let currentIndex = 0;
  
      async function updateCarousel() {
        const itemWidth = items[0].offsetWidth + 10;
        const containerWidth = track.parentElement.offsetWidth;
        const offset = (containerWidth - itemWidth) / 2;
        track.style.transform = `translateX(${-currentIndex * itemWidth + offset}px)`;
        items.forEach((item, i) => item.toggleAttribute('data-active', i === currentIndex));
        const category = items[currentIndex].getAttribute('data-category');
        document.querySelectorAll('.product-card').forEach(card => {
          card.style.display = card.getAttribute('data-category') === category ? 'flex' : 'none';
        });
        productsHeading.textContent = `Товары - ${items[currentIndex].querySelector('.carousel__text').textContent}`;
        await loadAndRenderSubcategories(category, items[currentIndex]);
      }
  
      let startX;
      track.addEventListener('touchstart', (e) => startX = e.touches[0].clientX);
      track.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].clientX;
        if (startX - endX > 30) {
          currentIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        } else if (endX - startX > 30) {
          currentIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        }
        updateCarousel();
      });
  
      window.addEventListener('load', updateCarousel);
      window.addEventListener('resize', updateCarousel);
    }
  
    function setupCardAnimation() {
      const cards = document.querySelectorAll('.product-card');
      if (cards.length === 0) return;
  
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
            }, i * 100);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
  
      cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(10px)';
        card.style.transition = 'opacity 0.4s, transform 0.4s';
        observer.observe(card);
      });
    }
  
    function setupSearch() {
      const searchIcon = document.querySelector('.search-icon');
      const searchPopup = document.querySelector('#searchPopup');
      const searchInput = document.querySelector('#searchInput');
      const searchResults = document.querySelector('#searchResults');
      const clearSearchBtn = document.querySelector('#clearSearch');
      const closeSearchBtn = document.querySelector('#closeSearch');
      const searchSuggestions = document.querySelector('#searchSuggestions');
      const searchTags = document.querySelectorAll('.search-popup__tag');
      
      // Объект для хранения истории поиска
      const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      
      // Функция для сохранения истории поиска
      function saveSearchHistory(query) {
        if (query && query.length > 2 && !searchHistory.includes(query)) {
          searchHistory.unshift(query);
          if (searchHistory.length > 5) {
            searchHistory.pop();
          }
          localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        }
      }
  
      if (searchIcon && searchPopup && searchInput && searchResults) {
        searchIcon.addEventListener('click', (e) => {
          e.preventDefault();
          searchPopup.setAttribute('aria-hidden', 'false');
          searchInput.focus();
          searchIcon.classList.add('active');
          
          // Показываем историю поиска, если она есть
          if (searchHistory.length > 0 && !searchInput.value) {
            showSearchHistory();
          }
        });
        
        // Функция для отображения истории поиска
        function showSearchHistory() {
          if (searchSuggestions) {
            const historyHTML = `
              <p class="search-popup__suggestions-title">История поиска:</p>
              <div class="search-popup__tags">
                ${searchHistory.map(query => `<span class="search-popup__tag" data-query="${query}">${query}</span>`).join('')}
                ${searchHistory.length > 0 ? '<span class="search-popup__tag" data-action="clear-history">Очистить историю</span>' : ''}
              </div>
            `;
            searchSuggestions.innerHTML = historyHTML;
            
            // Добавляем обработчики для тегов истории
            searchSuggestions.querySelectorAll('.search-popup__tag').forEach(tag => {
              tag.addEventListener('click', handleTagClick);
            });
          }
        }
        
        // Обработчик клика по тегу
        function handleTagClick(e) {
          const tag = e.currentTarget;
          if (tag.dataset.action === 'clear-history') {
            localStorage.removeItem('searchHistory');
            searchSuggestions.innerHTML = `
              <p class="search-popup__suggestions-title">Популярные запросы:</p>
              <div class="search-popup__tags">
                <span class="search-popup__tag" data-query="наушники">Наушники</span>
                <span class="search-popup__tag" data-query="часы">Часы</span>
                <span class="search-popup__tag" data-query="футболка">Футболка</span>
                <span class="search-popup__tag" data-query="чехол">Чехол</span>
                <span class="search-popup__tag" data-query="колонка">Колонка</span>
              </div>
            `;
            searchSuggestions.querySelectorAll('.search-popup__tag').forEach(tag => {
              tag.addEventListener('click', handleTagClick);
            });
            return;
          }
          
          const query = tag.dataset.query;
          if (query) {
            searchInput.value = query;
            searchInput.dispatchEvent(new Event('input'));
            searchInput.focus();
          }
        }
        
        // Добавляем обработчики для тегов популярных запросов
        if (searchTags) {
          searchTags.forEach(tag => {
            tag.addEventListener('click', handleTagClick);
          });
        }
  
        // Закрытие по клику на оверлей
        searchPopup.addEventListener('click', (e) => {
          if (e.target === searchPopup.querySelector('.search-popup__overlay')) {
            closeSearchPopup();
          }
        });
        
        // Функция закрытия поиска
        function closeSearchPopup() {
          searchPopup.setAttribute('aria-hidden', 'true');
          setTimeout(() => {
            searchIcon.classList.remove('active');
          }, 300);
        }
        
        // Кнопка закрытия
        if (closeSearchBtn) {
          closeSearchBtn.addEventListener('click', () => {
            closeSearchPopup();
          });
        }
        
        // Кнопка очистки поля
        if (clearSearchBtn) {
          clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchInput.focus();
            searchResults.innerHTML = '';
            if (searchHistory.length > 0) {
              showSearchHistory();
            } else {
              searchSuggestions.style.display = 'block';
            }
          });
        }
  
        // Обработка ввода в поле поиска
        searchInput.addEventListener('input', (e) => {
          const query = e.target.value.trim().toLowerCase();
          
          // Показываем/скрываем кнопку очистки
          if (clearSearchBtn) {
            clearSearchBtn.style.opacity = query.length > 0 ? '1' : '0';
          }
          
          if (query.length > 0) {
            searchSuggestions.style.display = 'none';
            const filteredProducts = Object.values(products).filter(product =>
              product.title.toLowerCase().includes(query) || 
              (product.description && product.description.toLowerCase().includes(query)) ||
              (product.category && product.category.toLowerCase().includes(query)) ||
              (product.sku && product.sku.toLowerCase().includes(query))
            );
            renderSearchResults(filteredProducts, query);
          } else {
            searchResults.innerHTML = '';
            searchSuggestions.style.display = 'block';
            if (searchHistory.length > 0) {
              showSearchHistory();
            }
          }
        });
  
        // Обработка нажатия Enter в поле поиска
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && searchInput.value.trim()) {
            const query = searchInput.value.trim().toLowerCase();
            saveSearchHistory(query);
            
            const firstResult = searchResults.querySelector('li');
            if (firstResult) {
              firstResult.click();
            }
          }
          
          // Закрытие по Escape
          if (e.key === 'Escape') {
            closeSearchPopup();
          }
        });
        
        // Обработка клика по результату поиска
        searchResults.addEventListener('click', (e) => {
          const li = e.target.closest('li');
          if (li) {
            const productId = li.getAttribute('data-id');
            if (productId && products[productId]) {
              const product = products[productId];
              saveSearchHistory(searchInput.value.trim().toLowerCase());
              updatePopup(product, productId);
              productPopup.setAttribute('aria-hidden', 'false');
              closeSearchPopup();
            }
          }
        });
        
        // Добавляем автофокус при открытии
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.attributeName === 'aria-hidden' && 
                searchPopup.getAttribute('aria-hidden') === 'false') {
              setTimeout(() => searchInput.focus(), 100);
            }
          });
        });
        
        observer.observe(searchPopup, { attributes: true });
      }
    }
  
    function renderSearchResults(filteredProducts, query) {
      const searchResults = document.querySelector('#searchResults');
      searchResults.innerHTML = '';
      
      if (filteredProducts.length === 0) {
        searchResults.innerHTML = `
          <div class="search-popup__no-results">
            <i class="fas fa-search" style="font-size: 24px; opacity: 0.5; margin-bottom: 10px;"></i>
            <p>По запросу «${query}» ничего не найдено</p>
            <p style="font-size: 12px; margin-top: 5px;">Попробуйте изменить запрос или выбрать из популярных</p>
          </div>
        `;
      } else {
        const ul = document.createElement('ul');
        
        filteredProducts.forEach(product => {
          const productId = Object.keys(products).find(id => products[id] === product);
          const li = document.createElement('li');
          li.setAttribute('data-id', productId);
          
          // Получаем изображение продукта
          let productImage = '';
          if (product.images && product.images.length > 0) {
            productImage = product.images[0];
          } else {
            // Пытаемся найти изображение в HTML
            const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
            if (productCard) {
              const img = productCard.querySelector('img');
              if (img) {
                productImage = img.src;
              }
            }
          }
          
          // Получаем категорию продукта
          const categoryName = getCategoryName(product.category);
          
          li.innerHTML = `
            <img src="${productImage}" alt="${product.title}" class="search-popup__product-image" onerror="this.src='https://via.placeholder.com/40x40?text=Фото'">
            <div class="search-popup__product-info">
              <div class="search-popup__product-title">${highlightQuery(product.title, query)}</div>
              <div class="search-popup__product-price">${product.price} ₽</div>
              ${categoryName ? `<div class="search-popup__category-tag">${categoryName}</div>` : ''}
              ${product.sku ? `<div class="search-popup__sku">Артикул: ${highlightQuery(product.sku, query)}</div>` : ''}
            </div>
          `;
          
          ul.appendChild(li);
        });
        
        searchResults.appendChild(ul);
      }
    }
    
    // Функция для подсветки искомого текста
    function highlightQuery(text, query) {
      if (!query) return text;
      const regex = new RegExp(`(${query})`, 'gi');
      return text.replace(regex, '<mark style="background-color: rgba(201, 137, 123, 0.2); padding: 0 2px; border-radius: 2px;">$1</mark>');
    }
    
    // Функция для получения названия категории
    function getCategoryName(categoryCode) {
      const categories = {
        'electronics': 'Электроника',
        'toys': 'Игрушки',
        'accessories': 'Аксессуары',
        'clothes': 'Одежда',
        'appliances': 'Бытовая техника'
      };
      
      return categories[categoryCode] || '';
    }
  
    updateCartCount();
  
    // Защита от копирования текста
    // Запрет контекстного меню
    document.addEventListener('contextmenu', function(e) {
      if (!e.target.matches('input, textarea')) {
        e.preventDefault();
      }
    });
  
    // Запрет копирования
    document.addEventListener('copy', function(e) {
      if (!e.target.matches('input, textarea')) {
        e.preventDefault();
        return false;
      }
    });
  
    // Запрет вырезания
    document.addEventListener('cut', function(e) {
      if (!e.target.matches('input, textarea')) {
        e.preventDefault();
        return false;
      }
    });
  
    // Запрет перетаскивания
    document.addEventListener('dragstart', function(e) {
      if (!e.target.matches('input, textarea')) {
        e.preventDefault();
        return false;
      }
    });
  
    // Обработчик клавиши ё для перехода на страницу пользователей
    document.addEventListener('keydown', function(e) {
      // Клавиша ё (код 192)
      if (e.keyCode === 192) {
        // Проверяем, авторизован ли пользователь
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData.loggedIn) {
          window.location.href = 'users.html';
        } else {
          showNotification('Доступ запрещен. Авторизуйтесь для просмотра списка пользователей.', 'error');
        }
      }
    });
  
    // Добавляем глобальную функцию showProfileModal
    function showProfileModal() {
      // Переиспользуем функцию из desktop.js, если она доступна
      if (typeof window.showProfileModal === 'function') {
        window.showProfileModal();
        return;
      }
      
      // Получаем данные пользователя
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (!userData.name || !userData.email) {
        alert('Ошибка загрузки данных профиля');
        return;
      }
      
      // Перенаправляем на страницу аккаунта, если она есть
      if (window.location.pathname.includes('account.html')) {
        // Уже на странице аккаунта
        return;
      }
      
      // Если у нас есть страница аккаунта, перенаправляем на нее
      window.location.href = 'account.html';
    }
  
    async function loadCategoriesAndRenderCarousel() {
      const track = document.querySelector('.carousel__track');
      if (!track) return;
      track.innerHTML = '<div style="color:#888;padding:20px;">Загрузка категорий...</div>';
      try {
        const res = await fetch(`${API_BASE_URL}/categories`);
        const data = await res.json();
        if (!data.success || !data.categories || !data.categories.length) {
          track.innerHTML = '<div style="color:#888;padding:20px;">Нет категорий</div>';
          return;
        }
        // Маппинг картинок для категорий (можно расширить)
        const categoryImages = {
          electronics: '../images/electronics.png',
          toys: '../images/toys.png',
          accessories: '../images/accessories.png',
          clothes: '../images/clothes.png',
          appliances: '../images/appliances.png',
          other: '../images/other.png',
        };
        
        track.innerHTML = '';
        data.categories.forEach((cat, index) => {
          const item = document.createElement('div');
          item.className = 'carousel__item';
          item.setAttribute('data-category', cat.code);
          if (index === 0) {
            item.setAttribute('data-active', '');
          }
          
          // Формируем URL изображения
          let imageUrl = cat.image_url || categoryImages[cat.code] || '../images/other.png';
          if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            imageUrl = `${API_BASE_URL}/${imageUrl}`;
          }
          
          item.innerHTML = `
            <div class="carousel__box">
              <img src="${imageUrl}" alt="${cat.name}" loading="lazy">
              <span class="carousel__text">${cat.name}</span>
            </div>
          `;
          
          track.appendChild(item);
        });
        
        // Загружаем товары и подкатегории для первой категории
        const firstItem = track.querySelector('.carousel__item[data-active]');
        if (firstItem) {
          const firstCategory = firstItem.getAttribute('data-category');
          console.log(`Инициализация первой категории: ${firstCategory}`);
          
          // Загружаем товары для первой категории
          await loadAndRenderProducts(firstCategory);
          
          // Загружаем подкатегории для первой категории
          await loadAndRenderSubcategories(firstCategory, firstItem);
        }
        
        // ВАЖНО: инициализируем свайп/скролл карусели
        setupCarousel();
      } catch (e) {
        console.error('Ошибка при загрузке категорий:', e);
        track.innerHTML = '<div style="color:#888;padding:20px;">Ошибка загрузки категорий</div>';
      }
    }
    
    // Функция для загрузки и отображения подкатегорий
    async function loadAndRenderSubcategories(categoryCode, categoryElement) {
      const container = document.querySelector('.subcategory-carousel__track');
      const subcategoriesCarousel = document.querySelector('.subcategory-carousel');
      
      if (!container || !subcategoriesCarousel) return;
      
      console.log(`Загрузка подкатегорий для категории: ${categoryCode}`);
      
      // Очищаем контейнер и показываем индикатор загрузки
      container.innerHTML = '<div style="text-align:center;color:#888;padding:10px;width:100%;">Загрузка подкатегорий...</div>';
      
      try {
        const response = await fetch(`${API_BASE_URL}/subcategories?category=${encodeURIComponent(categoryCode)}`);
        const data = await response.json();
        
        console.log('Полученные подкатегории:', data);
        
        if (!data.success || !data.subcategories || data.subcategories.length === 0) {
          // Если подкатегорий нет, скрываем карусель
          subcategoriesCarousel.classList.remove('active');
          container.innerHTML = '';
          
          // Убираем индикатор наличия подкатегорий с категории
          if (categoryElement) {
            categoryElement.classList.remove('has-subcategories');
          }
          return;
        }
        
        // Полностью очищаем контейнер перед добавлением новых подкатегорий
        container.innerHTML = '';
        
        // Отображаем подкатегории
        data.subcategories.forEach((subcat, index) => {
          const subcatElement = document.createElement('div');
          subcatElement.className = `subcategory-item ${index === 0 ? 'active' : ''}`;
          subcatElement.setAttribute('data-subcat', subcat.code);
          subcatElement.style.animationDelay = `${index * 0.05}s`;
          subcatElement.textContent = subcat.name;
          container.appendChild(subcatElement);
        });
        
        // Показываем карусель подкатегорий
        subcategoriesCarousel.classList.add('active');
        
        // Добавляем индикатор наличия подкатегорий на категорию
        if (categoryElement) {
          categoryElement.classList.add('has-subcategories');
        }
        
        // Добавляем обработчики событий для подкатегорий
        const subcategoryItems = container.querySelectorAll('.subcategory-item');
        subcategoryItems.forEach(item => {
          item.addEventListener('click', async function() {
            // Снимаем активный класс со всех подкатегорий
            subcategoryItems.forEach(el => el.classList.remove('active'));
            // Добавляем активный класс на выбранную подкатегорию
            this.classList.add('active');
            
            const subcatCode = this.getAttribute('data-subcat');
            const activeCategory = document.querySelector('.carousel__item[data-active]')?.getAttribute('data-category');
            
            if (activeCategory) {
              console.log(`Фильтрация товаров: категория ${activeCategory}, подкатегория ${subcatCode}`);
              
              // Загружаем товары по выбранной подкатегории
              await filterProductsBySubcategory(activeCategory, subcatCode);
              
              // Добавляем эффект пульсации для выбранной подкатегории
              this.classList.add('pulse');
              setTimeout(() => {
                this.classList.remove('pulse');
              }, 300);
            }
          });
        });
        
        // Если есть активная подкатегория, фильтруем товары по ней
        const activeSubcategory = container.querySelector('.subcategory-item.active');
        if (activeSubcategory) {
          const subcatCode = activeSubcategory.getAttribute('data-subcat');
          await filterProductsBySubcategory(categoryCode, subcatCode);
        }
        
      } catch (error) {
        console.error('Ошибка при загрузке подкатегорий:', error);
        subcategoriesCarousel.classList.remove('active');
        container.innerHTML = '';
      }
    }
    
    // Функция для фильтрации товаров по подкатегории
    async function filterProductsBySubcategory(categoryCode, subcatCode) {
      const productsGrid = document.querySelector('.products__grid');
      if (!productsGrid) return;
      
      productsGrid.innerHTML = '<div class="loading-indicator">Загрузка товаров...</div>';
      
      try {
        const url = new URL(`${API_BASE_URL}/products`, window.location.origin);
        url.searchParams.append('category', categoryCode);
        url.searchParams.append('subcategory', subcatCode);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.success || !data.products) {
          productsGrid.innerHTML = '<div class="no-products">Товары не найдены</div>';
          return;
        }
        
        renderProducts(data.products, categoryCode);
        
      } catch (error) {
        console.error('Ошибка при фильтрации товаров:', error);
        productsGrid.innerHTML = '<div class="no-products">Ошибка загрузки товаров</div>';
      }
    }

    // --- API для работы с товарами (аналогично products-api.js) ---
    async function getProducts(category = '') {
      try {
        const url = new URL(`${API_BASE_URL}/products`, window.location.origin);
        if (category) {
          url.searchParams.append('category', category);
        }
        const response = await fetch(url);
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Ошибка при получении товаров');
        }
        
        // Заполняем глобальную переменную products
        const productsList = data.products || [];
        products = {}; // Сбрасываем текущие продукты
        productsList.forEach(product => {
          products[product.id] = product;
        });
        
        return productsList;
      } catch (error) {
        console.error('Ошибка при получении товаров:', error);
        return [];
      }
    }
  
    function renderProducts(products, activeCategory = '') {
      const productsGrid = document.querySelector('.products__grid');
      if (!productsGrid) return;
      productsGrid.innerHTML = '';
      if (!products || products.length === 0) {
        let message = 'Товары не найдены';
        if (activeCategory) {
          message = `В категории "${activeCategory}" нет товаров`;
        }
        productsGrid.innerHTML = `<div class="no-products">${message}</div>`;
        return;
      }
      products.forEach((product, index) => {
        const productCard = document.createElement('article');
        productCard.className = 'product-card';
        productCard.dataset.id = product.id;
        productCard.dataset.category = product.category || 'other';
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
        productsGrid.appendChild(productCard);
        setTimeout(() => {
          productCard.classList.add('visible');
        }, index * 100);
        
        // Добавляем обработчик для кнопки "В корзину"
        const addToCartButton = productCard.querySelector('.product-card__button');
        if (addToCartButton) {
          addToCartButton.addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart({
              id: product.id,
              title: product.title,
              price: product.price,
              image: imageUrl || 'https://via.placeholder.com/300x300?text=Нет+изображения',
              quantity: 1
            });
          });
        }
      });
    }
  
    async function loadAndRenderProducts(category = '') {
      const productsGrid = document.querySelector('.products__grid');
      if (productsGrid) {
        productsGrid.innerHTML = '<div class="loading-indicator">Загрузка товаров...</div>';
      }
      const products = await getProducts(category);
      renderProducts(products, category);
    }
  
    // --- Подключение к смене категории ---
    function setupCategoryChangeForMobile() {
      const track = document.querySelector('.carousel__track');
      if (!track) return;
      track.addEventListener('click', async (e) => {
        const item = e.target.closest('.carousel__item');
        if (!item) return;
        
        // Снимаем data-active со всех
        track.querySelectorAll('.carousel__item').forEach(el => {
          el.removeAttribute('data-active');
          el.classList.remove('has-subcategories');
        });
        item.setAttribute('data-active', '');
        
        const category = item.getAttribute('data-category');
        console.log(`Выбрана категория: ${category}`);
        
        const productsHeading = document.querySelector('.products__heading');
        if (productsHeading) {
          productsHeading.textContent = `Товары - ${item.querySelector('.carousel__text').textContent}`;
        }
        
        // Скрываем мини-карусель подкатегорий перед загрузкой новых
        const subcategoriesCarousel = document.querySelector('.subcategory-carousel');
        const subcategoriesTrack = document.querySelector('.subcategory-carousel__track');
        if (subcategoriesCarousel) {
          subcategoriesCarousel.classList.remove('active');
        }
        if (subcategoriesTrack) {
          subcategoriesTrack.innerHTML = '';
        }
        
        // Загружаем товары для выбранной категории
        await loadAndRenderProducts(category);
        
        // Загружаем подкатегории для выбранной категории
        await loadAndRenderSubcategories(category, item);
        
        // Добавляем анимацию для выбранной категории
        item.classList.add('bounce');
        setTimeout(() => {
          item.classList.remove('bounce');
        }, 500);
      });
    }
  
    // --- Инициализация при загрузке страницы ---
    document.addEventListener('DOMContentLoaded', () => {
      if (window.location.pathname.includes('mobile.html') || window.location.pathname === '/') {
        // Загружаем категории и карусель
        loadCategoriesAndRenderCarousel();
        
        // Наблюдаем за изменениями в карусели
        const observer = new MutationObserver(() => {
          const firstItem = document.querySelector('.carousel__item[data-active]');
          if (firstItem) {
            observer.disconnect();
          }
        });
        const track = document.querySelector('.carousel__track');
        if (track) {
          observer.observe(track, { childList: true });
        }
        setupCategoryChangeForMobile();
      }
    });
  
    // --- Уведомление (минималистично) ---
    function showCartNotification(message) {
      let notif = document.getElementById('cartNotification');
      if (!notif) {
        notif = document.createElement('div');
        notif.id = 'cartNotification';
        notif.style.position = 'fixed';
        notif.style.bottom = '60px';
        notif.style.left = '50%';
        notif.style.transform = 'translateX(-50%)';
        notif.style.background = '#C9897B';
        notif.style.color = '#fff';
        notif.style.padding = '10px 22px';
        notif.style.borderRadius = '20px';
        notif.style.fontSize = '15px';
        notif.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)';
        notif.style.zIndex = '2000';
        notif.style.opacity = '0';
        notif.style.transition = 'opacity 0.3s';
        document.body.appendChild(notif);
      }
      notif.textContent = message;
      notif.style.opacity = '1';
      setTimeout(() => notif.style.opacity = '0', 1600);
    }
  
    // --- Добавление в корзину с проверкой на дубликаты ---
    function addToCart(item) {
      // Проверяем, есть ли у товара корректный ID
      if (!item.id) {
        console.error('Ошибка: Невозможно добавить товар в корзину без ID');
        showCartNotification('Ошибка при добавлении товара');
        return;
      }
      
      // Преобразуем ID в число, если это строка
      if (typeof item.id === 'string') {
        item.id = parseInt(item.id);
        if (isNaN(item.id)) {
          console.error('Ошибка: Невалидный ID товара');
          showCartNotification('Ошибка при добавлении товара');
          return;
        }
      }
      
      // Получаем актуальные данные из localStorage
      const currentCartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
      
      // Проверяем, есть ли уже такой товар (по id)
      const existing = currentCartItems.find(ci => ci.id === item.id);
      if (existing) {
        existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
        showCartNotification('Количество товара увеличено');
      } else {
        item.quantity = item.quantity || 1;
        currentCartItems.push(item);
        showCartNotification('Товар добавлен в корзину');
      }
      
      // Обновляем localStorage и глобальную переменную
      localStorage.setItem('cartItems', JSON.stringify(currentCartItems));
      cartItems = currentCartItems;
      
      // Обновляем счетчик корзины
      updateCartCount(true);
    }
  
    // Делаем функцию addToCart доступной глобально
    window.addToCart = addToCart;
  
    // Переключение между адресом и пунктом самовывоза
    const deliveryType = document.querySelector('#delivery-type');
    const addressGroup = document.querySelector('#delivery-address-group');
    const pickupGroup = document.querySelector('#pickup-points-group');
    if (deliveryType && addressGroup && pickupGroup) {
      deliveryType.addEventListener('change', () => {
        if (deliveryType.value === 'pickup') {
          addressGroup.style.display = 'none';
          pickupGroup.style.display = '';
        } else {
          addressGroup.style.display = '';
          pickupGroup.style.display = 'none';
        }
      });
    }

    // Функция для отображения формы контрагента после регистрации
    function showCounterpartyForm(userData) {
        console.log('Показываем форму контрагента для пользователя:', userData);
        
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'counterparty-modal';
        
        // Создаем содержимое модального окна
        const content = document.createElement('div');
        content.className = 'counterparty-modal__content';
        
        // Заголовок
        const heading = document.createElement('h2');
        heading.textContent = 'Данные контрагента';
        content.appendChild(heading);
        
        // Описание
        const description = document.createElement('p');
        description.textContent = 'Пожалуйста, заполните данные вашей организации для работы с нами.';
        content.appendChild(description);
        
        // Индикатор шагов
        const stepsIndicator = document.createElement('div');
        stepsIndicator.className = 'counterparty-steps';
        
        // Линия прогресса
        const progressLine = document.createElement('div');
        progressLine.className = 'progress-line';
        stepsIndicator.appendChild(progressLine);
        
        // Создаем индикаторы шагов
        const totalSteps = 3;
        for (let i = 1; i <= totalSteps; i++) {
            const step = document.createElement('div');
            step.className = `step step-${i}`;
            step.dataset.step = i;
            
            const stepCircle = document.createElement('div');
            stepCircle.className = 'step-circle';
            stepCircle.textContent = i;
            
            const stepLabel = document.createElement('div');
            stepLabel.className = 'step-label';
            stepLabel.textContent = ['Организация', 'Реквизиты', 'Контакты'][i-1];
            
            step.appendChild(stepCircle);
            step.appendChild(stepLabel);
            stepsIndicator.appendChild(step);
        }
        
        content.appendChild(stepsIndicator);
        
        // Форма
        const form = document.createElement('form');
        form.className = 'counterparty-form';
        form.id = 'mobileCounterpartyForm';
        
        // Создаем шаги формы
        const steps = [
            // Шаг 1: Организация
            [
                { id: 'orgName', label: 'Название организации', type: 'text', required: true },
                { id: 'legalAddress', label: 'Юридический адрес', type: 'text', required: true }
            ],
            // Шаг 2: Реквизиты
            [
                { id: 'inn', label: 'ИНН', type: 'text', required: true, pattern: '^\\d{10}$|^\\d{12}$', errorMsg: 'ИНН должен содержать 10 или 12 цифр' },
                { id: 'kpp', label: 'КПП', type: 'text', required: false, pattern: '^\\d{9}$', errorMsg: 'КПП должен содержать 9 цифр' },
                { id: 'ogrn', label: 'ОГРН', type: 'text', required: false, pattern: '^\\d{13}$|^\\d{15}$', errorMsg: 'ОГРН должен содержать 13 или 15 цифр' },
                { id: 'bankName', label: 'Наименование банка', type: 'text', required: true },
                { id: 'bankAccount', label: 'Расчетный счет', type: 'text', required: true, pattern: '^\\d{20}$', errorMsg: 'Расчетный счет должен содержать 20 цифр' },
                { id: 'corrAccount', label: 'Корреспондентский счет', type: 'text', required: true, pattern: '^\\d{20}$', errorMsg: 'Корреспондентский счет должен содержать 20 цифр' },
                { id: 'bik', label: 'БИК', type: 'text', required: true, pattern: '^\\d{9}$', errorMsg: 'БИК должен содержать 9 цифр' }
            ],
            // Шаг 3: Контакты
            [
                { id: 'contactPerson', label: 'Контактное лицо', type: 'text', required: true },
                { id: 'contactPosition', label: 'Должность', type: 'text', required: true },
                { id: 'workPhone', label: 'Рабочий телефон', type: 'tel', required: true },
                { id: 'contactEmail', label: 'Email для связи', type: 'email', required: true },
                { id: 'contactMethod', label: 'Предпочтительный способ связи', type: 'radio', required: true, options: [
                    { value: 'phone', label: 'Телефон', icon: 'fas fa-phone' },
                    { value: 'email', label: 'Email', icon: 'fas fa-envelope', default: true },
                    { value: 'telegram', label: 'Telegram', icon: 'fab fa-telegram' },
                    { value: 'whatsapp', label: 'WhatsApp', icon: 'fab fa-whatsapp' }
                ]}
            ]
        ];
        
        // Создаем контейнеры для шагов
        const stepsContainer = document.createElement('div');
        stepsContainer.className = 'steps-container';
        
        steps.forEach((stepFields, stepIndex) => {
            const stepContainer = document.createElement('div');
            stepContainer.className = `step-container step-${stepIndex + 1}`;
            stepContainer.style.display = stepIndex === 0 ? 'block' : 'none';
            
            stepFields.forEach(field => {
                const formGroup = document.createElement('div');
                formGroup.className = 'form-group';
                
                const label = document.createElement('label');
                label.setAttribute('for', field.id);
                label.textContent = field.label;
                formGroup.appendChild(label);
                
                // Для радио-кнопок создаем отдельную группу
                if (field.type === 'radio') {
                    const radioGroup = document.createElement('div');
                    radioGroup.className = 'radio-group';
                    
                    field.options.forEach(option => {
                        const radioOption = document.createElement('div');
                        radioOption.className = 'radio-option';
                        
                        const input = document.createElement('input');
                        input.type = 'radio';
                        input.id = `contactMethod${option.value.charAt(0).toUpperCase() + option.value.slice(1)}`;
                        input.name = field.id;
                        input.value = option.value;
                        if (option.default) input.checked = true;
                        
                        const radioLabel = document.createElement('label');
                        radioLabel.setAttribute('for', input.id);
                        
                        const icon = document.createElement('i');
                        icon.className = option.icon;
                        radioLabel.appendChild(icon);
                        radioLabel.appendChild(document.createTextNode(' ' + option.label));
                        
                        radioOption.appendChild(input);
                        radioOption.appendChild(radioLabel);
                        radioGroup.appendChild(radioOption);
                    });
                    
                    formGroup.appendChild(radioGroup);
                } else {
                    const input = document.createElement('input');
                    input.id = field.id;
                    input.type = field.type;
                    input.required = field.required;
                    if (field.pattern) input.pattern = field.pattern;
                    formGroup.appendChild(input);
                    
                    // Специальная обработка для телефона
                    if (field.id === 'workPhone') {
                        input.addEventListener('input', function(e) {
                            let value = this.value.replace(/\D/g, '');
                            
                            if (value.length > 0 && value[0] !== '7') {
                                value = '7' + value;
                            }
                            
                            if (value.length === 0) {
                                this.value = '';
                            } else if (value.length <= 1) {
                                this.value = '+7';
                            } else if (value.length <= 4) {
                                this.value = '+7 (' + value.substring(1);
                            } else if (value.length <= 7) {
                                this.value = '+7 (' + value.substring(1, 4) + ') ' + value.substring(4);
                            } else if (value.length <= 9) {
                                this.value = '+7 (' + value.substring(1, 4) + ') ' + value.substring(4, 7) + '-' + value.substring(7);
                            } else {
                                this.value = '+7 (' + value.substring(1, 4) + ') ' + value.substring(4, 7) + '-' + value.substring(7, 9) + '-' + value.substring(9, 11);
                            }
                        });
                    }
                    
                    // Добавляем обработчики для валидации
                    input.addEventListener('blur', function() {
                        validateField(this);
                    });
                }
                
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                
                if (field.errorMsg) {
                    errorMessage.textContent = field.errorMsg;
                }
                
                formGroup.appendChild(errorMessage);
                stepContainer.appendChild(formGroup);
            });
            
            stepsContainer.appendChild(stepContainer);
        });
        
        form.appendChild(stepsContainer);
        
        // Кнопки навигации
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'buttons-container';
        
        const prevButton = document.createElement('button');
        prevButton.type = 'button';
        prevButton.className = 'prev-button';
        prevButton.textContent = 'Назад';
        prevButton.style.display = 'none'; // Изначально скрыт на первом шаге
        
        const nextButton = document.createElement('button');
        nextButton.type = 'button';
        nextButton.className = 'next-button';
        nextButton.textContent = 'Далее';
        
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.className = 'submit-button';
        submitButton.textContent = 'Сохранить';
        submitButton.style.display = 'none'; // Изначально скрыт
        
        buttonsContainer.appendChild(prevButton);
        buttonsContainer.appendChild(nextButton);
        buttonsContainer.appendChild(submitButton);
        form.appendChild(buttonsContainer);
        
        content.appendChild(form);
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Текущий шаг
        let currentStep = 1;
        
        // Функция для переключения между шагами
        function goToStep(step) {
            // Скрываем все шаги
            document.querySelectorAll('.step-container').forEach(container => {
                container.style.display = 'none';
            });
            
            // Показываем нужный шаг
            document.querySelector(`.step-container.step-${step}`).style.display = 'block';
            
            // Обновляем индикаторы шагов
            document.querySelectorAll('.step').forEach((stepIndicator, index) => {
                const stepNum = index + 1;
                stepIndicator.classList.remove('active', 'completed');
                
                if (stepNum < step) {
                    stepIndicator.classList.add('completed');
                } else if (stepNum === step) {
                    stepIndicator.classList.add('active');
                }
            });
            
            // Показываем/скрываем кнопки
            prevButton.style.display = step > 1 ? 'block' : 'none';
            nextButton.style.display = step < totalSteps ? 'block' : 'none';
            submitButton.style.display = step === totalSteps ? 'block' : 'none';
            
            // Обновляем текущий шаг
            currentStep = step;
        }
        
        // Функция для валидации поля
        function validateField(input) {
            const errorMessage = input.nextElementSibling?.classList?.contains('error-message') ? 
                input.nextElementSibling : input.closest('.form-group').querySelector('.error-message');
            
            if (!errorMessage) return true; // Если нет элемента для отображения ошибки, считаем поле валидным
            
            // Для радио-кнопок проверяем группу
            if (input.type === 'radio') {
                const name = input.name;
                const radioGroup = document.querySelectorAll(`input[name="${name}"]`);
                const isChecked = Array.from(radioGroup).some(radio => radio.checked);
                
                if (!isChecked && input.required) {
                    errorMessage.textContent = 'Выберите один из вариантов';
                    errorMessage.classList.add('visible');
                    return false;
                } else {
                    errorMessage.classList.remove('visible');
                    return true;
                }
            }
            
            // Проверяем обязательные поля
            if (input.required && input.value.trim() === '') {
                errorMessage.textContent = 'Это поле обязательно для заполнения';
                errorMessage.classList.add('visible');
                input.classList.add('error');
                return false;
            }
            
            // Проверяем ИНН
            if (input.id === 'inn' && input.value.trim() !== '') {
                if (!/^\d{10}$|^\d{12}$/.test(input.value.trim())) {
                    errorMessage.textContent = 'ИНН должен содержать 10 или 12 цифр';
                    errorMessage.classList.add('visible');
                    input.classList.add('error');
                    return false;
                }
            }
            
            // Проверяем КПП
            if (input.id === 'kpp' && input.value.trim() !== '') {
                if (!/^\d{9}$/.test(input.value.trim())) {
                    errorMessage.textContent = 'КПП должен содержать 9 цифр';
                    errorMessage.classList.add('visible');
                    input.classList.add('error');
                    return false;
                }
            }
            
            // Проверяем ОГРН
            if (input.id === 'ogrn' && input.value.trim() !== '') {
                if (!/^\d{13}$|^\d{15}$/.test(input.value.trim())) {
                    errorMessage.textContent = 'ОГРН должен содержать 13 или 15 цифр';
                    errorMessage.classList.add('visible');
                    input.classList.add('error');
                    return false;
                }
            }
            
            // Проверяем расчетный счет
            if (input.id === 'bankAccount' && input.value.trim() !== '') {
                if (!/^\d{20}$/.test(input.value.trim())) {
                    errorMessage.textContent = 'Расчетный счет должен содержать 20 цифр';
                    errorMessage.classList.add('visible');
                    input.classList.add('error');
                    return false;
                }
            }
            
            // Проверяем корреспондентский счет
            if (input.id === 'corrAccount' && input.value.trim() !== '') {
                if (!/^\d{20}$/.test(input.value.trim())) {
                    errorMessage.textContent = 'Корреспондентский счет должен содержать 20 цифр';
                    errorMessage.classList.add('visible');
                    input.classList.add('error');
                    return false;
                }
            }
            
            // Проверяем БИК
            if (input.id === 'bik' && input.value.trim() !== '') {
                if (!/^\d{9}$/.test(input.value.trim())) {
                    errorMessage.textContent = 'БИК должен содержать 9 цифр';
                    errorMessage.classList.add('visible');
                    input.classList.add('error');
                    return false;
                }
            }
            
            // Проверяем телефон
            if (input.id === 'workPhone' && input.value.trim() !== '') {
                if (!/^\+7\s?\(\d{3}\)\s?\d{3}-\d{2}-\d{2}$/.test(input.value.trim())) {
                    errorMessage.textContent = 'Телефон должен быть в формате +7 (999) 123-45-67';
                    errorMessage.classList.add('visible');
                    input.classList.add('error');
                    return false;
                }
            }
            
            // Проверяем email
            if (input.id === 'contactEmail' && input.value.trim() !== '') {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
                    errorMessage.textContent = 'Введите корректный email';
                    errorMessage.classList.add('visible');
                    input.classList.add('error');
                    return false;
                }
            }
            
            // Если все проверки пройдены
            errorMessage.classList.remove('visible');
            input.classList.remove('error');
            return true;
        }
        
        // Функция для валидации текущего шага
        function validateStep(step) {
            const stepContainer = document.querySelector(`.step-container.step-${step}`);
            const inputs = stepContainer.querySelectorAll('input[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                // Для радио-кнопок проверяем, выбран ли хотя бы один вариант
                if (input.type === 'radio') {
                    const name = input.name;
                    const radioGroup = stepContainer.querySelectorAll(`input[name="${name}"]`);
                    const isChecked = Array.from(radioGroup).some(radio => radio.checked);
                    
                    // Если ни один не выбран, отмечаем первый как ошибочный
                    if (!isChecked) {
                        const errorMessage = radioGroup[0].closest('.form-group').querySelector('.error-message');
                        errorMessage.textContent = 'Выберите один из вариантов';
                        errorMessage.classList.add('visible');
                        isValid = false;
                    }
                } else if (!validateField(input)) {
                    isValid = false;
                }
            });
            
            return isValid;
        }
        
        // Обработчик кнопки "Далее"
        nextButton.addEventListener('click', function() {
            if (validateStep(currentStep)) {
                goToStep(currentStep + 1);
            } else {
                showNotification('Пожалуйста, заполните все обязательные поля', 'error');
            }
        });
        
        // Обработчик кнопки "Назад"
        prevButton.addEventListener('click', function() {
            goToStep(currentStep - 1);
        });
        
        // Обработчик отправки формы
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Проверяем все поля на последнем шаге
            if (!validateStep(currentStep)) {
                showNotification('Пожалуйста, заполните все обязательные поля', 'error');
                return;
            }
            
            // Сохраняем данные контрагента
            const counterpartyData = {
                orgName: document.getElementById('orgName').value,
                legalAddress: document.getElementById('legalAddress').value,
                inn: document.getElementById('inn').value,
                kpp: document.getElementById('kpp').value,
                ogrn: document.getElementById('ogrn').value,
                bankName: document.getElementById('bankName').value,
                bankAccount: document.getElementById('bankAccount').value,
                corrAccount: document.getElementById('corrAccount').value,
                bik: document.getElementById('bik').value,
                contactPerson: document.getElementById('contactPerson').value,
                contactPosition: document.getElementById('contactPosition').value,
                workPhone: document.getElementById('workPhone').value,
                contactEmail: document.getElementById('contactEmail').value,
                contactMethod: document.querySelector('input[name="contactMethod"]:checked')?.value || 'email'
            };
            
            // Получаем список пользователей
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            
            // Находим текущего пользователя и добавляем данные контрагента
            const userIndex = registeredUsers.findIndex(user => user.email === userData.email);
            if (userIndex !== -1) {
                registeredUsers[userIndex].counterparty = counterpartyData;
                localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
                
                // Обновляем данные текущего пользователя
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                currentUser.counterparty = counterpartyData;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // Показываем уведомление об успешном сохранении
                showNotification('Данные контрагента успешно сохранены', 'success');
                
                // Закрываем модальное окно
                document.body.removeChild(modal);
            } else {
                showNotification('Ошибка сохранения данных контрагента', 'error');
            }
        });
        
        // Инициализируем первый шаг
        goToStep(1);
    }

    // Делаем функцию clearDebugLogs доступной глобально
    window.clearDebugLogs = clearDebugLogs;
    
    // Функция для отображения сводки о заказах
    function viewOrdersSummary() {
        try {
            const successfulOrders = JSON.parse(localStorage.getItem('successfulOrders') || '[]');
            const failedOrders = JSON.parse(localStorage.getItem('failedOrders') || '[]');
            const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            
            console.group('%c[ЗАКАЗЫ] Сводка по заказам', 'color: #4CAF50; font-weight: bold;');
            
            console.log('%cВсего заказов: %c' + allOrders.length, 'font-weight: bold;', 'font-weight: normal; color: #2196F3;');
            console.log('%cУспешно отправлено: %c' + successfulOrders.length, 'font-weight: bold;', 'font-weight: normal; color: #4CAF50;');
            console.log('%cОшибки отправки: %c' + failedOrders.length, 'font-weight: bold;', 'font-weight: normal; color: #f44336;');
            
            if (successfulOrders.length > 0) {
                console.group('%cУспешные заказы:', 'color: #4CAF50;');
                successfulOrders.forEach((item, index) => {
                    console.group(`Заказ #${index + 1} (${new Date(item.timestamp).toLocaleString()})`);
                    console.log('ID заказа:', item.order.id);
                    console.log('Товаров:', item.order.items.length);
                    console.log('Ответ сервера:', item.response);
                    console.groupEnd();
                });
                console.groupEnd();
            }
            
            if (failedOrders.length > 0) {
                console.group('%cОшибки отправки:', 'color: #f44336;');
                failedOrders.forEach((item, index) => {
                    console.group(`Ошибка #${index + 1} (${new Date(item.timestamp).toLocaleString()})`);
                    console.log('ID заказа:', item.order.id);
                    console.log('Товаров:', item.order.items.length);
                    console.log('Ошибка:', item.error);
                    console.groupEnd();
                });
                console.groupEnd();
            }
            
            console.groupEnd();
        } catch (e) {
            console.error('Ошибка при отображении сводки заказов:', e);
        }
    }
    
    // Делаем функцию viewOrdersSummary доступной глобально
    window.viewOrdersSummary = viewOrdersSummary;

    async function fetchCartFromServer(email) {
      try {
        const res = await fetch(`${window.API_BASE_URL}/cart?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.success) {
          return data.cart || [];
        }
      } catch (e) { console.error('Ошибка загрузки корзины с сервера', e); }
      return [];
    }

    async function saveCartToServer(email, cart) {
      try {
        await fetch(`${window.API_BASE_URL}/cart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, cart })
        });
      } catch (e) { console.error('Ошибка сохранения корзины на сервер', e); }
    }

    // После успешного входа:
    async function loadCartAfterLogin(userEmail) {
      cartItems = await fetchCartFromServer(userEmail);
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      renderCartItems();
    }

    function updateCartAndSync(userEmail) {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      saveCartToServer(userEmail, cartItems);
      renderCartItems();
    }

    // --- Регистрация ---
    async function registerUser(name, email, password) {
      console.log('>>> [MOBILE REGISTER] Начинаем регистрацию:', { name, email, passwordLength: password.length });
      const url = `${window.API_BASE_URL}/register`;
      console.log('>>> [MOBILE REGISTER] URL:', url);
      
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        console.log('>>> [MOBILE REGISTER] Response status:', res.status);
        console.log('>>> [MOBILE REGISTER] Response headers:', Object.fromEntries([...res.headers.entries()]));
        
        const data = await res.json();
        console.log('>>> [MOBILE REGISTER] Response data:', data);
        return data;
      } catch (error) {
        console.error('>>> [MOBILE REGISTER] Ошибка запроса:', error);
        return { success: false, message: 'Ошибка соединения с сервером' };
      }
    }
    // --- Логин ---
    async function loginUser(email, password) {
      console.log('>>> [MOBILE LOGIN] Начинаем вход:', { email, passwordLength: password.length });
      const url = `${window.API_BASE_URL}/login`;
      console.log('>>> [MOBILE LOGIN] URL:', url);
      
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        console.log('>>> [MOBILE LOGIN] Response status:', res.status);
        console.log('>>> [MOBILE LOGIN] Response headers:', Object.fromEntries([...res.headers.entries()]));
        
        const data = await res.json();
        console.log('>>> [MOBILE LOGIN] Response data:', data);
        return data;
      } catch (error) {
        console.error('>>> [MOBILE LOGIN] Ошибка запроса:', error);
        return { success: false, message: 'Ошибка соединения с сервером' };
      }
    }

    // Получение продукта по ID
    async function getProductById(productId) {
      const res = await fetch(`${API_BASE_URL}/products/${productId}`);
      // ... existing code ...
    }

    // Оформление заказа
    function submitOrder(orderData) {
      return fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
    }

    // Поиск/построение URL для списка товаров
    (function buildProductsList() {
      const url = new URL(`${window.location.origin}${API_BASE_URL}/products`);
      // ... existing code ...
    })();

    (function buildFilteredProductsList() {
      const url = new URL(`${window.location.origin}${API_BASE_URL}/products`);
      // ... existing code ...
    })();

});
