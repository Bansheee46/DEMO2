// Модуль оформления заказа
const checkoutModule = (function() {
  // Приватные переменные
  let cartItems = [];
  let checkoutModal = null;
  let userData = {};
  let totalPrice = 0;
  let selectedPaymentMethod = 'card';
  let selectedDeliveryDate = '';
  let selectedDeliveryTime = '';
  let selectedPickupPoint = null;
  let selectedPostType = null;
  
  // Загрузка данных корзины
  function loadCartItems() {
    cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    return cartItems;
  }
  
  // Загрузка информации о пользователе
  function loadUserData() {
    userData = JSON.parse(localStorage.getItem('userData') || '{}');
    return userData;
  }
  
  // Проверка авторизации пользователя
  function isUserLoggedIn() {
    const userData = loadUserData();
    // Проверяем наличие обязательных полей пользователя и явного флага loggedIn
    if (userData && userData.email && userData.name) {
      // Если не установлен флаг loggedIn, установим его
      if (!userData.loggedIn) {
        userData.loggedIn = true;
        userData.lastActivity = new Date().getTime();
        localStorage.setItem('userData', JSON.stringify(userData));
      }
      return true;
    }
    return false;
  }
  
  // Перенаправление на авторизацию
  function redirectToLogin(message = 'Для оформления заказа необходимо войти в аккаунт') {
    // Показываем уведомление
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, 'info');
    } else {
      alert(message);
    }
    
    // Вызываем форму входа
    if (typeof window.showLoginModal === 'function') {
      setTimeout(() => {
        window.showLoginModal();
      }, 300);
    }
    return false;
  }
  
  // Создание разметки списка товаров
  function renderCartItemsList() {
    const items = loadCartItems();
    totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (items.length === 0) {
      return `
        <div class="checkout-empty">
          <div class="checkout-empty-icon">
            <i class="fas fa-shopping-cart"></i>
          </div>
          <h3 class="checkout-empty-title">Ваша корзина пуста</h3>
          <p class="checkout-empty-text">Добавьте товары в корзину, чтобы оформить заказ</p>
          <button class="checkout-empty-button">
            <i class="fas fa-shopping-bag"></i> Перейти к покупкам
          </button>
        </div>
      `;
    }
    
    const itemsHtml = items.map((item, index) => `
      <li class="checkout-item" style="--item-index: ${index}">
        <img src="${item.image}" alt="${item.title}" class="checkout-item-image">
        <div class="checkout-item-details">
          <h4 class="checkout-item-title">${item.title}</h4>
          <div class="checkout-item-meta">
            <span class="checkout-item-quantity">Кол-во: ${item.quantity}</span>
            <span class="checkout-item-price">${item.price.toLocaleString()} ₽</span>
          </div>
        </div>
        <div class="checkout-item-subtotal">${(item.price * item.quantity).toLocaleString()} ₽</div>
      </li>
    `).join('');
    
    return `
      <ul class="checkout-items">
        ${itemsHtml}
      </ul>
      <div class="checkout-summary">
        <div class="checkout-summary-row">
          <span>Подытог:</span>
          <strong class="checkout-subtotal-value">${totalPrice.toLocaleString()} ₽</strong>
        </div>
        <div class="checkout-summary-row">
          <span>Доставка:</span>
          <strong id="summary-delivery-cost">Уточняется</strong>
        </div>
        <div class="checkout-summary-row checkout-total-row">
          <span>Итого:</span>
          <strong class="checkout-grand-total">${totalPrice.toLocaleString()} ₽</strong>
        </div>
      </div>
    `;
  }
  
  // Показать модальное окно оформления заказа
  async function showCheckoutModal() {
    // Проверяем наличие товаров в корзине
    const cartItems = loadCartItems();
    if (cartItems.length === 0) {
      if (typeof window.showNotification === 'function') {
        window.showNotification('Ваша корзина пуста', 'info');
      } else {
        alert('Ваша корзина пуста');
      }
      return;
    }
    
    // Используем статические методы оплаты
    let paymentMethods = window.STATIC_PAYMENT_METHODS || [
      { value: 'card', label: 'Банковская карта' },
      { value: 'cash', label: 'Наличными при получении' },
      { value: 'online', label: 'Онлайн-оплата' }
    ];
    
    // Используем статические методы доставки
    let deliveryMethods = window.STATIC_DELIVERY_METHODS || [
      { value: 'courier', label: 'Курьер' },
      { value: 'pickup', label: 'Самовывоз' },
      { value: 'post', label: 'Почта' }
    ];
    
    // Закрываем панель корзины, если она открыта
    const cartPanel = document.querySelector('.cart-panel');
    if (cartPanel) {
      cartPanel.setAttribute('aria-hidden', 'true');
    }
    
    // Проверяем авторизацию - строгая проверка
    if (!isUserLoggedIn()) {
      return redirectToLogin();
    }
    
    // Скрываем остров, если он есть
    const islandElement = document.querySelector('.island');
    if (islandElement) {
      islandElement.style.visibility = 'hidden';
      islandElement.style.opacity = '0';
      islandElement.style.transform = 'translateY(100px) translateX(-50%)';
    }
    
    // Запоминаем текущую позицию прокрутки
    const scrollY = window.scrollY;
    
    // Блокируем прокрутку страницы
    document.body.classList.add('checkout-modal-open');
    
    // Фиксируем body на текущей позиции прокрутки
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    // Создаем модальное окно, если его еще нет
    if (!checkoutModal) {
      checkoutModal = document.createElement('div');
      checkoutModal.className = 'checkout-modal';
      document.body.appendChild(checkoutModal);
    }
    
    // Подключаем стили, если их еще нет
    if (!document.getElementById('checkout-styles')) {
      const link = document.createElement('link');
      link.id = 'checkout-styles';
      link.rel = 'stylesheet';
      link.href = 'checkout-styles.css';
      document.head.appendChild(link);
    }
    
    // Создаем новую структуру с контейнером для скролла
    checkoutModal.innerHTML = `
      <div class="checkout-modal__scroller">
        <div class="checkout-modal__content">
          <button class="checkout-modal__close" title="Закрыть">
            <i class="fas fa-times"></i>
          </button>
          
          <div class="checkout-grid">
            <div class="checkout-order">
              <h2 class="checkout-modal__title">Ваш заказ</h2>
              ${renderCartItemsList()}
              
              <div class="checkout-info-block">
                <div class="checkout-info-icon">
                  <i class="fas fa-info-circle"></i>
                </div>
                <div class="checkout-info-text">
                  После оформления заказа наш менеджер свяжется с вами для уточнения деталей доставки и оплаты.
                </div>
              </div>
            </div>
            
            <div class="checkout-delivery">
              <h2 class="checkout-modal__title">Оформление заказа</h2>
              
              <form class="checkout-form" id="checkout-form">
                <div class="checkout-process-steps">
                  <div class="process-step active">
                    <div class="step-number">1</div>
                    <div class="step-info">
                      <h4>Оформление</h4>
                      <p>Отправка заказа</p>
                    </div>
                  </div>
                  <div class="process-step">
                    <div class="step-number">2</div>
                    <div class="step-info">
                      <h4>Обработка</h4>
                      <p>Менеджер свяжется с вами</p>
                    </div>
                  </div>
                  <div class="process-step">
                    <div class="step-number">3</div>
                    <div class="step-info">
                      <h4>Доставка</h4>
                      <p>Согласование деталей</p>
                    </div>
                  </div>
                </div>
                
                <div class="checkout-info-card">
                  <div class="info-card-header">
                    <i class="fas fa-headset"></i>
                    <h3>Персональный подход к каждому заказу</h3>
                  </div>
                  <div class="info-card-content">
                    <p>После оформления заказа наш менеджер свяжется с вами в течение <strong>2 часов</strong> (в рабочее время) для:</p>
                    <ul class="info-card-list">
                      <li><i class="fas fa-check-circle"></i> Уточнения деталей доставки</li>
                      <li><i class="fas fa-check-circle"></i> Подбора оптимального способа оплаты</li>
                      <li><i class="fas fa-check-circle"></i> Ответа на все ваши вопросы</li>
                    </ul>
                  </div>
                </div>
                
                <div class="contact-preference">
                  <h4>Предпочтительный способ связи</h4>
                  <div class="contact-options">
                    <label class="contact-option">
                      <input type="radio" name="contact-method" value="phone" checked>
                      <span class="contact-icon"><i class="fas fa-phone-alt"></i></span>
                      <span class="contact-label">Телефон</span>
                    </label>
                    <label class="contact-option">
                      <input type="radio" name="contact-method" value="whatsapp">
                      <span class="contact-icon"><i class="fab fa-whatsapp"></i></span>
                      <span class="contact-label">WhatsApp</span>
                    </label>
                    <label class="contact-option">
                      <input type="radio" name="contact-method" value="telegram">
                      <span class="contact-icon"><i class="fab fa-telegram-plane"></i></span>
                      <span class="contact-label">Telegram</span>
                    </label>
                    <label class="contact-option">
                      <input type="radio" name="contact-method" value="email">
                      <span class="contact-icon"><i class="fas fa-envelope"></i></span>
                      <span class="contact-label">Email</span>
                    </label>
                  </div>
                </div>
                
                <div class="checkout-form-group">
                  <label for="checkout-comment">Комментарий к заказу</label>
                  <textarea id="checkout-comment" class="checkout-input" placeholder="Укажите удобное время для звонка, особые пожелания или вопросы по заказу" rows="3"></textarea>
                  <div class="comment-counter">0/500</div>
                </div>
                
                <div class="delivery-info-toggle">
                  <button type="button" class="toggle-button" id="delivery-info-toggle">
                    <i class="fas fa-truck"></i> Информация о доставке <i class="fas fa-chevron-down"></i>
                  </button>
                  <div class="delivery-info-content" id="delivery-info-content">
                    <div class="delivery-methods">
                      <div class="delivery-method">
                        <div class="delivery-method-icon">
                          <i class="fas fa-truck"></i>
                        </div>
                        <div class="delivery-method-details">
                          <h5>Курьерская доставка</h5>
                          <p>Доставка до двери в удобное для вас время</p>
                        </div>
                      </div>
                      <div class="delivery-method">
                        <div class="delivery-method-icon">
                          <i class="fas fa-store-alt"></i>
                        </div>
                        <div class="delivery-method-details">
                          <h5>Самовывоз</h5>
                          <p>Из пунктов выдачи или точек самовывоза</p>
                        </div>
                      </div>
                      <div class="delivery-method">
                        <div class="delivery-method-icon">
                          <i class="fas fa-boxes"></i>
                        </div>
                        <div class="delivery-method-details">
                          <h5>Транспортными компаниями</h5>
                          <p>Доставка в любой регион России</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="checkout-summary-sticky">
                  <div class="checkout-subtotal">
                    <div class="subtotal-label">Сумма заказа:</div>
                    <div class="subtotal-value">${totalPrice.toLocaleString()} ₽</div>
                  </div>
                  <div class="delivery-cost">
                    <div class="delivery-cost-label">Доставка:</div>
                    <div class="delivery-cost-value" id="delivery-cost">Согласовывается</div>
                  </div>
                  <div class="checkout-total">
                    <div class="total-label">Итого:</div>
                    <div class="total-value">${totalPrice.toLocaleString()} ₽</div>
                  </div>
                  <div class="checkout-actions">
                    <button type="submit" class="checkout-submit">
                      <i class="fas fa-check"></i>
                      Оформить заказ
                    </button>
                    <button type="button" class="checkout-cancel">
                      <i class="fas fa-times"></i>
                      Отмена
                    </button>
                  </div>
                  <div class="checkout-security">
                    <i class="fas fa-shield-alt"></i> Ваши данные защищены и используются только для обработки заказа
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Получаем ссылку на контейнер для скролла
    const scrollContainer = checkoutModal.querySelector('.checkout-modal__scroller');
    
    // Сбрасываем позицию прокрутки
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
    
    // Показываем модальное окно
    checkoutModal.setAttribute('aria-hidden', 'false');
    
    // Добавляем обработчики событий
    setupEventListeners();
    
    // После инициализации контейнера и привязки обработчиков выполняем дополнительную проверку прокрутки
    setTimeout(() => {
      if (scrollContainer) {
        // Добавляем класс, явно указывающий на возможность прокрутки
        scrollContainer.classList.add('scrollable');
        
        // Проверяем высоту контента
        const modalContent = scrollContainer.querySelector('.checkout-modal__content');
        if (modalContent) {
          console.log('Content height:', modalContent.scrollHeight, 'Container height:', scrollContainer.clientHeight);
          
          // Если контент меньше высоты контейнера, скрываем индикаторы прокрутки
          if (modalContent.scrollHeight <= scrollContainer.clientHeight) {
            scrollContainer.classList.add('at-bottom');
          } else {
            scrollContainer.classList.remove('at-bottom');
          }
        }
      }
    }, 200);
    
    // Принудительно активируем скролл для лучшей поддержки на мобильных устройствах
    forceEnableScrolling();
    
    // Инициализируем стоимость доставки при загрузке
    updateDeliveryCost();
  }
  
  // Функция для принудительной активации скролла
  function forceEnableScrolling() {
    setTimeout(() => {
      if (checkoutModal) {
        const scrollContainer = checkoutModal.querySelector('.checkout-modal__scroller');
        if (scrollContainer) {
          // Применяем все необходимые стили и классы для активации скролла
          scrollContainer.classList.add('scrollable');
          scrollContainer.classList.add('no-scroll-reset');
          scrollContainer.style.overflowY = 'auto !important';
          scrollContainer.style.webkitOverflowScrolling = 'touch !important';
          scrollContainer.style.pointerEvents = 'auto';
          
          // Фокусировка на контейнере для улучшения скроллинга
          scrollContainer.focus();
        }
      }
    }, 100);
  }
  
  // Функция для гарантированного сброса позиции прокрутки при необходимости (например, после успешного заказа)
  function ensureTopScrollPosition(callback) {
    // Сбрасываем позицию прокрутки
    if (checkoutModal) {
      const scrollContainer = checkoutModal.querySelector('.checkout-modal__scroller');
      if (scrollContainer && callback) {
        // Сбрасываем только при необходимости выполнить callback
        scrollContainer.scrollTop = 0;
      }
    }
    
    // Выполняем callback
    if (typeof callback === 'function') {
      callback();
    }
  }
  
  // Функция для принудительного сброса прокрутки в верхнюю позицию (при необходимости)
  function forceScrollToTop() {
    if (!checkoutModal) return;
    
    const scrollContainer = checkoutModal.querySelector('.checkout-modal__scroller');
    if (!scrollContainer) return;
    
    // Устанавливаем начальную позицию прокрутки только при вызове
    scrollContainer.scrollTop = 0;
  }
  
  // Функция для проверки и исправления пустого пространства в модальном окне
  function checkEmptySpace() {
    if (checkoutModal) {
      const modalContent = checkoutModal.querySelector('.checkout-modal__content');
      if (modalContent) {
        const modalRect = checkoutModal.getBoundingClientRect();
        const contentRect = modalContent.getBoundingClientRect();
        
        // Проверяем, есть ли пустое пространство под контентом
        const emptySpaceHeight = modalRect.bottom - contentRect.bottom;
        
        if (emptySpaceHeight > 20) { // Если пустого пространства больше 20px
          // Устраняем пустое пространство, настраивая высоту и отступы
          if (window.innerWidth <= 768) {
            // На мобильных устройствах просто устанавливаем нулевой нижний отступ
            checkoutModal.style.paddingBottom = '0';
            modalContent.style.marginBottom = '0';
          } else {
            // На более крупных экранах центрируем содержимое вертикально
            const availableHeight = window.innerHeight;
            if (contentRect.height < availableHeight * 0.9) {
              modalContent.style.margin = 'auto';
            } else {
              modalContent.style.marginBottom = '10px';
            }
          }
        }
        
        // Настраиваем предотвращение прокрутки за пределами содержимого
        const contentHeight = modalContent.scrollHeight;
        const windowHeight = window.innerHeight;
        
        if (contentHeight < windowHeight) {
          // Если контент меньше высоты окна, отключаем прокрутку модального окна
          checkoutModal.style.overflowY = 'hidden';
        } else {
          // Если контент больше высоты окна, включаем прокрутку
          checkoutModal.style.overflowY = 'auto';
        }
      }
    }
  }
  
  // Форматирование номера телефона
  function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 0) {
      if (value[0] === '7' || value[0] === '8') {
        value = value.substring(1);
      }
      if (value.length > 0) {
        value = '7' + value;
      }
    }
    
    const formatted = value.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/g, '+$1 ($2) $3-$4-$5');
    input.value = formatted.substring(0, 18);
  }
  
  // Обёртка для функций, требующих авторизацию
  function requireAuth(fn) {
    return function(...args) {
      if (!isUserLoggedIn()) {
        return redirectToLogin();
      }
      return fn.apply(this, args);
    };
  }
  
  // Форматирование даты для выбора дня доставки
  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }
  
  // Получение даты "завтра"
  function getTomorrow() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  
  // Функция для настройки обработчиков событий
  function setupEventListeners() {
    // Дополнительная проверка авторизации при настройке событий
    if (!isUserLoggedIn()) {
      closeCheckoutModal();
      return redirectToLogin();
    }
    
    // Кнопка закрытия
    const closeButton = checkoutModal.querySelector('.checkout-modal__close');
    if (closeButton) {
      closeButton.addEventListener('click', closeCheckoutModal);
    }
    
    // Добавляем обработчик события прокрутки для контроля границ
    const scrollContainer = checkoutModal.querySelector('.checkout-modal__scroller');
    if (scrollContainer) {
      // Добавляем класс для предотвращения сброса прокрутки
      scrollContainer.classList.add('no-scroll-reset');
      
      // Удаляем старый обработчик если он существует
      scrollContainer.removeEventListener('scroll', handleModalScroll);
      // Добавляем новый обработчик
      scrollContainer.addEventListener('scroll', handleModalScroll);
      
      // Так же добавляем обработчики для мобильного поведения (touch events)
      scrollContainer.addEventListener('touchstart', () => {
        scrollContainer.dataset.touching = 'true';
        // Принудительно делаем контейнер прокручиваемым
        scrollContainer.classList.add('scrollable');
        scrollContainer.classList.add('no-scroll-reset');
        // Устанавливаем важные стили прямо в JS для надежности
        scrollContainer.style.overflowY = 'auto';
        scrollContainer.style.webkitOverflowScrolling = 'touch';
      });
      
      scrollContainer.addEventListener('touchend', () => {
        scrollContainer.dataset.touching = 'false';
      });
      
      // Добавляем обработчик прокрутки на само модальное окно
      checkoutModal.addEventListener('scroll', (e) => {
        // Просто проверяем, скроллится ли модальное окно
        console.log('Modal scroll event');
      });
      
      // Добавляем обработчик клика для поддержки прокрутки на мобильных устройствах
      scrollContainer.addEventListener('click', (e) => {
        // Проверяем, что клик был по самому контейнеру, а не по его содержимому
        if (e.target === scrollContainer) {
          // Принудительно активируем прокрутку
          scrollContainer.classList.add('scrollable');
          // Применяем стили напрямую
          scrollContainer.style.overflowY = 'auto';
          scrollContainer.style.webkitOverflowScrolling = 'touch';
          // Перемещаем фокус на контейнер для дополнительной поддержки прокрутки
          scrollContainer.focus();
        }
      });
      
      // Добавим поддержку колесика мыши
      scrollContainer.addEventListener('wheel', (e) => {
        // Принудительно активируем класс scrollable
        scrollContainer.classList.add('scrollable');
        // Применяем стили напрямую для большей надежности
        scrollContainer.style.overflowY = 'auto';
        scrollContainer.style.webkitOverflowScrolling = 'touch';
      });
      
      // Добавим класс scrollable при нажатии на клавиши стрелок
      document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          if (checkoutModal.getAttribute('aria-hidden') === 'false') {
            scrollContainer.classList.add('scrollable');
            // Применяем стили напрямую
            scrollContainer.style.overflowY = 'auto';
            scrollContainer.style.webkitOverflowScrolling = 'touch';
          }
        }
      });
      
      // Активируем прокрутку при загрузке модального окна
      setTimeout(() => {
        scrollContainer.classList.add('scrollable');
        scrollContainer.style.overflowY = 'auto';
        scrollContainer.style.webkitOverflowScrolling = 'touch';
        scrollContainer.style.pointerEvents = 'auto';
      }, 100);
    }
    
    // Кнопка отмены
    const cancelButton = checkoutModal.querySelector('.checkout-cancel');
    if (cancelButton) {
      cancelButton.addEventListener('click', closeCheckoutModal);
    }
    
    // Кнопка "Перейти к покупкам" для пустой корзины
    const emptyCartButton = checkoutModal.querySelector('.checkout-empty-button');
    if (emptyCartButton) {
      emptyCartButton.addEventListener('click', () => {
        closeCheckoutModal();
      });
    }
    
    // Форматирование телефона при вводе
    const phoneInput = document.getElementById('checkout-phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', () => formatPhoneNumber(phoneInput));
    }
    
    // Выбор способа оплаты
    const paymentMethods = checkoutModal.querySelectorAll('.payment-method');
    paymentMethods.forEach(method => {
      method.addEventListener('click', () => {
        // Снимаем активный класс со всех методов
        paymentMethods.forEach(m => m.classList.remove('active'));
        // Устанавливаем активный класс на выбранный метод
        method.classList.add('active');
        // Устанавливаем выбранный метод
        selectedPaymentMethod = method.getAttribute('data-method');
        // Отмечаем соответствующий input
        const radio = method.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
        }
      });
    });
    
    // Обработка отправки формы заказа
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Добавляем обработчик для комментария
    const commentTextarea = document.getElementById('checkout-comment');
    if (commentTextarea) {
      // Инициализируем счетчик при загрузке
      const counter = document.querySelector('.comment-counter');
      if (counter) {
        counter.textContent = `0/500`;
      }
      
      commentTextarea.addEventListener('input', function() {
        if (this.value.length > 500) {
          this.value = this.value.substring(0, 500);
        }
        
        // Обновляем счётчик символов
        const counter = document.querySelector('.comment-counter');
        if (counter) {
          counter.textContent = `${this.value.length}/500`;
          
          // Меняем цвет счётчика, когда приближается к лимиту
          if (this.value.length > 400) {
            counter.classList.add('near-limit');
          } else {
            counter.classList.remove('near-limit');
          }
        }
      });
    }
    
    // Обработчик для переключателя информации о доставке
    const deliveryInfoToggle = document.getElementById('delivery-info-toggle');
    if (deliveryInfoToggle) {
      deliveryInfoToggle.addEventListener('click', function() {
        const parent = this.closest('.delivery-info-toggle');
        if (parent) {
          parent.classList.toggle('active');
          this.classList.toggle('active');
          
          // Воспроизводим звук клика, если доступен
          if (window.settingsModule && typeof window.settingsModule.playSound === 'function') {
            window.settingsModule.playSound('click', 0.2);
          }
        }
      });
    }
    
    // Обработчик для выбора способа связи
    const contactOptions = document.querySelectorAll('.contact-option input');
    contactOptions.forEach(option => {
      option.addEventListener('change', function() {
        // Воспроизводим звук клика, если доступен
        if (window.settingsModule && typeof window.settingsModule.playSound === 'function') {
          window.settingsModule.playSound('click', 0.2);
        }
      });
    });
  }
  
  // Обновление стоимости доставки
  function updateDeliveryCost() {
    // Устанавливаем статус "Уточняется" для стоимости доставки
    updateDeliveryCostValue();
  }
  
  // Функция для анимированного изменения числа
  function animateNumber(element, startValue, endValue, duration = 800) {
    if (!element) return;
    
    // Если значения не изменились, не делаем анимацию
    if (startValue === endValue) return;
    
    // Получаем текущее значение (если оно в формате "X XXX ₽", извлекаем только число)
    let currentText = element.textContent;
    let startNum = startValue;
    
    if (currentText.includes('₽')) {
      // Извлечь число из текста, убрав пробелы и символ ₽
      const match = currentText.match(/(\d[\d\s]*)/);
      if (match) {
        startNum = parseInt(match[0].replace(/\s/g, ''), 10);
      }
    }
    
    // Воспроизводим тихий звук при изменении цены, если доступен
    if (window.settingsModule && typeof window.settingsModule.playSound === 'function') {
      // Используем меньшую громкость для этого звука
      window.settingsModule.playSound('click', 0.1);
    }
    
    // Добавляем класс для CSS-анимации
    element.classList.add('price-changing');
    
    // Удаляем класс после завершения анимации
    setTimeout(() => {
      element.classList.remove('price-changing');
    }, duration);
    
    const startTime = performance.now();
    const changeInValue = endValue - startNum;
    
    function updateNumber(currentTime) {
      const elapsedTime = currentTime - startTime;
      if (elapsedTime > duration) {
        // Анимация завершена, устанавливаем конечное значение
        element.textContent = `${endValue.toLocaleString()} ₽`;
        return;
      }
      
      // Вычисляем текущее значение с использованием эффекта ускорения/замедления
      const progress = elapsedTime / duration;
      // Формула ease-in-out для более плавного изменения
      const easedProgress = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      const currentValue = Math.round(startNum + changeInValue * easedProgress);
      element.textContent = `${currentValue.toLocaleString()} ₽`;
      
      // Продолжаем анимацию
      requestAnimationFrame(updateNumber);
    }
    
    requestAnimationFrame(updateNumber);
  }
  
  // Обновление отображаемой стоимости доставки и итоговой суммы
  function updateDeliveryCostValue() {
    // Получаем все нужные элементы
    const deliveryCostElement = document.getElementById('delivery-cost');
    const summaryDeliveryCostElement = document.getElementById('summary-delivery-cost');
    const totalElement = checkoutModal.querySelector('.total-value');
    const grandTotalElement = checkoutModal.querySelector('.checkout-grand-total');
    
    // Устанавливаем текст "Уточняется" для стоимости доставки
    if (deliveryCostElement) {
      deliveryCostElement.textContent = 'Согласовывается';
    }
    
    if (summaryDeliveryCostElement) {
      summaryDeliveryCostElement.textContent = 'Уточняется';
    }
    
    // Устанавливаем итоговую сумму равной сумме товаров
    if (totalElement) {
      totalElement.textContent = `${totalPrice.toLocaleString()} ₽`;
    }
    
    if (grandTotalElement) {
      grandTotalElement.textContent = `${totalPrice.toLocaleString()} ₽`;
    }
  }
  
  // Обработка отправки формы
  function handleFormSubmit(event) {
    event.preventDefault();
    
    // Дополнительная проверка авторизации при отправке формы
    if (!isUserLoggedIn()) {
      return redirectToLogin('Для оформления заказа необходимо войти в аккаунт');
    }
    
    // Получаем комментарий к заказу, если есть
    const comment = document.getElementById('checkout-comment')?.value || '';
    
    // Получаем предпочтительный способ связи
    const contactMethod = document.querySelector('input[name="contact-method"]:checked')?.value || 'phone';
    
    // Формируем данные заказа
    const orderData = {
      items: cartItems,
      user: userData,
      comment: comment,
      contactMethod: contactMethod,
      timestamp: new Date().getTime(),
      orderNumber: generateOrderNumber(),
      totalPrice: totalPrice,
      status: 'Новый',
      adminProcessed: false
    };
    
    // Сохраняем заказ
    saveOrder(orderData);
    
    // Очищаем корзину
    clearCart();
    
    // Показываем подтверждение заказа
    showOrderConfirmation(orderData);
  }
  
  // Генерация номера заказа
  function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const randomPart = Math.floor(10000 + Math.random() * 90000);
    return `ORD-${year}${month}${day}-${randomPart}`;
  }
  
  // Сохранение заказа
  function saveOrder(order) {
    // Получаем существующие заказы из localStorage
    const existingOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]');
    
    // Добавляем дополнительные поля для админки
    const adminOrder = {
      ...order,
      createdAt: new Date().toISOString(),
      adminNotes: '',
      invoiceNumber: '',
      contactDetails: {
        method: order.contactMethod,
        status: 'Ожидает звонка',
        contactTime: null
      },
      deliveryDetails: {
        type: null,
        address: null,
        cost: null,
        date: null
      },
      paymentDetails: {
        method: null,
        status: 'Не оплачен',
        date: null
      },
      exportedTo: {
        excel: false,
        onec: false
      }
    };
    
    // Добавляем новый заказ в localStorage (для совместимости со старым кодом)
    existingOrders.push(adminOrder);
    localStorage.setItem('adminOrders', JSON.stringify(existingOrders));
    
    // Также сохраняем в обычных заказах для клиента
    const clientOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    clientOrders.push(order);
    localStorage.setItem('orders', JSON.stringify(clientOrders));
    
    // Отправляем заказ на сервер через API
    sendOrderToServer(adminOrder);
    
    return adminOrder;
  }
  
  // Функция для отправки заказа на сервер
  async function sendOrderToServer(order) {
    try {
      // Подготавливаем данные для отправки в формате, ожидаемом сервером
      const serverOrderData = {
        customer_name: order.user.name || order.user.fullName || '',
        customer_email: order.user.email || '',
        customer_phone: order.user.phone || '',
        shipping_address: order.user.address || '',
        items: order.items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total_amount: order.totalPrice,
        order_number: order.orderNumber,
        status: 'new',
        comment: order.comment || '',
        contact_method: order.contactMethod,
        // Добавляем данные о контрагенте, если они есть
        counterparty_data: order.user.counterpartyData || null
      };
      
      console.log('Отправка заказа на сервер:', serverOrderData);
      
      // Добавляем отладочную информацию
      const apiUrl = '/api/orders';
      console.log('URL запроса:', apiUrl);
      console.log('Метод запроса:', 'POST');
      console.log('Заголовки запроса:', {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST'
      });
      console.log('Тело запроса (JSON):', JSON.stringify(serverOrderData, null, 2));
      
      // Сначала отправляем preflight запрос для проверки CORS
      const preflightResponse = await fetch(apiUrl, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Accept'
        }
      });
      
      console.log('Preflight ответ:', preflightResponse.status, preflightResponse.statusText);
      console.log('Preflight заголовки:', Object.fromEntries([...preflightResponse.headers.entries()]));
      
      // Отправляем запрос на сервер напрямую, минуя прокси
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify(serverOrderData)
      });
      
      // Добавляем отладочную информацию о полученном ответе
      console.log('Статус ответа:', response.status, response.statusText);
      console.log('Заголовки ответа:', Object.fromEntries([...response.headers.entries()]));
      
      // Проверяем статус ответа перед обработкой JSON
      if (!response.ok) {
        console.error('Ошибка при отправке заказа на сервер:', response.status, response.statusText);
        // Показываем уведомление о локальном сохранении
        showLocalStorageNotification();
        return;
      }
      
      // Проверяем, есть ли содержимое в ответе
      const text = await response.text();
      console.log('Текст ответа:', text);
      
      if (!text) {
        console.error('Пустой ответ от сервера');
        // Показываем уведомление о локальном сохранении
        showLocalStorageNotification();
        return;
      }
      
      // Преобразуем текст в JSON
      const result = JSON.parse(text);
      
      if (!result.success) {
        console.error('Ошибка при отправке заказа на сервер:', result.message);
        // Показываем уведомление о локальном сохранении
        showLocalStorageNotification();
      } else {
        console.log('Заказ успешно отправлен на сервер:', result);
        // Обновляем номер заказа, если сервер вернул новый
        if (result.order_number && result.order_number !== order.orderNumber) {
          order.orderNumber = result.order_number;
          // Обновляем заказ в localStorage
          updateOrderInLocalStorage(order);
        }
        
        // Добавляем заказ в профиль пользователя для отображения в "Мои заказы"
        saveOrderToUserProfile(order);
      }
    } catch (error) {
      console.error('Ошибка при отправке заказа на сервер:', error);
      // Показываем уведомление о локальном сохранении
      showLocalStorageNotification();
      
      // Даже при ошибке сохраняем заказ в профиле пользователя
      saveOrderToUserProfile(order);
    }
  }
  
  // Функция для сохранения заказа в профиле пользователя
  function saveOrderToUserProfile(order) {
    try {
      // Получаем текущего пользователя
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (!userData.email) {
        console.log('Пользователь не авторизован, заказ не будет сохранен в профиле');
        return;
      }
      
      // Получаем список зарегистрированных пользователей
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const userIndex = registeredUsers.findIndex(user => user.email === userData.email);
      
      if (userIndex === -1) {
        console.log('Пользователь не найден в списке зарегистрированных пользователей');
        return;
      }
      
      // Форматируем заказ для отображения в профиле
      const profileOrder = {
        id: order.orderNumber,
        date: new Date().toLocaleDateString('ru-RU'),
        status: 'Новый',
        total: order.totalPrice,
        items: order.items,
        userEmail: userData.email,
        address: userData.address || '',
        phone: userData.phone || '',
        name: userData.name || '',
        delivery: {
          type: 'courier',
          address: userData.address || ''
        },
        paymentMethod: order.paymentMethod || 'card',
        customer: {
          name: userData.name || '',
          phone: userData.phone || '',
          email: userData.email || ''
        }
      };
      
      // Добавляем заказ в профиль пользователя
      if (!registeredUsers[userIndex].orders) {
        registeredUsers[userIndex].orders = [];
      }
      
      // Проверяем, нет ли уже такого заказа (по номеру)
      const existingOrderIndex = registeredUsers[userIndex].orders.findIndex(o => o.id === profileOrder.id);
      if (existingOrderIndex !== -1) {
        // Если заказ уже есть, обновляем его
        registeredUsers[userIndex].orders[existingOrderIndex] = profileOrder;
      } else {
        // Если заказа нет, добавляем новый
        registeredUsers[userIndex].orders.push(profileOrder);
      }
      
      // Сохраняем обновленный список пользователей
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
      
      // Также добавляем заказ в общую историю заказов
      const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
      
      // Проверяем, нет ли уже такого заказа в истории
      const existingHistoryIndex = orderHistory.findIndex(o => o.id === profileOrder.id);
      if (existingHistoryIndex !== -1) {
        // Если заказ уже есть, обновляем его
        orderHistory[existingHistoryIndex] = profileOrder;
      } else {
        // Если заказа нет, добавляем новый
        orderHistory.push(profileOrder);
      }
      
      // Сохраняем обновленную историю заказов
      localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
      
      console.log('Заказ успешно сохранен в профиле пользователя:', profileOrder);
    } catch (error) {
      console.error('Ошибка при сохранении заказа в профиле пользователя:', error);
    }
  }
  
  // Функция для отображения уведомления о локальном сохранении
  function showLocalStorageNotification() {
    // Проверяем, есть ли функция для показа уведомлений
    if (typeof window.showNotification === 'function') {
      window.showNotification({
        title: 'Заказ сохранен локально',
        message: 'Не удалось отправить заказ на сервер, но он сохранен в локальном хранилище.',
        type: 'info',
        duration: 5000
      });
    } else {
      // Если функции нет, просто выводим в консоль
      console.log('Заказ сохранен локально, но не отправлен на сервер');
    }
  }
  
  // Функция для обновления заказа в localStorage
  function updateOrderInLocalStorage(updatedOrder) {
    // Обновляем в adminOrders
    const adminOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]');
    const adminOrderIndex = adminOrders.findIndex(order => order.timestamp === updatedOrder.timestamp);
    if (adminOrderIndex !== -1) {
      adminOrders[adminOrderIndex] = updatedOrder;
      localStorage.setItem('adminOrders', JSON.stringify(adminOrders));
    }
    
    // Обновляем в обычных заказах
    const clientOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const clientOrderIndex = clientOrders.findIndex(order => order.timestamp === updatedOrder.timestamp);
    if (clientOrderIndex !== -1) {
      clientOrders[clientOrderIndex] = updatedOrder;
      localStorage.setItem('orders', JSON.stringify(clientOrders));
    }
  }
  
  // Очистка корзины
  function clearCart() {
    cartItems = [];
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    
    // Обновляем отображение корзины, если она открыта
    if (typeof window.updateCartPanel === 'function') {
      window.updateCartPanel();
    }
    
    // Обновляем счетчик товаров в корзине
    if (typeof window.updateCartCounter === 'function') {
      window.updateCartCounter(0);
    }
  }
  
  // Показ подтверждения заказа
  function showOrderConfirmation(order) {
    // Определяем иконку и текст для выбранного способа связи
    let contactIcon, contactText;
    switch (order.contactMethod) {
      case 'whatsapp':
        contactIcon = 'fab fa-whatsapp';
        contactText = 'WhatsApp';
        break;
      case 'telegram':
        contactIcon = 'fab fa-telegram-plane';
        contactText = 'Telegram';
        break;
      case 'email':
        contactIcon = 'fas fa-envelope';
        contactText = 'Email';
        break;
      default:
        contactIcon = 'fas fa-phone-alt';
        contactText = 'телефон';
    }
    
    // Обновляем содержимое модального окна
    if (checkoutModal) {
      const modalContent = checkoutModal.querySelector('.checkout-modal__content');
      if (modalContent) {
        modalContent.innerHTML = `
          <div class="checkout-success">
            <div class="checkout-success-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <h2 class="checkout-success-title">Заказ успешно оформлен</h2>
            <p class="checkout-success-text">
              Благодарим за ваш заказ! В течение 2 часов наш менеджер свяжется с вами через <strong><i class="${contactIcon}"></i> ${contactText}</strong> для уточнения деталей доставки и оплаты.
            </p>
            <div class="checkout-success-number">
              <span>Номер заказа:</span>
              <strong>${order.orderNumber}</strong>
            </div>
            <div class="checkout-success-buttons">
              <button class="checkout-view-orders">
                <i class="fas fa-list-ul"></i>
                Мои заказы
              </button>
              <button class="checkout-empty-button">
                <i class="fas fa-shopping-bag"></i>
                Продолжить покупки
              </button>
            </div>
          </div>
        `;
        
        // Добавляем обработчик для кнопки "Мои заказы"
        const viewOrdersBtn = modalContent.querySelector('.checkout-view-orders');
        if (viewOrdersBtn) {
          viewOrdersBtn.addEventListener('click', () => {
            // Закрываем модальное окно
            closeCheckoutModal();
            
            // Если есть функция показа заказов, вызываем её
            if (typeof window.showOrdersModal === 'function') {
              setTimeout(() => {
                window.showOrdersModal();
              }, 300);
            }
          });
        }
        
        // Добавляем обработчик для кнопки "Продолжить покупки"
        const continueBtn = modalContent.querySelector('.checkout-empty-button');
        if (continueBtn) {
          continueBtn.addEventListener('click', closeCheckoutModal);
        }
      }
    }
    
    // Воспроизводим звук успешного оформления заказа
    if (window.settingsModule && typeof window.settingsModule.playSound === 'function') {
      window.settingsModule.playSound('success');
    }
  }
  
  // Закрытие модального окна
  function closeCheckoutModal() {
    if (checkoutModal) {
      checkoutModal.setAttribute('aria-hidden', 'true');
      
      // Разблокируем прокрутку страницы и сбрасываем стили положения
      document.body.classList.remove('checkout-modal-open');
      
      // Сохраняем текущее смещение для восстановления позиции прокрутки
      const scrollY = document.body.style.top;
      
      // Сбрасываем стили позиционирования
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('top');
      document.body.style.removeProperty('width');
      document.body.style.removeProperty('height');
      document.body.style.removeProperty('touch-action');
      
      // Восстанавливаем позицию прокрутки
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
      
      // Проверяем и обновляем данные пользователя для сохранения авторизации
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (userData && (userData.email || userData.name)) {
        // Убедимся, что у нас сохранен флаг авторизации
        userData.loggedIn = true;
        userData.lastActivity = new Date().getTime();
        localStorage.setItem('userData', JSON.stringify(userData));
      }
      
      // Возвращаем видимость острова с задержкой
      setTimeout(() => {
        const islandElement = document.querySelector('.island');
        if (islandElement) {
          islandElement.style.visibility = 'visible';
          islandElement.style.opacity = '1';
          islandElement.style.transform = 'translateY(0) translateX(-50%)';
        }
      }, 300);
    }
  }
  
  // Обработчик прокрутки для модального окна
  function handleModalScroll(event) {
    // Контейнер прокрутки
    const scrollContainer = event.target;
    
    // Проверяем, достигла ли прокрутка нижней части содержимого
    if (scrollContainer) {
      const scrollTop = scrollContainer.scrollTop;
      const maxScrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight;
      
     
      // Если мы прокрутили к самому верху - добавляем класс для визуальных эффектов при необходимости
      if (scrollTop <= 0) {
        scrollContainer.classList.add('at-top');
      } else {
        scrollContainer.classList.remove('at-top');
      }
      
      // Если мы прокрутили почти до конца - добавляем класс для визуальных эффектов при необходимости
      if (scrollTop >= maxScrollTop - 50) {
        scrollContainer.classList.add('at-bottom');
      } else {
        scrollContainer.classList.remove('at-bottom');
      }
    }
  }
  
  // Функция для настройки высоты модального окна в зависимости от размера экрана
  function adjustModalHeight() {
    if (checkoutModal) {
      const modalContent = checkoutModal.querySelector('.checkout-modal__content');
      const scrollContainer = checkoutModal.querySelector('.checkout-modal__scroller');
      
      if (modalContent) {
        const windowHeight = window.innerHeight;
        const modalContentHeight = modalContent.scrollHeight;
        
        // Получаем реальный размер контента (с учетом внутренних элементов)
        const contentHeight = Array.from(modalContent.children)
          .reduce((total, child) => total + child.offsetHeight, 0);
        
        if (modalContentHeight > windowHeight * 0.9) {
          // Ограничиваем высоту контента при большом содержимом
          modalContent.style.maxHeight = `${windowHeight * 0.9}px`;
          modalContent.style.marginBottom = '10px';
          
          // На мобильных устройствах добавляем небольшую прокрутку
          if (window.innerWidth <= 768) {
            scrollContainer.style.overflowY = 'auto';
            // Проверяем, действительно ли контент больше окна
            if (contentHeight < windowHeight) {
              // Устанавливаем минимальную высоту контейнера, чтобы избежать лишней прокрутки
              scrollContainer.style.height = 'auto';
              scrollContainer.style.minHeight = '100%';
              scrollContainer.style.maxHeight = '100%';
            }
          }
        } else {
          // Для небольшого содержимого устанавливаем автоматическую высоту
          modalContent.style.maxHeight = 'auto';
          modalContent.style.height = 'auto';
          
          // Центрируем модальное окно по вертикали
          if (windowHeight > modalContentHeight + 40) {
            modalContent.style.margin = 'auto';
          }
          
          // Устанавливаем ограничения на прокрутку, если контент меньше окна
          if (contentHeight < windowHeight) {
            scrollContainer.style.overflowY = 'hidden';
          } else {
            scrollContainer.style.overflowY = 'auto';
          }
        }
        
        // На мобильных устройствах регулируем отступы
        if (window.innerWidth <= 768) {
          modalContent.style.marginBottom = '0';
          scrollContainer.style.paddingBottom = '0';
        }
        
        // Обновляем стили после загрузки всех изображений
        // (может повлиять на общую высоту)
        const images = modalContent.querySelectorAll('img');
        if (images.length > 0) {
          let imagesLoaded = 0;
          images.forEach(img => {
            if (img.complete) {
              imagesLoaded++;
              if (imagesLoaded === images.length) {
                // Все изображения загружены, обновляем высоту
                setTimeout(() => {
                  adjustModalHeight();
                }, 50);
              }
            } else {
              img.addEventListener('load', () => {
                imagesLoaded++;
                if (imagesLoaded === images.length) {
                  // Все изображения загружены, обновляем высоту
                  setTimeout(() => {
                    adjustModalHeight();
                  }, 50);
                }
              });
            }
          });
        }
      }
    }
  }
  
  // Функция для анимированной перезагрузки страницы
  function animatedReload(delay = 400, withFlag = false, flagName = '', flagValue = '', theme = '') {
    // Определяем тему анимации
    const reloadTheme = theme || localStorage.getItem('reloadAnimationTheme') || 'default';
    
    // Создаем оверлей для анимации перезагрузки, если его еще нет
    let reloadOverlay = document.querySelector('.page-reload-overlay');
    if (!reloadOverlay) {
      reloadOverlay = document.createElement('div');
      reloadOverlay.className = `page-reload-overlay theme-${reloadTheme}`;
      
      // Создаем более интересную анимацию с частицами
      const particlesContainer = document.createElement('div');
      particlesContainer.className = 'reload-particles-container';
      
      // Количество частиц зависит от темы
      const particleCount = getThemeConfig(reloadTheme).particleCount;
      
      // Добавляем частицы
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'reload-particle';
        particle.style.setProperty('--delay', `${Math.random() * 1}s`);
        particle.style.setProperty('--size', `${Math.random() * 10 + 5}px`);
        particle.style.setProperty('--speed', `${Math.random() * 2 + 1}s`);
        particle.style.setProperty('--color', getRandomColor(reloadTheme));
        
        // Для праздничной темы добавляем разные формы частиц
        if (reloadTheme === 'festive') {
          const shapes = ['circle', 'star', 'square', 'triangle'];
          const shape = shapes[Math.floor(Math.random() * shapes.length)];
          particle.classList.add(`shape-${shape}`);
        }
        
        particlesContainer.appendChild(particle);
      }
      
      // Добавляем анимированный спиннер
      const animationContainer = document.createElement('div');
      animationContainer.className = 'reload-animation';
      
      // Контент зависит от темы
      const themeConfig = getThemeConfig(reloadTheme);
      animationContainer.innerHTML = themeConfig.animationHTML;
      
      reloadOverlay.appendChild(particlesContainer);
      reloadOverlay.appendChild(animationContainer);
      
      // Добавляем стили для оверлея, если их еще нет
      if (!document.getElementById('reload-overlay-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'reload-overlay-styles';
        styleElement.textContent = `
          .page-reload-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: ${document.body.classList.contains('dark') ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.6s ease;
            overflow: hidden;
          }
          
          /* Стили для разных тем */
          .page-reload-overlay.theme-minimal {
            background-color: ${document.body.classList.contains('dark') ? 'rgba(20, 20, 20, 0.98)' : 'rgba(250, 250, 250, 0.98)'};
          }
          
          .page-reload-overlay.theme-festive {
            background-color: ${document.body.classList.contains('dark') ? 'rgba(30, 30, 60, 0.95)' : 'rgba(245, 245, 255, 0.95)'};
          }
          
          .page-reload-overlay.theme-tech {
            background-color: ${document.body.classList.contains('dark') ? 'rgba(0, 20, 40, 0.95)' : 'rgba(240, 250, 255, 0.95)'};
            background-image: ${document.body.classList.contains('dark') ? 
              'linear-gradient(0deg, rgba(0, 30, 60, 0.8) 0%, rgba(20, 20, 40, 0.8) 100%)' : 
              'linear-gradient(0deg, rgba(240, 250, 255, 0.8) 0%, rgba(230, 240, 255, 0.8) 100%)'};
          }
          
          .reload-particles-container {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            overflow: hidden;
            z-index: 1;
          }
          
          .reload-particle {
            position: absolute;
            width: var(--size);
            height: var(--size);
            background: var(--color);
            border-radius: 50%;
            opacity: 0;
            animation: particle-float var(--speed) ease-in-out var(--delay) infinite;
            box-shadow: 0 0 10px var(--color);
          }
          
          /* Формы частиц для праздничной темы */
          .reload-particle.shape-star {
            clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
          }
          
          .reload-particle.shape-square {
            border-radius: 0;
          }
          
          .reload-particle.shape-triangle {
            clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
          }
          
          /* Анимация частиц для разных тем */
          @keyframes particle-float {
            0% {
              opacity: 0;
              transform: translate(calc(50vw - var(--size)/2), calc(50vh - var(--size)/2)) scale(0);
            }
            20% {
              opacity: 0.8;
              transform: translate(
                calc(50vw - var(--size)/2 + ${Math.random() > 0.5 ? '' : '-'}${Math.floor(Math.random() * 150)}px), 
                calc(50vh - var(--size)/2 + ${Math.random() > 0.5 ? '' : '-'}${Math.floor(Math.random() * 150)}px)
              ) scale(1);
            }
            80% {
              opacity: 0.8;
              transform: translate(
                calc(50vw - var(--size)/2 + ${Math.random() > 0.5 ? '' : '-'}${Math.floor(Math.random() * 300)}px), 
                calc(50vh - var(--size)/2 + ${Math.random() > 0.5 ? '' : '-'}${Math.floor(Math.random() * 300)}px)
              ) scale(1);
            }
            100% {
              opacity: 0;
              transform: translate(
                calc(50vw - var(--size)/2 + ${Math.random() > 0.5 ? '' : '-'}${Math.floor(Math.random() * 400)}px), 
                calc(50vh - var(--size)/2 + ${Math.random() > 0.5 ? '' : '-'}${Math.floor(Math.random() * 400)}px)
              ) scale(0);
            }
          }
          
          /* Анимация для минималистичной темы */
          .theme-minimal .reload-particle {
            box-shadow: none;
            animation: minimal-particle-float var(--speed) ease-in-out var(--delay) infinite;
          }
          
          @keyframes minimal-particle-float {
            0% {
              opacity: 0;
              transform: translate(50vw, 50vh) scale(0);
            }
            30% {
              opacity: 0.6;
              transform: translate(50vw, 50vh) scale(1);
            }
            70% {
              opacity: 0.6;
              transform: translate(50vw, 50vh) scale(1);
            }
            100% {
              opacity: 0;
              transform: translate(50vw, 50vh) scale(0);
            }
          }
          
          /* Анимация для технической темы */
          .theme-tech .reload-particle {
            border-radius: 0;
            animation: tech-particle-float var(--speed) ease-in-out var(--delay) infinite;
          }
          
          @keyframes tech-particle-float {
            0% {
              opacity: 0;
              transform: translate(calc(50vw - var(--size)/2), calc(50vh - var(--size)/2)) scale(0) rotate(0deg);
            }
            20% {
              opacity: 0.7;
              transform: translate(
                calc(50vw - var(--size)/2 + ${Math.random() > 0.5 ? '' : '-'}${Math.floor(Math.random() * 200)}px), 
                calc(50vh - var(--size)/2 + ${Math.random() > 0.5 ? '' : '-'}${Math.floor(Math.random() * 200)}px)
              ) scale(1) rotate(180deg);
            }
            80% {
              opacity: 0.7;
              transform: translate(
                calc(50vw - var(--size)/2 + ${Math.random() > 0.5 ? '' : '-'}${Math.floor(Math.random() * 350)}px), 
                calc(50vh - var(--size)/2 + ${Math.random() > 0.5 ? '' : '-'}${Math.floor(Math.random() * 350)}px)
              ) scale(1) rotate(360deg);
            }
            100% {
              opacity: 0;
              transform: translate(
                calc(50vw - var(--size)/2 + ${Math.random() > 0.5 ? '' : '-'}${Math.floor(Math.random() * 450)}px), 
                calc(50vh - var(--size)/2 + ${Math.random() > 0.5 ? '' : '-'}${Math.floor(Math.random() * 450)}px)
              ) scale(0) rotate(540deg);
            }
          }
          
          .reload-animation {
            position: relative;
            z-index: 2;
            text-align: center;
            font-size: 24px;
            color: ${document.body.classList.contains('dark') ? '#f0f0f0' : '#333'};
          }
          
          .reload-spinner {
            position: relative;
            width: 120px;
            height: 120px;
            margin: 0 auto 20px;
          }
          
          .reload-spinner-inner,
          .reload-spinner-middle,
          .reload-spinner-outer {
            position: absolute;
            border-radius: 50%;
            border: 4px solid transparent;
          }
          
          .reload-spinner-inner {
            width: 60px;
            height: 60px;
            border-top-color: #4a90e2;
            border-left-color: #4a90e2;
            top: 30px;
            left: 30px;
            animation: spin 1s linear infinite;
          }
          
          .reload-spinner-middle {
            width: 80px;
            height: 80px;
            border-top-color: #C9897B;
            border-right-color: #C9897B;
            top: 20px;
            left: 20px;
            animation: spin 1.5s linear infinite reverse;
          }
          
          .reload-spinner-outer {
            width: 100px;
            height: 100px;
            border-bottom-color: #BCB88A;
            border-left-color: #BCB88A;
            top: 10px;
            left: 10px;
            animation: spin 2s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .reload-text {
            margin-top: 20px;
            font-size: 22px;
            font-weight: 500;
            display: flex;
            justify-content: center;
            gap: 2px;
          }
          
          .reload-text-char {
            display: inline-block;
            animation: text-bounce 1.5s ease-in-out infinite;
            opacity: 0.8;
          }
          
          @keyframes text-bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          
          /* Стили для минималистичной темы */
          .theme-minimal .reload-spinner {
            width: 60px;
            height: 60px;
          }
          
          .theme-minimal .reload-spinner-inner,
          .theme-minimal .reload-spinner-middle,
          .theme-minimal .reload-spinner-outer {
            display: none;
          }
          
          .theme-minimal .minimal-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid transparent;
            border-top-color: ${document.body.classList.contains('dark') ? '#fff' : '#333'};
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto;
          }
          
          .theme-minimal .reload-text {
            font-size: 16px;
            margin-top: 15px;
            font-weight: 400;
            letter-spacing: 1px;
          }
          
          .theme-minimal .reload-text-char {
            animation: none;
          }
          
          /* Стили для праздничной темы */
          .theme-festive .reload-spinner {
            transform: scale(1.2);
          }
          
          .theme-festive .reload-text {
            font-size: 24px;
            font-weight: 700;
            margin-top: 25px;
          }
          
          .theme-festive .reload-text-char {
            animation: festive-text-bounce 1s ease-in-out infinite;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
          }
          
          @keyframes festive-text-bounce {
            0%, 100% {
              transform: translateY(0) rotate(0deg);
              color: #4a90e2;
            }
            25% {
              color: #C9897B;
            }
            50% {
              transform: translateY(-15px) rotate(10deg);
              color: #BCB88A;
            }
            75% {
              color: #4caf50;
            }
          }
          
          /* Стили для технической темы */
          .theme-tech .reload-spinner {
            width: 150px;
            height: 150px;
          }
          
          .theme-tech .tech-grid {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            border: 1px solid rgba(74, 144, 226, 0.3);
            box-sizing: border-box;
          }
          
          .theme-tech .tech-grid::before,
          .theme-tech .tech-grid::after {
            content: '';
            position: absolute;
            background-color: rgba(74, 144, 226, 0.3);
          }
          
          .theme-tech .tech-grid::before {
            width: 1px;
            height: 100%;
            left: 50%;
            top: 0;
          }
          
          .theme-tech .tech-grid::after {
            width: 100%;
            height: 1px;
            top: 50%;
            left: 0;
          }
          
          .theme-tech .tech-circle {
            position: absolute;
            width: 70%;
            height: 70%;
            top: 15%;
            left: 15%;
            border: 1px solid rgba(74, 144, 226, 0.5);
            border-radius: 50%;
            animation: tech-pulse 2s ease-in-out infinite;
          }
          
          @keyframes tech-pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 0.5;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.8;
            }
          }
          
          .theme-tech .tech-scanner {
            position: absolute;
            width: 100%;
            height: 2px;
            background: linear-gradient(to right, 
              rgba(74, 144, 226, 0), 
              rgba(74, 144, 226, 0.8), 
              rgba(74, 144, 226, 0));
            top: 0;
            left: 0;
            animation: tech-scan 2s ease-in-out infinite;
          }
          
          @keyframes tech-scan {
            0% {
              top: 0;
              opacity: 0.8;
            }
            100% {
              top: 100%;
              opacity: 0.2;
            }
          }
          
          .theme-tech .reload-text {
            font-family: monospace;
            letter-spacing: 2px;
          }
          
          .theme-tech .reload-text-char {
            animation: tech-text-flicker 2s ease-in-out infinite;
            animation-delay: calc(var(--index) * 0.1s);
          }
          
          @keyframes tech-text-flicker {
            0%, 100% {
              opacity: 1;
            }
            5%, 10% {
              opacity: 0.4;
            }
          }
        `;
        
        // Добавляем задержку для каждой буквы
        const textChars = styleElement.textContent.match(/\.reload-text-char \{[^}]*\}/);
        if (textChars) {
          let charStyles = '';
          for (let i = 0; i < 13; i++) {
            charStyles += `
              .reload-text-char:nth-child(${i+1}) {
                animation-delay: ${i * 0.1}s;
                --index: ${i};
              }
            `;
          }
          styleElement.textContent += charStyles;
        }
        
        document.head.appendChild(styleElement);
      }
      
      document.body.appendChild(reloadOverlay);
    }
    
    // Если нужно установить флаг в localStorage
    if (withFlag && flagName) {
      localStorage.setItem(flagName, flagValue || 'true');
    }
    
    // Анимируем появление оверлея
    setTimeout(() => {
      reloadOverlay.style.opacity = '1';
      // Запускаем перезагрузку после завершения анимации
      setTimeout(() => {
        window.location.reload();
      }, getThemeConfig(reloadTheme).duration);
    }, 10);
  }
  
  // Вспомогательная функция для генерации случайного цвета в зависимости от темы
  function getRandomColor(theme) {
    let colors;
    
    switch (theme) {
      case 'minimal':
        // Монохромные цвета для минималистичной темы
        colors = document.body.classList.contains('dark') ? 
          ['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0.7)'] :
          ['rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.3)'];
        break;
        
      case 'festive':
        // Яркие цвета для праздничной темы
        colors = [
          'rgba(255, 0, 0, 0.7)',     // Красный
          'rgba(0, 255, 0, 0.7)',     // Зеленый
          'rgba(0, 0, 255, 0.7)',     // Синий
          'rgba(255, 255, 0, 0.7)',   // Желтый
          'rgba(255, 0, 255, 0.7)',   // Розовый
          'rgba(0, 255, 255, 0.7)',   // Голубой
          'rgba(255, 165, 0, 0.7)',   // Оранжевый
          'rgba(128, 0, 128, 0.7)'    // Фиолетовый
        ];
        break;
        
      case 'tech':
        // Технические цвета
        colors = [
          'rgba(0, 150, 255, 0.7)',   // Синий
          'rgba(0, 200, 255, 0.7)',   // Голубой
          'rgba(0, 255, 200, 0.7)',   // Бирюзовый
          'rgba(100, 255, 100, 0.7)'  // Зеленый
        ];
        break;
        
      default:
        // Стандартные цвета
        colors = [
          'rgba(74, 144, 226, 0.7)',  // Синий
          'rgba(201, 137, 123, 0.7)', // Розовый
          'rgba(188, 184, 138, 0.7)', // Бежевый
          'rgba(76, 175, 80, 0.7)',   // Зеленый
          'rgba(255, 152, 0, 0.7)'    // Оранжевый
        ];
    }
    
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  // Функция для получения конфигурации в зависимости от темы
  function getThemeConfig(theme) {
    const configs = {
      default: {
        particleCount: 20,
        duration: 1500,
        animationHTML: `
          <div class="reload-spinner">
            <div class="reload-spinner-inner"></div>
            <div class="reload-spinner-middle"></div>
            <div class="reload-spinner-outer"></div>
          </div>
          <div class="reload-text">
            <span class="reload-text-char">О</span>
            <span class="reload-text-char">б</span>
            <span class="reload-text-char">н</span>
            <span class="reload-text-char">о</span>
            <span class="reload-text-char">в</span>
            <span class="reload-text-char">л</span>
            <span class="reload-text-char">е</span>
            <span class="reload-text-char">н</span>
            <span class="reload-text-char">и</span>
            <span class="reload-text-char">е</span>
            <span class="reload-text-char">.</span>
            <span class="reload-text-char">.</span>
            <span class="reload-text-char">.</span>
          </div>
        `
      },
      
      minimal: {
        particleCount: 5,
        duration: 1000,
        animationHTML: `
          <div class="minimal-spinner"></div>
          <div class="reload-text">
            <span class="reload-text-char">З</span>
            <span class="reload-text-char">А</span>
            <span class="reload-text-char">Г</span>
            <span class="reload-text-char">Р</span>
            <span class="reload-text-char">У</span>
            <span class="reload-text-char">З</span>
            <span class="reload-text-char">К</span>
            <span class="reload-text-char">А</span>
          </div>
        `
      },
      
      festive: {
        particleCount: 40,
        duration: 2000,
        animationHTML: `
          <div class="reload-spinner">
            <div class="reload-spinner-inner"></div>
            <div class="reload-spinner-middle"></div>
            <div class="reload-spinner-outer"></div>
          </div>
          <div class="reload-text">
            <span class="reload-text-char">П</span>
            <span class="reload-text-char">р</span>
            <span class="reload-text-char">а</span>
            <span class="reload-text-char">з</span>
            <span class="reload-text-char">д</span>
            <span class="reload-text-char">н</span>
            <span class="reload-text-char">и</span>
            <span class="reload-text-char">ч</span>
            <span class="reload-text-char">н</span>
            <span class="reload-text-char">о</span>
            <span class="reload-text-char">!</span>
          </div>
        `
      },
      
      tech: {
        particleCount: 15,
        duration: 2500,
        animationHTML: `
          <div class="reload-spinner">
            <div class="tech-grid"></div>
            <div class="tech-circle"></div>
            <div class="tech-scanner"></div>
            <div class="reload-spinner-inner"></div>
            <div class="reload-spinner-middle"></div>
            <div class="reload-spinner-outer"></div>
          </div>
          <div class="reload-text">
            <span class="reload-text-char">S</span>
            <span class="reload-text-char">Y</span>
            <span class="reload-text-char">S</span>
            <span class="reload-text-char">T</span>
            <span class="reload-text-char">E</span>
            <span class="reload-text-char">M</span>
            <span class="reload-text-char">_</span>
            <span class="reload-text-char">R</span>
            <span class="reload-text-char">E</span>
            <span class="reload-text-char">L</span>
            <span class="reload-text-char">O</span>
            <span class="reload-text-char">A</span>
            <span class="reload-text-char">D</span>
          </div>
        `
      }
    };
    
    return configs[theme] || configs.default;
  }
  
  // Публичные методы
  return {
    showCheckout: requireAuth(showCheckoutModal), // Защита метода оформления заказа
    closeCheckout: closeCheckoutModal,
    isUserLoggedIn: isUserLoggedIn, // Экспортируем функцию проверки авторизации
    redirectToLogin: redirectToLogin, // Экспортируем для доступа из других модулей
    animatedReload: animatedReload // Экспортируем функцию анимированной перезагрузки
  };
})();

// Делаем модуль доступным глобально
window.checkoutModule = checkoutModule;

// Делаем функцию анимированной перезагрузки доступной глобально
window.animatedReload = checkoutModule.animatedReload;