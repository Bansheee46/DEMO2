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
          <strong id="summary-delivery-cost">300 ₽</strong>
        </div>
        <div class="checkout-summary-row checkout-total-row">
          <span>Итого:</span>
          <strong class="checkout-grand-total">${(totalPrice + 300).toLocaleString()} ₽</strong>
        </div>
      </div>
    `;
  }
  
  // Показать модальное окно оформления заказа
  function showCheckoutModal() {
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
            </div>
            
            <div class="checkout-delivery">
              <h2 class="checkout-modal__title">Варианты получения</h2>
              <div class="delivery-options-tabs">
                <button class="delivery-tab active" data-delivery="courier">
                  <i class="fas fa-truck"></i>
                  <span>Курьер</span>
                </button>
                <button class="delivery-tab" data-delivery="pickup">
                  <i class="fas fa-store-alt"></i>
                  <span>Самовывоз</span>
                </button>
                <button class="delivery-tab" data-delivery="post">
                  <i class="fas fa-mail-bulk"></i>
                  <span>Почта</span>
                </button>
              </div>
              
              <div class="delivery-options-content">
                <!-- Секция с курьерской доставкой (активна по умолчанию) -->
                <div class="delivery-option-panel active" id="courier-panel">
                  <div class="delivery-timeframe">
                    <div class="timeframe-header">
                      <i class="fas fa-clock"></i>
                      <h3>Выберите удобное время доставки</h3>
                    </div>
                    <div class="delivery-days">
                      <div class="delivery-day" data-date="${formatDate(new Date())}">
                        <div class="date-label">Сегодня</div>
                        <div class="time-slots">
                          <button class="time-slot">9:00-12:00</button>
                          <button class="time-slot">12:00-15:00</button>
                          <button class="time-slot" disabled>15:00-18:00</button>
                          <button class="time-slot">18:00-21:00</button>
                        </div>
                      </div>
                      <div class="delivery-day" data-date="${formatDate(getTomorrow())}">
                        <div class="date-label">Завтра</div>
                        <div class="time-slots">
                          <button class="time-slot">9:00-12:00</button>
                          <button class="time-slot">12:00-15:00</button>
                          <button class="time-slot">15:00-18:00</button>
                          <button class="time-slot">18:00-21:00</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="address-map-section">
                    <div class="address-input-group">
                      <label for="delivery-address">Адрес доставки</label>
                      <div class="address-field-wrapper">
                        <input type="text" id="delivery-address" class="checkout-input address-autocomplete" placeholder="Начните вводить адрес...">
                        <button class="locate-me-btn" title="Определить моё местоположение">
                          <i class="fas fa-crosshairs"></i>
                        </button>
                      </div>
                    </div>
                    <div class="address-map">
                      <div class="map-placeholder">
                        <i class="fas fa-map-marked-alt"></i>
                        <span>Карта загрузится после ввода адреса</span>
                      </div>
                      <!-- Здесь будет подключена карта -->
                    </div>
                  </div>
                </div>
                
                <!-- Секция с пунктами самовывоза -->
                <div class="delivery-option-panel" id="pickup-panel">
                  <div class="pickup-search">
                    <input type="text" class="checkout-input" placeholder="Введите адрес для поиска ближайших пунктов">
                    <button class="pickup-search-btn">
                      <i class="fas fa-search"></i>
                    </button>
                  </div>
                  <div class="pickup-points">
                    <div class="pickup-point">
                      <div class="pickup-info">
                        <h4>Пункт выдачи №1</h4>
                        <p class="pickup-address">ул. Ленина, 25</p>
                        <p class="pickup-schedule">
                          <i class="far fa-clock"></i> 09:00-21:00, без выходных
                        </p>
                        <div class="pickup-details">
                          <span><i class="fas fa-money-bill-wave"></i> Наличная оплата</span>
                          <span><i class="fas fa-credit-card"></i> Картой на месте</span>
                        </div>
                      </div>
                      <button class="pickup-select-btn">Выбрать</button>
                    </div>
                    <div class="pickup-point">
                      <div class="pickup-info">
                        <h4>Пункт выдачи №2</h4>
                        <p class="pickup-address">ул. Гагарина, 54</p>
                        <p class="pickup-schedule">
                          <i class="far fa-clock"></i> 10:00-22:00, ежедневно
                        </p>
                        <div class="pickup-details">
                          <span><i class="fas fa-money-bill-wave"></i> Наличная оплата</span>
                          <span><i class="fas fa-credit-card"></i> Картой на месте</span>
                        </div>
                      </div>
                      <button class="pickup-select-btn">Выбрать</button>
                    </div>
                    <div class="pickup-point">
                      <div class="pickup-info">
                        <h4>Пункт выдачи №3</h4>
                        <p class="pickup-address">пр. Победы, 112</p>
                        <p class="pickup-schedule">
                          <i class="far fa-clock"></i> 08:00-20:00, ежедневно
                        </p>
                        <div class="pickup-details">
                          <span><i class="fas fa-money-bill-wave"></i> Наличная оплата</span>
                          <span><i class="fas fa-credit-card"></i> Картой на месте</span>
                        </div>
                      </div>
                      <button class="pickup-select-btn">Выбрать</button>
                    </div>
                  </div>
                </div>
                
                <!-- Секция с почтовой доставкой -->
                <div class="delivery-option-panel" id="post-panel">
                  <div class="post-types">
                    <div class="post-type active">
                      <input type="radio" name="post-type" id="post-regular" checked>
                      <label for="post-regular">
                        <div class="post-icon">
                          <i class="fas fa-envelope"></i>
                        </div>
                        <div class="post-info">
                          <span>Обычное отправление</span>
                          <p>5-7 дней, от 300 ₽</p>
                        </div>
                      </label>
                    </div>
                    <div class="post-type">
                      <input type="radio" name="post-type" id="post-express">
                      <label for="post-express">
                        <div class="post-icon">
                          <i class="fas fa-shipping-fast"></i>
                        </div>
                        <div class="post-info">
                          <span>Экспресс-доставка</span>
                          <p>2-3 дня, от 500 ₽</p>
                        </div>
                      </label>
                    </div>
                    <div class="post-type">
                      <input type="radio" name="post-type" id="post-insured">
                      <label for="post-insured">
                        <div class="post-icon">
                          <i class="fas fa-shield-alt"></i>
                        </div>
                        <div class="post-info">
                          <span>С объявленной ценностью</span>
                          <p>5-7 дней, от 350 ₽</p>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  <div class="postal-details">
                    <div class="checkout-form-group">
                      <label for="post-address">Почтовый адрес</label>
                      <textarea id="post-address" class="checkout-input" rows="3" placeholder="Индекс, город, улица, дом, квартира"></textarea>
                    </div>
                    <div class="checkout-form-group">
                      <label for="post-recipient">ФИО получателя</label>
                      <input type="text" id="post-recipient" class="checkout-input" placeholder="Фамилия Имя Отчество">
                    </div>
                  </div>
                </div>
              </div>
              
              <form class="checkout-form" id="checkout-form">
                <!-- Основные контактные данные для всех типов доставки -->
                <div class="checkout-form-comment">Основные контактные данные</div>
                <div class="checkout-form-row">
                  <div class="checkout-form-group">
                    <label for="checkout-name">Имя</label>
                    <input type="text" id="checkout-name" class="checkout-input" value="${userData.name || ''}" placeholder="Имя" required>
                  </div>
                  
                  <div class="checkout-form-group">
                    <label for="checkout-surname">Фамилия</label>
                    <input type="text" id="checkout-surname" class="checkout-input" value="${userData.surname || ''}" placeholder="Фамилия" required>
                  </div>
                </div>
                
                <div class="checkout-form-row">
                  <div class="checkout-form-group">
                    <label for="checkout-email">Email</label>
                    <input type="email" id="checkout-email" class="checkout-input" value="${userData.email || ''}" placeholder="example@domain.com" required>
                  </div>
                  
                  <div class="checkout-form-group">
                    <label for="checkout-phone">Телефон</label>
                    <input type="tel" id="checkout-phone" class="checkout-input" value="${userData.phone || ''}" placeholder="+7 (XXX) XXX-XX-XX" required>
                  </div>
                </div>
                
                <div class="payment-section">
                  <h3 class="payment-title">
                    <i class="fas fa-credit-card"></i>
                    Способ оплаты
                  </h3>
                  <div class="payment-methods">
                    <div class="payment-method active" data-method="card">
                      <input type="radio" id="payment-card" name="payment-method" value="card" checked>
                      <label for="payment-card" class="payment-method-label">
                        <i class="fas fa-credit-card"></i>
                        <div>
                          <span>Банковская карта</span>
                          <small>Visa, MasterCard, МИР</small>
                        </div>
                      </label>
                    </div>
                    
                    <div class="payment-method" data-method="cash">
                      <input type="radio" id="payment-cash" name="payment-method" value="cash">
                      <label for="payment-cash" class="payment-method-label">
                        <i class="fas fa-money-bill-wave"></i>
                        <div>
                          <span>Наличными при получении</span>
                          <small>Для курьера и самовывоза</small>
                        </div>
                      </label>
                    </div>
                    
                    <div class="payment-method" data-method="online">
                      <input type="radio" id="payment-online" name="payment-method" value="online">
                      <label for="payment-online" class="payment-method-label">
                        <i class="fas fa-mobile-alt"></i>
                        <div>
                          <span>Онлайн-оплата</span>
                          <small>СБП, ЮMoney, QIWI</small>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div class="checkout-form-group">
                  <label for="checkout-comment">Комментарий к заказу</label>
                  <textarea id="checkout-comment" class="checkout-input" placeholder="Ваши пожелания (необязательно)" rows="2"></textarea>
                </div>
                
                <div class="checkout-summary-sticky">
                  <div class="checkout-subtotal">
                    <div class="subtotal-label">Сумма заказа:</div>
                    <div class="subtotal-value">${totalPrice.toLocaleString()} ₽</div>
                  </div>
                  <div class="delivery-cost">
                    <div class="delivery-cost-label">Доставка:</div>
                    <div class="delivery-cost-value" id="delivery-cost">300 ₽</div>
                  </div>
                  <div class="checkout-total">
                    <div class="total-label">Итого:</div>
                    <div class="total-value">${(totalPrice + 300).toLocaleString()} ₽</div>
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
    updateDeliveryCost('courier');
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
          
          // Отладочное сообщение
          console.log('Принудительно активирован скролл:', scrollContainer);
          
          // Фокусировка на контейнере для улучшения скроллинга
          scrollContainer.focus();
          
          // Проверка скролла один раз через секунду
          setTimeout(() => {
            console.log('Статус скролла:', scrollContainer.scrollHeight, scrollContainer.clientHeight);
            scrollContainer.classList.add('scrollable');
            scrollContainer.style.overflowY = 'auto';
            scrollContainer.style.webkitOverflowScrolling = 'touch';
          }, 1000);
        }
      }
    }, 300);
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
    
    // Переключение вкладок способов доставки
    const deliveryTabs = checkoutModal.querySelectorAll('.delivery-tab');
    const deliveryPanels = checkoutModal.querySelectorAll('.delivery-option-panel');
    
    deliveryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Удаляем активный класс у всех вкладок
        deliveryTabs.forEach(t => t.classList.remove('active'));
        // Делаем текущую вкладку активной
        tab.classList.add('active');
        
        // Скрываем все панели
        deliveryPanels.forEach(panel => panel.classList.remove('active'));
        
        // Показываем нужную панель
        const targetPanel = document.getElementById(`${tab.dataset.delivery}-panel`);
        if (targetPanel) {
          targetPanel.classList.add('active');
          
          // Обновляем стоимость доставки в зависимости от выбранного способа
          updateDeliveryCost(tab.dataset.delivery);
        }
      });
    });
    
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
    
    // Обработка выбора временного слота
    const timeSlots = checkoutModal.querySelectorAll('.time-slot:not([disabled])');
    timeSlots.forEach(slot => {
      slot.addEventListener('click', () => {
        // Снимаем выделение со всех слотов
        timeSlots.forEach(s => s.classList.remove('selected'));
        // Выделяем выбранный слот
        slot.classList.add('selected');
        
        // Обновляем данные о выбранном времени доставки
        const dayElement = slot.closest('.delivery-day');
        if (dayElement) {
          selectedDeliveryDate = dayElement.dataset.date;
          selectedDeliveryTime = slot.textContent;
        }
      });
    });
    
    // Обработка выбора пункта самовывоза
    const pickupPoints = checkoutModal.querySelectorAll('.pickup-select-btn');
    pickupPoints.forEach(button => {
      button.addEventListener('click', () => {
        // Снимаем выделение со всех пунктов
        pickupPoints.forEach(b => {
          const point = b.closest('.pickup-point');
          if (point) point.classList.remove('selected');
          b.textContent = 'Выбрать';
        });
        
        // Выделяем выбранный пункт
        const selectedPoint = button.closest('.pickup-point');
        if (selectedPoint) {
          selectedPoint.classList.add('selected');
          button.textContent = 'Выбрано';
          
          // Сохраняем информацию о выбранном пункте
          const pointTitle = selectedPoint.querySelector('h4').textContent;
          const pointAddress = selectedPoint.querySelector('.pickup-address').textContent;
          selectedPickupPoint = { title: pointTitle, address: pointAddress };
        }
      });
    });
    
    // Обработка выбора типа почтовой доставки
    const postTypes = checkoutModal.querySelectorAll('.post-type');
    postTypes.forEach(type => {
      type.addEventListener('click', () => {
        // Снимаем выделение со всех типов
        postTypes.forEach(t => t.classList.remove('active'));
        // Выделяем выбранный тип
        type.classList.add('active');
        
        // Отмечаем соответствующий radio
        const radio = type.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          
          // Обновляем стоимость доставки в зависимости от типа
          let deliveryCost = 300;
          if (radio.id === 'post-express') {
            deliveryCost = 500;
          } else if (radio.id === 'post-insured') {
            deliveryCost = 350;
          } else {
            deliveryCost = 300;
          }
          
          updateDeliveryCostValue(deliveryCost);
          selectedPostType = radio.id;
        }
      });
    });
    
    // Имитация кнопки геолокации
    const locateMeBtn = checkoutModal.querySelector('.locate-me-btn');
    if (locateMeBtn) {
      locateMeBtn.addEventListener('click', () => {
        // Имитируем определение местоположения
        const deliveryAddressInput = document.getElementById('delivery-address');
        if (deliveryAddressInput) {
          // Для демонстрации заполняем поле адресом
          deliveryAddressInput.value = 'г. Казань, ул. Баумана, 12';
          
          // Показываем уведомление
          if (typeof window.showNotification === 'function') {
            window.showNotification('Ваше местоположение определено', 'success');
          }
          
          // Имитируем отображение карты
          const mapPlaceholder = checkoutModal.querySelector('.map-placeholder');
          if (mapPlaceholder) {
            mapPlaceholder.innerHTML = '<div class="map-loaded"><i class="fas fa-map-pin"></i> Адрес определен на карте</div>';
          }
        }
      });
    }
    
    // Обработка отправки формы
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Добавляем обработчик изменения размера окна для правильного отображения модального окна
    window.addEventListener('resize', () => {
      if (checkoutModal && checkoutModal.getAttribute('aria-hidden') === 'false') {
        // Настраиваем высоту модального окна
        adjustModalHeight();
        
        // Проверяем и исправляем пустое пространство
        setTimeout(() => {
          checkEmptySpace();
          forceScrollToTop();
        }, 100);
      }
    });
    
    // Вызываем функцию настройки высоты модального окна при инициализации
    adjustModalHeight();
    
    // Сбрасываем позицию прокрутки в начало с несколькими задержками для надежности
    [10, 50, 100, 200, 300, 500].forEach(delay => {
      setTimeout(() => {
        if (checkoutModal) {
          const scrollContainer = checkoutModal.querySelector('.checkout-modal__scroller');
          if (scrollContainer) {
            scrollContainer.scrollTop = 0;
          }
        }
      }, delay);
    });
    
    // Принудительно сбрасываем прокрутку после инициализации
    setTimeout(forceScrollToTop, 50);
    
    // Добавляем обработчик для мобильных устройств при изменении ориентации
    window.addEventListener('orientationchange', () => {
      if (checkoutModal && checkoutModal.getAttribute('aria-hidden') === 'false') {
        // Небольшая задержка для корректного расчета новых размеров после поворота
        setTimeout(() => {
          adjustModalHeight();
          checkEmptySpace();
        }, 300);
      }
    });
  }
  
  // Обновление стоимости доставки в зависимости от способа
  function updateDeliveryCost(deliveryType) {
    let cost = 300; // Базовая стоимость доставки всегда 300 рублей
    
    switch (deliveryType) {
      case 'courier':
        cost = 300;
        break;
      case 'pickup':
        cost = 300; // Изменяем с 0 на 300 рублей
        break;
      case 'post':
        // Для почты берем стоимость в зависимости от выбранного типа
        const selectedPostRadio = document.querySelector('input[name="post-type"]:checked');
        if (selectedPostRadio) {
          if (selectedPostRadio.id === 'post-express') {
            cost = 500;
          } else if (selectedPostRadio.id === 'post-insured') {
            cost = 350;
          } else {
            cost = 300;
          }
        } else {
          cost = 300;
        }
        break;
      default:
        cost = 300;
    }
    
    updateDeliveryCostValue(cost);
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
  function updateDeliveryCostValue(cost) {
    // Получаем все нужные элементы
    const deliveryCostElement = document.getElementById('delivery-cost');
    const summaryDeliveryCostElement = document.getElementById('summary-delivery-cost');
    const totalElement = checkoutModal.querySelector('.total-value');
    const grandTotalElement = checkoutModal.querySelector('.checkout-grand-total');
    
    // Функция для получения числового значения из элемента
    function getNumberFromElement(element) {
      if (!element) return 0;
      const text = element.textContent;
      const match = text.match(/(\d[\d\s]*)/);
      if (match) {
        return parseInt(match[0].replace(/\s/g, ''), 10);
      }
      return 0;
    }
    
    // Обновляем стоимость доставки в нижнем блоке с анимацией
    if (deliveryCostElement) {
      const currentCost = getNumberFromElement(deliveryCostElement);
      animateNumber(deliveryCostElement, currentCost, cost);
    }
    
    // Обновляем стоимость доставки в верхнем блоке товаров с анимацией
    if (summaryDeliveryCostElement) {
      const currentCost = getNumberFromElement(summaryDeliveryCostElement);
      animateNumber(summaryDeliveryCostElement, currentCost, cost);
    }
    
    // Обновляем итоговую сумму в нижнем блоке с анимацией
    if (totalElement) {
      const currentTotal = getNumberFromElement(totalElement);
      const newTotal = totalPrice + cost;
      animateNumber(totalElement, currentTotal, newTotal);
    }
    
    // Обновляем итоговую сумму в верхнем блоке товаров с анимацией
    if (grandTotalElement) {
      const currentTotal = getNumberFromElement(grandTotalElement);
      const newTotal = totalPrice + cost;
      animateNumber(grandTotalElement, currentTotal, newTotal);
    }
  }
  
  // Обработка отправки формы
  function handleFormSubmit(event) {
    event.preventDefault();
    
    // Дополнительная проверка авторизации при отправке формы
    if (!isUserLoggedIn()) {
      return redirectToLogin('Для оформления заказа необходимо войти в аккаунт');
    }
    
    // Проверка формы
    const name = document.getElementById('checkout-name').value;
    const surname = document.getElementById('checkout-surname').value;
    const email = document.getElementById('checkout-email').value;
    const phone = document.getElementById('checkout-phone').value;
    const comment = document.getElementById('checkout-comment').value;
    
    if (!name || !surname || !email || !phone) {
      if (typeof window.showNotification === 'function') {
        window.showNotification('Пожалуйста, заполните все обязательные поля', 'error');
      } else {
        alert('Пожалуйста, заполните все обязательные поля');
      }
      return;
    }
    
    // Определяем выбранный способ доставки
    const activeTab = checkoutModal.querySelector('.delivery-tab.active');
    if (!activeTab) {
      if (typeof window.showNotification === 'function') {
        window.showNotification('Пожалуйста, выберите способ доставки', 'error');
      } else {
        alert('Пожалуйста, выберите способ доставки');
      }
      return;
    }
    
    const deliveryType = activeTab.dataset.delivery;
    let deliveryData = {};
    let deliveryCost = 0;
    
    // Собираем данные в зависимости от выбранного способа доставки
    switch (deliveryType) {
      case 'courier':
        const address = document.getElementById('delivery-address').value;
        const selectedTimeSlot = checkoutModal.querySelector('.time-slot.selected');
        
        if (!address) {
          if (typeof window.showNotification === 'function') {
            window.showNotification('Пожалуйста, укажите адрес доставки', 'error');
          } else {
            alert('Пожалуйста, укажите адрес доставки');
          }
          return;
        }
        
        if (!selectedTimeSlot) {
          if (typeof window.showNotification === 'function') {
            window.showNotification('Пожалуйста, выберите время доставки', 'error');
          } else {
            alert('Пожалуйста, выберите время доставки');
          }
          return;
        }
        
        deliveryData = {
          type: 'courier',
          address: address,
          date: selectedDeliveryDate,
          time: selectedDeliveryTime
        };
        deliveryCost = 300;
        break;
        
      case 'pickup':
        if (!selectedPickupPoint) {
          if (typeof window.showNotification === 'function') {
            window.showNotification('Пожалуйста, выберите пункт самовывоза', 'error');
          } else {
            alert('Пожалуйста, выберите пункт самовывоза');
          }
          return;
        }
        
        deliveryData = {
          type: 'pickup',
          point: selectedPickupPoint
        };
        deliveryCost = 300; // Фиксируем стоимость в 300 рублей
        break;
        
      case 'post':
        const postAddress = document.getElementById('post-address').value;
        const recipient = document.getElementById('post-recipient').value;
        
        if (!postAddress || !recipient) {
          if (typeof window.showNotification === 'function') {
            window.showNotification('Пожалуйста, заполните почтовый адрес и ФИО получателя', 'error');
          } else {
            alert('Пожалуйста, заполните почтовый адрес и ФИО получателя');
          }
          return;
        }
        
        deliveryData = {
          type: 'post',
          address: postAddress,
          recipient: recipient,
          postType: selectedPostType || 'post-regular'
        };
        
        // Определяем стоимость в зависимости от типа
        if (selectedPostType === 'post-express') {
          deliveryCost = 500;
        } else if (selectedPostType === 'post-insured') {
          deliveryCost = 350;
        } else {
          deliveryCost = 300;
        }
        break;
    }
    
    // Создаем объект заказа
    const order = {
      id: 'ORD-' + Date.now(),
      date: new Date().toLocaleString('ru-RU'),
      items: loadCartItems(),
      subtotal: totalPrice,
      deliveryCost: deliveryCost,
      totalPrice: totalPrice + deliveryCost,
      total: totalPrice + deliveryCost, // Дублируем для совместимости с desktop.js
      status: 'Выполнен', // Статус для совместимости с desktop.js
      customer: {
        name,
        surname,
        email,
        phone,
        comment
      },
      // Добавляем поля для совместимости с отображением в modal_orders
      name: name + ' ' + surname,
      phone: phone,
      address: deliveryData.type === 'courier' ? deliveryData.address : 
               deliveryData.type === 'pickup' ? (deliveryData.point ? deliveryData.point.address : 'Самовывоз') : 
               deliveryData.type === 'post' ? deliveryData.address : 'Не указан',
      delivery: deliveryData,
      paymentMethod: selectedPaymentMethod
    };
    
    // Сохраняем данные пользователя
    userData = {
      name,
      surname,
      email,
      phone
    };
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // Сохраняем заказ в историю заказов
    saveOrder(order);
    
    // Очищаем корзину
    clearCart();
    
    // Показываем подтверждение заказа
    showOrderConfirmation(order);
  }
  
  // Сохранение заказа в истории
  function saveOrder(order) {
    // Проверка авторизации перед сохранением заказа
    if (!isUserLoggedIn()) {
      return redirectToLogin('Для сохранения заказа необходимо войти в аккаунт');
    }
    
    // Получаем данные пользователя
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    // Добавляем email пользователя к заказу для связи с аккаунтом
    order.userEmail = userData.email;
    
    // Сохраняем заказ в общей истории заказов
    let orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    orderHistory.push(order);
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
    
    // Также добавляем заказ в список заказов пользователя
    // Получаем список зарегистрированных пользователей
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const userIndex = registeredUsers.findIndex(user => user.email === userData.email);
    
    if (userIndex !== -1) {
      // Если пользователь найден, добавляем заказ в его список заказов
      if (!registeredUsers[userIndex].orders) {
        registeredUsers[userIndex].orders = [];
      }
      registeredUsers[userIndex].orders.push(order);
      
      // Сохраняем обновленный список пользователей
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
      console.log('Заказ успешно привязан к аккаунту пользователя', userData.email);
    } else {
      console.warn('Пользователь не найден в списке зарегистрированных пользователей');
    }
  }
  
  // Очистка корзины
  function clearCart() {
    localStorage.setItem('cartItems', '[]');
    cartItems = [];
    
    // Обновляем счетчик корзины
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
      cartCount.textContent = '0';
      cartCount.classList.remove('updating');
      void cartCount.offsetWidth;
      cartCount.classList.add('updating');
    }
    
    // Обновляем данные пользователя, чтобы быть уверенными что авторизация сохраняется
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData && userData.email) {
      userData.loggedIn = true;
      userData.lastActivity = new Date().getTime();
      localStorage.setItem('userData', JSON.stringify(userData));
    }
  }
  
  // Показ подтверждения заказа
  function showOrderConfirmation(order) {
    // Проверка авторизации перед показом подтверждения заказа
    if (!isUserLoggedIn()) {
      closeCheckoutModal();
      return redirectToLogin('Для просмотра заказа необходимо войти в аккаунт');
    }
    
    // Собираем имя + фамилию для обращения
    const fullName = order.customer.name.split(' ');
    const firstName = fullName[0] || '';
    
    // Создаем HTML для подтверждения
    const confirmationHtml = `
      <div class="checkout-success">
        <div class="checkout-success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2 class="checkout-success-title">Заказ успешно оформлен!</h2>
        <p class="checkout-success-text">
          ${firstName ? `${firstName}, с` : 'С'}пасибо за ваш заказ. Мы свяжемся с вами в ближайшее время для подтверждения деталей.
        </p>
        <div class="checkout-success-number">
          Номер заказа: <strong>${order.id}</strong>
        </div>
        <div class="checkout-success-buttons">
          <button class="checkout-empty-button">
            <i class="fas fa-home"></i> На главную
          </button>
        </div>
      </div>
    `;
    
    // Обновляем содержимое модального окна
    const scrollContainer = checkoutModal.querySelector('.checkout-modal__scroller');
    if (scrollContainer) {
      const modalContent = scrollContainer.querySelector('.checkout-modal__content');
      if (modalContent) {
        // Сохраняем кнопку закрытия
        const closeButton = modalContent.querySelector('.checkout-modal__close');
        
        // Обновляем содержимое
        modalContent.innerHTML = '';
        if (closeButton) {
          modalContent.appendChild(closeButton);
        }
        
        // Добавляем подтверждение
        const confirmationDiv = document.createElement('div');
        confirmationDiv.innerHTML = confirmationHtml;
        modalContent.appendChild(confirmationDiv.firstElementChild);
        
        // Обработчик для кнопки "На главную"
        const homeButton = modalContent.querySelector('.checkout-empty-button');
        if (homeButton) {
          homeButton.addEventListener('click', (event) => {
            // Предотвращаем стандартное поведение кнопки
            event.preventDefault();
            event.stopPropagation();
            
            // Проверяем и обновляем данные авторизации перед закрытием
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            if (userData && (userData.email || userData.name)) {
              // Обновляем дату последнего действия, чтобы не сбрасывалась авторизация
              userData.loggedIn = true;
              userData.lastActivity = new Date().getTime();
              localStorage.setItem('userData', JSON.stringify(userData));
              console.log('Данные пользователя обновлены перед возвратом на главную', userData);
            }
            
            // Закрываем модальное окно
            closeCheckoutModal();
            
            // Показываем уведомление о перезагрузке
            if (typeof window.showNotification === 'function') {
              window.showNotification('Заказ успешно оформлен! Перезагрузка страницы...', 'success');
            }
            
            // Анимированная перезагрузка страницы с флагом для открытия заказов и праздничной темой
            animatedReload(400, true, 'openOrdersAfterReload', 'true', 'festive');
          });
        }
        
        // Обработчик для кнопки "Мои заказы"
        const ordersButton = modalContent.querySelector('.checkout-view-orders');
        if (ordersButton) {
          ordersButton.addEventListener('click', (event) => {
            // Предотвращаем стандартное поведение кнопки
            event.preventDefault();
            event.stopPropagation();
            
            // Проверяем и обновляем данные авторизации перед закрытием
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            if (userData && (userData.email || userData.name)) {
              // Обновляем дату последнего действия, чтобы не сбрасывалась авторизация
              userData.loggedIn = true;
              userData.lastActivity = new Date().getTime();
              localStorage.setItem('userData', JSON.stringify(userData));
            }
            
            // Закрываем модальное окно
            closeCheckoutModal();
            
            // Показываем уведомление о перезагрузке
            if (typeof window.showNotification === 'function') {
              window.showNotification('Заказ успешно оформлен! Перезагрузка страницы...', 'success');
            }
            
            // Анимированная перезагрузка страницы с флагом для открытия заказов и праздничной темой
            animatedReload(400, true, 'openOrdersAfterReload', 'true', 'festive');
          });
        }
      }
    }
    
    // Воспроизводим звук успеха, если он есть
    if (window.settingsModule && typeof window.settingsModule.playSound === 'function') {
      window.settingsModule.playSound('success');
    }
    
    // Показываем уведомление
    if (typeof window.showNotification === 'function') {
      window.showNotification('Заказ успешно оформлен!', 'success');
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