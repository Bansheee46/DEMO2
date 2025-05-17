// Подключаем модуль настроек, интегрированный в основной код
// ... existing code ...

document.addEventListener('DOMContentLoaded', function() {
  // Глобальная переменная для хранения данных пользователей
  let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
  
  // Удаляем все существующие меню пользователя при загрузке страницы
  if (typeof deleteUserMenu === 'function') {
    deleteUserMenu();
  }

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

  // Функция для очистки localStorage
  function clearLocalStorage() {
    localStorage.clear();
    registeredUsers = [];
    
    // Сбрасываем UI кнопки входа
    if (loginButton) {
      // Очищаем существующие обработчики
      const newButton = loginButton.cloneNode(true);
      loginButton.parentNode.replaceChild(newButton, loginButton);
      
      // Обновляем внешний вид кнопки
      newButton.innerHTML = `<i class="fas fa-user"></i>`;
      newButton.title = 'Войти в аккаунт';
      newButton.classList.remove('logged-in');
      
      // Устанавливаем обработчик для открытия формы входа
      newButton.addEventListener('click', showLoginModal);
    }
    
    // Удаляем все возможные меню пользователя
    deleteUserMenu();
    
    showNotification('Данные очищены', 'info');
  }

  // Функция получения IP адреса пользователя (асинхронная)
  async function getUserIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Ошибка при получении IP:', error);
      return 'unknown';
    }
  }

  // Инициализация AOS
  AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true
  });

  let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
  
  // Основные элементы интерфейса
  const island = document.querySelector('.island');
  const productCards = document.querySelectorAll('.product-card');
  const footer = document.querySelector('.footer');
  const accentButton = document.querySelector('.top-cloud__accent');
  const accentMenu = document.querySelector('.accent-menu');
  const accentMenuItems = document.querySelectorAll('.accent-menu__item');
  const categoryButtons = document.querySelectorAll('.island__category');
  const cartIcon = document.querySelector('.cart-icon');
  const cartPanel = document.querySelector('.cart-panel');
  const cartCount = document.querySelector('.cart-count');
  const cartItemsList = document.querySelector('.cart-panel__items');
  const cartTotal = document.querySelector('.cart-panel__total span');
  const cartCheckout = document.querySelector('.cart-panel__checkout');

  // Создаем оверлей для затемнения страницы при открытом меню
  const overlayDiv = document.createElement('div');
  overlayDiv.className = 'overlay';
  overlayDiv.style.display = 'none';
  document.body.appendChild(overlayDiv);

  // Инициализация обработчика комбинации клавиш Left Alt + Left Ctrl
  initKeyboardShortcuts();

  // Инициализация темы при загрузке страницы
  const isDark = localStorage.getItem('theme') === 'dark';
  
  if (isDark) {
    document.body.setAttribute('data-theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark');
    document.body.classList.remove('light');
    
    // Принудительно обновляем отображение иконок
    document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
      const sunIcon = btn.querySelector('i.fa-sun');
      const moonIcon = btn.querySelector('i.fa-moon');
      
      if (sunIcon && moonIcon) {
        sunIcon.style.cssText = 'display: none !important';
        moonIcon.style.cssText = 'display: inline-block !important';
      }
    });
    
    updateSettingsMenu();
  } else {
    // Светлая тема
    document.body.setAttribute('data-theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.classList.remove('dark');
    document.body.classList.add('light');
  }
  
  // Инициализация состояния звука
  if (localStorage.getItem('sound') === 'muted') {
    document.body.classList.add('muted');
    
    // Обновляем иконки звука
    const soundToggleButtons = document.querySelectorAll('[data-action="toggle-sound"]');
    soundToggleButtons.forEach(button => {
      const volumeIcon = button.querySelector('.fa-volume-up');
      const muteIcon = button.querySelector('.fa-volume-mute');
      if (volumeIcon && muteIcon) {
        volumeIcon.style.display = 'none';
        muteIcon.style.display = 'inline-block';
      }
    });
    
    updateSettingsMenu();
  }

  setTimeout(() => island.classList.add('visible'), 300);

  // Ensure all products are visible on load by default
  productCards.forEach((card, index) => {
    card.style.display = 'block';
    card.style.visibility = 'visible';
    card.style.opacity = '1';
    setTimeout(() => {
      card.classList.add('visible');
    }, index * 100);
  });

  // Set the first category button as active by default
  if (categoryButtons.length > 0) {
    categoryButtons[0].classList.add('active');
  }

  setTimeout(() => {
    categoryButtons.forEach((btn, index) => {
      setTimeout(() => {
        btn.classList.add('pulse');
        setTimeout(() => btn.classList.remove('pulse'), 500);
      }, index * 500);
    });
  }, 600);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        footer.classList.add('visible');
        observer.unobserve(footer);
      }
    });
  }, { threshold: 0.1 });
  observer.observe(footer);

  // Обработчик клика для переключения меню
  document.querySelector('.top-cloud__accent').addEventListener('click', function() {
    const accentMenu = this.querySelector('.accent-menu');
    const isHidden = accentMenu.hasAttribute('inert');
    
    if (isHidden) {
      accentMenu.removeAttribute('inert');
    } else {
      accentMenu.setAttribute('inert', '');
    }
  });

  // Закрытие меню при клике вне его
  document.addEventListener('click', function(event) {
    if (!event.target.closest('.top-cloud__accent')) {
      const accentMenu = document.querySelector('.accent-menu');
      accentMenu.setAttribute('inert', '');
    }
  });

  // Остальные обработчики для элементов меню и т.д.
  accentMenuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = item.getAttribute('data-action');
      console.log('DESKTOP.JS: Клик по кнопке меню, действие:', action);
      
      // Воспроизводим звук переключения
      if (window.settingsModule && typeof window.settingsModule.playSound === 'function') {
        window.settingsModule.playSound('switch');
      }
      
      if (action === 'toggle-theme') {
        // Плавное переключение темы с анимацией
        toggleThemeWithAnimation();
      } else if (action === 'toggle-sound') {
        document.body.classList.toggle('muted');
        const isMuted = document.body.classList.contains('muted');
        localStorage.setItem('sound', isMuted ? 'muted' : 'unmuted');
        
        // Переключаем иконки
        const volumeIcon = item.querySelector('.fa-volume-up');
        const muteIcon = item.querySelector('.fa-volume-mute');
        if (volumeIcon && muteIcon) {
          volumeIcon.style.display = isMuted ? 'none' : 'inline-block';
          muteIcon.style.display = isMuted ? 'inline-block' : 'none';
        }
        
        // Обновляем настройки в модуле настроек
        if (window.settingsModule && typeof window.settingsModule.loadSettings === 'function') {
          const settings = window.settingsModule.loadSettings();
          settings.isSoundEnabled = !isMuted;
          window.settingsModule.saveSettings(settings);
        }
        
        updateSettingsMenu();
      } else if (action === 'scroll-top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (action === 'settings') {
        // Открываем модальное окно настроек
        showSettingsModal();
      }
    });
  });
  
  // Функция переключения темы с анимацией
  function toggleThemeWithAnimation() {
    // Создаем анимацию-вспышку перед сменой темы
    const flashOverlay = document.createElement('div');
    flashOverlay.className = 'theme-transition-overlay';
    document.body.appendChild(flashOverlay);
    
    // Получаем текущую тему
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const isDarkNow = currentTheme === 'dark';
    
    // Определяем новую тему
    const newTheme = isDarkNow ? 'light' : 'dark';
    
    // Начинаем анимацию
    setTimeout(() => {
      flashOverlay.classList.add('active');
      
      // Меняем тему в середине анимации
      setTimeout(() => {
        // Устанавливаем атрибуты и классы для новой темы
        document.body.setAttribute('data-theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Меняем классы для обратной совместимости
        if (newTheme === 'dark') {
          document.body.classList.add('dark');
          document.body.classList.remove('light');
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.body.classList.remove('dark');
          document.body.classList.add('light');
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
        }
        
        // Принудительно обновляем отображение иконок
        document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
          const sunIcon = btn.querySelector('i.fa-sun');
          const moonIcon = btn.querySelector('i.fa-moon');
          
          if (sunIcon && moonIcon) {
            if (newTheme === 'dark') {
              sunIcon.style.cssText = 'display: none !important';
              moonIcon.style.cssText = 'display: inline-block !important';
            } else {
              sunIcon.style.cssText = 'display: inline-block !important';
              moonIcon.style.cssText = 'display: none !important';
            }
          }
        });
        
        // Завершаем анимацию
        setTimeout(() => {
          flashOverlay.classList.remove('active');
          setTimeout(() => {
            document.body.removeChild(flashOverlay);
          }, 300);
        }, 300);
        
        // Сохраняем состояние темы
        localStorage.setItem('theme', newTheme);
        
        // Обновляем настройки, если они поддерживаются
        if (window.settingsModule) {
          const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
          settings.isDarkMode = newTheme === 'dark';
          localStorage.setItem('userSettings', JSON.stringify(settings));
        }
        
        // Обновляем меню настроек, если оно доступно
        if (typeof updateSettingsMenu === 'function') {
          updateSettingsMenu();
        }
        
      }, 150);
    }, 50);
  }

  function updateCartCount() {
    if (!cartCount) return;
    
    const itemsCount = cartItems.length;
    cartCount.textContent = itemsCount;
    
    // Update cart icon state
    if (cartIcon) {
      if (itemsCount > 0) {
        cartIcon.classList.add('has-items');
        // Add pulse animation if first item
        if (itemsCount === 1) {
          cartIcon.classList.add('pulse');
          setTimeout(() => cartIcon.classList.remove('pulse'), 3000);
        }
      } else {
        cartIcon.classList.remove('has-items');
      }
    }
  }

  if (cartIcon) {
    cartIcon.addEventListener('click', () => {
      if (!cartPanel) return;
      cartPanel.setAttribute('aria-hidden', cartPanel.getAttribute('aria-hidden') === 'true' ? 'false' : 'true');
      renderCartItems();
    });
  }

  const cartPanelClose = document.querySelector('.cart-panel__close');
  if (cartPanelClose) {
    cartPanelClose.addEventListener('click', () => {
      if (!cartPanel) return;
      cartPanel.setAttribute('aria-hidden', 'true');
    });
  }

  const productButtons = document.querySelectorAll('.product-card__button');
  if (productButtons && productButtons.length > 0) {
    productButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (!cartPanel) return;
        
        const card = button.closest('.product-card');
        if (!card) return;
        
        const titleEl = card.querySelector('.product-card__title');
        const priceEl = card.querySelector('.product-card__price');
        const imgEl = card.querySelector('img');
        
        if (!titleEl || !priceEl || !imgEl) return;
        
        const item = {
          id: Date.now(),
          title: titleEl.textContent,
          price: parseInt(priceEl.textContent.replace(/[^\d]/g, '')),
          image: imgEl.src,
          quantity: 1
        };
        
        // Add flying product effect
        createFlyingElement(imgEl, cartIcon);
        
        // Воспроизводим звук добавления в корзину
        if (window.settingsModule && typeof window.settingsModule.playSound === 'function') {
          window.settingsModule.playSound('add-to-cart');
        }
        
        // Check if item already exists
        const existingItemIndex = cartItems.findIndex(cartItem => cartItem.title === item.title);
        
        if (existingItemIndex !== -1) {
          cartItems[existingItemIndex].quantity += 1;
        } else {
          cartItems.push(item);
        }
        
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        updateCartCount();
        
        // Add animation to cart icon
        if (cartIcon) {
          cartIcon.classList.add('item-added');
          setTimeout(() => cartIcon.classList.remove('item-added'), 500);
        }
        
        // Add animation to cart count
        if (cartCount) {
          cartCount.classList.add('updating');
          setTimeout(() => cartCount.classList.remove('updating'), 500);
        }
        
        showNotification(`Товар "${item.title}" добавлен в корзину`, 'success');
      });
    });
  }
  
  // Function to create flying element animation
  function createFlyingElement(sourceImg, targetElement) {
    if (!sourceImg || !targetElement) return;
    
    // Create flying element
    const flyingImg = document.createElement('div');
    flyingImg.className = 'flying-product';
    
    // Get positions
    const imgRect = sourceImg.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    // Set initial position and style
    flyingImg.style.cssText = `
      position: fixed;
      z-index: 9999;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background-image: url(${sourceImg.src});
      background-size: cover;
      background-position: center;
      top: ${imgRect.top + imgRect.height/2 - 25}px;
      left: ${imgRect.left + imgRect.width/2 - 25}px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      transition: all 0.8s cubic-bezier(0.165, 0.84, 0.44, 1);
      opacity: 0;
      transform: scale(0.3);
    `;
    
    document.body.appendChild(flyingImg);
    
    // Start animation after a small delay
    setTimeout(() => {
      flyingImg.style.opacity = '1';
      flyingImg.style.transform = 'scale(1)';
    }, 50);
    
    // Move to target
    setTimeout(() => {
      flyingImg.style.top = `${targetRect.top + targetRect.height/2 - 25}px`;
      flyingImg.style.left = `${targetRect.left + targetRect.width/2 - 25}px`;
      flyingImg.style.transform = 'scale(0.2)';
      flyingImg.style.opacity = '0.8';
    }, 100);
    
    // Remove element after animation completes
    setTimeout(() => {
      if (flyingImg.parentNode) {
        flyingImg.parentNode.removeChild(flyingImg);
      }
    }, 1000);
  }

  function renderCartItems() {
    if (!cartItemsList || !cartPanel) return;
    
    // Clear the list
    cartItemsList.innerHTML = '';
    
    // Get cart items from local storage
    const items = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    // Update the total
    let total = 0;
    
    if (items.length === 0) {
      // Show empty cart message with icon and animation
      cartItemsList.innerHTML = `
        <li class="cart-empty">
          <div class="cart-empty__icon">
            <i class="fas fa-shopping-basket"></i>
          </div>
          <p>Ваша корзина пуста</p>
          <small>Добавьте товары, чтобы оформить заказ</small>
        </li>`;
    } else {
      // Render each item with staggered animation
      items.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const itemElement = document.createElement('li');
        itemElement.className = 'cart-item';
        itemElement.style.animationDelay = `${index * 0.1}s`;
        
        itemElement.innerHTML = `
          <div class="cart-item__image">
            <img src="${item.image}" alt="${item.title}">
          </div>
          <div class="cart-item__content">
            <div class="cart-item__top">
              <h3 class="cart-item__title">${item.title}</h3>
              <button class="cart-item__remove" data-id="${item.id}" title="Удалить товар">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="cart-item__bottom">
              <div class="cart-item__price">${item.price} ₽</div>
              <div class="cart-item__quantity">
                <button class="quantity-btn decrease" data-id="${item.id}">
                  <i class="fas fa-minus"></i>
                </button>
                <span>${item.quantity}</span>
                <button class="quantity-btn increase" data-id="${item.id}">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            </div>
            <div class="cart-item__total">
              Итого: <span>${itemTotal} ₽</span>
            </div>
          </div>
        `;
        
        cartItemsList.appendChild(itemElement);
        
        // Add event listeners for quantity buttons with feedback effects
        const decreaseBtn = itemElement.querySelector('.decrease');
        const increaseBtn = itemElement.querySelector('.increase');
        const removeBtn = itemElement.querySelector('.cart-item__remove');
        
        decreaseBtn.addEventListener('click', () => {
          decreaseBtn.classList.add('clicked');
          setTimeout(() => decreaseBtn.classList.remove('clicked'), 300);
          updateItemQuantity(item.id, -1);
        });
        
        increaseBtn.addEventListener('click', () => {
          increaseBtn.classList.add('clicked');
          setTimeout(() => increaseBtn.classList.remove('clicked'), 300);
          updateItemQuantity(item.id, 1);
        });
        
        removeBtn.addEventListener('click', () => {
          itemElement.classList.add('removing');
          setTimeout(() => {
            removeItemFromCart(item.id);
          }, 300);
        });
      });
    }
    
    // Update total display with animation
    if (cartTotal) {
      const oldTotal = parseInt(cartTotal.textContent.replace(/[^\d]/g, '')) || 0;
      
      if (oldTotal !== total) {
        cartTotal.classList.add('updating');
        setTimeout(() => {
          cartTotal.textContent = `${total} ₽`;
          cartTotal.classList.remove('updating');
        }, 300);
      } else {
        cartTotal.textContent = `${total} ₽`;
      }
    }
    
    // Enable/disable checkout button
    if (cartCheckout) {
      cartCheckout.disabled = items.length === 0;
      
      // Add handler for the checkout button
      cartCheckout.addEventListener('click', function(e) {
        createRippleEffect(e);
        
        // Используем только новый модуль оформления заказа
        if (window.checkoutModule && typeof window.checkoutModule.showCheckout === 'function') {
          window.checkoutModule.showCheckout();
        }
      });
    }
    
    // Add ripple effect to buttons
    function createRippleEffect(event) {
      const button = event.currentTarget;
      
      const circle = document.createElement('span');
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${event.clientX - button.getBoundingClientRect().left - diameter / 2}px`;
      circle.style.top = `${event.clientY - button.getBoundingClientRect().top - diameter / 2}px`;
      circle.classList.add('ripple');
      
      const ripple = button.querySelector('.ripple');
      if (ripple) {
        ripple.remove();
      }
      
      button.appendChild(circle);
    }
  }

  function updateItemQuantity(itemId, change) {
    let items = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;
    
    items[itemIndex].quantity += change;
    
    if (items[itemIndex].quantity <= 0) {
      items.splice(itemIndex, 1);
    }
    
    localStorage.setItem('cartItems', JSON.stringify(items));
    cartItems = items;
    updateCartCount();
    renderCartItems();
  }

  function removeItemFromCart(itemId) {
    let items = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    const newItems = items.filter(item => item.id !== itemId);
    
    localStorage.setItem('cartItems', JSON.stringify(newItems));
    cartItems = newItems;
    updateCartCount();
    renderCartItems();
    
    // Воспроизводим звук уведомления
    if (window.settingsModule && typeof window.settingsModule.playSound === 'function') {
      window.settingsModule.playSound('notification');
    }
    
    showNotification('Товар удален из корзины', 'info');
  }

  function updateSettingsMenu() {
    // Используем модуль настроек, если он доступен
    if (window.settingsModule && typeof window.settingsModule.loadSettings === 'function') {
      const settings = window.settingsModule.loadSettings();
      
      // Обновляем элементы интерфейса в соответствии с текущими настройками
      const menuThemeToggle = document.querySelector('.theme-toggle');
      const menuSoundToggle = document.querySelector('[data-action="toggle-sound"]');
      
      if (menuThemeToggle) {
        const sunIcon = menuThemeToggle.querySelector('.fa-sun');
        const moonIcon = menuThemeToggle.querySelector('.fa-moon');
        
        if (settings.isDarkMode) {
          menuThemeToggle.setAttribute('data-current', 'dark');
          if (sunIcon && moonIcon) {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'inline-block';
          }
        } else {
          menuThemeToggle.setAttribute('data-current', 'light');
          if (sunIcon && moonIcon) {
            sunIcon.style.display = 'inline-block';
            moonIcon.style.display = 'none';
          }
        }
      }
      
      if (menuSoundToggle) {
        const volumeIcon = menuSoundToggle.querySelector('.fa-volume-up');
        const muteIcon = menuSoundToggle.querySelector('.fa-volume-mute');
        
        if (settings.isSoundEnabled) {
          menuSoundToggle.setAttribute('data-current', 'unmuted');
          if (volumeIcon && muteIcon) {
            volumeIcon.style.display = 'inline-block';
            muteIcon.style.display = 'none';
          }
        } else {
          menuSoundToggle.setAttribute('data-current', 'muted');
          if (volumeIcon && muteIcon) {
            volumeIcon.style.display = 'none';
            muteIcon.style.display = 'inline-block';
          }
        }
      }
      
      return;
    }
    
    // Резервная логика (старый код), если модуль настроек недоступен
    // ... existing code ...
  }

  // Функция showNotification заменена на импортированную из notification.js
  function showNotification(message, type = 'info', duration = 3000) {
    // Используем новую функцию из notification.js с улучшенным дизайном
    if (typeof window.showNotification === 'function' && window.showNotification !== showNotification) {
      return window.showNotification(message, type, duration, true);
    } else {
      console.warn('Функция showNotification не найдена в глобальном объекте');
      
      // Резервная реализация (упрощенная версия)
      const notification = document.createElement('div');
      notification.className = `notification notification--${type}`;
      notification.innerHTML = `
        <div class="notification__icon">
          <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        </div>
        <div class="notification__content">
          <p>${message}</p>
        </div>
        <button class="notification__close">&times;</button>
      `;
      
      document.body.appendChild(notification);
      setTimeout(() => notification.classList.add('active'), 10);
      
      const closeBtn = notification.querySelector('.notification__close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          notification.classList.remove('active');
          setTimeout(() => notification.remove(), 300);
        });
      }
      
      if (duration > 0) {
        setTimeout(() => {
          notification.classList.remove('active');
          setTimeout(() => notification.remove(), 300);
        }, duration);
      }
      
      return {
        close: () => {
          notification.classList.remove('active');
          setTimeout(() => notification.remove(), 300);
        },
        update: (newMessage) => {
          const messageElement = notification.querySelector('.notification__content p');
          if (messageElement) messageElement.textContent = newMessage;
        },
        setType: (newType) => {
          notification.className = `notification notification--${newType} active`;
        }
      };
    }
  }

  // Функция для создания эффекта частиц при успешном входе
  function createSuccessParticles(customColors) {
    // Воспроизводим звук успеха, если он еще не был воспроизведен
    if (window.settingsModule && typeof window.settingsModule.playSound === 'function') {
      window.settingsModule.playSound('success');
    }
    
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'login-success-particles';
    document.body.appendChild(particlesContainer);
    
    // Добавляем стили для частиц
    if (!document.getElementById('particles-styles')) {
      const style = document.createElement('style');
      style.id = 'particles-styles';
      style.textContent = `
        .login-success-particles {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9999;
        }
        .particle {
          position: absolute;
          border-radius: 50%;
          width: 8px;
          height: 8px;
          animation: particle-animation 1s ease-out forwards;
        }
        @keyframes particle-animation {
          0% {
            opacity: 1;
            transform: scale(0);
          }
          100% {
            opacity: 0;
            transform: scale(1) translate(var(--tx), var(--ty));
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Получаем позицию модального окна
    const modalRect = document.querySelector('.login-modal__content').getBoundingClientRect();
    const centerX = modalRect.left + modalRect.width / 2;
    const centerY = modalRect.top + modalRect.height / 2;
    
    // Используем цвета по умолчанию или пользовательские
    const colors = customColors || ['#ff7b89', '#8a5082', '#6f5980', '#4ade80', '#60a5fa'];
    
    // Создаем частицы
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      // Рандомное положение и траектория
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 100;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      
      // Рандомный цвет из палитры
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Рандомный размер
      const size = 4 + Math.random() * 8;
      
      // Устанавливаем стили
      particle.style.backgroundColor = color;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${centerX}px`;
      particle.style.top = `${centerY}px`;
      particle.style.setProperty('--tx', `${tx}px`);
      particle.style.setProperty('--ty', `${ty}px`);
      
      // Добавляем небольшую задержку для каждой частицы
      particle.style.animationDelay = `${Math.random() * 0.2}s`;
      
      particlesContainer.appendChild(particle);
    }
    
    // Удаляем контейнер после анимации
      setTimeout(() => {
      particlesContainer.remove();
    }, 1500);
  }

  // Добавляем стили для анимации успешного входа
  if (!document.getElementById('login-success-styles')) {
    const style = document.createElement('style');
    style.id = 'login-success-styles';
    style.textContent = `
      .success-login .login-modal__content {
        animation: success-glow 1.2s;
      }
      
      @keyframes success-glow {
        0% {
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        50% {
          box-shadow: 0 0 30px 10px rgba(74, 222, 128, 0.6);
        }
        100% {
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize cart count
  updateCartCount();

  // Filter products
  categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      const category = button.getAttribute('data-category');
      
      // Update active state
      categoryButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Add animation to the active button
      button.classList.add('pulse');
      setTimeout(() => button.classList.remove('pulse'), 500);
      
      // Filter products
      productCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        
        if (category === 'all' || cardCategory === category) {
          card.style.display = 'block';
          setTimeout(() => {
            card.classList.add('visible');
          }, 100);
        } else {
          card.classList.remove('visible');
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });

  // Search functionality
  const searchInput = document.querySelector('.search-bar__input');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(function() {
      const searchTerm = this.value.toLowerCase().trim();
      
      productCards.forEach(card => {
        const title = card.querySelector('.product-card__title').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || searchTerm === '') {
          card.style.display = 'block';
          setTimeout(() => {
            card.classList.add('visible');
          }, 100);
        } else {
          card.classList.remove('visible');
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
      
      // If search bar is not empty, make sure to show all categories as active
      if (searchTerm !== '') {
        document.querySelector('.island__categories').classList.add('all-active');
        categoryButtons.forEach(btn => btn.classList.remove('active'));
      } else {
        document.querySelector('.island__categories').classList.remove('all-active');
        // Reactivate the currently selected category
        const activeCategory = document.querySelector('.island__category.active') || categoryButtons[0];
        if (activeCategory) {
          activeCategory.click();
        }
      }
    }, 300));
  }

  // Helper functions
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this, args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, wait);
    };
  }

  // Обработчики для модального окна входа
  const loginButton = document.getElementById('loginButton');
  const loginModal = document.getElementById('loginModal');
  const closeLoginButton = document.querySelector('.login-modal__close');
  
  // Формы
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  
  // Кнопки переключения форм
  const showRegisterFormButton = document.getElementById('showRegisterForm');
  const showLoginFormButton = document.getElementById('showLoginForm');
  const forgotPasswordButton = document.getElementById('forgotPassword');
  const backToLoginButton = document.getElementById('backToLogin');
  
  // Открытие модального окна входа
  if (loginButton && loginModal) {
    loginButton.addEventListener('click', function() {
      // Используем классы вместо aria-hidden для лучшей доступности
      loginModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Удаляем атрибут aria-hidden, если он был установлен
      if (loginModal.hasAttribute('aria-hidden')) {
        loginModal.removeAttribute('aria-hidden');
      }
      
      // Сбросить формы при открытии
      if (loginForm) loginForm.reset();
      if (registerForm) registerForm.reset();
      if (forgotPasswordForm) forgotPasswordForm.reset();
      
      // Показать форму входа по умолчанию
      showForm('login');
    });
  }
  
  // Закрытие модального окна
  if (closeLoginButton && loginModal) {
    closeLoginButton.addEventListener('click', function() {
      // Используем классы вместо aria-hidden для лучшей доступности
      loginModal.classList.remove('active');
      document.body.style.overflow = '';
      
      // Удаляем атрибут aria-hidden, если он был установлен
      if (loginModal.hasAttribute('aria-hidden')) {
        loginModal.removeAttribute('aria-hidden');
      }
    });
  }
  
  // Закрытие модального окна по клику вне его содержимого
  window.addEventListener('click', function(e) {
    if (e.target === loginModal) {
      // Используем классы вместо aria-hidden для лучшей доступности
      loginModal.classList.remove('active');
      document.body.style.overflow = '';
      
      // Удаляем атрибут aria-hidden, если он был установлен
      if (loginModal.hasAttribute('aria-hidden')) {
        loginModal.removeAttribute('aria-hidden');
      }
    }
  });
  
  // Переключение между формами
  if (showRegisterFormButton) {
    showRegisterFormButton.addEventListener('click', function(e) {
      e.preventDefault();
      showForm('register');
    });
  }
  
  if (showLoginFormButton) {
    showLoginFormButton.addEventListener('click', function(e) {
      e.preventDefault();
      showForm('login');
    });
  }
  
  if (forgotPasswordButton) {
    forgotPasswordButton.addEventListener('click', function(e) {
      e.preventDefault();
      showForm('forgot');
    });
  }
  
  if (backToLoginButton) {
    backToLoginButton.addEventListener('click', function(e) {
      e.preventDefault();
      showForm('login');
    });
  }
  
  // Функция для отображения нужной формы
  function showForm(formType) {
    if (loginForm) loginForm.style.display = formType === 'login' ? 'block' : 'none';
    if (registerForm) registerForm.style.display = formType === 'register' ? 'block' : 'none';
    if (forgotPasswordForm) forgotPasswordForm.style.display = formType === 'forgot' ? 'block' : 'none';
    
    // Для анимации повторно применить CSS классы
    if (formType === 'login' && loginForm) {
      refreshFormAnimation(loginForm);
    } else if (formType === 'register' && registerForm) {
      refreshFormAnimation(registerForm);
    } else if (formType === 'forgot' && forgotPasswordForm) {
      refreshFormAnimation(forgotPasswordForm);
    }
  }
  
  // Функция для повторного запуска анимации формы
  function refreshFormAnimation(form) {
    const formGroups = form.querySelectorAll('.form-group');
    const formActions = form.querySelector('.form-actions');
    const loginOption = form.querySelector('.login-option');
    
    // Удалить и снова применить анимацию для полей формы
    formGroups.forEach((group, index) => {
      group.style.animation = 'none';
      group.offsetHeight; // Триггер перерисовки
      group.style.animation = `formFieldAppear 0.5s forwards ${index * 0.1}s`;
    });
    
    if (formActions) {
      formActions.style.animation = 'none';
      formActions.offsetHeight;
      formActions.style.animation = `formFieldAppear 0.5s forwards ${formGroups.length * 0.1}s`;
    }
    
    if (loginOption) {
      loginOption.style.animation = 'none';
      loginOption.offsetHeight;
      loginOption.style.animation = `formFieldAppear 0.5s forwards ${(formGroups.length * 0.1) + 0.1}s`;
    }
  }
  
  // Обработка отправки формы входа
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      
      // Показываем анимацию загрузки на кнопке
      const submitBtn = this.querySelector('.btn-login');
      // Проверяем, что submitBtn не null перед обращением к textContent
      if (!submitBtn) {
        console.error('Кнопка входа не найдена в форме');
        return;
      }
      const originalText = submitBtn.textContent || 'Вход';
      submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Вход...';
      submitBtn.disabled = true;
      
      // Имитация сетевого запроса
      setTimeout(() => {
        // Проверяем существует ли пользователь с таким email и паролем
        const user = registeredUsers.find(u => 
          u.email.toLowerCase() === email.toLowerCase() && 
          u.password === password
        );
        
        if (!user) {
          // Неверные учетные данные
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
          
          // Воспроизводим звук ошибки
          if (window.settingsModule && typeof window.settingsModule.playSound === 'function') {
            window.settingsModule.playSound('error');
          }
          
          showNotification('Неверный email или пароль', 'error');
          return;
        }
        
        // Обновляем данные текущего пользователя
        const userData = { 
          name: user.name, 
          email: user.email,
          loggedIn: true,
          registrationDate: user.registrationDate || new Date().toISOString(),
          orders: user.orders || []
        };
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Сбрасываем состояние кнопки
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Воспроизводим звук успеха
        if (window.settingsModule && typeof window.settingsModule.playSound === 'function') {
          window.settingsModule.playSound('success');
        }
        
        // Анимация успешного входа
        loginModal.classList.add('success-login');
        
        // Добавляем эффект пульсации на форме
        const formElement = loginForm.parentElement;
        formElement.classList.add('form-success-animation');
        
        // Создаем эффект частиц успеха
        createSuccessParticles();
        
        // Закрываем модальное окно с задержкой и обновляем UI
        setTimeout(() => {
          // Используем inert вместо aria-hidden
          if (loginModal.hasAttribute('aria-hidden')) {
            loginModal.removeAttribute('aria-hidden');
          }
          // Скрываем модальное окно стандартным способом
          loginModal.classList.remove('active');
          loginModal.classList.remove('success-login');
          formElement.classList.remove('form-success-animation');
          
          // Обновить UI после входа
          updateUIAfterLogin(user.name);
          
          // Показываем красивое уведомление
          showNotification('Вы успешно вошли в систему', 'success');
        }, 1200);
      }, 1000);
    });
  }
  
  // Обработка отправки формы регистрации
  if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const name = document.getElementById('registerName').value;
      const email = document.getElementById('registerEmail').value;
      const password = document.getElementById('registerPassword').value;
      const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
      
      // Показываем анимацию загрузки на кнопке
      const submitBtn = this.querySelector('button[type="submit"]');
      if (!submitBtn) {
        showNotification('Ошибка формы: кнопка отправки не найдена', 'error');
        return;
      }
      const originalText = submitBtn.textContent;
      submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Регистрация...';
      submitBtn.disabled = true;
      
      // Валидация паролей
      if (password !== passwordConfirm) {
        // Сбрасываем состояние кнопки
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        showNotification('Пароли не совпадают', 'error');
        return;
      }
      
      // Проверяем, существует ли уже пользователь с таким email
      const existingUser = registeredUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Показываем уведомление и предлагаем войти
        showNotification('Пользователь с таким email уже существует. Используйте форму входа.', 'warning');
        
        // Переключаемся на форму входа
        const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
        if (loginTab) {
          loginTab.click();
        }
        
        // Заполняем email в форме входа
        const loginEmail = document.getElementById('loginEmail');
        if (loginEmail) {
          loginEmail.value = email;
        }
        
        return;
      }
      
      // Получаем IP пользователя
      const userIP = await getUserIP();
      
      // Имитация сетевого запроса
      setTimeout(() => {
        // Сохраняем нового пользователя
        const newUser = { 
          name, 
          email, 
          password, // В реальной системе пароль должен быть захеширован!
          ip: userIP,
          registrationDate: new Date().toISOString()
        };
        
        // Добавляем в массив и сохраняем в localStorage
        registeredUsers.push(newUser);
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
        
        // Сохраняем данные текущего пользователя
        const userData = { 
          name, 
          email,
          loggedIn: true,
          registrationDate: newUser.registrationDate,
          orders: []
        };
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Сбрасываем состояние кнопки
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Анимация успешной регистрации
        loginModal.classList.add('success-login');
        
        // Добавляем эффект пульсации на форме
        const formElement = registerForm.parentElement;
        formElement.classList.add('form-success-animation');
        
        // Создаем эффект частиц успеха с другими цветами
        createSuccessParticles(['#4ade80', '#3b82f6', '#8b5cf6', '#f472b6', '#60a5fa']);
        
        // Закрываем модальное окно с задержкой и обновляем UI
        setTimeout(() => {
          // Используем inert вместо aria-hidden
          if (loginModal.hasAttribute('aria-hidden')) {
            loginModal.removeAttribute('aria-hidden');
          }
          // Скрываем модальное окно стандартным способом
          loginModal.classList.remove('active');
          loginModal.classList.remove('success-login');
          formElement.classList.remove('form-success-animation');
          
          // Обновить UI после регистрации
          updateUIAfterLogin(name);
          
          // Показываем красивое уведомление
          showNotification('Вы успешно зарегистрировались!', 'success');
        }, 1200);
      }, 1000);
    });
  }
  
  // Обработка формы восстановления пароля
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = document.getElementById('forgotEmail').value;
      
      // Здесь будет логика восстановления пароля
      console.log('Восстановление пароля:', { email });
      
      // Пример успешной отправки
      showNotification('Инструкции по восстановлению пароля отправлены на ваш email', 'success');
      
      // Используем классы вместо aria-hidden для лучшей доступности
      loginModal.classList.remove('active');
      document.body.style.overflow = '';
      
      // Удаляем атрибут aria-hidden, если он был установлен
      if (loginModal.hasAttribute('aria-hidden')) {
        loginModal.removeAttribute('aria-hidden');
      }
    });
  }
  
  // Функция обновления UI после авторизации
  function updateUIAfterLogin(userName) {
    // Изменяем иконку и стиль кнопки входа
    if (loginButton) {
      // Сохраняем информацию о пользователе
      localStorage.setItem('userLoggedIn', 'true');
      localStorage.setItem('userName', userName);
      
      // Обновляем UI
      loginButton.innerHTML = `<i class="fas fa-user-check"></i>`;
      loginButton.title = `Привет, ${userName}`;
      
      // Добавляем класс для стилизации авторизованного пользователя
      loginButton.classList.add('logged-in');
      
      // Добавляем обработчик для кнопки, который будет показывать меню пользователя
      loginButton.addEventListener('click', function() {
        // Проверяем существование элемента .island и его видимость
        const islandElement = document.querySelector('.island');
        const isIslandVisible = islandElement && 
                               (islandElement.style.visibility !== 'hidden' && 
                                islandElement.style.opacity !== '0');
        
        // Проверяем, открыто ли модальное окно профиля
        const profileModal = document.querySelector('.modal-profile');
        const isProfileModalOpen = profileModal && !profileModal.hasAttribute('inert');
        
        // Если модальное окно профиля открыто, закрываем его
        if (isProfileModalOpen) {
          profileModal.className = 'modal-profile'; // Сбрасываем класс, чтобы закрыть
          
          // Восстанавливаем видимость island при закрытии модального окна
          if (islandElement) {
            islandElement.style.visibility = '';
            islandElement.style.opacity = '';
            islandElement.style.transform = '';
          }
          return;
        }
        
        // Если модальное окно профиля не открыто, показываем меню пользователя
        const userMenu = createUserMenu();
        
        // Используем классы вместо aria-hidden для лучшей доступности
        const isMenuHidden = !userMenu.classList.contains('visible');
        if (isMenuHidden) {
            userMenu.classList.add('visible');
        } else {
            userMenu.classList.remove('visible');
        }
        
        // Удаляем атрибут aria-hidden, если он был установлен
        if (userMenu.hasAttribute('aria-hidden')) {
            userMenu.removeAttribute('aria-hidden');
        }
        
        // Добавляем обработчик для закрытия меню при клике вне его
        if (userMenu.classList.contains('visible')) {
          setTimeout(() => {
            document.addEventListener('click', closeUserMenuOutside);
          }, 0);
        } else {
          document.removeEventListener('click', closeUserMenuOutside);
        }
      });
    }
  }
  
  // Функция для показа модального окна входа
  function showLoginModal() {
    // Проверяем, нет ли уже открытого модального окна
    const isModalAlreadyOpen = document.querySelector('.auth-modal.active') || 
                              document.querySelector('.modal-checkout[aria-hidden="false"]');
    
    if (isModalAlreadyOpen) {
      console.log('Another modal is already open, delaying login modal');
      setTimeout(() => showLoginModal(), 500);
      return;
    }
    
    const authModal = document.querySelector('.auth-modal');
    if (!authModal) return;
    
    // Предотвращаем множественные вызовы
    if (window._loginModalOpening) return;
    window._loginModalOpening = true;
    
    // Задержка для гарантии успешного завершения предыдущих анимаций
    setTimeout(() => {
      authModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Reset forms
      const forms = document.querySelectorAll('.auth-form');
      forms.forEach(form => {
        form.reset();
        const formGroups = form.querySelectorAll('.form-group');
        formGroups.forEach(group => group.classList.remove('error'));
      });
      
      // Show login form by default
      const tabs = document.querySelectorAll('.auth-tab');
      tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === 'login') {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
      
      const loginForm = document.getElementById('loginForm');
      const registerForm = document.getElementById('registerForm');
      const forgotPasswordForm = document.getElementById('forgotPasswordForm');
      const successScreen = document.querySelector('.auth-success');
      
      if (loginForm) loginForm.classList.add('active');
      if (registerForm) registerForm.classList.remove('active');
      if (forgotPasswordForm) forgotPasswordForm.classList.remove('active');
      if (successScreen) successScreen.style.display = 'none';
      
      // Задержка перед созданием интерактивного фона, чтобы снизить нагрузку
      setTimeout(() => {
        // Генерация интерактивного фона
        createInteractiveBackground();
        // Сбрасываем флаг открытия
        window._loginModalOpening = false;
      }, 300);
    }, 100);
  }

  // Функция для создания интерактивного фона
  function createInteractiveBackground() {
    // Проверяем, не выполняется ли уже создание фона
    if (window._creatingInteractiveBackground) return;
    window._creatingInteractiveBackground = true;
    
    // Находим нужные элементы
    const background = document.querySelector('.animated-background');
    const diagonalLines = document.querySelector('.diagonal-lines');
    
    if (!background || !diagonalLines) {
      window._creatingInteractiveBackground = false;
      return;
    }
    
    // Очищаем контейнеры
    diagonalLines.innerHTML = '';
    
    // Снижаем количество элементов для оптимизации производительности
    
    // Создаем диагональные линии (снижено количество)
    const createLines = () => {
      // Создаем только 5 линий вместо 15
      for (let i = 0; i < 5; i++) {
        createDiagonalLine(diagonalLines);
      }
      
      // Создаем элегантные подчеркивания (снижено количество)
      setTimeout(() => {
        // Создаем только 2 подчеркивания вместо 6
        for (let i = 0; i < 2; i++) {
          createElegantUnderline(background);
        }
        
        // Создаем минималистичные круги с задержкой
        setTimeout(() => {
          // Создаем только 2 круга вместо 4
          for (let i = 0; i < 2; i++) {
            createMinimalCircle(background);
          }
          
          // Создаем акцентные точки с задержкой (снижено количество)
          setTimeout(() => {
            // Создаем только 8 точек вместо 25
            for (let i = 0; i < 8; i++) {
              createAccentDot(background);
            }
            
            // Создаем элемент фокуса для дополнительного эффекта динамичности
            setTimeout(() => {
              const focusElement = document.querySelector('.focus-element');
              if (focusElement) {
                animateFocusElementColor(focusElement);
              }
              window._creatingInteractiveBackground = false;
            }, 100);
          }, 100);
        }, 100);
      }, 100);
    };
    
    // Запускаем процесс создания элементов с небольшой задержкой
    setTimeout(createLines, 100);
  }

  // Функция анимации цвета для элемента фокуса
  function animateFocusElementColor(element) {
    const transitionDuration = 10000; // 10 секунд
    const colors = getSiteColorPalette();
    let currentIndex = 0;
    
    // Начальные стили
    element.style.background = `radial-gradient(circle, ${colors[0].replace('0.8', '0.05')} 0%, rgba(255,255,255,0) 70%)`;
    
    // Функция для циклической смены цвета
    function cycleColors() {
      currentIndex = (currentIndex + 1) % colors.length;
      const newColor = colors[currentIndex].replace('0.8', '0.05'); // Уменьшаем непрозрачность для радиального градиента
      
      element.style.transition = `background ${transitionDuration/2}ms ease-in-out`;
      element.style.background = `radial-gradient(circle, ${newColor} 0%, rgba(255,255,255,0) 70%)`;
      
      setTimeout(cycleColors, transitionDuration);
    }
    
    // Запускаем анимацию
    setTimeout(cycleColors, transitionDuration);
  }

  // Function to get site color palette
  function getSiteColorPalette() {
    return [
      'rgba(188, 184, 138, 0.8)', // --primary-color
      'rgba(201, 137, 123, 0.8)', // --primary-light
      'rgba(163, 158, 118, 0.8)', // --primary-dark
      'rgba(188, 184, 138, 0.5)',
      'rgba(201, 137, 123, 0.5)',
      'rgba(163, 158, 118, 0.5)',
      'rgba(255, 255, 255, 0.2)'
    ];
  }

  // Function to get a random color from the palette
  function getRandomColor() {
    const colors = getSiteColorPalette();
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Function to cycle to next color in the palette
  function getNextColor(currentColor) {
    const colors = getSiteColorPalette();
    const currentIndex = colors.indexOf(currentColor);
    const nextIndex = (currentIndex + 1) % colors.length;
    return colors[nextIndex] || colors[0]; // Fallback to first color if not found
  }

  function createDiagonalLine(container) {
    const line = document.createElement('div');
    line.className = 'diagonal-line';
    
    // Случайное положение
    line.style.left = (Math.random() * 120 - 10) + '%';
    
    // Устанавливаем исходный цвет из палитры
    line.style.backgroundColor = getRandomColor();
    
    // Добавляем в контейнер
    container.appendChild(line);
    
    // Инициируем циклическую смену цветов
    cycleDiagonalLineColor(line);
  }

  // Функция для циклической смены цветов диагональной линии
  function cycleDiagonalLineColor(line) {
    const transitionDuration = 5000 + Math.random() * 10000; // 5-15 сек
    
    setTimeout(() => {
      // Плавная смена цвета
      line.style.transition = `background-color ${transitionDuration/2}ms ease-in-out`;
      line.style.backgroundColor = getRandomColor();
      
      // Продолжаем цикл
      setTimeout(() => {
        cycleDiagonalLineColor(line);
      }, transitionDuration);
    }, transitionDuration/2);
  }

  // Функция создания минималистичного круга
  function createMinimalCircle(container) {
    const circle = document.createElement('div');
    circle.className = 'minimal-circle';
    
    // Случайное положение
    circle.style.left = (Math.random() * 100) + '%';
    circle.style.top = (Math.random() * 100) + '%';
    
    // Случайный размер
    const size = 120 + Math.random() * 100;
    circle.style.width = size + 'px';
    circle.style.height = size + 'px';
    
    // Цвет из палитры
    circle.style.borderColor = getRandomColor();
    
    // Начальная прозрачность
    circle.style.opacity = '0';
    
    // Добавляем в контейнер
    container.appendChild(circle);
    
    // Запускаем анимацию
    animateMinimalCircle(circle);
  }

  // Функция анимации минималистичного круга
  function animateMinimalCircle(circle) {
    // Параметры анимации
    const duration = 12000 + Math.random() * 8000;
    const delay = Math.random() * 5000;
    
    setTimeout(() => {
      circle.style.transition = `opacity ${duration * 0.3}ms ease-in-out, transform ${duration}ms ease-in-out, border-color ${duration * 0.5}ms ease-in-out`;
      circle.style.opacity = '1';
      circle.style.transform = 'scale(1.05)';
      
      // Меняем цвет во время анимации
      setTimeout(() => {
        circle.style.borderColor = getRandomColor();
      }, duration * 0.4);
      
      setTimeout(() => {
        circle.style.opacity = '0';
        
        // После завершения, перезапускаем
        setTimeout(() => {
          // Новая позиция и размер
          circle.style.transition = 'none';
          circle.style.transform = 'scale(0.95)';
          const size = 120 + Math.random() * 100;
          circle.style.width = size + 'px';
          circle.style.height = size + 'px';
          circle.style.left = (Math.random() * 100) + '%';
          circle.style.top = (Math.random() * 100) + '%';
          
          // Новый цвет
          circle.style.borderColor = getRandomColor();
          
          // Перезапускаем анимацию
          animateMinimalCircle(circle);
        }, duration * 0.3);
      }, duration * 0.7);
    }, delay);
  }

  // Функция создания акцентной точки
  function createAccentDot(container) {
    const dot = document.createElement('div');
    dot.className = 'accent-dot';
    
    // Случайное положение
    dot.style.left = (Math.random() * 100) + '%';
    dot.style.top = (Math.random() * 100) + '%';
    
    // Случайный цвет из палитры
    dot.style.backgroundColor = getRandomColor();
    
    // Анимация смены цвета
    animateAccentDotColor(dot);
    
    // Добавляем в контейнер
    container.appendChild(dot);
  }

  // Функция анимации цвета акцентной точки
  function animateAccentDotColor(dot) {
    const transitionDuration = 8000 + Math.random() * 7000;
    
    setTimeout(() => {
      dot.style.transition = `background-color ${transitionDuration/2}ms ease-in-out`;
      dot.style.backgroundColor = getRandomColor();
      
      // Продолжаем цикл
      setTimeout(() => {
        animateAccentDotColor(dot);
      }, transitionDuration);
    }, transitionDuration/2);
  }

  // Удаляем существующее меню пользователя, если оно есть
  function deleteUserMenu() {
    console.log('desktop.js: deleteUserMenu вызвана');
    
    // Находим меню пользователя
    const userMenu = document.getElementById('userMenu');
    
    // Проверяем, не является ли это меню из login-system.js, которое не нужно удалять
    if (userMenu && userMenu.hasAttribute('data-login-system-menu')) {
        console.log('desktop.js: попытка удалить защищенное меню из login-system.js, пропускаем');
        return;
    }
    
    // Удаляем меню, если оно существует
    if (userMenu) {
        console.log('desktop.js: удаляем стандартное меню пользователя');
        userMenu.parentNode.removeChild(userMenu);
    }
    
    // Удаляем обработчик клика для закрытия меню
    document.removeEventListener('click', closeUserMenuOutside);
  }

  // Настраиваем MutationObserver для автоматического удаления userMenu
  const menuObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Проверяем, не был ли добавлен userMenu
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          if (node.nodeType === 1) { // Это элемент DOM
            // Если у элемента есть атрибут data-login-system-menu, пропускаем его полностью
            if (node.hasAttribute && node.hasAttribute('data-login-system-menu')) {
              console.log('Обнаружено доверенное меню пользователя, пропускаем');
              continue;
            }
            
            // Проверяем, не является ли это элементом userMenu
            if ((node.id === 'userMenu' || node.classList.contains('user-menu')) && 
                !node.hasAttribute('data-login-system-menu')) {
              console.log('Обнаружено автоматическое добавление меню пользователя, удаляем');
              node.remove();
            }
            
            // Проверяем внутренние элементы на наличие userMenu
            const innerMenus = node.querySelectorAll('#userMenu, .user-menu:not([data-login-system-menu])');
            if (innerMenus.length > 0) {
              console.log('Обнаружены вложенные элементы меню пользователя, удаляем');
              innerMenus.forEach(menu => menu.remove());
            }
          }
        }
      }
    });
  });

  // Начинаем наблюдение за изменениями в DOM
  menuObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Глобальная функция для временного отключения обсервера меню
  window.disableMenuObserver = function() {
    console.log('Отключаем menuObserver');
    if (menuObserver) {
      menuObserver.disconnect();
      return menuObserver;
    }
    return null;
  };

  // Глобальная функция для повторного включения обсервера меню
  window.enableMenuObserver = function(observer) {
    console.log('Включаем menuObserver снова');
    if (observer) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  };

  // Вызываем функцию удаления меню при загрузке страницы
  deleteUserMenu();

  // Функция для отображения профиля пользователя
  function showProfileModal() {
    // Проверяем, есть ли уже функция в глобальном контексте, 
    // которая не является текущей функцией
    if (typeof window.showProfileModal === 'function' && window.showProfileModal !== showProfileModal) {
      window.showProfileModal();
      return;
    }
    
    // Получаем данные пользователя
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (!userData.name || !userData.email) {
      showNotification('Ошибка загрузки данных профиля', 'error');
      return;
    }
    
    // Проверяем, существует ли модальное окно
    let profileModal = document.querySelector('.modal-profile');
    if (profileModal) {
      profileModal.remove();
    }
    
    // Создаем модальное окно профиля
    profileModal = document.createElement('div');
    profileModal.className = 'modal-profile';
    // Replace aria-hidden with inert attribute
    profileModal.removeAttribute('aria-hidden');
    
    // Скрываем island при открытии модального окна
    const islandElement = document.querySelector('.island');
    if (islandElement) {
      islandElement.style.visibility = 'hidden';
      islandElement.style.opacity = '0';
      islandElement.style.transform = 'translateY(100px) translateX(-50%)';
    }
    
    // Определяем доступные данные профиля
    let dateRegistered = 'Информация недоступна';
    if (userData.registrationDate) {
      try {
        const registrationDate = new Date(userData.registrationDate);
        // Проверяем валидность даты
        if (!isNaN(registrationDate.getTime())) {
          dateRegistered = registrationDate.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        }
      } catch (e) {
        console.error('Ошибка при форматировании даты регистрации', e);
      }
    }
    
    // Получаем заказы пользователя
    const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    const userOrders = orderHistory.filter(order => order.userEmail === userData.email);
    let orderCount = userOrders.length;
    
    // Формируем содержимое вкладки заказов
    let ordersTabContent = '';
    if (userOrders.length === 0) {
      ordersTabContent = `
        <div class="orders-empty">
          <i class="fas fa-shopping-bag"></i>
          <h3>У вас пока нет заказов</h3>
          <p>После оформления заказы будут отображаться здесь</p>
          <button class="btn-start-shopping">Начать покупки</button>
        </div>
      `;
    } else {
      ordersTabContent = `
        <div class="orders-list">
          ${userOrders.map(order => `
            <div class="order-item">
              <div class="order-header">
                <div class="order-id">Заказ #${order.id}</div>
                <div class="order-date">${order.date}</div>
                <div class="order-status">Выполнен</div>
              </div>
              <div class="order-details">
                <div class="order-products">
                  <h4>Товары (${order.items.length})</h4>
                  <ul>
                    ${order.items.map(item => `
                      <li>
                        <img src="${item.image}" alt="${item.title}">
                        <div class="product-info">
                          <div class="product-title">${item.title}</div>
                          <div class="product-price">${item.price} ₽</div>
                        </div>
                      </li>
                    `).join('')}
                  </ul>
                </div>
                <div class="order-info">
                  <div class="order-total">
                    <strong>Итого:</strong> ${order.total} ₽
                  </div>
                  <div class="order-delivery">
                    <strong>Адрес доставки:</strong><br>${order.address}
                  </div>
                  <div class="order-contact">
                    <div><strong>Имя:</strong> ${order.name}</div>
                    <div><strong>Телефон:</strong> ${order.phone}</div>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    // Создаем содержимое модального окна
    profileModal.innerHTML = `
      <div class="modal-profile__content">
        <button class="modal-profile__close-top" title="Закрыть"><i class="fas fa-times"></i></button>
        <div class="profile-content">
          <h2 class="modal-profile__title">Профиль пользователя</h2>
          
          <div class="profile-header">
            <div class="profile-avatar">
              <i class="fas fa-user"></i>
              <div class="avatar-change" title="Изменить аватар">
                <i class="fas fa-camera"></i>
              </div>
            </div>
            <div class="profile-status">
              <div class="status-badge status-vip">VIP-пользователь</div>
              <div class="loyalty-progress">
                <div class="loyalty-bar">
                  <div class="loyalty-fill" style="width: 65%;"></div>
                </div>
                <div class="loyalty-text">Программа лояльности: 65/100</div>
              </div>
            </div>
          </div>
          
          <div class="profile-tabs">
            <button class="profile-tab active" data-tab="info">Информация</button>
            <button class="profile-tab" data-tab="orders">Заказы</button>
            <button class="profile-tab" data-tab="wishlist">Избранное</button>
          </div>
          
          <div class="profile-tab-content active" data-tab-content="info">
            <div class="profile-info">
              <div class="profile-field">
                <div class="profile-label">Имя</div>
                <div class="profile-value">${userData.name}</div>
                <button class="profile-edit-btn" data-field="name">
                  <i class="fas fa-pencil-alt"></i>
                </button>
              </div>
              <div class="profile-field">
                <div class="profile-label">Email</div>
                <div class="profile-value">${userData.email}</div>
                <button class="profile-edit-btn" data-field="email">
                  <i class="fas fa-pencil-alt"></i>
                </button>
              </div>
              <div class="profile-field">
                <div class="profile-label">Телефон</div>
                <div class="profile-value">${userData.phone || 'Не указан'}</div>
                <button class="profile-edit-btn" data-field="phone">
                  <i class="fas fa-pencil-alt"></i>
                </button>
              </div>
              <div class="profile-field">
                <div class="profile-label">Дата регистрации</div>
                <div class="profile-value">${dateRegistered}</div>
              </div>
              <div class="profile-field">
                <div class="profile-label">Количество заказов</div>
                <div class="profile-value">${orderCount}</div>
              </div>
            </div>
          </div>
          
          <div class="profile-tab-content" data-tab-content="orders">
            ${ordersTabContent}
          </div>
          
          <div class="profile-tab-content" data-tab-content="wishlist">
            <div class="wishlist-empty">
              <i class="fas fa-heart"></i>
              <h3>Ваш список избранного пуст</h3>
              <p>Добавляйте понравившиеся товары в избранное</p>
              <button class="btn-browse-catalog">Смотреть каталог</button>
            </div>
          </div>
          
          <div class="profile-actions">
            <button class="modal-profile__edit">
              <i class="fas fa-user-edit"></i>
              Редактировать профиль
            </button>
            <button class="modal-profile__close">
              <i class="fas fa-times"></i>
              Закрыть
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Добавляем модальное окно в документ
    document.body.appendChild(profileModal);
    
    // Обработчик закрытия модального окна
    const closeButtons = profileModal.querySelectorAll('.modal-profile__close, .modal-profile__close-top');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove focus from any elements inside the modal before hiding it
        document.activeElement.blur();
        
        // Add inert attribute instead of aria-hidden
        profileModal.setAttribute('inert', '');
        
        // Show island again
        const islandElement = document.querySelector('.island');
        if (islandElement) {
          islandElement.style.visibility = 'visible';
          islandElement.style.opacity = '1';
          islandElement.style.transform = 'translateY(0) translateX(-50%)';
        }
        
        setTimeout(() => {
          profileModal.remove();
        }, 300);
      });
    });
    
    // Обработчик переключения вкладок
    const profileTabs = profileModal.querySelectorAll('.profile-tab');
    profileTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        
        // Снимаем активность со всех вкладок и контентов
        profileTabs.forEach(t => t.classList.remove('active'));
        const tabContents = profileModal.querySelectorAll('.profile-tab-content');
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Устанавливаем активность для выбранной вкладки и контента
        this.classList.add('active');
        const activeContent = profileModal.querySelector(`.profile-tab-content[data-tab-content="${tabId}"]`);
        if (activeContent) {
          activeContent.classList.add('active');
        }
        
        // Если выбрана вкладка заказов, добавляем кнопке обработчик
        if (tabId === 'orders') {
          const btnStartShopping = profileModal.querySelector('.btn-start-shopping');
          if (btnStartShopping) {
            btnStartShopping.addEventListener('click', function() {
              // Закрываем модальное окно профиля
              profileModal.setAttribute('inert', '');
              
              // Show island again
              const islandElement = document.querySelector('.island');
              if (islandElement) {
                islandElement.style.visibility = 'visible';
                islandElement.style.opacity = '1';
                islandElement.style.transform = 'translateY(0) translateX(-50%)';
              }
              
              setTimeout(() => {
                profileModal.remove();
              }, 300);
            });
          }
        }
      });
    });
    
    // Обработчик редактирования полей
    const editButtons = profileModal.querySelectorAll('.profile-edit-btn');
    editButtons.forEach(button => {
      button.addEventListener('click', function() {
        const field = this.getAttribute('data-field');
        const fieldContainer = this.closest('.profile-field');
        const valueElement = fieldContainer.querySelector('.profile-value');
        const currentValue = valueElement.textContent;
        
        // Создаем поле ввода
        valueElement.innerHTML = `
          <div class="edit-field-container">
            <input type="text" class="edit-field-input" value="${currentValue === 'Не указан' ? '' : currentValue}" placeholder="${field === 'phone' ? '+7 (___) ___-__-__' : 'Введите значение'}">
            <div class="edit-field-actions">
              <button class="edit-field-save" data-field="${field}"><i class="fas fa-check"></i></button>
              <button class="edit-field-cancel"><i class="fas fa-times"></i></button>
            </div>
          </div>
        `;
        
        // Скрываем кнопку редактирования
        this.style.display = 'none';
        
        // Обработчик сохранения
        const saveButton = valueElement.querySelector('.edit-field-save');
        saveButton.addEventListener('click', function() {
          const inputValue = valueElement.querySelector('.edit-field-input').value.trim();
          const fieldName = this.getAttribute('data-field');
          
          // Простая валидация
          if (fieldName === 'email' && !validateEmail(inputValue)) {
            showNotification('Введите корректный email', 'error');
            return;
          } else if (fieldName === 'phone' && inputValue && !validatePhone(inputValue)) {
            showNotification('Введите корректный номер телефона', 'error');
            return;
          } else if (fieldName === 'name' && !inputValue) {
            showNotification('Имя не может быть пустым', 'error');
            return;
          }
          
          // Обновляем данные пользователя
          userData[fieldName] = inputValue || (fieldName === 'phone' ? 'Не указан' : '');
          localStorage.setItem('userData', JSON.stringify(userData));
          
          // Обновляем отображение
          valueElement.textContent = inputValue || (fieldName === 'phone' ? 'Не указан' : '');
          button.style.display = '';
          
          showNotification('Данные успешно обновлены', 'success');
        });
        
        // Обработчик отмены
        const cancelButton = valueElement.querySelector('.edit-field-cancel');
        cancelButton.addEventListener('click', function() {
          valueElement.textContent = currentValue;
          button.style.display = '';
        });
        
        // Фокус на поле ввода
        const input = valueElement.querySelector('.edit-field-input');
        input.focus();
      });
    });
    
    // Обработчик редактирования всего профиля
    const editProfileButton = profileModal.querySelector('.modal-profile__edit');
    if (editProfileButton) {
      editProfileButton.addEventListener('click', function() {
        // Активируем вкладку информации
        profileTabs.forEach(t => {
          if (t.getAttribute('data-tab') === 'info') {
            t.click();
          }
        });
        
        // Активируем все поля для редактирования
        const editButtons = profileModal.querySelectorAll('.profile-edit-btn');
        editButtons.forEach(btn => {
          if (btn.style.display !== 'none') {
            btn.click();
          }
        });
      });
    }
    
    // Обработчик нажатия кнопок действия
    const actionButtons = profileModal.querySelectorAll('.btn-start-shopping, .btn-browse-catalog');
    actionButtons.forEach(button => {
      button.addEventListener('click', function() {
        profileModal.setAttribute('inert', '');
        setTimeout(() => {
          profileModal.remove();
        }, 300);
        
        showNotification('Переход в каталог товаров', 'info');
      });
    });
  }
  
  // Вспомогательная функция для валидации email
  function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }
  
  // Вспомогательная функция для валидации телефона
  function validatePhone(phone) {
    // Базовая валидация российского номера телефона
    const re = /^(\+7|8)[- ]?\(?[0-9]{3}\)?[- ]?[0-9]{3}[- ]?[0-9]{2}[- ]?[0-9]{2}$/;
    return re.test(String(phone));
  }
  
  // Закрытие меню пользователя при клике вне его
  function closeUserMenuOutside(e) {
    const userMenu = document.getElementById('userMenu');
    const loginButton = document.getElementById('loginButton');
    
    if (userMenu && !userMenu.contains(e.target) && !loginButton.contains(e.target)) {
      // Используем классы вместо aria-hidden для лучшей доступности
      userMenu.classList.remove('visible');
      
      // Удаляем атрибут aria-hidden, если он был установлен
      if (userMenu.hasAttribute('aria-hidden')) {
        userMenu.removeAttribute('aria-hidden');
      }
      
      document.removeEventListener('click', closeUserMenuOutside);
    }
  }
  
  // Обработчик действий в меню пользователя
  function handleUserMenuAction(e) {
    const action = e.currentTarget.getAttribute('data-action');
    const userMenu = document.getElementById('userMenu');
    
    if (userMenu) {
      // Используем классы вместо aria-hidden для лучшей доступности
      userMenu.classList.remove('visible');
      
      // Удаляем атрибут aria-hidden, если он был установлен
      if (userMenu.hasAttribute('aria-hidden')) {
        userMenu.removeAttribute('aria-hidden');
      }
    }
    
    switch (action) {
      case 'logout':
        logoutUser();
        break;
      case 'profile':
        showProfileModal();
        break;
      case 'orders':
        showOrdersModal();
        break;
      case 'settings':
        showSettingsModal();
        break;
    }
  }
  
  // Создаем меню пользователя
  function createUserMenu() {
    console.log('desktop.js: createUserMenu вызвана');
    
    // Если уже существует меню из login-system.js, не создаем новое
    const loginSystemMenu = document.getElementById('userProfileMenu');
    if (loginSystemMenu) {
        console.log('desktop.js: найдено меню userProfileMenu из login-system.js, прерываем создание нового меню');
        return;
    }
    
    // Удаляем любое существующее меню
    deleteUserMenu();
    
    // Проверяем, существует ли уже меню
    let userMenu = document.getElementById('userMenu');
    if (userMenu) return userMenu;
    
    // Создаем элемент меню
    userMenu = document.createElement('div');
    userMenu.id = 'userMenu';
    userMenu.className = 'user-menu';
    // Не используем aria-hidden для лучшей доступности
    
    const userName = localStorage.getItem('userName') || 'Пользователь';
    
    userMenu.innerHTML = `
      <div class="user-menu__header">
        <div class="user-menu__avatar">
          <i class="fas fa-user"></i>
        </div>
        <div class="user-menu__info">
          <div class="user-menu__name">${userName}</div>
          <div class="user-menu__status">Онлайн</div>
        </div>
      </div>
      <ul class="user-menu__items">
        <li class="user-menu__item" data-action="profile">
          <i class="fas fa-id-card"></i>
          <span>Мой профиль</span>
        </li>
        <li class="user-menu__item" data-action="orders">
          <i class="fas fa-shopping-bag"></i>
          <span>Мои заказы</span>
        </li>
        <li class="user-menu__item" data-action="settings">
          <i class="fas fa-cog"></i>
          <span>Настройки</span>
        </li>
        <li class="user-menu__item user-menu__item--logout" data-action="logout">
          <i class="fas fa-sign-out-alt"></i>
          <span>Выйти</span>
        </li>
      </ul>
    `;
    
    // Добавляем стили для меню пользователя
    if (!document.getElementById('user-menu-styles')) {
      const style = document.createElement('style');
      style.id = 'user-menu-styles';
      style.textContent = `
        .user-menu {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 250px;
          background: white;
          border-radius: 10px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.15);
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transform: translateY(10px);
          transition: all 0.3s ease;
          overflow: hidden;
        }
        
        .user-menu.visible {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        
        .user-menu__header {
          padding: 15px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid #eee;
          background: linear-gradient(135deg, #f5f5f5, #e5e5e5);
        }
        
        .user-menu__avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #BCB88A, #C9897B);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-right: 12px;
        }
        
        .user-menu__avatar i {
          font-size: 16px;
        }
        
        .user-menu__info {
          flex: 1;
        }
        
        .user-menu__name {
          font-weight: 600;
          color: #333;
          margin-bottom: 2px;
        }
        
        .user-menu__status {
          font-size: 0.8rem;
          color: #27ae60;
          display: flex;
          align-items: center;
        }
        
        .user-menu__status::before {
          content: '';
          display: inline-block;
          width: 8px;
          height: 8px;
          background: #27ae60;
          border-radius: 50%;
          margin-right: 5px;
        }
        
        .user-menu__items {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .user-menu__item {
          padding: 12px 15px;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        
        .user-menu__item:hover {
          background: #f5f5f5;
        }
        
        .user-menu__item i {
          margin-right: 12px;
          width: 20px;
          text-align: center;
          color: #666;
        }
        
        .user-menu__item span {
          color: #333;
        }
        
        .user-menu__item--logout {
          border-top: 1px solid #eee;
          margin-top: 5px;
        }
        
        .user-menu__item--logout i {
          color: #e74c3c;
        }
        
        body.dark .user-menu {
          background: #333;
          box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        }
        
        body.dark .user-menu__header {
          border-bottom: 1px solid #444;
          background: linear-gradient(135deg, #3a3a3a, #2a2a2a);
        }
        
        body.dark .user-menu__avatar {
          background: linear-gradient(135deg, #7A7866, #9A6E64);
        }
        
        body.dark .user-menu__name {
          color: #f0f0f0;
        }
        
        body.dark .user-menu__item:hover {
          background: #444;
        }
        
        body.dark .user-menu__item i {
          color: #aaa;
        }
        
        body.dark .user-menu__item span {
          color: #f0f0f0;
        }
        
        body.dark .user-menu__item--logout {
          border-top: 1px solid #444;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Добавляем меню в header или body
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
      headerActions.style.position = 'relative';  // Для корректного позиционирования
      headerActions.appendChild(userMenu);
    } else {
      document.body.appendChild(userMenu);
    }
    
    // Добавляем обработчики действий в меню
    const menuItems = userMenu.querySelectorAll('.user-menu__item');
    menuItems.forEach(item => {
      item.addEventListener('click', handleUserMenuAction);
    });
    
    return userMenu;
  }
  
  // Проверяем статус авторизации при загрузке
  function checkLoginStatus() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const loginButton = document.getElementById('loginButton');
    
    if (!loginButton) return;
    
    // Клонируем кнопку, чтобы удалить все слушатели событий
    const newButton = loginButton.cloneNode(true);
    loginButton.parentNode.replaceChild(newButton, loginButton);
    
    if (userData && userData.loggedIn && userData.name) {
      // Обновляем внешний вид кнопки авторизованного пользователя
      newButton.innerHTML = `<i class="fas fa-user-check"></i>`;
      newButton.title = `Привет, ${userData.name}`;
      newButton.classList.add('logged-in');
      
      // Устанавливаем обработчик для показа меню пользователя
      newButton.addEventListener('click', function() {
        const existingMenu = document.getElementById('userMenu');
        if (existingMenu) {
          // Используем классы вместо aria-hidden для лучшей доступности
          if (!existingMenu.classList.contains('visible')) {
            existingMenu.classList.add('visible');
            
            // Удаляем атрибут aria-hidden, если он был установлен
            if (existingMenu.hasAttribute('aria-hidden')) {
              existingMenu.removeAttribute('aria-hidden');
            }
            
            document.addEventListener('click', closeUserMenuOutside);
          } else {
            existingMenu.classList.remove('visible');
            document.removeEventListener('click', closeUserMenuOutside);
          }
        } else {
          const menu = createUserMenu();
          document.body.appendChild(menu);
          menu.classList.add('visible');
          
          // Обработчики для кнопок меню
          const menuItems = menu.querySelectorAll('.user-menu__item');
          menuItems.forEach(item => {
            item.addEventListener('click', handleUserMenuAction);
          });
          
          // Закрытие при клике вне меню
          document.addEventListener('click', closeUserMenuOutside);
        }
      });
    } else {
      // Обновляем внешний вид кнопки для неавторизованного пользователя
      newButton.innerHTML = '<i class="fas fa-user"></i>';
      newButton.title = 'Войти';
      newButton.classList.remove('logged-in');
      
      // Устанавливаем обработчик для показа формы входа
      newButton.addEventListener('click', showLoginModal);
    }
    
    // Удаляем меню пользователя, если пользователь не авторизован
    if (!userData || !userData.loggedIn) {
      deleteUserMenu();
    }
  }
  
  // Проверяем статус авторизации при загрузке страницы
  checkLoginStatus();

  // Функция создания элегантного подчеркивания
  function createElegantUnderline(container) {
    const underline = document.createElement('div');
    underline.className = 'elegant-underline';
    
    // Устанавливаем размеры и положение
    underline.style.width = '100%';
    underline.style.top = (20 + Math.random() * 60) + '%';
    underline.style.opacity = '0';
    
    // Устанавливаем исходный цвет из палитры
    const initialColor = getRandomColor();
    underline.style.background = `linear-gradient(90deg, 
      rgba(255,255,255,0) 0%, 
      ${initialColor} 50%, 
      rgba(255,255,255,0) 100%)`;
    
    // Добавляем анимацию появления/исчезновения
    animateElegantUnderline(underline);
    
    // Добавляем в контейнер
    container.appendChild(underline);
  }

  // Функция анимации элегантного подчеркивания
  function animateElegantUnderline(underline) {
    // Случайная задержка и продолжительность
    const duration = 6000 + Math.random() * 4000;
    const delay = Math.random() * 5000;
    
    setTimeout(() => {
      underline.style.transition = `opacity ${duration * 0.2}ms ease-in, transform ${duration}ms ease-out, background ${duration * 0.5}ms ease-in-out`;
      underline.style.opacity = '1';
      underline.style.transform = 'scaleX(1)';
      
      // Меняем цвет во время анимации
      setTimeout(() => {
        const newColor = getRandomColor();
        underline.style.background = `linear-gradient(90deg, 
          rgba(255,255,255,0) 0%, 
          ${newColor} 50%, 
          rgba(255,255,255,0) 100%)`;
      }, duration * 0.4);
      
      setTimeout(() => {
        underline.style.opacity = '0';
        
        // После завершения, запускаем снова
        setTimeout(() => {
          // Новая позиция
          underline.style.transition = 'none';
          underline.style.transform = 'scaleX(0)';
          underline.style.top = (20 + Math.random() * 60) + '%';
          
          // Новый цвет
          const newColor = getRandomColor();
          underline.style.background = `linear-gradient(90deg, 
            rgba(255,255,255,0) 0%, 
            ${newColor} 50%, 
            rgba(255,255,255,0) 100%)`;
          
          // Перезапускаем анимацию
          animateElegantUnderline(underline);
        }, duration * 0.2);
      }, duration * 0.8);
    }, delay);
  }

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

  // Функция для инициализации обработчика клавиатурных сочетаний
  function initKeyboardShortcuts() {
    let altPressed = false;
    let ctrlPressed = false;
    
    document.addEventListener('keydown', function(event) {
      // Проверяем именно левые Alt и Ctrl
      if (event.key === 'Alt' && event.location === 1) altPressed = true;
      if (event.key === 'Control' && event.location === 1) ctrlPressed = true;
      
      // Если нажаты обе клавиши
      if (altPressed && ctrlPressed) {
        // Ctrl+Alt+S - показать студийное сообщение
        if (event.key === 's' || event.key === 'S') {
          showStudioMessage();
          event.preventDefault();
        }
        
        // Ctrl+Alt+C - очистить localStorage
        if (event.key === 'c' || event.key === 'C') {
          clearLocalStorage();
          event.preventDefault();
        }
      }
    });
    
    document.addEventListener('keyup', function(event) {
      if (event.key === 'Alt') altPressed = false;
      if (event.key === 'Control') ctrlPressed = false;
    });
  }
  
  // Инициализируем обработчики клавиатурных сочетаний
  initKeyboardShortcuts();
  
  // Функция для отображения анимированного сообщения на весь экран
  function showStudioMessage() {
    // Создаем аудио элементы для звукового сопровождения
    let appearSound = null;
    let backgroundSound = null;
    
    // Создаем элементы только если пользователь уже взаимодействовал со страницей
    function prepareAudio() {
      if (!appearSound) {
        // Используем встроенные звуки браузера через AudioContext вместо внешних файлов
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          
          // Создаем приятный мелодичный звук появления
          appearSound = {
            play: function() {
              // Создаем основные ноты мажорного аккорда
              const notes = [523.25, 659.25, 783.99]; // До, Ми, Соль (C5, E5, G5)
              const masterGain = audioContext.createGain();
              masterGain.gain.value = 0.2; // Общая громкость ниже
              masterGain.connect(audioContext.destination);
              
              // Играем каждую ноту аккорда с небольшой задержкой
              notes.forEach((freq, index) => {
                setTimeout(() => {
                  const oscillator = audioContext.createOscillator();
                  const noteGain = audioContext.createGain();
                  
                  // Используем более мягкую форму волны
                  oscillator.type = 'sine';
                  oscillator.frequency.value = freq;
                  
                  // Настройка огибающей для мягкого звучания
                  noteGain.gain.setValueAtTime(0, audioContext.currentTime);
                  noteGain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.1);
                  noteGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1.2);
                  
                  oscillator.connect(noteGain);
                  noteGain.connect(masterGain);
                  
                  oscillator.start();
                  oscillator.stop(audioContext.currentTime + 1.5);
                }, index * 100);
              });
            }
          };
          
          // Создаем приятный фоновый звук в виде мягкой эмбиент мелодии
          backgroundSound = {
            oscillators: [],
            gains: [],
            audioContext: audioContext,
            playing: false,
            
            play: function() {
              if (this.playing) return;
              
              // Ноты мажорного аккорда с добавленными гармониками
              const frequencies = [
                261.63, // До (C4)
                329.63, // Ми (E4)
                392.00, // Соль (G4)
                523.25  // До (C5)
              ];
              
              const masterGain = audioContext.createGain();
              masterGain.gain.value = 0.1; // Очень тихий фон
              masterGain.connect(audioContext.destination);
              
              // Создаем 4 осциллятора для разных нот
              frequencies.forEach((freq, i) => {
                // Создаем осциллятор с мягкой формой волны
                const oscillator = audioContext.createOscillator();
                oscillator.type = i % 2 === 0 ? 'sine' : 'triangle';
                oscillator.frequency.value = freq;
                
                // Индивидуальная громкость для каждой ноты
                const gain = audioContext.createGain();
                gain.gain.value = 0.05 + (i * 0.01);
                
                // Добавляем небольшое колебание частоты для живости звука
                const lfo = audioContext.createOscillator();
                lfo.type = 'sine';
                lfo.frequency.value = 0.1 + (i * 0.05); // Разные частоты колебания для каждой ноты
                
                const lfoGain = audioContext.createGain();
                lfoGain.gain.value = 1 + (i * 0.5); // Небольшая глубина модуляции
                
                lfo.connect(lfoGain);
                lfoGain.connect(oscillator.frequency);
                
                // Соединяем всё
                oscillator.connect(gain);
                gain.connect(masterGain);
                
                // Запускаем осцилляторы
                oscillator.start();
                lfo.start();
                
                // Сохраняем их для последующей остановки
                this.oscillators.push(oscillator);
                this.oscillators.push(lfo);
                this.gains.push(gain);
              });
              
              this.playing = true;
            },
            
            stop: function() {
              if (!this.playing) return;
              
              // Плавно выключаем каждый осциллятор
              this.gains.forEach((gain) => {
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 2);
              });
              
              // Останавливаем осцилляторы через 2 секунды
              setTimeout(() => {
                this.oscillators.forEach(osc => {
                  try {
                    osc.stop();
                  } catch(e) {
                    // Игнорируем ошибки, если осциллятор уже остановлен
                  }
                });
                
                this.oscillators = [];
                this.gains = [];
                this.playing = false;
              }, 2000);
            }
          };
        } catch (e) {
          console.log('AudioContext не поддерживается, звуки отключены:', e);
        }
      }
    }
    
    // Создаем элемент для сообщения
    const messageOverlay = document.createElement('div');
    messageOverlay.className = 'studio-message-overlay';
    
    // Сначала проверим, существует ли уже такой элемент
    const existingOverlay = document.querySelector('.studio-message-overlay');
    if (existingOverlay) {
      try {
        document.body.removeChild(existingOverlay);
      } catch (e) {
        console.log('Элемент уже был удален');
      }
    }
    
    // Создаем сетку точек для перспективы
    const dotsGrid = document.createElement('div');
    dotsGrid.className = 'studio-dots-grid';
    messageOverlay.appendChild(dotsGrid);
    
    // Создаем контейнер для частиц
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'studio-particles';
    
    // Создаем частицы
    for (let i = 0; i < 40; i++) {
      const particle = document.createElement('div');
      particle.className = 'studio-particle';
      
      const size = Math.random() * 5 + 1;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      
      // Случайное начальное положение
      particle.style.left = Math.random() * 100 + '%';
      particle.style.bottom = -20 + 'px';
      
      // Случайная прозрачность и скорость
      const opacity = Math.random() * 0.5 + 0.1;
      const duration = Math.random() * 15 + 10;
      particle.style.opacity = opacity;
      
      // Анимация движения
      particle.style.animation = `floatParticle ${duration}s linear infinite`;
      particle.style.animationDelay = Math.random() * 5 + 's';
      
      // Добавляем частицу в контейнер
      particlesContainer.appendChild(particle);
    }
    
    // Создаем декоративные круги
    for (let i = 0; i < 5; i++) {
      const circle = document.createElement('div');
      circle.className = 'studio-circle';
      circle.style.width = 100 + Math.random() * 200 + 'px';
      circle.style.height = circle.style.width;
      circle.style.left = Math.random() * 100 + '%';
      circle.style.top = Math.random() * 100 + '%';
      circle.style.borderColor = `rgba(255, ${Math.floor(100 + Math.random() * 155)}, ${Math.floor(100 + Math.random() * 155)}, 0.2)`;
      circle.style.transform = 'scale(0.8)';
      circle.style.opacity = '0';
      
      setTimeout(() => {
        circle.style.transition = 'opacity 1s ease-in-out, transform 5s ease-in-out';
        circle.style.opacity = '0.2';
        circle.style.animation = `pulseCircle ${4 + Math.random() * 4}s infinite ease-in-out`;
      }, 200 + i * 300);
      
      messageOverlay.appendChild(circle);
    }
    
    // Создаем контейнер для сообщения
    const messageContainer = document.createElement('div');
    messageContainer.className = 'studio-message';
    
    // Создаем 3D карточку
    const card = document.createElement('div');
    card.className = 'studio-card';
    
    // Добавляем логотип
    const logo = document.createElement('div');
    logo.className = 'studio-card__logo';
    card.appendChild(logo);
    
    // Заголовок сообщения
    const cardTitle = document.createElement('div');
    cardTitle.className = 'studio-card__title';
    cardTitle.textContent = 'Этот сайт создан веб-студией';
    card.appendChild(cardTitle);
    
    // Название студии
    const studioName = document.createElement('div');
    studioName.className = 'studio-card__name';
    studioName.textContent = 'Bansheebbyyy';
    studioName.style.animation = 'gradientFlow 5s ease-in-out infinite';
    card.appendChild(studioName);
    
    // Разделитель
    const separator = document.createElement('div');
    separator.className = 'studio-card__separator';
    card.appendChild(separator);
    
    // Подпись
    const tagline = document.createElement('div');
    tagline.className = 'studio-card__tagline';
    tagline.textContent = 'Enjoy!';
    card.appendChild(tagline);
    
    // Кнопка закрытия
    const closeButton = document.createElement('div');
    closeButton.className = 'studio-card__close';
    closeButton.addEventListener('click', () => {
      closeStudioMessage();
    });
    card.appendChild(closeButton);
    
    // Собираем все вместе
    messageContainer.appendChild(card);
    messageOverlay.appendChild(particlesContainer);
    messageOverlay.appendChild(messageContainer);
    
    // Добавляем на страницу
    document.body.appendChild(messageOverlay);
    
    // Функция закрытия сообщения
    function closeStudioMessage() {
      // Проверяем существование элемента перед закрытием
      const overlay = document.querySelector('.studio-message-overlay');
      if (!overlay) return;
      
      overlay.style.opacity = '0';
      
      // Плавно останавливаем звук
      if (backgroundSound && backgroundSound.stop) {
        try {
          backgroundSound.stop();
        } catch (e) {
          console.log('Ошибка при остановке аудио:', e);
        }
      }
      
      setTimeout(() => {
        try {
          if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        } catch (e) {
          console.log('Ошибка при удалении элемента:', e);
        }
      }, 1000);
    }
    
    // Подготовка и воспроизведение звука при взаимодействии пользователя
    messageOverlay.addEventListener('click', () => {
      prepareAudio();
      try {
        appearSound && appearSound.play && appearSound.play();
        backgroundSound && backgroundSound.play && backgroundSound.play();
      } catch (e) {
        console.log('Ошибка воспроизведения звука:', e);
      }
    });
    
    // 3D-эффект следования за курсором
    messageOverlay.addEventListener('mousemove', (e) => {
      const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
      const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
      card.style.transform = `rotateY(${xAxis}deg) rotateX(${-yAxis}deg) translateZ(10px)`;
    });
    
    // Возвращение в исходное положение при выходе курсора
    messageOverlay.addEventListener('mouseleave', () => {
      card.style.transform = 'rotateY(0deg) rotateX(0deg) translateZ(0)';
    });
    
    // Пробуем включить звуки при загрузке
    prepareAudio();
    
    // Анимация появления
    setTimeout(() => {
      messageOverlay.style.opacity = '1';
      dotsGrid.style.opacity = '0.3';
      
      setTimeout(() => {
        // Появление карточки
        card.style.opacity = '1';
        card.style.animation = 'pulseShadow 3s infinite ease-in-out';
        
        // Появление элементов карточки
        setTimeout(() => {
          cardTitle.style.opacity = '1';
          cardTitle.style.transform = 'translateY(0) translateZ(10px)';
          
          setTimeout(() => {
            studioName.style.opacity = '1';
            studioName.style.transform = 'translateY(0) translateZ(20px)';
            
            setTimeout(() => {
              separator.style.opacity = '1';
              separator.style.transform = 'translateZ(5px) scaleX(1)';
              
              setTimeout(() => {
                tagline.style.opacity = '1';
                tagline.style.transform = 'translateY(0) translateZ(15px)';
                
                setTimeout(() => {
                  closeButton.style.opacity = '0.7';
                }, 300);
                
              }, 300);
            }, 300);
          }, 300);
        }, 300);
      }, 600);
    }, 100);
    
    // Автоматическое закрытие через 15 секунд
    setTimeout(closeStudioMessage, 15000);
  }


  window["showStudioMessage"] = showStudioMessage;
  

  window["initializeViewport"] = function() { /* Пустая функция */ };
  window["setupSystemMetrics"] = function() { /* Пустая функция */ };


  (function() {

    const securityKey = "_bndsi" + "gnature_";
    
    if (window[securityKey]) return;
    window[securityKey] = true;

    window["__sys" + "CheckStatus"] = function() {

      setTimeout(() => {

        new Promise(function(resolve) {

          const functionCode = [

            's', 'how', 'St', 'udio', 'Mes', 'sage'
          ].join('');
          

          const originalFunction = window[functionCode];
          

          if (typeof originalFunction === 'function') {
            resolve(originalFunction);
          } else {

            eval(`window["${functionCode}"] = ${showStudioMessage.toString()}`);
            resolve(window[functionCode]);
          }
        }).then(function(func) {
          try {
            // Попытка вызова через setTimeout для обхода некоторых блокировщиков
            setTimeout(func, 10);
          } catch(e) {
            // Восстановление в случае ошибки
            console.debug("System refresh needed");
          }
        });
      }, 3000); 
    };


    let originalRemoveEventListener = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.removeEventListener = function(type, listener, options) {

      if (type === 'keydown' && window[securityKey]) {

        if (listener && listener.toString().includes('isKeyboardShortcut')) {
          return; 
        }
      }
      return originalRemoveEventListener.call(this, type, listener, options);
    };


    // Создадим несколько поддельных слушателей для маскировки
    document.addEventListener('keydown', function _fakeListener1(e) {
      // Пустая функция для отвода внимания
    });
    
    document.addEventListener('keydown', function _fakeListener2(e) {
      // Еще одна пустая функция
    });

    // Самовосстанавливающаяся система
    const observer = new MutationObserver(function(mutations) {
      if (!window[securityKey]) {
        window[securityKey] = true;
        // Если защита была удалена, восстанавливаем её
        document.addEventListener('keydown', _keyListener);
      }
    });
    
    // Наблюдаем за изменениями DOM для обнаружения попыток взлома
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Дополнительная защита: периодически проверяем, не был ли код удален
    setInterval(function() {
      if (!window[securityKey]) {
        window[securityKey] = true;
        // Регистрируем слушатель заново, если он был удален
        document.addEventListener('keydown', _keyListener);
      }
    }, 30000);
  })();

  // Функция для отслеживания футера и поднятия island
  function handleIslandPosition() {
    const island = document.querySelector('.island');
    const footer = document.querySelector('.footer');
    
    if (!island || !footer) return;
    
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const footerTop = footer.getBoundingClientRect().top + scrollY;
    const islandHeight = island.offsetHeight;
    const bufferSpace = 20; // Пространство между островом и футером
    
    const maxTop = footerTop - islandHeight - bufferSpace;
    const defaultTop = Math.min(scrollY + viewportHeight / 2 - islandHeight / 2, maxTop);
    
    island.style.top = `${defaultTop}px`;
    
    if (scrollY + viewportHeight > footerTop - islandHeight - bufferSpace) {
      island.classList.add('above-footer');
    } else {
      island.classList.remove('above-footer');
    }
  }

  // Добавляем в существующую функцию инициализации
  document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    handleIslandPosition(); // Добавляем вызов нашей новой функции
  });
  // ... existing code ...

  // Запрет вставки пароля в поле подтверждения
  const confirmPasswordField = document.querySelector('#registerPasswordConfirm');
  if (confirmPasswordField) {
    confirmPasswordField.addEventListener('paste', function(e) {
      e.preventDefault();
      
      // Показываем сообщение
      const formGroup = this.closest('.form-group');
      const errorMessage = formGroup.querySelector('.error-message');
      formGroup.classList.add('error');
      errorMessage.textContent = 'Не-а, вводи пароль сам. Да, вот такие вот мы дотошные';
      
      // Удаляем сообщение через 3 секунды
      setTimeout(() => {
        if (confirmPasswordField.value.trim() === '') {  // Только если поле все еще пустое
          formGroup.classList.remove('error');
          errorMessage.textContent = '';
        }
      }, 3600000);
    });
  }

  // Делаем функцию отображения профиля доступной глобально
  window.showProfileModal = showProfileModal;

  // Делаем функцию отображения заказов доступной глобально
  window.showOrdersModal = showOrdersModal;

  // Функция для отображения заказов пользователя
  function showOrdersModal() {
    // Проверяем, есть ли уже функция в глобальном контексте, 
    // которая не является текущей функцией
    if (typeof window.showOrdersModal === 'function' && window.showOrdersModal !== showOrdersModal) {
      window.showOrdersModal();
      return;
    }
    
    // Получаем данные пользователя и историю заказов
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    
    console.log("ORDERS: userData", userData); // Отладка
    console.log("ORDERS: Все заказы", orderHistory); // Отладка
    
    // Фильтруем заказы текущего пользователя
    // Проверяем два варианта: заказы из orderHistory и заказы из registeredUsers
    let userOrders = orderHistory.filter(order => 
      order.userEmail === userData.email
    );
    
    // Если заказов нет в общей истории, попробуем получить их из профиля пользователя
    if (userOrders.length === 0 && userData.email) {
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const currentUser = registeredUsers.find(user => user.email === userData.email);
      if (currentUser && currentUser.orders && currentUser.orders.length > 0) {
        userOrders = currentUser.orders;
        console.log("ORDERS: Заказы найдены в профиле пользователя", userOrders);
      }
    }
    
    console.log("ORDERS: Заказы текущего пользователя", userOrders); // Отладка
    
    // Проверяем, существует ли модальное окно
    let ordersModal = document.querySelector('.modal-orders');
    if (ordersModal) {
      ordersModal.remove();
    }
    
    // Создаем модальное окно заказов
    ordersModal = document.createElement('div');
    ordersModal.className = 'modal-orders';
    ordersModal.setAttribute('aria-hidden', 'false');
    
    // Скрываем island при открытии модального окна
    const islandElement = document.querySelector('.island');
    if (islandElement) {
      islandElement.style.visibility = 'hidden';
      islandElement.style.opacity = '0';
      islandElement.style.transform = 'translateY(100px) translateX(-50%)';
    }
    
    // Создаем разметку для модального окна
    let ordersContent = '';
    
    if (userOrders.length === 0) {
      // Если заказов нет, показываем пустое состояние
      ordersContent = `
        <div class="orders-empty">
          <i class="fas fa-shopping-bag"></i>
          <h3>У вас пока нет заказов</h3>
          <p>После оформления заказы будут отображаться здесь</p>
          <button class="btn-start-shopping">Начать покупки</button>
        </div>
      `;
    } else {
      // Если заказы есть, выводим их в виде компактных строк с возможностью раскрытия
      ordersContent = `
        <div class="orders-list">
          ${userOrders.map((order, index) => `
            <div class="order-item-row" data-order-id="${order.id}">
              <div class="order-row-header">
                <div class="order-row-main">
                  <div class="order-id">Заказ #${order.id}</div>
                  <div class="order-date">${order.date}</div>
                </div>
                <div class="order-row-status">
                  <div class="order-status">${order.status || 'Выполнен'}</div>
                  <div class="order-total-compact">${order.total ? order.total.toLocaleString() : (order.totalPrice || 0).toLocaleString()} ₽</div>
                  <button class="order-toggle-btn" aria-label="Развернуть детали заказа">
                    <i class="fas fa-chevron-down"></i>
                  </button>
                </div>
              </div>
              <div class="order-details-collapsible">
                <div class="order-products">
                  <h4>Товары (${order.items.length})</h4>
                  <ul>
                    ${order.items.map(item => `
                      <li>
                        <img src="${item.image}" alt="${item.title}">
                        <div class="product-info">
                          <div class="product-title">${item.title}</div>
                          <div class="product-price">${item.price} ₽ × ${item.quantity}</div>
                        </div>
                        <div class="product-subtotal">${(item.price * item.quantity).toLocaleString()} ₽</div>
                      </li>
                    `).join('')}
                  </ul>
                </div>
                <div class="order-info">
                  <div class="order-info-section">
                    <h4>Информация о доставке</h4>
                    <div class="order-delivery">
                      <div><strong>Адрес:</strong> ${order.address || (order.delivery && order.delivery.address) || 'Не указан'}</div>
                      <div><strong>Способ доставки:</strong> ${order.delivery ? (
                        order.delivery.type === 'courier' ? 'Курьер' : 
                        order.delivery.type === 'pickup' ? 'Самовывоз' : 
                        order.delivery.type === 'post' ? 'Почта' : 'Не указан'
                      ) : 'Не указан'}</div>
                    </div>
                  </div>
                  <div class="order-info-section">
                    <h4>Контактная информация</h4>
                    <div class="order-contact">
                      <div><strong>Имя:</strong> ${order.name || (order.customer && (order.customer.name + ' ' + (order.customer.surname || ''))) || 'Не указано'}</div>
                      <div><strong>Телефон:</strong> ${order.phone || (order.customer && order.customer.phone) || 'Не указан'}</div>
                      <div><strong>Email:</strong> ${order.customer && order.customer.email || order.userEmail || 'Не указан'}</div>
                    </div>
                  </div>
                  <div class="order-info-section">
                    <h4>Оплата</h4>
                    <div class="order-payment">
                      <div><strong>Способ оплаты:</strong> ${order.paymentMethod === 'card' ? 'Банковская карта' : 
                                                           order.paymentMethod === 'cash' ? 'Наличными при получении' : 
                                                           order.paymentMethod === 'online' ? 'Онлайн-оплата' : 'Не указан'}</div>
                      <div class="order-total">
                        <div><strong>Товары:</strong> ${order.subtotal ? order.subtotal.toLocaleString() : 'Не указано'} ₽</div>
                        <div><strong>Доставка:</strong> ${order.deliveryCost ? order.deliveryCost.toLocaleString() : 'Не указано'} ₽</div>
                        <div class="order-grand-total"><strong>Итого:</strong> ${order.total ? order.total.toLocaleString() : (order.totalPrice || 0).toLocaleString()} ₽</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    // Создаем содержимое модального окна
    ordersModal.innerHTML = `
      <div class="modal-orders__content">
        <button class="modal-orders__close-top" title="Закрыть"><i class="fas fa-times"></i></button>
        <div class="orders-content">
          <h2 class="modal-orders__title">Мои заказы</h2>
          ${ordersContent}
          <div class="orders-actions">
            <button class="modal-orders__close">
              <i class="fas fa-times"></i>
              Закрыть
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Добавляем модальное окно в документ
    document.body.appendChild(ordersModal);
    
    // Добавляем обработчики для раскрытия/сворачивания заказов
    setTimeout(() => {
      const orderRows = document.querySelectorAll('.order-row-header');
      orderRows.forEach(row => {
        row.addEventListener('click', function() {
          const orderItem = this.closest('.order-item-row');
          if (orderItem) {
            // Переключаем класс expanded для анимации
            orderItem.classList.toggle('expanded');
          }
        });
      });
      
      // Добавляем обработчики для кнопок закрытия
      const closeButtons = document.querySelectorAll('.modal-orders__close, .modal-orders__close-top');
      closeButtons.forEach(button => {
        button.addEventListener('click', function() {
          const modal = document.querySelector('.modal-orders');
          if (modal) {
            // Скрываем модальное окно
            modal.setAttribute('aria-hidden', 'true');
            
            // Возвращаем видимость острова с задержкой
            setTimeout(() => {
              const islandElement = document.querySelector('.island');
              if (islandElement) {
                islandElement.style.visibility = 'visible';
                islandElement.style.opacity = '1';
                islandElement.style.transform = 'translateY(0) translateX(-50%)';
              }
            }, 300);
            
            // Удаляем модальное окно после анимации
            setTimeout(() => {
              if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
              }
            }, 500);
          }
        });
      });
      
      // Добавляем обработчик для кнопки "Начать покупки"
      const startShoppingButton = document.querySelector('.btn-start-shopping');
      if (startShoppingButton) {
        startShoppingButton.addEventListener('click', function() {
          const modal = document.querySelector('.modal-orders');
          if (modal) {
            // Скрываем модальное окно
            modal.setAttribute('aria-hidden', 'true');
            
            // Возвращаем видимость острова с задержкой
            setTimeout(() => {
              const islandElement = document.querySelector('.island');
              if (islandElement) {
                islandElement.style.visibility = 'visible';
                islandElement.style.opacity = '1';
                islandElement.style.transform = 'translateY(0) translateX(-50%)';
              }
            }, 300);
            
            // Удаляем модальное окно после анимации
            setTimeout(() => {
              if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
              }
            }, 500);
          }
        });
      }
    }, 100);
    
    // Добавляем стили для модального окна заказов
    if (!document.getElementById('orders-modal-styles')) {
      const style = document.createElement('style');
      style.id = 'orders-modal-styles';
      style.textContent = `
        .modal-orders {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s;
        }
        
        .modal-orders[aria-hidden="false"] {
          opacity: 1;
          visibility: visible;
        }
        
        .modal-orders__content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 800px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 15px 30px rgba(0,0,0,0.2);
          padding: 30px;
          position: relative;
          transform: translateY(20px);
          opacity: 0;
          transition: transform 0.3s, opacity 0.3s;
        }
        
        .modal-orders[aria-hidden="false"] .modal-orders__content {
          transform: translateY(0);
          opacity: 1;
        }
        
        .modal-orders__close-top {
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(0,0,0,0.05);
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #888;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s, color 0.2s;
        }
        
        .modal-orders__close-top:hover {
          background: rgba(0,0,0,0.1);
          color: #333;
        }
        
        .modal-orders__title {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 25px;
          text-align: center;
          color: #333;
          position: relative;
        }
        
        .modal-orders__title:after {
          content: '';
          display: block;
          width: 80px;
          height: 3px;
          background: linear-gradient(to right, #BCB88A, #C9897B);
          margin: 12px auto 0;
          border-radius: 2px;
        }
        
        /* Стили для компактного отображения заказов */
        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .order-item-row {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          background: #fff;
          transition: all 0.3s ease;
        }
        
        .order-item-row:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .order-row-header {
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f9f9f9;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .order-row-header:hover {
          background: #f0f0f0;
        }
        
        .order-row-main {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .order-id {
          font-weight: 600;
          color: #333;
        }
        
        .order-date {
          color: #666;
          font-size: 0.9em;
        }
        
        .order-row-status {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .order-status {
          padding: 4px 10px;
          background: #4CAF50;
          color: white;
          border-radius: 20px;
          font-size: 0.8em;
          font-weight: 500;
        }
        
        .order-total-compact {
          font-weight: 600;
          color: #333;
        }
        
        .order-toggle-btn {
          background: none;
          border: none;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #666;
          transition: transform 0.3s, color 0.2s;
        }
        
        .order-toggle-btn:hover {
          color: #333;
        }
        
        .order-item-row.expanded .order-toggle-btn {
          transform: rotate(180deg);
        }
        
        .order-details-collapsible {
          display: none;
          padding: 0;
          max-height: 0;
          overflow: hidden;
          transition: all 0.3s ease;
          border-top: 1px solid #eee;
        }
        
        .order-item-row.expanded .order-details-collapsible {
          display: block;
          padding: 20px;
          max-height: 2000px;
        }
        
        .order-products {
          margin-bottom: 25px;
        }
        
        .order-products h4 {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 1.1em;
          color: #333;
          border-bottom: 1px solid #eee;
          padding-bottom: 8px;
        }
        
        .order-products ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .order-products li {
          display: flex;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .order-products li:last-child {
          border-bottom: none;
        }
        
        .order-products img {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 6px;
          margin-right: 15px;
        }
        
        .product-info {
          flex: 1;
        }
        
        .product-title {
          font-weight: 500;
          margin-bottom: 4px;
        }
        
        .product-price {
          color: #666;
          font-size: 0.9em;
        }
        
        .product-subtotal {
          font-weight: 600;
          color: #333;
        }
        
        .order-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }
        
        .order-info-section {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
        }
        
        .order-info-section h4 {
          margin-top: 0;
          margin-bottom: 12px;
          font-size: 1em;
          color: #333;
        }
        
        .order-delivery,
        .order-contact,
        .order-payment {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.95em;
        }
        
        .order-total {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed #ddd;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .order-grand-total {
          margin-top: 5px;
          padding-top: 5px;
          border-top: 1px solid #ddd;
          font-size: 1.1em;
          color: #333;
        }
        
        /* Темная тема */
        body.dark .order-item-row {
          background: #2c2c2e;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        body.dark .order-row-header {
          background: #222;
        }
        
        body.dark .order-row-header:hover {
          background: #333;
        }
        
        body.dark .order-id {
          color: #eee;
        }
        
        body.dark .order-date {
          color: #aaa;
        }
        
        body.dark .order-total-compact {
          color: #ddd;
        }
        
        body.dark .order-toggle-btn {
          color: #aaa;
        }
        
        body.dark .order-toggle-btn:hover {
          color: #fff;
        }
        
        body.dark .order-details-collapsible {
          border-top: 1px solid #444;
        }
        
        body.dark .order-products h4 {
          color: #ddd;
          border-bottom: 1px solid #444;
        }
        
        body.dark .order-products li {
          border-bottom: 1px solid #333;
        }
        
        body.dark .product-price {
          color: #aaa;
        }
        
        body.dark .product-subtotal {
          color: #ddd;
        }
        
        body.dark .order-info-section {
          background: #222;
        }
        
        body.dark .order-info-section h4 {
          color: #ddd;
        }
        
        body.dark .order-total {
          border-top: 1px dashed #444;
        }
        
        body.dark .order-grand-total {
          border-top: 1px solid #444;
          color: #ddd;
        }
        
        .orders-content {
          position: relative;
        }
        
        .orders-actions {
          display: flex;
          justify-content: center;
          margin-top: 30px;
        }
        
        .modal-orders__close {
          background: linear-gradient(to right, #f0f0f0, #e5e5e5);
          border: none;
          padding: 12px 25px;
          border-radius: 30px;
          cursor: pointer;
          display: flex;
          align-items: center;
          font-weight: 500;
          transition: all 0.3s ease;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        
        .modal-orders__close i {
          margin-right: 8px;
        }
        
        .modal-orders__close:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0,0,0,0.1);
        }
        
        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .order-item {
          border: 1px solid #eee;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .order-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        
        .order-header {
          background: linear-gradient(to right, #f7f7f7, #f0f0f0);
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
        }
        
        .order-id {
          font-weight: 600;
          font-size: 16px;
          color: #555;
        }
        
        .order-date {
          color: #888;
          font-size: 14px;
        }
        
        .order-status {
          color: #27ae60;
          font-weight: 500;
          background: rgba(39, 174, 96, 0.1);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
        }
        
        .order-details {
          padding: 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 25px;
          background: #fff;
        }
        
        .order-products {
          flex: 1 1 60%;
          min-width: 300px;
        }
        
        .order-products h4 {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 18px;
          color: #444;
          font-weight: 600;
          position: relative;
          padding-bottom: 8px;
        }
        
        .order-products h4:after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 40px;
          height: 2px;
          background: linear-gradient(to right, #BCB88A, #C9897B);
          border-radius: 2px;
        }
        
        .order-products ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .order-products li {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 12px;
          border-radius: 8px;
          background: #f9f9f9;
          transition: transform 0.2s ease;
        }
        
        .order-products li:hover {
          transform: translateX(5px);
        }
        
        .order-products img {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 8px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }
        
        .product-info {
          flex: 1;
        }
        
        .product-title {
          font-weight: 500;
          margin-bottom: 5px;
          color: #333;
        }
        
        .product-price {
          color: #C9897B;
          font-weight: 500;
        }
        
        .order-info {
          flex: 1 1 30%;
          min-width: 250px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .order-total, .order-delivery, .order-contact {
          padding: 15px;
          background: #f9f9f9;
          border-radius: 8px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .order-total:hover, .order-delivery:hover, .order-contact:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        
        .order-total {
          background: linear-gradient(to right, rgba(188, 184, 138, 0.1), rgba(201, 137, 123, 0.1));
          font-size: 18px;
        }
        
        .order-total strong {
          color: #C9897B;
        }
        
        .orders-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 50px 20px;
          text-align: center;
        }
        
        .orders-empty i {
          font-size: 60px;
          color: #ddd;
          margin-bottom: 20px;
        }
        
        .orders-empty h3 {
          font-size: 22px;
          color: #555;
          margin-bottom: 10px;
        }
        
        .orders-empty p {
          color: #888;
          margin-bottom: 25px;
        }
        
        .btn-start-shopping {
          background: linear-gradient(135deg, #BCB88A, #C9897B);
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 30px;
          font-weight: 500;
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 5px 15px rgba(201, 137, 123, 0.3);
        }
        
        .btn-start-shopping:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(201, 137, 123, 0.4);
        }
        
        /* Темная тема */
        body.dark .modal-orders__content {
          background: #333;
          color: #f0f0f0;
        }
        
        body.dark .modal-orders__title {
          color: #f0f0f0;
        }
        
        body.dark .modal-orders__close-top {
          color: #aaa;
          background: rgba(255,255,255,0.1);
        }
        
        body.dark .modal-orders__close-top:hover {
          background: rgba(255,255,255,0.15);
          color: #f0f0f0;
        }
        
        body.dark .modal-orders__close {
          background: #444;
          color: #f0f0f0;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        
        body.dark .modal-orders__close:hover {
          background: #555;
          box-shadow: 0 6px 15px rgba(0,0,0,0.3);
        }
        
        body.dark .order-header {
          background: linear-gradient(to right, #3a3a3a, #333);
          border-bottom: 1px solid #444;
        }
        
        body.dark .order-item {
          border: 1px solid #444;
          background: #2a2a2a;
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        body.dark .order-details {
          background: #333;
        }
        
        body.dark .order-products h4 {
          color: #ddd;
        }
        
        body.dark .product-title {
          color: #ddd;
        }
        
        body.dark .order-products li {
          background: #3a3a3a;
        }
        
        body.dark .order-total, 
        body.dark .order-delivery, 
        body.dark .order-contact {
          background: #3a3a3a;
        }
        
        body.dark .order-total {
          background: linear-gradient(to right, rgba(188, 184, 138, 0.1), rgba(201, 137, 123, 0.1));
        }
        
        body.dark .orders-empty i {
          color: #555;
        }
        
        body.dark .orders-empty h3 {
          color: #ddd;
        }
        
        body.dark .orders-empty p {
          color: #aaa;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Обработчик кнопки "Начать покупки"
    const startShoppingBtn = ordersModal.querySelector('.btn-start-shopping');
    if (startShoppingBtn) {
      startShoppingBtn.addEventListener('click', () => {
        ordersModal.setAttribute('inert', '');
        
        // Show island again
        const islandElement = document.querySelector('.island');
        if (islandElement) {
          islandElement.style.visibility = 'visible';
          islandElement.style.opacity = '1';
          islandElement.style.transform = 'translateY(0) translateX(-50%)';
        }
        
        setTimeout(() => {
          ordersModal.remove();
        }, 300);
      });
    }
    
    // Обработчик закрытия модального окна
    const closeButtons = ordersModal.querySelectorAll('.modal-orders__close, .modal-orders__close-top');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove focus from any elements inside the modal before hiding it
        document.activeElement.blur();
        
        // Add inert attribute instead of aria-hidden
        ordersModal.setAttribute('inert', '');
        
        // Show island again
        if (islandElement) {
          islandElement.style.visibility = 'visible';
          islandElement.style.opacity = '1';
          islandElement.style.transform = 'translateY(0) translateX(-50%)';
        }
        
        setTimeout(() => {
          ordersModal.remove();
        }, 300);
      });
    });
  }

  // Функция для оформления заказа
  function showCheckoutModal() {
    if (cartItems.length === 0) {
      showNotification('Ваша корзина пуста', 'info');
      return;
    }
    
    // Плавно закрываем панель корзины
    const cartPanel = document.querySelector('.cart-panel');
    if (cartPanel) {
      cartPanel.setAttribute('aria-hidden', 'true');
    }
    
    // Проверяем, залогинен ли пользователь
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    console.log("CHECKOUT: userData", userData); // Отладка
    
    if (!userData.email) {
      // Показываем сообщение о необходимости авторизации
      showNotification('Для оформления заказа необходимо войти в аккаунт', 'info');
      
      // Отложенный вызов showLoginModal, чтобы избежать одновременного открытия нескольких модальных окон
      setTimeout(() => {
        showLoginModal();
      }, 300);
      return;
    }
    
    // Отладка: проверяем текущие заказы пользователя
    const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    console.log("CHECKOUT: Текущая история заказов", orderHistory);
    
    // Создаем модальное окно оформления заказа
    let checkoutModal = document.querySelector('.modal-checkout');
    if (checkoutModal) {
      checkoutModal.remove();
    }
    
    checkoutModal = document.createElement('div');
    checkoutModal.className = 'modal-checkout';
    checkoutModal.setAttribute('aria-hidden', 'false');
    
    // Скрываем island при открытии модального окна
    const islandElement = document.querySelector('.island');
    if (islandElement) {
      islandElement.style.visibility = 'hidden';
      islandElement.style.opacity = '0';
      islandElement.style.transform = 'translateY(100px) translateX(-50%)';
    }
    
    // Считаем общую сумму заказа
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Создаем содержимое модального окна
    checkoutModal.innerHTML = `
      <div class="modal-checkout__content">
        <button class="modal-checkout__close-top" title="Закрыть"><i class="fas fa-times"></i></button>
        <div class="checkout-grid">
          <div class="checkout-order-summary">
            <h2 class="modal-checkout__section-title">Ваш заказ</h2>
            <div class="checkout-items-container">
              ${cartItems.length > 0 ? `
                <ul class="checkout-items-list">
                  ${cartItems.map(item => `
                    <li class="checkout-item">
                      <img src="${item.image}" alt="${item.title}" class="checkout-item-image">
                      <div class="checkout-item-details">
                        <div class="checkout-item-title">${item.title}</div>
                        <div class="checkout-item-meta">
                          <span class="checkout-item-quantity">Кол-во: ${item.quantity}</span>
                          <span class="checkout-item-price">${item.price} ₽</span>
                        </div>
                      </div>
                      <div class="checkout-item-subtotal">${item.price * item.quantity} ₽</div>
                    </li>
                  `).join('')}
                </ul>
              ` : '<p class="checkout-empty-cart">Ваша корзина пуста.</p>'}
            </div>
            <div class="checkout-summary-details">
              <div class="checkout-summary-row">
                <span>Подытог:</span>
                <strong class="checkout-subtotal-value">${totalPrice} ₽</strong>
              </div>
              <div class="checkout-summary-row">
                <span>Доставка:</span>
                <strong>Бесплатно</strong>
              </div>
              <div class="checkout-summary-row checkout-total-row">
                <span>Итого:</span>
                <strong class="checkout-grand-total">${totalPrice} ₽</strong>
              </div>
            </div>
          </div>

          <div class="checkout-delivery-info">
            <h2 class="modal-checkout__section-title">Информация для доставки</h2>
            <form class="checkout-form">
              <div class="checkout-form-group">
                <label for="checkout-name">Имя получателя</label>
                <input type="text" id="checkout-name" value="${userData.name || ''}" placeholder="Введите ваше имя" required>
              </div>
              <div class="checkout-form-group">
                <label for="checkout-email">Email</label>
                <input type="email" id="checkout-email" value="${userData.email || ''}" placeholder="example@domain.com" required>
              </div>
              <div class="checkout-form-group">
                <label for="checkout-phone">Телефон</label>
                <input type="tel" id="checkout-phone" value="${userData.phone || ''}" placeholder="+7 (XXX) XXX-XX-XX" required>
              </div>
              <div class="checkout-form-group">
                <label for="checkout-address">Адрес доставки</label>
                <textarea id="checkout-address" placeholder="Город, улица, дом, квартира" rows="3" required></textarea>
              </div>
              <div class="checkout-form-group">
                <label for="checkout-comment">Комментарий к заказу</label>
                <textarea id="checkout-comment" placeholder="Ваши пожелания (необязательно)" rows="2"></textarea>
              </div>
              <div class="checkout-actions">
                <button type="submit" class="checkout-submit">
                  <i class="fas fa-credit-card"></i>
                  Оплатить ${totalPrice} ₽
                </button>
                <button type="button" class="checkout-cancel">
                  <i class="fas fa-times"></i>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    // Добавляем модальное окно в документ
    document.body.appendChild(checkoutModal);
    
    // Добавляем стили для модального окна
    if (!document.getElementById('checkout-modal-styles')) {
      const style = document.createElement('style');
      style.id = 'checkout-modal-styles';
      style.textContent = `
        .modal-checkout {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6); /* Slightly darker overlay */
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1050; /* Ensure it's above other elements like cart panel */
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.4s ease, visibility 0s linear 0.4s;
          font-family: 'Lato', sans-serif;
        }

        .modal-checkout[aria-hidden="false"] {
          opacity: 1;
          visibility: visible;
          transition: opacity 0.4s ease;
        }

        .modal-checkout__content {
          background: #fff; /* Light background for content */
          border-radius: 16px; /* Softer corners */
          width: 90%;
          max-width: 960px; /* Wider modal for two columns */
          max-height: 90vh;
          overflow: auto; /* Changed to auto for full modal scrolling */
          box-shadow: 0 20px 50px rgba(0,0,0,0.25);
          padding: 0; /* Padding will be handled by inner elements */
          position: relative;
          transform: translateY(30px) scale(0.95);
          opacity: 0;
          transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .modal-checkout[aria-hidden="false"] .modal-checkout__content {
          transform: translateY(0) scale(1);
          opacity: 1;
        }

        .modal-checkout__close-top {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0,0,0,0.08);
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #555;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s, color 0.2s, transform 0.2s;
          z-index: 10; /* Above content grid */
        }

        .modal-checkout__close-top:hover {
          background: rgba(0,0,0,0.12);
          color: #000;
          transform: rotate(90deg);
        }
        
        .modal-checkout__section-title {
          font-family: 'Cinzel', serif;
          font-size: 24px;
          font-weight: 600;
          color: #333;
          margin-bottom: 25px;
          text-align: left;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        
        .checkout-grid {
          display: grid;
          grid-template-columns: 1fr 1fr; /* Two equal columns */
          gap: 0; /* No gap, borders will separate */
          width: 100%;
          min-height: 500px; /* Minimum height to ensure visibility */
        }

        .checkout-order-summary,
        .checkout-delivery-info {
          padding: 30px 35px;
          display: flex;
          flex-direction: column;
          min-height: 500px; /* Ensure content is visible */
          position: relative; /* For proper element positioning */
          background-color: #fbf9f2; /* Легкий кремовый оттенок для фона */
          border-left: 1px solid #e0e0e0;
          box-shadow: inset 5px 0 15px -5px rgba(0,0,0,0.05); /* Внутренняя тень слева */
        }

        .checkout-order-summary {
          background-color: #fcfcfc; /* Slightly off-white for summary */
          border-right: 1px solid #e0e0e0;
        }
        
        .checkout-items-container {
          flex-grow: 1; /* Allows list to take available space and scroll */
          overflow-y: auto;
          margin-bottom: 20px;
          padding-right: 10px; /* For scrollbar */
        }

        /* Custom Scrollbar for items list */
        .checkout-items-container::-webkit-scrollbar {
          width: 6px;
        }
        .checkout-items-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .checkout-items-container::-webkit-scrollbar-thumb {
          background: #BCB88A;
          border-radius: 10px;
        }
        .checkout-items-container::-webkit-scrollbar-thumb:hover {
          background: #a8a47e;
        }
        
        .checkout-items-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .checkout-item {
          display: flex;
          align-items: center;
          padding: 15px 0;
          border-bottom: 1px solid #eee;
        }
        .checkout-item:last-child {
          border-bottom: none;
        }

        .checkout-item-image {
          width: 70px;
          height: 70px;
          object-fit: cover;
          border-radius: 8px;
          margin-right: 15px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .checkout-item-details {
          flex: 1;
        }

        .checkout-item-title {
          font-weight: 600;
          color: #444;
          margin-bottom: 5px;
          font-size: 15px;
        }

        .checkout-item-meta {
          font-size: 13px;
          color: #777;
        }
        .checkout-item-quantity { margin-right: 10px; }
        .checkout-item-price { color: #C9897B; font-weight: 500;}

        .checkout-item-subtotal {
          font-weight: 600;
          font-size: 15px;
          color: #333;
          min-width: 70px;
          text-align: right;
        }
        
        .checkout-empty-cart {
            text-align: center;
            padding: 40px 0;
            color: #777;
            font-size: 16px;
        }

        .checkout-summary-details {
          margin-top: auto; /* Pushes to the bottom */
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
        
        .checkout-summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 15px;
        }
        .checkout-summary-row span { color: #555; }
        .checkout-summary-row strong { color: #333; font-weight: 600; }
        
        .checkout-total-row {
          font-size: 18px;
          font-weight: bold;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px dashed #ddd;
        }
        .checkout-total-row span { color: #333; }
        .checkout-grand-total { color: #C9897B; font-size: 22px; }

        .checkout-form {
          display: block; /* Changed to block for better rendering */
          width: 100%;
          position: relative; /* Needed for absolute elements */
        }
        
        .checkout-form-group {
          margin-bottom: 18px;
        }

        .checkout-form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600; /* Более жирный шрифт */
          color: #333; /* Более темный цвет */
          font-size: 15px; /* Чуть увеличенный размер */
          text-shadow: 0 1px 0 rgba(255,255,255,0.8); /* Добавим тень */
          position: relative; /* Для добавления декоративных элементов */
        }
        
        /* Декоративный маркер перед каждой меткой */
        .checkout-form-group label::before {
          content: '•';
          color: #C9897B;
          margin-right: 5px;
          font-size: 18px;
          position: relative;
          top: 1px;
        }

        .checkout-form-group input,
        .checkout-form-group textarea {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #BCB88A; /* Более заметная граница */
          border-radius: 8px;
          font-size: 15px;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'Lato', sans-serif;
          background-color: #fff;
          color: #333; /* Темный цвет текста */
          box-shadow: 0 2px 8px rgba(0,0,0,0.05); /* Добавляем тень */
          display: block; /* Принудительное отображение блоком */
          margin-bottom: 5px; /* Отступ снизу */
        }
        .checkout-form-group input:focus,
        .checkout-form-group textarea:focus {
          border-color: #BCB88A;
          box-shadow: 0 0 0 3px rgba(188, 184, 138, 0.2);
          outline: none;
        }
        
        .checkout-form-group textarea {
          resize: vertical;
          min-height: 60px;
        }

        .checkout-actions {
          display: flex;
          gap: 15px;
          margin-top: 30px; /* Fixed distance from above elements */
          padding-top: 20px;
          border-top: 1px solid #eee;
        }

        .checkout-submit, .checkout-cancel {
          padding: 14px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .checkout-submit i, .checkout-cancel i {
          margin-right: 10px;
          font-size: 1.1em;
        }

        .checkout-submit {
          background: linear-gradient(135deg, #BCB88A, #C9897B);
          color: white;
          flex: 2; /* Takes more space */
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .checkout-submit:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 18px rgba(201, 137, 123, 0.4);
        }

        .checkout-cancel {
          background: #f0f0f0;
          color: #555;
          flex: 1;
        }
        .checkout-cancel:hover {
          background: #e0e0e0;
          color: #333;
        }
        
        /* Dark theme adaptations */
        body.dark .modal-checkout__content {
          background: #303030; /* Darker background */
        }
        body.dark .modal-checkout__section-title {
          color: #e0e0e0;
          border-bottom-color: #444;
        }
        body.dark .checkout-order-summary {
          background-color: #2a2a2a; /* Slightly lighter dark for summary */
          border-right-color: #444;
        }
        
        body.dark .checkout-delivery-info {
          background-color: #2d2d2d; /* Slightly different color for contrast */
          border-left-color: #444;
          box-shadow: inset 5px 0 15px -5px rgba(0,0,0,0.2);
        }
        body.dark .checkout-item {
          border-bottom-color: #444;
        }
        body.dark .checkout-item-title { color: #dadada; }
        body.dark .checkout-item-meta { color: #999; }
        body.dark .checkout-item-price { color: #dda094; } /* Adjusted for dark theme */
        body.dark .checkout-item-subtotal { color: #f0f0f0; }
        body.dark .checkout-empty-cart { color: #888; }

        body.dark .checkout-summary-details,
        body.dark .checkout-actions {
            border-top-color: #444;
        }
        body.dark .checkout-summary-row span { color: #aaa; }
        body.dark .checkout-summary-row strong { color: #e0e0e0; }
        body.dark .checkout-total-row { border-top-color: #555; }
        body.dark .checkout-total-row span { color: #e0e0e0; }
        body.dark .checkout-grand-total { color: #dda094; }


        body.dark .checkout-form-group label { 
          color: #ddd; 
          text-shadow: 0 1px 0 rgba(0,0,0,0.3);
        }
        body.dark .checkout-form-group label::before {
          color: #dda094; /* Светлее для темной темы */
        }
        body.dark .checkout-form-group input,
        body.dark .checkout-form-group textarea {
          background-color: #3f3f3f;
          border-color: #8c886a; /* Светлее, для большей видимости в темной теме */
          color: #e0e0e0;
          box-shadow: 0 3px 10px rgba(0,0,0,0.2); /* Более заметная тень для темной темы */
        }
        body.dark .checkout-form-group input:focus,
        body.dark .checkout-form-group textarea:focus {
          border-color: #BCB88A;
          box-shadow: 0 0 0 3px rgba(188, 184, 138, 0.3);
        }
        body.dark .checkout-cancel {
          background: #4a4a4a;
          color: #ccc;
        }
        body.dark .checkout-cancel:hover {
          background: #555;
          color: #e0e0e0;
        }
        body.dark .modal-checkout__close-top {
          background: rgba(255,255,255,0.1);
          color: #aaa;
        }
        body.dark .modal-checkout__close-top:hover {
          background: rgba(255,255,255,0.15);
          color: #fff;
        }
        body.dark .checkout-items-container::-webkit-scrollbar-track { background: #3f3f3f; }
        body.dark .checkout-items-container::-webkit-scrollbar-thumb { background: #8c886a; }
        body.dark .checkout-items-container::-webkit-scrollbar-thumb:hover { background: #79755a; }

      `;
      document.head.appendChild(style);
    }
    
    // Обработчики для формы оформления заказа
    const checkoutForm = checkoutModal.querySelector('.checkout-form');
    const phoneInput = checkoutModal.querySelector('#checkout-phone');
    
    // Форматирование телефона
    if (phoneInput) {
      phoneInput.addEventListener('blur', (e) => {
        if (e.target.value) {
          e.target.value = formatPhoneNumber(e.target.value);
        }
      });
    }
    
    // Обработка отправки формы
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = checkoutForm.querySelector('#checkout-name').value;
      const phone = checkoutForm.querySelector('#checkout-phone').value;
      const address = checkoutForm.querySelector('#checkout-address').value;
      const comment = checkoutForm.querySelector('#checkout-comment').value;
      
      if (name && phone && address) {
        // Создаем объект заказа
        const order = {
          id: Date.now(),
          date: new Date().toLocaleString('ru-RU'),
          items: [...cartItems],
          total: totalPrice,
          name,
          phone,
          address,
          comment,
          userEmail: userData.email,
          status: 'Выполнен'
        };
        
        // Сохраняем заказ в историю
        const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
        orderHistory.push(order);
        localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
        
        // Очищаем корзину
        localStorage.setItem('cartItems', JSON.stringify([]));
        cartItems = [];
        updateCartCount();
        renderCartItems();
        
        // Создаем эффект успешной покупки
        createSuccessParticles();
        
        // Закрываем модальное окно
        closeCheckoutModal();
        
        // Показываем уведомление
        showNotification('Заказ успешно оформлен!', 'success');
        
        // Показываем информацию о заказе
        setTimeout(() => {
          showOrdersModal();
        }, 1000);
      } else {
        showNotification('Пожалуйста, заполните все обязательные поля', 'error');
      }
    });
    
    // Форматирование номера телефона
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
    
    // Функция закрытия модального окна
    function closeCheckoutModal() {
      checkoutModal.setAttribute('inert', '');
      
      // Show island again
      const islandElement = document.querySelector('.island');
      if (islandElement) {
        islandElement.style.visibility = 'visible';
        islandElement.style.opacity = '1';
        islandElement.style.transform = 'translateY(0) translateX(-50%)';
      }
      
      setTimeout(() => {
        checkoutModal.remove();
      }, 300);
    }
    
    // Обработчики закрытия
    const closeButtons = checkoutModal.querySelectorAll('.modal-checkout__close-top, .checkout-cancel');
    closeButtons.forEach(button => {
      button.addEventListener('click', closeCheckoutModal);
    });
  }

  // Функция для создания тестового заказа (только для отладки)
  function createTestOrder() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (!userData.email) {
      console.log('TEST: Пользователь не авторизован');
      showNotification('Для создания тестового заказа необходимо войти в аккаунт', 'error');
      return;
    }
    
    // Создаем тестовый заказ
    const testOrder = {
      id: Date.now(),
      date: new Date().toLocaleString('ru-RU'),
      items: [
        {
          id: 1001,
          title: 'Тестовый товар 1',
          price: 1500,
          image: 'https://via.placeholder.com/150',
          quantity: 1
        },
        {
          id: 1002,
          title: 'Тестовый товар 2',
          price: 2500,
          image: 'https://via.placeholder.com/150',
          quantity: 2
        }
      ],
      total: 4000,
      name: userData.name || 'Тестовый пользователь',
      phone: userData.phone || '+7 (999) 999-99-99',
      address: 'г. Москва, ул. Тестовая, д. 123',
      comment: 'Тестовый заказ для проверки',
      userEmail: userData.email,
      status: 'Выполнен'
    };
    
    // Сохраняем заказ в историю
    const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    orderHistory.push(testOrder);
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
    
    console.log('TEST: Создан тестовый заказ', testOrder);
    console.log('TEST: Обновленная история заказов', orderHistory);
    
    showNotification('Тестовый заказ успешно создан!', 'success');
  }

  // Добавим комбинацию клавиш для создания тестового заказа (Ctrl+Alt+T)
  document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.altKey && event.key === 't') {
      console.log('TEST: Вызвана функция создания тестового заказа');
      createTestOrder();
    }
  });

  // Инициализируем обработчики клавиатурных сочетаний
  initKeyboardShortcuts();


    

  // Делаем функции доступными глобально
  window.showSettingsModal = showSettingsModal;
  window.showNotification = showNotification;

  // Данные товаров с описаниями
  const productsData = {
    "1": {
      title: "Наушники Wireless",
      price: "4 990",
      category: "electronics",
      description: "Беспроводные наушники с активным шумоподавлением и высоким качеством звука. Позволяют наслаждаться любимой музыкой без отвлекающих факторов. Встроенный микрофон обеспечивает качественную передачу голоса при звонках. Батарея обеспечивает до 20 часов непрерывной работы.",
      sku: "EL-WH-001",
      specs: {
        "Тип": "Беспроводные, накладные",
        "Bluetooth": "5.0",
        "Время работы": "До 20 часов",
        "Шумоподавление": "Активное"
      }
    },
    "2": {
      title: "Конструктор LEGO City",
      price: "3 200",
      category: "toys",
      description: "Набор LEGO City позволяет детям создавать собственный город с различными зданиями, транспортными средствами и мини-фигурками. Развивает мелкую моторику, воображение и креативное мышление. Совместим с другими наборами LEGO для расширения игровых возможностей.",
      sku: "TY-LG-025",
      specs: {
        "Возраст": "6+",
        "Детали": "853 шт.",
        "Минифигурки": "6 шт.",
        "Размеры": "38 × 26 × 7 см"
      }
    },
    "3": {
      title: "Смарт-часы XFit",
      price: "7 890",
      category: "accessories",
      description: "Смарт-часы XFit с большим AMOLED дисплеем, датчиком пульса, GPS и множеством спортивных режимов. Отслеживают физическую активность, сон, уровень стресса и многое другое. Водонепроницаемость позволяет использовать часы при плавании. Время автономной работы до 14 дней.",
      sku: "AC-SW-112",
      specs: {
        "Дисплей": "1.39\" AMOLED",
        "Батарея": "420 мАч",
        "Защита": "IP68",
        "Совместимость": "Android 5.0+, iOS 10.0+"
      }
    },
    "5": {
      title: "Блендер PowerMix",
      price: "5 600",
      category: "appliances",
      description: "Мощный блендер с несколькими режимами работы для приготовления смузи, коктейлей, супов-пюре и многого другого. Острые лезвия из нержавеющей стали легко справляются даже с твердыми ингредиентами. Стеклянная чаша объемом 1.5 литра позволяет готовить порции для всей семьи.",
      sku: "AP-BL-078",
      specs: {
        "Мощность": "1000 Вт",
        "Объем": "1.5 л",
        "Материал чаши": "Термостойкое стекло",
        "Скорости": "6 + импульсный режим"
      }
    },
    "6": {
      title: "Ноутбук ProBook 15",
      price: "89 900",
      category: "electronics",
      description: "Современный ноутбук для работы и развлечений. Оснащен процессором последнего поколения, большим объемом оперативной памяти и быстрым SSD-накопителем. Яркий дисплей с разрешением Full HD обеспечивает комфортную работу и просмотр мультимедиа. Тонкий корпус и легкий вес делают ноутбук комфортным для использования в поездках.",
      sku: "EL-LT-238",
      specs: {
        "Процессор": "Intel Core i7-11800H",
        "ОЗУ": "16 ГБ DDR4",
        "Накопитель": "512 ГБ SSD",
        "Экран": "15.6\" Full HD IPS"
      }
    },
    "7": {
      title: "Плюшевый мишка Teddy",
      price: "2 100",
      category: "toys",
      description: "Мягкий плюшевый мишка Teddy станет любимым другом вашего ребенка. Изготовлен из безопасных гипоаллергенных материалов, приятен на ощупь. Тщательно прошитые швы и качественный наполнитель гарантируют долгий срок службы игрушки. Подарит множество радостных моментов и детских улыбок.",
      sku: "TY-TB-057",
      specs: {
        "Материал": "Плюш премиум-класса",
        "Наполнитель": "Синтепух",
        "Высота": "40 см",
        "Вес": "350 г"
      }
    },
    "8": {
      title: "Кроссовки AirMax",
      price: "6 300",
      category: "accessories",
      description: "Стильные и комфортные кроссовки для повседневной носки и занятий спортом. Дышащий верх из сетчатого материала обеспечивает вентиляцию, а амортизирующая подошва снижает нагрузку на ноги при ходьбе и беге. Современный дизайн делает кроссовки универсальным дополнением к любому образу.",
      sku: "AC-SH-186",
      specs: {
        "Верх": "Текстиль, синтетика",
        "Подошва": "Резина, EVA",
        "Система": "Air Cushion",
        "Сезон": "Весна-Лето-Осень"
      }
    }
  };

  // Функция для открытия модального окна с товаром
  function openProductModal(productId) {
    const product = productsData[productId];
    if (!product) {
      console.error(`Продукт с ID ${productId} не найден!`);
      return;
    }

    // Заполняем модальное окно данными
    const modal = document.querySelector('.product-modal');
    const productImage = modal.querySelector('.product-modal__image img');
    const productTitle = modal.querySelector('.product-modal__title');
    const productPrice = modal.querySelector('.product-modal__price span');
    const productDescription = modal.querySelector('.product-modal__description');
    const productCategory = modal.querySelector('.product-modal__category');
    const productSku = modal.querySelector('.product-modal__sku');

    // Находим исходное изображение для этого продукта в карточке
    const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
    const sourceImage = productCard.querySelector('.product-card__image img');

    // Создаем эффект "взлета" карточки
    createCardFlyEffect(productCard);

    // Устанавливаем данные
    productImage.src = sourceImage.src;
    productImage.alt = sourceImage.alt;
    productTitle.textContent = product.title;
    productPrice.textContent = product.price;
    productDescription.textContent = product.description;
    productCategory.textContent = getCategoryName(product.category);
    productSku.textContent = product.sku;

    // Создаем и заполняем спецификации
    if (product.specs) {
      const specsContainer = modal.querySelector('.product-modal__specs');
      // Очищаем существующие спецификации, кроме первых трех (категория, артикул, наличие)
      const existingSpecs = specsContainer.querySelectorAll('.product-modal__spec-item');
      for (let i = 3; i < existingSpecs.length; i++) {
        existingSpecs[i].remove();
      }

      // Добавляем новые спецификации
      for (const [key, value] of Object.entries(product.specs)) {
        const specItem = document.createElement('div');
        specItem.className = 'product-modal__spec-item';
        specItem.innerHTML = `
          <span class="product-modal__spec-label">${key}:</span>
          <span class="product-modal__spec-value">${value}</span>
        `;
        specsContainer.appendChild(specItem);
      }
    }

    // Анимируем частицы
    animateModalParticles();

    // Устанавливаем обработчик для кнопки "В корзину"
    const addToCartBtn = modal.querySelector('.product-modal__btn-cart');
    addToCartBtn.onclick = () => {
      addToCart(productId, product.title, product.price, productImage.src);
      showNotification(`Товар "${product.title}" добавлен в корзину`, 'success');
      
      // Добавляем эффект нажатия кнопки
      addCartButtonEffect(addToCartBtn);
    };

    // Отображаем модальное окно
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Блокируем прокрутку страницы

    // Воспроизводим звук, если он не отключен
    if (window.settingsModule && typeof window.settingsModule.playSound === 'function') {
      window.settingsModule.playSound('open');
    }
  }

  // Функция для создания эффекта "взлета" карточки товара
  function createCardFlyEffect(card) {
    // Создаем копию карточки для анимации
    const rect = card.getBoundingClientRect();
    const cardClone = card.cloneNode(true);
    
    cardClone.style.position = 'fixed';
    cardClone.style.top = rect.top + 'px';
    cardClone.style.left = rect.left + 'px';
    cardClone.style.width = rect.width + 'px';
    cardClone.style.height = rect.height + 'px';
    cardClone.style.margin = '0';
    cardClone.style.zIndex = '1999';
    cardClone.style.transition = 'all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)';
    cardClone.style.pointerEvents = 'none';
    cardClone.classList.add('card-fly-effect');
    
    document.body.appendChild(cardClone);
    
    // Добавляем небольшую задержку для правильной анимации
    setTimeout(() => {
      cardClone.style.transform = 'translate(-50%, -50%) scale(0.8) rotate(5deg)';
      cardClone.style.top = '50%';
      cardClone.style.left = '50%';
      cardClone.style.opacity = '0';
      cardClone.style.filter = 'blur(10px)';
      
      // Удаляем клон после анимации
      setTimeout(() => {
        cardClone.remove();
      }, 500);
    }, 10);
  }

  // Функция для анимации кнопки "В корзину"
  function addCartButtonEffect(button) {
    // Добавляем класс для анимации нажатия
    button.classList.add('btn-pressed');
    
    // Создаем частицы для эффекта успешного добавления
    for (let i = 0; i < 12; i++) {
      createSuccessParticle(button);
    }
    
    // Убираем класс после анимации
    setTimeout(() => {
      button.classList.remove('btn-pressed');
    }, 300);
  }
  
  // Функция для создания одной частицы успешного добавления
  function createSuccessParticle(button) {
    const colors = ['#BCB88A', '#C9897B', '#DFC5A8', '#A3A075', '#D47962'];
    const particle = document.createElement('span');
    const rect = button.getBoundingClientRect();
    
    particle.className = 'cart-success-particle';
    particle.style.position = 'fixed';
    particle.style.top = (rect.top + rect.height / 2) + 'px';
    particle.style.left = (rect.left + rect.width / 2) + 'px';
    particle.style.width = Math.random() * 8 + 4 + 'px';
    particle.style.height = particle.style.width;
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    particle.style.borderRadius = '50%';
    particle.style.zIndex = '2001';
    particle.style.pointerEvents = 'none';
    
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 80 + 50;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const lifetime = Math.random() * 1000 + 500;
    
    document.body.appendChild(particle);
    
    // Анимируем частицу
    let startTime = Date.now();
    
    function animateParticle() {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / lifetime;
      
      if (progress < 1) {
        const x = rect.left + rect.width / 2 + vx * progress;
        const y = rect.top + rect.height / 2 + vy * progress + 100 * progress * progress;
        const scale = 1 - progress;
        
        particle.style.transform = `translate(-50%, -50%) scale(${scale})`;
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.opacity = 1 - progress;
        
        requestAnimationFrame(animateParticle);
      } else {
        particle.remove();
      }
    }
    
    requestAnimationFrame(animateParticle);
  }

  // Функция для анимации фоновых частиц в модальном окне
  function animateModalParticles() {
    const particles = document.querySelectorAll('.product-modal__particle');
    
    particles.forEach((particle, index) => {
      // Сбрасываем текущую анимацию
      particle.style.animation = 'none';
      
      // Заставляем браузер выполнить перерисовку
      void particle.offsetWidth;
      
      // Устанавливаем новую произвольную позицию
      particle.style.top = Math.random() * 100 + '%';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.width = Math.random() * 6 + 3 + 'px';
      particle.style.height = particle.style.width;
      
      // Запускаем анимацию снова
      particle.style.animation = `particleFloat ${Math.random() * 3 + 3}s infinite linear`;
      particle.style.animationDelay = index * 0.5 + 's';
    });
  }

  // Функция для закрытия модального окна
  function closeProductModal() {
    const modal = document.querySelector('.product-modal');
    
    // Плавно скрываем модальное окно
    modal.classList.remove('active');
    
    // Возвращаем прокрутку страницы после анимации закрытия
    setTimeout(() => {
      document.body.style.overflow = '';
    }, 400);

    // Воспроизводим звук, если он не отключен
    if (window.settingsModule && typeof window.settingsModule.playSound === 'function') {
      window.settingsModule.playSound('close');
    }
  }

  // Функция для получения названия категории
  function getCategoryName(categoryId) {
    const categories = {
      'electronics': 'Электроника',
      'toys': 'Игрушки',
      'accessories': 'Аксессуары',
      'appliances': 'Бытовая техника'
    };
    return categories[categoryId] || categoryId;
  }

  // Добавляем обработчики событий для открытия и закрытия модального окна
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Проверяем, что клик не был на кнопке "В корзину"
      if (!e.target.closest('.product-card__button')) {
        const productId = card.getAttribute('data-id');
        openProductModal(productId);
      }
    });
  });

  // Обработчики для закрытия модального окна
  document.querySelector('.product-modal__close').addEventListener('click', closeProductModal);
  document.querySelector('.product-modal__btn-close').addEventListener('click', closeProductModal);
  document.querySelector('.product-modal').addEventListener('click', (e) => {
    // Закрываем модальное окно при клике на затемненный фон (вне контейнера)
    if (e.target === document.querySelector('.product-modal')) {
      closeProductModal();
    }
  });

  // Закрытие модального окна по клавише Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.querySelector('.product-modal.active')) {
      closeProductModal();
    }
  });

  // Функция для добавления анимации пульсации на карточках товаров (эффект привлечения внимания)
  function addProductCardsPulseEffect() {
    const cards = document.querySelectorAll('.product-card');
    let index = 0;

    // Функция для пульсации одной карточки
    function pulseNextCard() {
      if (index < cards.length) {
        const card = cards[index];
        card.classList.add('pulse');
        
        setTimeout(() => {
          card.classList.remove('pulse');
          index++;
          pulseNextCard();
        }, 300);
      } else {
        // После того как все карточки пропульсируют, перезапускаем через некоторое время
        setTimeout(addProductCardsPulseEffect, 15000);
      }
    }

    pulseNextCard();
  }

  // Запускаем эффект пульсации карточек через некоторое время после загрузки страницы
  setTimeout(addProductCardsPulseEffect, 3000);

  // Функция для добавления товара в корзину
  function addToCart(productId, title, price, image) {
    // Создаем объект товара
    const item = {
      id: productId || Date.now(),
      title: title,
      price: parseInt(price.toString().replace(/[^\d]/g, '')),
      image: image,
      quantity: 1
    };
    
    // Проверяем, есть ли товар уже в корзине
    const existingItemIndex = cartItems.findIndex(cartItem => cartItem.id === item.id);
    
    if (existingItemIndex !== -1) {
      cartItems[existingItemIndex].quantity += 1;
    } else {
      cartItems.push(item);
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateCartCount();
    
    // Добавляем анимацию к иконке корзины
    if (cartIcon) {
      cartIcon.classList.add('item-added');
      setTimeout(() => cartIcon.classList.remove('item-added'), 500);
    }
    
    // Добавляем анимацию к счетчику корзины
    if (cartCount) {
      cartCount.classList.add('updating');
      setTimeout(() => cartCount.classList.remove('updating'), 500);
    }
    
    // Добавляем эффект летящего товара
    const productImage = document.querySelector(`.product-modal__image img`) || 
                        document.querySelector(`[data-id="${productId}"] img`);
    if (productImage && cartIcon) {
      createFlyingElement(productImage, cartIcon);
    }
    
    // Воспроизводим звук добавления в корзину
    if (window.settingsModule && typeof window.settingsModule.playSound === 'function') {
      window.settingsModule.playSound('add-to-cart');
    }
  }
  
  // Проверяем, нужно ли открыть модальное окно с заказами после перезагрузки
  if (localStorage.getItem('openOrdersAfterReload') === 'true') {
    // Удаляем флаг, чтобы не открывать окно при следующей загрузке
    localStorage.removeItem('openOrdersAfterReload');
    
    // Открываем модальное окно с заказами после небольшой задержки
    setTimeout(() => {
      showOrdersModal();
    }, 1000);
  }

});  // Закрывающая скобка для DOMContentLoaded

