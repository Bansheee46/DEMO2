document.addEventListener('DOMContentLoaded', () => {
  let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
  let user = JSON.parse(localStorage.getItem('user')) || null;
  let users = JSON.parse(localStorage.getItem('users')) || [];

  // Если пользователь авторизован через социальную сеть, обрабатываем это
  if (user && (user.provider === 'google' || user.provider === 'vk')) {
    console.log(`User logged in via ${user.provider}`);
    
    // Проверяем, добавлен ли уже этот пользователь в локальную базу
    const existingUserIndex = users.findIndex(u => u.email === user.email && u.provider === user.provider);
    
    // Если пользователя нет, добавляем его в локальную базу
    if (existingUserIndex === -1) {
      users.push({
        name: user.name,
        email: user.email,
        provider: user.provider,
        date: new Date().toLocaleDateString(),
        // Для социальных сетей пароль не нужен
        password: null
      });
      localStorage.setItem('users', JSON.stringify(users));
    }
  }

  const cartPanel = document.querySelector('.cart-panel');
  const cartCount = document.querySelector('.cart-count');
  const cartIcon = document.querySelector('.cart-icon');
  const island = document.querySelector('.island');
  const productCards = document.querySelectorAll('.product-card');
  const footer = document.querySelector('.footer');
  const accentButton = document.querySelector('.top-cloud__accent');
  const accentMenu = document.querySelector('.accent-menu');
  const accentMenuItems = document.querySelectorAll('.accent-menu__item');
  const categoryButtons = document.querySelectorAll('.island__category');
  const accountPanel = document.querySelector('.account-panel');
  const accountToggle = document.querySelector('.account-toggle');
  const accountMenu = document.querySelector('.account-menu');
  const modalAuth = document.querySelector('.modal-auth');
  const modalRegister = document.querySelector('.modal-register');
  const modalProfile = document.querySelector('.modal-profile');
  const modalSettings = document.querySelector('.modal-settings');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const modalAuthClose = modalAuth ? modalAuth.querySelector('.modal-auth__close') : null;
  const modalRegisterClose = modalRegister ? modalRegister.querySelector('.modal-register__close') : null;
  const modalProfileClose = modalProfile ? modalProfile.querySelector('.modal-profile__close') : null;
  const modalSettingsClose = modalSettings ? modalSettings.querySelector('.modal-settings__close') : null;
  const settingsMenuItems = document.querySelectorAll('.settings-menu__item');
  const loginTab = modalAuth ? modalAuth.querySelector('.modal-auth__tab[data-tab="login"]') : null;
  const registerTab = modalAuth ? modalAuth.querySelector('.modal-auth__tab[data-tab="register"]') : null;

  // Add overlay div to the DOM for modal background
  const overlayDiv = document.createElement('div');
  overlayDiv.className = 'modal-overlay';
  document.body.appendChild(overlayDiv);

  // Убедимся, что модальные окна скрыты при загрузке
  if (modalAuth) {
    modalAuth.style.display = 'none';
    modalAuth.setAttribute('aria-hidden', 'true');
  }
  
  if (modalRegister) {
    modalRegister.style.display = 'none';
    modalRegister.setAttribute('aria-hidden', 'true');
  }
  
  if (modalProfile) {
    modalProfile.style.display = 'none';
    modalProfile.setAttribute('aria-hidden', 'true');
  }
  
  if (modalSettings) {
    modalSettings.style.display = 'none';
    modalSettings.setAttribute('aria-hidden', 'true');
  }

  // Render Account Menu
  function renderAccountMenu() {
    if (!accountMenu) return;
    
    accountMenu.innerHTML = user ? `
      <div class="account-menu__item" data-action="profile">
        <i class="fas fa-user-circle"></i>
        <span>Профиль</span>
      </div>
      <div class="account-menu__item" data-action="settings">
        <i class="fas fa-cog"></i>
        <span>Настройки</span>
      </div>
      <div class="account-menu__item" data-action="logout">
        <i class="fas fa-sign-out-alt"></i>
        <span>Выйти</span>
      </div>
    ` : `
      <div class="account-menu__item" data-action="login">
        <i class="fas fa-sign-in-alt"></i>
        <span>Войти</span>
      </div>
      <div class="account-menu__item" data-action="register">
        <i class="fas fa-user-plus"></i>
        <span>Зарегистрироваться</span>
      </div>
    `;
    
    attachAccountMenuListeners();
  }

  // Attach event listeners to account menu items
  function attachAccountMenuListeners() {
    const accountToggle = document.querySelector('.account-toggle');
    const accountMenu = document.querySelector('.account-menu');
    
    if (accountToggle) {
      // Удаляем существующие обработчики, чтобы избежать дублирования
      accountToggle.removeEventListener('click', toggleAccountPanel);
      // Добавляем новый обработчик
      accountToggle.addEventListener('click', toggleAccountPanel);
    }
    
    if (accountMenu) {
      // Предотвращаем закрытие при клике внутри меню
      accountMenu.addEventListener('click', function(e) {
        e.stopPropagation(); // Предотвращаем всплытие события к document
        
        // Проверяем, является ли цель элементом с data-action
        const actionElement = e.target.closest('[data-action]');
        if (actionElement) {
          handleAccountMenuClick(e);
        }
      });
    }
    
    // Обработчик для закрытия при клике вне панели
    document.addEventListener('click', function(e) {
      const accountPanel = document.querySelector('.account-panel');
      
      if (accountPanel && accountPanel.getAttribute('aria-hidden') === 'false') {
        // Проверяем, что клик был не внутри панели и не по кнопке переключения
        const isOutsideClick = !accountPanel.contains(e.target) && 
                               !e.target.closest('.account-toggle');
        
        if (isOutsideClick) {
          hideAccountPanel();
        }
      }
    });
    
    // Добавляем улучшенные обработчики для модальных окон
    const modalProfileBtn = document.querySelector('[data-action="profile"]');
    const modalSettingsBtn = document.querySelector('[data-action="settings"]');
    const modalLogoutBtn = document.querySelector('[data-action="logout"]');
    const modalLoginBtn = document.querySelector('[data-action="login"]');
    const modalRegisterBtn = document.querySelector('[data-action="register"]');
    
    if (modalProfileBtn) {
      modalProfileBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showProfileModal();
        hideAccountPanel();
      });
    }
    
    if (modalSettingsBtn) {
      modalSettingsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showSettingsModal();
        hideAccountPanel();
      });
    }
    
    if (modalLogoutBtn) {
      modalLogoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        logoutUser();
        hideAccountPanel();
      });
    }
    
    if (modalLoginBtn) {
      modalLoginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showLoginModal();
        hideAccountPanel();
      });
    }
    
    if (modalRegisterBtn) {
      modalRegisterBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showRegisterModal();
        hideAccountPanel();
      });
    }
  }

  // Handle clicks on account menu items
  function handleAccountMenuClick(e) {
    e.preventDefault();
    const action = e.target.closest('[data-action]')?.dataset.action;

    if (!action) return;

    switch (action) {
      case 'profile':
        showProfileModal();
        break;
      case 'settings':
        showSettingsModal();
        break;
      case 'logout':
        logoutUser(); // Теперь вызывает модифицированную функцию с подтверждением
        break;
      case 'login':
        showLoginModal();
        break;
      case 'register':
        showRegisterModal();
        break;
    }

    // Скрываем меню после выбора действия
    hideAccountPanel();
  }

  // Function to show modals
  function showLoginModal() {
    const modalAuth = document.querySelector('.modal-auth');
    const modalOverlay = document.querySelector('.modal-overlay');
    
    // Подготовка элементов для анимации
    const hero = modalAuth.querySelector('.auth-hero');
    const heroLogo = modalAuth.querySelector('.auth-hero__logo');
    const heroTagline = modalAuth.querySelector('.auth-hero__tagline');
    const heroBackdrop = modalAuth.querySelector('.auth-hero__backdrop');
    const forms = modalAuth.querySelector('.auth-forms');
    const tabs = modalAuth.querySelector('.modal-auth__tabs');
    
    // Начальное состояние элементов для анимации
    if (hero) hero.style.opacity = '0';
    if (heroLogo) heroLogo.style.opacity = '0';
    if (heroTagline) heroTagline.style.opacity = '0';
    if (heroBackdrop) {
      heroBackdrop.style.opacity = '0';
      heroBackdrop.style.transform = 'scale(1.2)';
    }
    if (forms) {
      forms.style.opacity = '0';
      forms.style.transform = 'translateX(50px)';
    }
    if (tabs) {
      tabs.style.opacity = '0';
      tabs.style.transform = 'translateY(-20px)';
    }
    
    // Show modal
    modalAuth.style.display = 'flex';
    modalAuth.setAttribute('aria-hidden', 'false');
    
    // Блокируем прокрутку основной страницы
    document.body.style.overflow = 'hidden';
    
    // Make sure login tab is active
    const loginTab = modalAuth.querySelector('.modal-auth__tab[data-tab="login"]');
    const registerTab = modalAuth.querySelector('.modal-auth__tab[data-tab="register"]');
    
    if (loginTab && registerTab) {
      loginTab.classList.add('active');
      registerTab.classList.remove('active');
    }
    
    // Display correct form
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm && registerForm) {
      loginForm.style.display = 'flex';
      registerForm.style.display = 'none';
    }
    
    // Position and animate
    positionModalNearAccountMenu(modalAuth);
    
    // Последовательная анимация элементов с задержкой
    setTimeout(() => {
      if (hero) {
        hero.style.transition = 'opacity 0.8s ease';
        hero.style.opacity = '1';
      }
    }, 100);
    
    setTimeout(() => {
      if (heroBackdrop) {
        heroBackdrop.style.transition = 'opacity 1s ease, transform 1.5s ease';
        heroBackdrop.style.opacity = '0.2';
        heroBackdrop.style.transform = 'scale(1)';
      }
    }, 200);
    
    setTimeout(() => {
      if (heroLogo) {
        heroLogo.style.transition = 'opacity 0.8s ease';
        heroLogo.style.opacity = '1';
      }
    }, 300);
    
    setTimeout(() => {
      if (heroTagline) {
        heroTagline.style.transition = 'opacity 0.8s ease';
        heroTagline.style.opacity = '1';
      }
    }, 500);
    
    setTimeout(() => {
      if (tabs) {
        tabs.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        tabs.style.opacity = '1';
        tabs.style.transform = 'translateY(0)';
      }
    }, 600);
    
    setTimeout(() => {
      if (forms) {
        forms.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        forms.style.opacity = '1';
        forms.style.transform = 'translateX(0)';
      }
    }, 700);
    
    // Focus on first input
    setTimeout(() => {
      const firstInput = modalAuth.querySelector('input');
      if (firstInput) firstInput.focus();
    }, 1000);
    
    // Close account panel if open
    const accountPanel = document.querySelector('.account-panel');
    accountPanel.setAttribute('aria-hidden', 'true');
    
    // Добавим эффект появления для кнопки закрытия
    const closeButton = modalAuth.querySelector('.modal-auth__close');
    if (closeButton) {
      closeButton.style.opacity = '0';
      closeButton.style.transform = 'rotate(-90deg)';
      
      setTimeout(() => {
        closeButton.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        closeButton.style.opacity = '1';
        closeButton.style.transform = 'rotate(0)';
      }, 800);
    }
    
    // Устанавливаем обработчики для кнопок "Показать пароль" и "Зарегистрироваться"
    setTimeout(setupPasswordToggles, 1000);
    setTimeout(setupRegisterButtonAnimation, 1000);
  }

  function showRegisterModal() {
    const modalAuth = document.querySelector('.modal-auth');
    
    // Сначала покажем модальное окно как обычно
    showLoginModal();
    
    // Затем переключимся на вкладку регистрации
    setTimeout(() => {
      const loginTab = modalAuth.querySelector('.modal-auth__tab[data-tab="login"]');
      const registerTab = modalAuth.querySelector('.modal-auth__tab[data-tab="register"]');
      
      if (loginTab && registerTab) {
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
      }
      
      // Display correct form
      const loginForm = document.getElementById('login-form');
      const registerForm = document.getElementById('register-form');
      
      if (loginForm && registerForm) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
      }
      
      // Focus on first input
      setTimeout(() => {
        const firstInput = registerForm.querySelector('input');
        if (firstInput) firstInput.focus();
      }, 100);

      // Инициализируем валидацию флажка согласия
      setupTermsAgreementValidation();
    }, 800);
  }

  function showProfileModal() {
    const modalProfile = document.querySelector('.modal-profile');
    
    if (!modalProfile) return;
    
    // Заполняем данные пользователя
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileDate = document.getElementById('profile-date');
    
    if (profileName && user) profileName.textContent = user.name;
    if (profileEmail && user) profileEmail.textContent = user.email;
    if (profileDate && user) profileDate.textContent = user.date || 'Не указано';
    
    // Добавим отображение способа авторизации, если пользователь авторизован через соцсеть
    const profileInfoElement = modalProfile.querySelector('.profile-info');
    
    // Проверяем, есть ли уже поле с провайдером
    const existingProviderField = modalProfile.querySelector('.profile-field-provider');
    
    if (user && user.provider && !existingProviderField) {
      // Создаем новое поле для отображения провайдера
      const providerField = document.createElement('div');
      providerField.className = 'profile-field profile-field-provider';
      
      // Определяем название и иконку провайдера
      let providerName = '';
      let providerIcon = '';
      
      if (user.provider === 'google') {
        providerName = 'Google';
        providerIcon = '<i class="fab fa-google" style="color: #DB4437; margin-right: 5px;"></i>';
      } else if (user.provider === 'vk') {
        providerName = 'ВКонтакте';
        providerIcon = '<i class="fab fa-vk" style="color: #4C75A3; margin-right: 5px;"></i>';
      }
      
      providerField.innerHTML = `
        <span class="profile-label">Способ входа:</span>
        <span class="profile-value">${providerIcon} ${providerName}</span>
      `;
      
      // Добавляем новое поле в информацию о профиле
      profileInfoElement.appendChild(providerField);
    } else if (!user.provider && existingProviderField) {
      // Удаляем поле, если пользователь не авторизован через соцсеть
      existingProviderField.remove();
    }
    
    // Подготовка элементов для анимации
    const hero = modalProfile.querySelector('.auth-hero');
    const heroLogo = modalProfile.querySelector('.auth-hero__logo');
    const heroTagline = modalProfile.querySelector('.auth-hero__tagline');
    const heroBackdrop = modalProfile.querySelector('.auth-hero__backdrop');
    const content = modalProfile.querySelector('.profile-content');
    
    // Начальное состояние элементов для анимации
    if (hero) hero.style.opacity = '0';
    if (heroLogo) heroLogo.style.opacity = '0';
    if (heroTagline) heroTagline.style.opacity = '0';
    if (heroBackdrop) {
      heroBackdrop.style.opacity = '0';
      heroBackdrop.style.transform = 'scale(1.2)';
    }
    if (content) {
      content.style.opacity = '0';
      content.style.transform = 'translateX(50px)';
    }
    
    // Show modal
    modalProfile.style.display = 'flex';
    modalProfile.setAttribute('aria-hidden', 'false');
    
    // Блокируем прокрутку основной страницы
    document.body.style.overflow = 'hidden';
    
    // Обновляем данные профиля
    renderProfile();
    
    // Position and animate
    positionModalNearAccountMenu(modalProfile);
    
    // Последовательная анимация элементов с задержкой
    setTimeout(() => {
      if (hero) {
        hero.style.transition = 'opacity 0.8s ease';
        hero.style.opacity = '1';
      }
    }, 100);
    
    setTimeout(() => {
      if (heroBackdrop) {
        heroBackdrop.style.transition = 'opacity 1s ease, transform 1.5s ease';
        heroBackdrop.style.opacity = '0.2';
        heroBackdrop.style.transform = 'scale(1)';
      }
    }, 200);
    
    setTimeout(() => {
      if (heroLogo) {
        heroLogo.style.transition = 'opacity 0.8s ease';
        heroLogo.style.opacity = '1';
      }
    }, 300);
    
    setTimeout(() => {
      if (heroTagline) {
        heroTagline.style.transition = 'opacity 0.8s ease';
        heroTagline.style.opacity = '1';
      }
    }, 500);
    
    setTimeout(() => {
      if (content) {
        content.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        content.style.opacity = '1';
        content.style.transform = 'translateX(0)';
      }
    }, 700);
    
    // Close account panel if open
    const accountPanel = document.querySelector('.account-panel');
    if (accountPanel) {
    accountPanel.setAttribute('aria-hidden', 'true');
    }
  }

  function showSettingsModal() {
    const modalSettings = document.querySelector('.modal-settings');
    
    if (!modalSettings) return;
    
    // Подготовка элементов для анимации
    const hero = modalSettings.querySelector('.auth-hero');
    const heroLogo = modalSettings.querySelector('.auth-hero__logo');
    const heroTagline = modalSettings.querySelector('.auth-hero__tagline');
    const heroBackdrop = modalSettings.querySelector('.auth-hero__backdrop');
    const content = modalSettings.querySelector('.settings-content');
    
    // Начальное состояние элементов для анимации
    if (hero) hero.style.opacity = '0';
    if (heroLogo) heroLogo.style.opacity = '0';
    if (heroTagline) heroTagline.style.opacity = '0';
    if (heroBackdrop) {
      heroBackdrop.style.opacity = '0';
      heroBackdrop.style.transform = 'scale(1.2)';
    }
    if (content) {
      content.style.opacity = '0';
      content.style.transform = 'translateX(50px)';
    }
    
    // Show modal
    modalSettings.style.display = 'flex';
    modalSettings.setAttribute('aria-hidden', 'false');
    
    // Блокируем прокрутку основной страницы
    document.body.style.overflow = 'hidden';
    
    // Обновляем статус настроек
    updateSettingsMenu();
    
    // Position and animate
    positionModalNearAccountMenu(modalSettings);
    
    // Последовательная анимация элементов с задержкой
    setTimeout(() => {
      if (hero) {
        hero.style.transition = 'opacity 0.8s ease';
        hero.style.opacity = '1';
      }
    }, 100);
    
    setTimeout(() => {
      if (heroBackdrop) {
        heroBackdrop.style.transition = 'opacity 1s ease, transform 1.5s ease';
        heroBackdrop.style.opacity = '0.2';
        heroBackdrop.style.transform = 'scale(1)';
      }
    }, 200);
    
    setTimeout(() => {
      if (heroLogo) {
        heroLogo.style.transition = 'opacity 0.8s ease';
        heroLogo.style.opacity = '1';
      }
    }, 300);
    
    setTimeout(() => {
      if (heroTagline) {
        heroTagline.style.transition = 'opacity 0.8s ease';
        heroTagline.style.opacity = '1';
      }
    }, 500);
    
    setTimeout(() => {
      if (content) {
        content.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        content.style.opacity = '1';
        content.style.transform = 'translateX(0)';
      }
    }, 700);
    
    // Close account panel if open
    const accountPanel = document.querySelector('.account-panel');
    if (accountPanel) {
    accountPanel.setAttribute('aria-hidden', 'true');
    }
  }

  function hideModal() {
    // Восстанавливаем прокрутку основной страницы
    document.body.style.overflow = '';
    
    // Restore visibility to original buttons
    const loginButton = document.querySelector('.account-menu__item[data-action="login"]');
    const registerButton = document.querySelector('.account-menu__item[data-action="register"]');
    
    if (loginButton) {
      loginButton.style.opacity = '1';
      loginButton.style.pointerEvents = 'auto';
    }
    
    if (registerButton) {
      registerButton.style.opacity = '1';
      registerButton.style.pointerEvents = 'auto';
    }
    
    // Hide all modals with animation
    if (modalAuth) {
      // Найдем все элементы для анимации
      const modalContent = modalAuth.querySelector('.modal-auth__content');
      const hero = modalAuth.querySelector('.auth-hero');
      const forms = modalAuth.querySelector('.auth-forms');
      const tabs = modalAuth.querySelector('.modal-auth__tabs');
      const closeButton = modalAuth.querySelector('.modal-auth__close');
      
      // Анимируем закрытие кнопки
      if (closeButton) {
        closeButton.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        closeButton.style.opacity = '0';
        closeButton.style.transform = 'rotate(-90deg)';
      }
      
      // Анимируем исчезновение табов
      if (tabs) {
        tabs.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        tabs.style.opacity = '0';
        tabs.style.transform = 'translateY(-20px)';
      }
      
      // Анимируем исчезновение форм
      setTimeout(() => {
        if (forms) {
          forms.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          forms.style.opacity = '0';
          forms.style.transform = 'translateX(30px)';
        }
      }, 100);
      
      // Анимируем исчезновение героя
      setTimeout(() => {
        if (hero) {
          hero.style.transition = 'opacity 0.3s ease';
          hero.style.opacity = '0';
        }
      }, 200);
      
      // Анимируем исчезновение контента
      setTimeout(() => {
        if (modalContent) {
          modalContent.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease';
          modalContent.style.transform = 'scale(0.9) translateY(20px)';
          modalContent.style.opacity = '0';
        }
      }, 300);
      
      // Анимируем исчезновение фона
      setTimeout(() => {
        modalAuth.style.transition = 'opacity 0.4s ease';
        modalAuth.style.opacity = '0';
        modalAuth.style.backdropFilter = 'blur(0px)';
      }, 400);
      
      // После завершения анимации скрываем модальное окно
      setTimeout(() => {
        modalAuth.setAttribute('aria-hidden', 'true');
        modalAuth.style.display = 'none';
        
        // Сбрасываем стили для следующего открытия
        if (modalContent) {
          modalContent.style.transform = '';
          modalContent.style.opacity = '';
        }
        
        if (hero) {
          hero.style.opacity = '';
        }
        
        if (forms) {
          forms.style.opacity = '';
          forms.style.transform = '';
        }
        
        if (tabs) {
          tabs.style.opacity = '';
          tabs.style.transform = '';
        }
        
        if (closeButton) {
          closeButton.style.opacity = '';
          closeButton.style.transform = '';
        }
        
        modalAuth.style.opacity = '';
        modalAuth.style.backdropFilter = '';
      }, 600);
    }
    
    if (modalProfile) {
      // Анимация закрытия для профиля
      const profileContent = modalProfile.querySelector('.modal-profile__content');
      
      if (profileContent) {
        profileContent.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease';
        profileContent.style.transform = 'scale(0.9) translateY(20px)';
        profileContent.style.opacity = '0';
      }
      
      modalProfile.style.transition = 'opacity 0.4s ease';
      modalProfile.style.opacity = '0';
      
      setTimeout(() => {
        modalProfile.setAttribute('aria-hidden', 'true');
        modalProfile.style.display = 'none';
        
        if (profileContent) {
          profileContent.style.transform = '';
          profileContent.style.opacity = '';
        }
        
        modalProfile.style.opacity = '';
      }, 400);
    }
    
    if (modalSettings) {
      // Анимация закрытия для настроек
      const settingsContent = modalSettings.querySelector('.modal-settings__content');
      
      if (settingsContent) {
        settingsContent.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease';
        settingsContent.style.transform = 'scale(0.9) translateY(20px)';
        settingsContent.style.opacity = '0';
      }
      
      modalSettings.style.transition = 'opacity 0.4s ease';
      modalSettings.style.opacity = '0';
      
      setTimeout(() => {
        modalSettings.setAttribute('aria-hidden', 'true');
        modalSettings.style.display = 'none';
        
        if (settingsContent) {
          settingsContent.style.transform = '';
          settingsContent.style.opacity = '';
        }
        
        modalSettings.style.opacity = '';
      }, 400);
    }
  }

  // Function for switching between login and register forms
  function switchForm(formType) {
    if (!loginForm || !registerForm || !loginTab || !registerTab) return;

    if (formType === 'login') {
      loginTab.classList.add('active');
      registerTab.classList.remove('active');
      loginForm.style.display = 'flex';
      registerForm.style.display = 'none';
      
      // Focus on first input of login form
      setTimeout(() => {
        const firstInput = loginForm.querySelector('input');
        if (firstInput) firstInput.focus();
      }, 10);
    } else {
      loginTab.classList.remove('active');
      registerTab.classList.add('active');
      loginForm.style.display = 'none';
      registerForm.style.display = 'flex';
      
      // Focus on first input of register form
      setTimeout(() => {
        const firstInput = registerForm.querySelector('input');
        if (firstInput) firstInput.focus();
      }, 10);
    }
  }

  // Добавляем обработчики для табов
  if (loginTab) {
    loginTab.addEventListener('click', () => switchForm('login'));
  }
  if (registerTab) {
    registerTab.addEventListener('click', () => switchForm('register'));
  }

  // Обработчик закрытия модального окна
  if (modalAuthClose) {
    modalAuthClose.addEventListener('click', hideModal);
  }

  if (modalRegisterClose) {
    modalRegisterClose.addEventListener('click', hideModal);
  }

  if (modalProfileClose) {
    modalProfileClose.addEventListener('click', hideModal);
  }

  if (modalSettingsClose) {
    modalSettingsClose.addEventListener('click', hideModal);
  }

  // Function to position modal near account menu
  function positionModalNearAccountMenu(modal) {
    const accountToggle = document.querySelector('.account-toggle');
    const accountRect = accountToggle.getBoundingClientRect();
    const modalContent = modal.querySelector('.modal-auth__content') || 
                         modal.querySelector('.modal-register__content') ||
                         modal.querySelector('.modal-profile__content') ||
                         modal.querySelector('.modal-settings__content');

    // Set position only for desktop sizes
    if (window.innerWidth > 768) {
      // Center horizontally
      const windowWidth = window.innerWidth;
      const modalWidth = modalContent.offsetWidth;
      
      // Calculate position to center the modal and adjust it slightly upward
      modalContent.style.margin = '0 auto';
      modalContent.style.marginTop = '-40px';
    }
  }

  // Function to animate modal emergence from menu
  function animateModalFromMenu(modal) {
    // Add a class to trigger the animation
    const modalContent = modal.querySelector('.modal-auth__content') || 
                         modal.querySelector('.modal-register__content') ||
                         modal.querySelector('.modal-profile__content') ||
                         modal.querySelector('.modal-settings__content');
    
    // Reset animation
    modalContent.style.animation = 'none';
    
    // Force reflow
    void modalContent.offsetWidth;
    
    // Start animation
    modalContent.style.animation = '';
  }

  // Function to attach tab switch listeners
  function attachTabSwitchListeners() {
    const loginTab = modalAuth.querySelector('.modal-auth__tab[data-tab="login"]');
    const registerTab = modalAuth.querySelector('.modal-auth__tab[data-tab="register"]');
    if (loginTab) {
      loginTab.removeEventListener('click', switchToLoginTab);
      loginTab.addEventListener('click', switchToLoginTab);
      console.log('Listener attached to login tab');
    } else {
      console.error('Login tab not found for listener attachment');
    }
    if (registerTab) {
      registerTab.removeEventListener('click', switchToRegisterTab);
      registerTab.addEventListener('click', switchToRegisterTab);
      console.log('Listener attached to register tab');
    } else {
      console.error('Register tab not found for listener attachment');
    }
  }

  // Functions to handle tab switching
  function switchToLoginTab() {
    console.log('Switching to login tab');
    const loginTab = modalAuth.querySelector('.modal-auth__tab[data-tab="login"]');
    const registerTab = modalAuth.querySelector('.modal-auth__tab[data-tab="register"]');
    if (loginTab && registerTab) {
      loginTab.classList.add('active');
      registerTab.classList.remove('active');
    }
    
    // Плавное исчезновение и появление форм
    registerForm.style.opacity = '0';
    registerForm.style.transform = 'translateX(-20px)';
    
    setTimeout(() => {
      loginForm.style.display = 'flex';
      registerForm.style.display = 'none';
      
      // Сбрасываем стили для следующего перехода
      registerForm.style.opacity = '';
      registerForm.style.transform = '';
      
      // Анимация появления формы входа
      loginForm.style.opacity = '0';
      loginForm.style.transform = 'translateX(20px)';
      
      // Принудительный рефлоу для запуска анимации
      void loginForm.offsetWidth;
      
      // Запускаем анимацию
      loginForm.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      loginForm.style.opacity = '1';
      loginForm.style.transform = 'translateX(0)';
      
      // Анимируем поля ввода последовательно
      const inputGroups = loginForm.querySelectorAll('.input-group');
      inputGroups.forEach((group, index) => {
        group.style.opacity = '0';
        group.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
          group.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          group.style.opacity = '1';
          group.style.transform = 'translateY(0)';
        }, 100 + (index * 100));
      });
      
      // Анимируем остальные элементы
      const otherElements = loginForm.querySelectorAll('.auth-options, .modal-auth__submit');
      otherElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
          el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, 400 + (index * 100));
      });
      
      // Focus on first input
      setTimeout(() => {
        const firstInput = loginForm.querySelector('input');
        if (firstInput) firstInput.focus();
      }, 10);
    }, 200);
    
    console.log('Switched to login tab, form displays updated');
  }

  function switchToRegisterTab() {
    console.log('Switching to register tab');
    const loginTab = modalAuth.querySelector('.modal-auth__tab[data-tab="login"]');
    const registerTab = modalAuth.querySelector('.modal-auth__tab[data-tab="register"]');
    if (loginTab && registerTab) {
      loginTab.classList.remove('active');
      registerTab.classList.add('active');
    }
    
    // Инициализируем валидацию флажка согласия сразу
    setupTermsAgreementValidation();
    
    // Плавное исчезновение и появление форм
    loginForm.style.opacity = '0';
    loginForm.style.transform = 'translateX(-20px)';
    
    setTimeout(() => {
      loginForm.style.display = 'none';
      registerForm.style.display = 'flex';
      
      // Сбрасываем стили для следующего перехода
      loginForm.style.opacity = '';
      loginForm.style.transform = '';
      
      // Анимация появления формы регистрации
      registerForm.style.opacity = '0';
      registerForm.style.transform = 'translateX(20px)';
      
      // Принудительный рефлоу для запуска анимации
      void registerForm.offsetWidth;
      
      // Запускаем анимацию
      registerForm.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      registerForm.style.opacity = '1';
      registerForm.style.transform = 'translateX(0)';
      
      // Анимируем поля ввода последовательно
      const inputGroups = registerForm.querySelectorAll('.input-group');
      inputGroups.forEach((group, index) => {
        group.style.opacity = '0';
        group.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
          group.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          group.style.opacity = '1';
          group.style.transform = 'translateY(0)';
        }, 50 + (index * 50));
      });
      
      // Анимируем остальные элементы
      const otherElements = registerForm.querySelectorAll('.terms-agreement, .modal-auth__submit');
      otherElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
          el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, 200 + (index * 50));
      });
      
      // Focus on first input
      setTimeout(() => {
        const firstInput = registerForm.querySelector('input');
        if (firstInput) firstInput.focus();
      }, 10);
      
      // Еще раз инициализируем валидацию флажка согласия
      setupTermsAgreementValidation();
    }, 150);
    
    console.log('Switched to register tab, form displays updated');
  }

  // Модифицируем функцию logoutUser для добавления подтверждения с расширенной функциональностью
  function logoutUser() {
    // Создаем модальное окно для подтверждения с анимированным стилем
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal-confirm logout-confirm';
    confirmModal.setAttribute('aria-hidden', 'false');
    
    confirmModal.innerHTML = `
      <div class="modal-confirm__content">
        <div class="logout-header">
          <i class="fas fa-sign-out-alt logout-icon"></i>
          <h3>Выход из аккаунта</h3>
        </div>
        <div class="logout-message">
          <p>Вы действительно хотите выйти из своего аккаунта?</p>
          <div class="logout-details">
            <div class="user-details">
              <div class="user-avatar-container">
                <img src="${user?.avatar || 'https://i.pravatar.cc/150?img=1'}" class="user-mini-avatar" alt="Avatar">
              </div>
              <div class="user-info">
                <span class="user-name">${user?.name || 'Пользователь'}</span>
                <span class="user-email">${user?.email || 'email@example.com'}</span>
              </div>
            </div>
            <div class="session-info">
              <div class="session-detail">
                <i class="fas fa-clock"></i>
                <span>Время сессии: ${formatSessionTime()}</span>
              </div>
              <div class="session-detail">
                <i class="fas fa-shopping-cart"></i>
                <span>Товаров в корзине: ${getCartItemsCount()}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="confirm-warning">
          <i class="fas fa-exclamation-triangle"></i>
          <span>После выхода несохранённые данные будут потеряны</span>
        </div>
        <div class="confirm-actions">
          <button class="confirm-yes">
            <i class="fas fa-sign-out-alt"></i>
            <span>Выйти</span>
          </button>
          <button class="confirm-no">
            <i class="fas fa-times"></i>
            <span>Отмена</span>
          </button>
        </div>
        <div class="confirm-options">
          <label class="remember-device">
            <input type="checkbox" id="remember-device">
            <span>Запомнить устройство</span>
          </label>
          <a href="#" class="help-link">Нужна помощь?</a>
        </div>
      </div>
    `;
    
    // Добавляем стили для модального окна выхода с улучшенным дизайном
    const style = document.createElement('style');
    style.textContent = `
      .logout-confirm .modal-confirm__content {
        max-width: 450px;
        border-radius: 16px;
        padding: 30px;
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.25);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-top: 5px solid #e74c3c;
      }
      
      body.dark .logout-confirm .modal-confirm__content {
        background: #2a2a2a;
        border-top: 5px solid #c0392b;
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
      }
      
      .logout-header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      }
      
      body.dark .logout-header {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .logout-icon {
        font-size: 24px;
        color: #e74c3c;
        margin-right: 15px;
        animation: pulseIcon 1.5s infinite ease-in-out alternate;
      }
      
      @keyframes pulseIcon {
        0% { transform: scale(1); }
        100% { transform: scale(1.15); }
      }
      
      .logout-header h3 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #333;
      }
      
      body.dark .logout-header h3 {
        color: #f0f0f0;
      }
      
      .logout-message p {
        margin-bottom: 15px;
        font-size: 1.1rem;
        color: #555;
      }
      
      body.dark .logout-message p {
        color: #ccc;
      }
      
      .logout-details {
        background: rgba(0, 0, 0, 0.03);
        border-radius: 10px;
        padding: 15px;
        margin-bottom: 20px;
      }
      
      body.dark .logout-details {
        background: rgba(255, 255, 255, 0.05);
      }
      
      .user-details {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 15px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      }
      
      body.dark .user-details {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
      
      .user-avatar-container {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        overflow: hidden;
        margin-right: 15px;
        border: 2px solid #f0f0f0;
        position: relative;
      }
      
      .user-mini-avatar {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .user-info {
        display: flex;
        flex-direction: column;
      }
      
      .user-name {
        font-weight: 600;
        font-size: 1rem;
        color: #333;
        margin-bottom: 5px;
      }
      
      body.dark .user-name {
        color: #f0f0f0;
      }
      
      .user-email {
        font-size: 0.85rem;
        color: #777;
      }
      
      body.dark .user-email {
        color: #aaa;
      }
      
      .session-info {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .session-detail {
        display: flex;
        align-items: center;
        font-size: 0.9rem;
        color: #666;
      }
      
      body.dark .session-detail {
        color: #bbb;
      }
      
      .session-detail i {
        margin-right: 10px;
        color: #888;
      }
      
      body.dark .session-detail i {
        color: #999;
      }
      
      .confirm-warning {
        display: flex;
        align-items: center;
        padding: 10px 15px;
        background-color: rgba(231, 76, 60, 0.1);
        border-left: 3px solid #e74c3c;
        border-radius: 5px;
        margin-bottom: 20px;
        font-size: 0.9rem;
        color: #c0392b;
      }
      
      body.dark .confirm-warning {
        background-color: rgba(231, 76, 60, 0.2);
        color: #e74c3c;
      }
      
      .confirm-warning i {
        margin-right: 10px;
        font-size: 1rem;
      }
      
      .confirm-actions {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
      }
      
      .confirm-yes, .confirm-no {
        padding: 12px 20px;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        width: 48%;
      }
      
      .confirm-yes i, .confirm-no i {
        margin-right: 8px;
      }
      
      .confirm-yes {
        background-color: #e74c3c;
        color: white;
        box-shadow: 0 4px 12px rgba(231, 76, 60, 0.25);
      }
      
      .confirm-yes:hover {
        background-color: #c0392b;
        transform: translateY(-3px);
        box-shadow: 0 6px 15px rgba(231, 76, 60, 0.35);
      }
      
      .confirm-yes:active {
        transform: translateY(-1px);
      }
      
      .confirm-no {
        background-color: #f0f0f0;
        color: #333;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      .confirm-no:hover {
        background-color: #e0e0e0;
        transform: translateY(-3px);
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
      }
      
      .confirm-no:active {
        transform: translateY(-1px);
      }
      
      body.dark .confirm-no {
        background-color: #444;
        color: #f0f0f0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      
      body.dark .confirm-no:hover {
        background-color: #555;
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
      }
      
      .confirm-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.85rem;
      }
      
      .remember-device {
        display: flex;
        align-items: center;
        cursor: pointer;
        color: #666;
      }
      
      body.dark .remember-device {
        color: #bbb;
      }
      
      .remember-device input {
        margin-right: 8px;
      }
      
      .help-link {
        color: #3498db;
        text-decoration: none;
        transition: all 0.2s ease;
      }
      
      .help-link:hover {
        color: #2980b9;
        text-decoration: underline;
      }
      
      body.dark .help-link {
        color: #5dade2;
      }
      
      body.dark .help-link:hover {
        color: #7fb3d5;
      }
      
      @keyframes modalFadeIn {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      
      .logout-confirm .modal-confirm__content {
        animation: modalFadeIn 0.3s forwards;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(confirmModal);
    
    // Получаем количество товаров в корзине
    function getCartItemsCount() {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      return cart.length;
    }
    
    // Форматируем время сессии
    function formatSessionTime() {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.loginTime) {
        // Устанавливаем текущее время, если нет времени входа
        const now = new Date().getTime();
        user.loginTime = now;
        localStorage.setItem('user', JSON.stringify(user));
        return '< 1 минуты';
      }
      
      const now = new Date().getTime();
      const loginTime = user.loginTime;
      const diffMs = now - loginTime;
      
      // Преобразуем миллисекунды в минуты
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return '< 1 минуты';
      if (diffMins < 60) return `${diffMins} ${formatMinutes(diffMins)}`;
      
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      
      if (hours < 24) {
        if (mins === 0) return `${hours} ${formatHours(hours)}`;
        return `${hours} ${formatHours(hours)} ${mins} ${formatMinutes(mins)}`;
      }
      
      const days = Math.floor(hours / 24);
      return `${days} ${formatDays(days)}`;
      
      function formatMinutes(num) {
        if (num >= 11 && num <= 19) return 'минут';
        const lastDigit = num % 10;
        if (lastDigit === 1) return 'минута';
        if (lastDigit >= 2 && lastDigit <= 4) return 'минуты';
        return 'минут';
      }
      
      function formatHours(num) {
        if (num >= 11 && num <= 19) return 'часов';
        const lastDigit = num % 10;
        if (lastDigit === 1) return 'час';
        if (lastDigit >= 2 && lastDigit <= 4) return 'часа';
        return 'часов';
      }
      
      function formatDays(num) {
        if (num >= 11 && num <= 19) return 'дней';
        const lastDigit = num % 10;
        if (lastDigit === 1) return 'день';
        if (lastDigit >= 2 && lastDigit <= 4) return 'дня';
        return 'дней';
      }
    }
    
    // Анимируем появление модального окна
    setTimeout(() => {
      confirmModal.setAttribute('aria-hidden', 'false');
    }, 10);
    
    // Обработчики для кнопок
    const confirmYesBtn = confirmModal.querySelector('.confirm-yes');
    const confirmNoBtn = confirmModal.querySelector('.confirm-no');
    const rememberDeviceCheckbox = confirmModal.querySelector('#remember-device');
    const helpLink = confirmModal.querySelector('.help-link');
    
    confirmYesBtn.addEventListener('click', function() {
      // Анимируем кнопку
      this.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.style.transform = 'scale(1)';
      }, 100);
      
      // Запоминаем устройство, если чекбокс активирован
      if (rememberDeviceCheckbox.checked) {
        localStorage.setItem('rememberedDevice', navigator.userAgent);
      }
      
      // Выполняем выход
      setTimeout(() => {
        localStorage.removeItem('user');
        
        // Обновляем меню аккаунта
        renderAccountMenu();
        
        // Скрываем панель аккаунта
        hideAccountPanel();
        
        // Удаляем модальное окно
        confirmModal.setAttribute('aria-hidden', 'true');
        setTimeout(() => {
          document.body.removeChild(confirmModal);
        }, 300);
        
        // Показываем уведомление
        showNotification('Вы успешно вышли из аккаунта', 'success');
      }, 300);
    });
    
    confirmNoBtn.addEventListener('click', function() {
      // Анимируем кнопку
      this.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.style.transform = 'scale(1)';
      }, 100);
      
      // Просто закрываем модальное окно
      confirmModal.setAttribute('aria-hidden', 'true');
      
      setTimeout(() => {
        document.body.removeChild(confirmModal);
      }, 300);
    });
    
    helpLink.addEventListener('click', function(e) {
      e.preventDefault();
      confirmModal.setAttribute('aria-hidden', 'true');
      
      setTimeout(() => {
        document.body.removeChild(confirmModal);
        
        // Показываем информационное окно с помощью вместо стандартного
        showHelpModal();
      }, 300);
    });
    
    // Закрытие по клику вне модального окна
    confirmModal.addEventListener('click', function(e) {
      if (e.target === confirmModal) {
        confirmModal.setAttribute('aria-hidden', 'true');
        
        setTimeout(() => {
          document.body.removeChild(confirmModal);
        }, 300);
      }
    });
  }

  // Функция для показа вспомогательного окна
  function showHelpModal() {
    const helpModal = document.createElement('div');
    helpModal.className = 'modal-help';
    helpModal.setAttribute('aria-hidden', 'false');
    
    helpModal.innerHTML = `
      <div class="modal-help__content">
        <div class="help-header">
          <i class="fas fa-question-circle"></i>
          <h3>Помощь и поддержка</h3>
        </div>
        <div class="help-body">
          <div class="help-section">
            <h4>Часто задаваемые вопросы</h4>
            <ul class="faq-list">
              <li>
                <div class="faq-question">Как сохранить мои данные при выходе?</div>
                <div class="faq-answer">При выходе активируйте опцию "Запомнить устройство", чтобы сохранить часть информации для будущих сессий.</div>
              </li>
              <li>
                <div class="faq-question">Будет ли сохранена моя корзина?</div>
                <div class="faq-answer">Да, содержимое корзины сохраняется даже после выхода из аккаунта на этом устройстве.</div>
              </li>
              <li>
                <div class="faq-question">Как обезопасить свой аккаунт?</div>
                <div class="faq-answer">Не забывайте выходить из аккаунта на общедоступных устройствах и регулярно меняйте пароль.</div>
              </li>
            </ul>
          </div>
          <div class="help-section">
            <h4>Контакты поддержки</h4>
            <div class="support-contacts">
              <div class="support-contact">
                <i class="fas fa-envelope"></i>
                <span>support@damax.com</span>
              </div>
              <div class="support-contact">
                <i class="fas fa-phone"></i>
                <span>+7 (999) 123-45-67</span>
              </div>
              <div class="support-contact">
                <i class="fab fa-telegram"></i>
                <span>@damax_support</span>
              </div>
            </div>
          </div>
        </div>
        <button class="help-close">
          <i class="fas fa-times"></i>
          <span>Закрыть</span>
        </button>
      </div>
    `;
    
    // Добавляем стили для модального окна помощи
    const style = document.createElement('style');
    style.textContent = `
      .modal-help {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }
      
      .modal-help[aria-hidden="false"] {
        opacity: 1;
        visibility: visible;
      }
      
      .modal-help__content {
        background: #fff;
        border-radius: 16px;
        padding: 30px;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.25);
        transform: scale(0.8);
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        text-align: left;
        border-top: 5px solid #3498db;
        animation: modalFadeIn 0.3s forwards;
      }
      
      body.dark .modal-help__content {
        background: #2a2a2a;
        color: #f0f0f0;
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
        border-top: 5px solid #2980b9;
      }
      
      .help-header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      }
      
      body.dark .help-header {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .help-header i {
        font-size: 24px;
        color: #3498db;
        margin-right: 15px;
      }
      
      .help-header h3 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #333;
      }
      
      body.dark .help-header h3 {
        color: #f0f0f0;
      }
      
      .help-body {
        margin-bottom: 20px;
      }
      
      .help-section {
        margin-bottom: 20px;
      }
      
      .help-section h4 {
        margin: 0 0 15px;
        color: #444;
        font-size: 1.1rem;
        font-weight: 600;
      }
      
      body.dark .help-section h4 {
        color: #ddd;
      }
      
      .faq-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      .faq-list li {
        margin-bottom: 15px;
        border-bottom: 1px dotted #eee;
        padding-bottom: 15px;
      }
      
      body.dark .faq-list li {
        border-bottom: 1px dotted #555;
      }
      
      .faq-list li:last-child {
        margin-bottom: 0;
        border-bottom: none;
        padding-bottom: 0;
      }
      
      .faq-question {
        font-weight: 600;
        color: #3498db;
        margin-bottom: 8px;
        font-size: 0.95rem;
      }
      
      body.dark .faq-question {
        color: #5dade2;
      }
      
      .faq-answer {
        color: #666;
        font-size: 0.9rem;
        line-height: 1.5;
      }
      
      body.dark .faq-answer {
        color: #bbb;
      }
      
      .support-contacts {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .support-contact {
        display: flex;
        align-items: center;
        font-size: 0.95rem;
        color: #555;
      }
      
      body.dark .support-contact {
        color: #ccc;
      }
      
      .support-contact i {
        margin-right: 12px;
        width: 20px;
        text-align: center;
        color: #3498db;
      }
      
      body.dark .support-contact i {
        color: #5dade2;
      }
      
      .help-close {
        margin-top: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 12px;
        background: #f0f0f0;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        color: #333;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .help-close:hover {
        background: #e0e0e0;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      
      .help-close:active {
        transform: translateY(0);
      }
      
      .help-close i {
        margin-right: 8px;
      }
      
      body.dark .help-close {
        background: #444;
        color: #f0f0f0;
      }
      
      body.dark .help-close:hover {
        background: #555;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(helpModal);
    
    // Обработчик для кнопки закрытия
    const closeButton = helpModal.querySelector('.help-close');
    closeButton.addEventListener('click', function() {
      helpModal.setAttribute('aria-hidden', 'true');
      setTimeout(() => {
        document.body.removeChild(helpModal);
      }, 300);
    });
    
    // Закрытие по клику вне модального окна
    helpModal.addEventListener('click', function(e) {
      if (e.target === helpModal) {
        helpModal.setAttribute('aria-hidden', 'true');
        setTimeout(() => {
          document.body.removeChild(helpModal);
        }, 300);
      }
    });
  }

  // Initial Setup
  renderAccountMenu();
  hideAccountPanel(); // Сначала скрываем панель
  
  // Убедимся, что аккаунт-тогл виден
  if (accountToggle) {
    accountToggle.style.display = 'flex';
    accountToggle.style.opacity = '1';
  }
  
  console.log('Account panel initialized, aria-hidden:', accountPanel ? accountPanel.getAttribute('aria-hidden') : 'element not found');
  console.log('Account toggle element:', accountToggle);

  // Функции для работы с панелью аккаунта
  function showAccountPanel() {
    if (!accountPanel) return;
    accountPanel.setAttribute('aria-hidden', 'false');
    if (accountMenu) {
      accountMenu.style.display = 'flex';
      accountMenu.style.visibility = 'visible';
    }
    console.log('Account panel shown');
  }

  function hideAccountPanel() {
    if (!accountPanel) return;
    
    // Начинаем анимацию исчезновения
    accountPanel.setAttribute('aria-hidden', 'true');
    
    // Ждем окончания самой долгой анимации перед скрытием элемента
    setTimeout(() => {
      if (accountMenu) {
        accountMenu.style.visibility = 'hidden';
      }
    }, 300); // Время немного больше, чем длительность анимации
    console.log('Account panel hidden');
  }

  // Модифицируем функцию toggleAccountPanel для предотвращения немедленного закрытия
  function toggleAccountPanel(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation(); // Останавливаем всплытие события
    }
    
    const accountPanel = document.querySelector('.account-panel');
    const isHidden = accountPanel.getAttribute('aria-hidden') === 'true';
    
    if (isHidden) {
      showAccountPanel();
    } else {
      hideAccountPanel();
    }
  }

  // Обработчик для переключения меню аккаунта
  if (accountToggle) {
    // Сначала удалим все существующие обработчики
    const newAccountToggle = accountToggle.cloneNode(true);
    if (accountToggle.parentNode) {
      accountToggle.parentNode.replaceChild(newAccountToggle, accountToggle);
    }
    
    // Добавим новый обработчик
    newAccountToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleAccountPanel();
      console.log('Account toggle clicked, panel visibility:', accountPanel.getAttribute('aria-hidden') === 'false');
    });
    
    console.log('New event listener attached to account toggle');
  } else {
    console.error('Account toggle element not found in DOM');
  }

  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    updateSettingsMenu();
  }
  if (localStorage.getItem('sound') === 'muted') {
    document.body.classList.add('muted');
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

  accentButton.addEventListener('click', () => {
    const isHidden = accentMenu.getAttribute('aria-hidden') === 'true';
    accentMenu.setAttribute('aria-hidden', !isHidden);
  });

  document.addEventListener('click', (e) => {
    // Проверяем клик вне акцент-меню
    if (accentButton && accentMenu && !accentButton.contains(e.target) && !accentMenu.contains(e.target)) {
      accentMenu.setAttribute('aria-hidden', 'true');
    }
    
    // Проверяем клик вне панели аккаунта
    if (accountPanel && accountToggle && accountMenu) {
      const isClickInside = accountToggle.contains(e.target) || 
                           accountMenu.contains(e.target);
                           
      if (!isClickInside && accountPanel.getAttribute('aria-hidden') === 'false') {
        hideAccountPanel();
      }
    }
    
    // Проверяем клик вне модальных окон
    if (modalAuth && modalAuth.getAttribute('aria-hidden') === 'false') {
      const modalContent = modalAuth.querySelector('.modal-auth__content');
      if (modalContent && !modalContent.contains(e.target) && !accountToggle.contains(e.target)) {
        hideModal();
      }
    }
    
    // То же самое для остальных модальных окон
    if (modalProfile && modalProfile.getAttribute('aria-hidden') === 'false') {
      const modalContent = modalProfile.querySelector('.modal-profile__content');
      if (modalContent && !modalContent.contains(e.target) && !accountToggle.contains(e.target)) {
        hideModal();
      }
    }
    
    if (modalSettings && modalSettings.getAttribute('aria-hidden') === 'false') {
      const modalContent = modalSettings.querySelector('.modal-settings__content');
      if (modalContent && !modalContent.contains(e.target) && !accountToggle.contains(e.target)) {
        hideModal();
      }
    }
  });

  // Остальные обработчики для элементов меню и т.д.
  if (accentMenuItems) {
    accentMenuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = item.getAttribute('data-action');
        if (action === 'toggle-theme') {
          document.body.classList.toggle('dark');
          localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
          updateSettingsMenu();
        } else if (action === 'toggle-sound') {
          document.body.classList.toggle('muted');
          localStorage.setItem('sound', document.body.classList.contains('muted') ? 'muted' : 'unmuted');
          updateSettingsMenu();
        } else if (action === 'scroll-top') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }

  function updateCartCount() {
    if (!cartCount) return;
    cartCount.textContent = cartItems.length;
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
          image: imgEl.src
        };
        cartItems.push(item);
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        updateCartCount();
        renderCartItems();
        cartPanel.setAttribute('aria-hidden', 'false');
      });
    });
  }

  // Update category button functionality to show all products by default
  const categoryItems = document.querySelectorAll('.island__category');
  if (categoryItems && categoryItems.length > 0) {
    categoryItems.forEach(category => {
      category.addEventListener('click', () => {
        if (!productCards || productCards.length === 0) return;
        
        console.log('Category button clicked:', category.getAttribute('data-category')); // Debug log
        
        const activeCategory = document.querySelector('.island__category.active');
        if (activeCategory) {
          activeCategory.classList.remove('active');
        }
        
        category.classList.add('active');
        const cat = category.getAttribute('data-category');
        
        productCards.forEach((card, index) => {
          card.classList.remove('visible');
          setTimeout(() => {
            if (cat === 'all') {
              card.style.display = 'block';
            } else {
              card.style.display = card.getAttribute('data-category') === cat ? 'block' : 'none';
            }
            if (card.style.display === 'block') {
              card.style.visibility = 'visible';
              card.style.opacity = '1';
              setTimeout(() => card.classList.add('visible'), index * 100);
            } else {
              card.style.visibility = 'hidden';
              card.style.opacity = '0';
            }
          }, 200);
        });
      });
    });
  }

  function renderCartItems() {
    const cartItemsList = document.querySelector('.cart-panel__items');
    const totalElement = document.querySelector('.cart-panel__total span');
    
    if (!cartItemsList || !totalElement) return;
    
    cartItemsList.innerHTML = '';
    let total = 0;

    cartItems.forEach((item, index) => {
      const li = document.createElement('li');
      li.style.animationDelay = `${index * 0.1}s`;
      li.innerHTML = `
        <img src="${item.image}" alt="${item.title}">
        <div class="cart-panel__item-info">
          <span class="cart-panel__item-title">${item.title}</span>
          <span class="cart-panel__item-price">${item.price} ₽</span>
        </div>
        <button>Удалить</button>
      `;
      li.querySelector('button').addEventListener('click', () => {
        cartItems.splice(index, 1);
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        renderCartItems();
        updateCartCount();
      });
      cartItemsList.appendChild(li);
      total += item.price;
    });

    totalElement.textContent = `${total} ₽`;
  }

  // Profile Modal Logic
  function renderProfile() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) return;
    
    // Обновляем имя пользователя
    const profileName = document.getElementById('profile-name');
    if (profileName) {
      profileName.textContent = user.name || 'Не указано';
    }
    
    // Обновляем email пользователя
    const profileEmail = document.getElementById('profile-email');
    if (profileEmail) {
      profileEmail.textContent = user.email || 'Не указано';
    }
    
    // Обновляем телефон пользователя
    const profilePhone = document.getElementById('profile-phone');
    if (profilePhone) {
      profilePhone.textContent = user.phone || 'Не указано';
    }
    
    // Обновляем адрес пользователя
    const profileAddress = document.getElementById('profile-address');
    if (profileAddress) {
      profileAddress.textContent = user.address || 'Не указано';
    }
    
    // Обновляем дату регистрации
    const profileDate = document.getElementById('profile-date');
    if (profileDate) {
      profileDate.textContent = user.date || new Date().toLocaleDateString();
    }
    
    // Добавляем информацию о способе регистрации
    const profileInfo = document.querySelector('.profile-tab-content[data-tab-content="info"]');
    if (profileInfo) {
      // Проверяем, есть ли уже поле с информацией о способе регистрации
      let authMethodField = profileInfo.querySelector('.profile-field[data-field="auth-method"]');
      
      if (!authMethodField) {
        // Создаем новое поле для способа авторизации
        authMethodField = document.createElement('div');
        authMethodField.className = 'profile-field';
        authMethodField.setAttribute('data-field', 'auth-method');
        
        const authMethodLabel = document.createElement('span');
        authMethodLabel.className = 'profile-label';
        authMethodLabel.textContent = 'Способ входа:';
        
        const authMethodValue = document.createElement('span');
        authMethodValue.className = 'profile-value';
        
        // Определяем способ авторизации по данным пользователя
        let authMethod = 'Email';
        let authIcon = 'fa-envelope';
        
        if (user.provider === 'google') {
          authMethod = 'Google';
          authIcon = 'fa-google';
        } else if (user.provider === 'vk') {
          authMethod = 'ВКонтакте';
          authIcon = 'fa-vk';
        }
        
        authMethodValue.innerHTML = `<i class="fab ${authIcon}"></i> ${authMethod}`;
        
        authMethodField.appendChild(authMethodLabel);
        authMethodField.appendChild(authMethodValue);
        
        // Добавляем поле в информацию профиля
        profileInfo.appendChild(authMethodField);
      } else {
        // Обновляем существующее поле
        const authMethodValue = authMethodField.querySelector('.profile-value');
        
        // Определяем способ авторизации по данным пользователя
        let authMethod = 'Email';
        let authIcon = 'fa-envelope';
        
        if (user.provider === 'google') {
          authMethod = 'Google';
          authIcon = 'fa-google';
        } else if (user.provider === 'vk') {
          authMethod = 'ВКонтакте';
          authIcon = 'fa-vk';
        }
        
        authMethodValue.innerHTML = `<i class="fab ${authIcon}"></i> ${authMethod}`;
      }
    }
    
    // Загружаем историю заказов, если есть
    loadOrdersHistory();
    
    // Загружаем избранное, если есть
    loadWishlist();
  }

  // Функция для загрузки истории заказов
  function loadOrdersHistory() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    
    // Получаем историю заказов из localStorage
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const userOrders = orders.filter(order => order.userEmail === user.email);
    
    const ordersTabContent = document.querySelector('.profile-tab-content[data-tab-content="orders"]');
    if (!ordersTabContent) return;
    
    // Если у пользователя нет заказов, показываем пустое состояние
    if (userOrders.length === 0) {
      ordersTabContent.innerHTML = `
        <div class="orders-empty">
          <i class="fas fa-shopping-bag"></i>
          <p>У вас пока нет заказов</p>
          <button class="btn-start-shopping">Начать покупки</button>
        </div>
      `;
      
      // Добавляем обработчик для кнопки
      const startShoppingBtn = ordersTabContent.querySelector('.btn-start-shopping');
      if (startShoppingBtn) {
        startShoppingBtn.addEventListener('click', function() {
          hideModal();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    } else {
      // Если у пользователя есть заказы, показываем их список
      ordersTabContent.innerHTML = `
        <div class="orders-list">
          <h3 class="orders-title">Ваши заказы</h3>
          <div class="orders-container"></div>
        </div>
      `;
      
      const ordersContainer = ordersTabContent.querySelector('.orders-container');
      
      // Сортируем заказы по дате (самые новые сверху)
      userOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Создаем элементы заказов
      userOrders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'order-item';
        
        const formattedDate = new Date(order.date).toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        const statusClass = getStatusClass(order.status);
        
        orderElement.innerHTML = `
          <div class="order-header">
            <div class="order-info">
              <span class="order-number">Заказ №${order.id}</span>
              <span class="order-date">${formattedDate}</span>
            </div>
            <div class="order-status ${statusClass}">
              <span>${getStatusText(order.status)}</span>
            </div>
          </div>
          <div class="order-products">
            ${renderOrderProducts(order.items)}
          </div>
          <div class="order-footer">
            <div class="order-total">
              Итого: <span>${order.total} ₽</span>
            </div>
            <button class="order-details-btn" data-order-id="${order.id}">
              <i class="fas fa-info-circle"></i>
              <span>Подробнее</span>
            </button>
          </div>
        `;
        
        ordersContainer.appendChild(orderElement);
      });
      
      // Добавляем обработчики для кнопок "Подробнее"
      const detailButtons = ordersTabContent.querySelectorAll('.order-details-btn');
      detailButtons.forEach(button => {
        button.addEventListener('click', function() {
          const orderId = this.getAttribute('data-order-id');
          const order = userOrders.find(o => o.id === orderId);
          if (order) {
            showOrderDetails(order);
          }
        });
      });
    }
    
    // Вспомогательная функция для рендеринга товаров заказа
    function renderOrderProducts(items) {
      // Ограничиваем количество отображаемых товаров
      const displayItems = items.slice(0, 3);
      const hiddenItems = items.length > 3 ? items.length - 3 : 0;
      
      let html = '';
      
      displayItems.forEach(item => {
        html += `
          <div class="order-product">
            <img src="${item.image}" alt="${item.title}" class="order-product-image">
            <div class="order-product-info">
              <span class="order-product-title">${item.title}</span>
              <span class="order-product-price">${item.price} ₽</span>
            </div>
            <span class="order-product-quantity">x${item.quantity}</span>
          </div>
        `;
      });
      
      // Если есть скрытые товары, добавляем информацию о них
      if (hiddenItems > 0) {
        html += `
          <div class="order-more-products">
            <span>Ещё ${hiddenItems} ${formatProductsCount(hiddenItems)}</span>
          </div>
        `;
      }
      
      return html;
    }
    
    // Функция для форматирования количества товаров
    function formatProductsCount(count) {
      if (count >= 11 && count <= 19) return 'товаров';
      const lastDigit = count % 10;
      if (lastDigit === 1) return 'товар';
      if (lastDigit >= 2 && lastDigit <= 4) return 'товара';
      return 'товаров';
    }
    
    // Функция для получения текста статуса
    function getStatusText(status) {
      switch(status) {
        case 'new': return 'Новый';
        case 'processing': return 'В обработке';
        case 'shipped': return 'Отправлен';
        case 'delivered': return 'Доставлен';
        case 'completed': return 'Выполнен';
        case 'cancelled': return 'Отменен';
        default: return 'Неизвестно';
      }
    }
    
    // Функция для получения класса статуса
    function getStatusClass(status) {
      switch(status) {
        case 'new': return 'status-new';
        case 'processing': return 'status-processing';
        case 'shipped': return 'status-shipped';
        case 'delivered': return 'status-delivered';
        case 'completed': return 'status-completed';
        case 'cancelled': return 'status-cancelled';
        default: return '';
      }
    }
  }

  // Функция для отображения подробностей заказа
  function showOrderDetails(order) {
    const orderDetailsModal = document.createElement('div');
    orderDetailsModal.className = 'modal-order-details';
    orderDetailsModal.setAttribute('aria-hidden', 'false');
    
    // Форматируем дату заказа
    const orderDate = new Date(order.date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Создаем содержимое модального окна
    orderDetailsModal.innerHTML = `
      <div class="modal-order-details__content">
        <div class="order-details-header">
          <h3>Детали заказа №${order.id}</h3>
          <button class="order-details-close">&times;</button>
        </div>
        <div class="order-details-info">
          <div class="order-details-row">
            <span class="order-details-label">Дата заказа:</span>
            <span class="order-details-value">${orderDate}</span>
          </div>
          <div class="order-details-row">
            <span class="order-details-label">Статус:</span>
            <span class="order-details-value status-${order.status}">${getStatusText(order.status)}</span>
          </div>
          <div class="order-details-row">
            <span class="order-details-label">Адрес доставки:</span>
            <span class="order-details-value">${order.address || 'Не указан'}</span>
          </div>
          <div class="order-details-row">
            <span class="order-details-label">Способ оплаты:</span>
            <span class="order-details-value">${order.paymentMethod || 'Не указан'}</span>
          </div>
        </div>
        <div class="order-details-products">
          <h4>Товары</h4>
          <div class="order-details-products-list">
            ${renderDetailedProducts(order.items)}
          </div>
        </div>
        <div class="order-details-summary">
          <div class="order-summary-row">
            <span>Стоимость товаров:</span>
            <span>${calculateProductsTotal(order.items)} ₽</span>
          </div>
          <div class="order-summary-row">
            <span>Доставка:</span>
            <span>${order.shipping || '0'} ₽</span>
          </div>
          <div class="order-summary-row total">
            <span>Итого:</span>
            <span>${order.total} ₽</span>
          </div>
        </div>
        <div class="order-details-actions">
          <button class="order-repeat-btn" data-order-id="${order.id}">
            <i class="fas fa-sync-alt"></i>
            <span>Повторить заказ</span>
          </button>
          <button class="order-cancel-btn" data-order-id="${order.id}" ${order.status === 'cancelled' || order.status === 'completed' ? 'disabled' : ''}>
            <i class="fas fa-times"></i>
            <span>Отменить заказ</span>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(orderDetailsModal);
    
    // Добавляем обработчики событий
    const closeButton = orderDetailsModal.querySelector('.order-details-close');
    closeButton.addEventListener('click', function() {
      orderDetailsModal.setAttribute('aria-hidden', 'true');
      setTimeout(() => {
        document.body.removeChild(orderDetailsModal);
      }, 300);
    });
    
    // Повторение заказа
    const repeatButton = orderDetailsModal.querySelector('.order-repeat-btn');
    repeatButton.addEventListener('click', function() {
      // Получаем текущую корзину
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      
      // Добавляем все товары из заказа в корзину
      order.items.forEach(item => {
        const existingItem = cart.find(cartItem => cartItem.id === item.id);
        
        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          cart.push({...item});
        }
      });
      
      // Сохраняем обновленную корзину
      localStorage.setItem('cart', JSON.stringify(cart));
      
      // Обновляем счетчик корзины
      updateCartCount();
      
      // Показываем уведомление
      showNotification('Товары добавлены в корзину', 'success');
      
      // Закрываем модальное окно
      orderDetailsModal.setAttribute('aria-hidden', 'true');
      setTimeout(() => {
        document.body.removeChild(orderDetailsModal);
      }, 300);
    });
    
    // Отмена заказа
    const cancelButton = orderDetailsModal.querySelector('.order-cancel-btn');
    if (!cancelButton.disabled) {
      cancelButton.addEventListener('click', function() {
        // Запрашиваем подтверждение
        if (confirm('Вы действительно хотите отменить заказ?')) {
          // Получаем все заказы
          const orders = JSON.parse(localStorage.getItem('orders')) || [];
          
          // Находим нужный заказ и меняем его статус
          const orderIndex = orders.findIndex(o => o.id === order.id);
          
          if (orderIndex !== -1) {
            orders[orderIndex].status = 'cancelled';
            orders[orderIndex].cancelDate = new Date().toISOString();
            
            // Сохраняем обновленные заказы
            localStorage.setItem('orders', JSON.stringify(orders));
            
            // Обновляем статус в модальном окне
            const statusElement = orderDetailsModal.querySelector('.order-details-value.status-' + order.status);
            
            if (statusElement) {
              statusElement.classList.remove('status-' + order.status);
              statusElement.classList.add('status-cancelled');
              statusElement.textContent = 'Отменен';
            }
            
            // Отключаем кнопку отмены
            cancelButton.disabled = true;
            
            // Показываем уведомление
            showNotification('Заказ успешно отменен', 'success');
            
            // Обновляем список заказов
            loadOrdersHistory();
          }
        }
      });
    }
    
    // Закрытие по клику вне модального окна
    orderDetailsModal.addEventListener('click', function(e) {
      if (e.target === orderDetailsModal) {
        orderDetailsModal.setAttribute('aria-hidden', 'true');
        setTimeout(() => {
          document.body.removeChild(orderDetailsModal);
        }, 300);
      }
    });
    
    // Функция для рендеринга товаров
    function renderDetailedProducts(items) {
      let html = '';
      
      items.forEach(item => {
        html += `
          <div class="order-details-product">
            <img src="${item.image}" alt="${item.title}" class="order-details-product-image">
            <div class="order-details-product-info">
              <div class="order-details-product-title">${item.title}</div>
              <div class="order-details-product-price">${item.price} ₽</div>
            </div>
            <div class="order-details-product-quantity">
              <span>Количество: ${item.quantity}</span>
            </div>
            <div class="order-details-product-total">
              <span>${item.price * item.quantity} ₽</span>
            </div>
          </div>
        `;
      });
      
      return html;
    }
    
    // Функция для расчета общей стоимости товаров
    function calculateProductsTotal(items) {
      return items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    // Функция для получения текста статуса
    function getStatusText(status) {
      switch(status) {
        case 'new': return 'Новый';
        case 'processing': return 'В обработке';
        case 'shipped': return 'Отправлен';
        case 'delivered': return 'Доставлен';
        case 'completed': return 'Выполнен';
        case 'cancelled': return 'Отменен';
        default: return 'Неизвестно';
      }
    }
  }

  // Функция для загрузки избранного
  function loadWishlist() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    
    // Получаем список избранного из localStorage
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const userWishlist = wishlist.filter(item => item.userEmail === user.email);
    
    const wishlistTabContent = document.querySelector('.profile-tab-content[data-tab-content="wishlist"]');
    if (!wishlistTabContent) return;
    
    // Если у пользователя нет избранных товаров, показываем пустое состояние
    if (userWishlist.length === 0) {
      wishlistTabContent.innerHTML = `
        <div class="wishlist-empty">
          <i class="fas fa-heart"></i>
          <p>Ваш список избранного пуст</p>
          <button class="btn-browse-catalog">Перейти в каталог</button>
        </div>
      `;
      
      // Добавляем обработчик для кнопки
      const browseCatalogBtn = wishlistTabContent.querySelector('.btn-browse-catalog');
      if (browseCatalogBtn) {
        browseCatalogBtn.addEventListener('click', function() {
          hideModal();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    } else {
      // Если у пользователя есть избранные товары, показываем их список
      wishlistTabContent.innerHTML = `
        <div class="wishlist-list">
          <h3 class="wishlist-title">Избранные товары</h3>
          <div class="wishlist-container"></div>
        </div>
      `;
      
      const wishlistContainer = wishlistTabContent.querySelector('.wishlist-container');
      
      // Создаем элементы избранных товаров
      userWishlist.forEach(item => {
        const wishlistItem = document.createElement('div');
        wishlistItem.className = 'wishlist-item';
        
        wishlistItem.innerHTML = `
          <div class="wishlist-item-image">
            <img src="${item.image}" alt="${item.title}">
          </div>
          <div class="wishlist-item-info">
            <div class="wishlist-item-title">${item.title}</div>
            <div class="wishlist-item-price">${item.price} ₽</div>
          </div>
          <div class="wishlist-item-actions">
            <button class="wishlist-add-to-cart" data-id="${item.id}">
              <i class="fas fa-shopping-cart"></i>
              <span>В корзину</span>
            </button>
            <button class="wishlist-remove" data-id="${item.id}">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        `;
        
        wishlistContainer.appendChild(wishlistItem);
      });
      
      // Добавляем обработчики для кнопок "В корзину"
      const addToCartButtons = wishlistTabContent.querySelectorAll('.wishlist-add-to-cart');
      addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
          const itemId = this.getAttribute('data-id');
          
          // Получаем информацию о товаре
          const wishlistItem = userWishlist.find(item => item.id === itemId);
          
          if (wishlistItem) {
            // Получаем текущую корзину
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            
            // Проверяем, есть ли товар уже в корзине
            const existingItem = cart.find(item => item.id === itemId);
            
            if (existingItem) {
              // Если товар уже в корзине, увеличиваем количество
              existingItem.quantity++;
            } else {
              // Если товара нет в корзине, добавляем его
              cart.push({
                id: wishlistItem.id,
                title: wishlistItem.title,
                price: wishlistItem.price,
                image: wishlistItem.image,
                quantity: 1
              });
            }
            
            // Сохраняем обновленную корзину
            localStorage.setItem('cart', JSON.stringify(cart));
            
            // Обновляем счетчик корзины
            updateCartCount();
            
            // Показываем уведомление
            showNotification('Товар добавлен в корзину', 'success');
          }
        });
      });
      
      // Добавляем обработчики для кнопок удаления
      const removeButtons = wishlistTabContent.querySelectorAll('.wishlist-remove');
      removeButtons.forEach(button => {
        button.addEventListener('click', function() {
          const itemId = this.getAttribute('data-id');
          
          // Удаляем товар из избранного
          const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
          const updatedWishlist = wishlist.filter(item => !(item.id === itemId && item.userEmail === user.email));
          
          localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
          
          // Обновляем интерфейс
          loadWishlist();
          
          // Показываем уведомление
          showNotification('Товар удален из избранного', 'success');
        });
      });
    }
  }

  // Settings Modal Logic
  function updateSettingsMenu() {
    if (!settingsMenuItems || settingsMenuItems.length === 0) return;
    
    // Заменяем содержимое
    profileContent.innerHTML = '';
    profileContent.appendChild(passwordForm);
    
    // Настраиваем функциональность переключателей паролей
    setupPasswordToggles();
    
    // Настраиваем индикатор силы пароля
    const newPasswordInput = document.getElementById('new-password');
    const strengthBar = document.querySelector('.strength-bar span');
    const strengthText = document.querySelector('.strength-text');
    
    if (newPasswordInput) {
      newPasswordInput.addEventListener('input', function() {
        updatePasswordStrength(this.value, strengthBar, strengthText);
      });
    }
    
    // Обработчик для кнопки сохранения пароля
    const savePasswordButton = document.querySelector('.password-save-btn');
    if (savePasswordButton) {
      savePasswordButton.addEventListener('click', function() {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Проверки
        if (!currentPassword) {
          showNotification('Введите текущий пароль', 'error');
          return;
        }
        
        if (!newPassword) {
          showNotification('Введите новый пароль', 'error');
          return;
        }
        
        if (newPassword !== confirmPassword) {
          showNotification('Пароли не совпадают', 'error');
          return;
        }
        
        // В реальном приложении здесь была бы проверка текущего пароля
        
        // Сохраняем новый пароль
        if (user) {
          const hashedPassword = hashPassword(newPassword);
          
          // Обновляем пароль в локальном хранилище
          const users = JSON.parse(localStorage.getItem('users')) || [];
          const userIndex = users.findIndex(u => u.email === user.email);
          
          if (userIndex !== -1) {
            users[userIndex].password = hashedPassword;
            localStorage.setItem('users', JSON.stringify(users));
            
            showNotification('Пароль успешно изменен', 'success');
            
            // Возвращаемся к профилю
            setTimeout(() => {
              profileContent.innerHTML = originalContent;
              // Восстанавливаем обработчики
              initProfileEditButtons();
              initProfileTabs();
            }, 1500);
          }
        }
      });
    }
    
    // Обработчик для кнопки отмены
    const cancelPasswordButton = document.querySelector('.password-cancel-btn');
    if (cancelPasswordButton) {
      cancelPasswordButton.addEventListener('click', function() {
        // Восстанавливаем первоначальное содержимое
        profileContent.innerHTML = originalContent;
        
        // Восстанавливаем обработчики
        initProfileEditButtons();
        initProfileTabs();
      });
    }

    // Обработчик для кнопки смены аватара
    const avatarChangeButton = document.querySelector('.avatar-change');
    if (avatarChangeButton) {
      avatarChangeButton.addEventListener('click', function() {
        // В реальном приложении здесь была бы логика загрузки изображения
        showNotification('Функция смены аватара будет доступна в ближайшем обновлении', 'info');
      });
    }
  }

  // Улучшенные уведомления с анимацией и иконками
  function showNotification(message, type = 'info', duration = 3000) {
    // Удаляем существующие уведомления для предотвращения наслоения
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
      notification.remove();
    });
    
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Определяем иконку в зависимости от типа уведомления
    let icon = 'fa-info-circle';
    switch (type) {
      case 'success':
        icon = 'fa-check-circle';
        break;
      case 'error':
        icon = 'fa-exclamation-circle';
        break;
      case 'warning':
        icon = 'fa-exclamation-triangle';
        break;
    }
    
    // Создаем содержимое уведомления
    notification.innerHTML = `
      <div class="notification__icon">
        <i class="fas ${icon}"></i>
      </div>
      <div class="notification__content">
        <div class="notification__message">${message}</div>
        <div class="notification__progress">
          <div class="notification__progress-bar"></div>
        </div>
      </div>
      <button class="notification__close">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Добавляем уведомление в DOM
    document.body.appendChild(notification);
    
    // Добавляем стили для уведомлений, если их еще нет
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          max-width: 350px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: stretch;
          overflow: hidden;
          z-index: 1000;
          opacity: 0;
          transform: translateX(30px);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .notification.visible {
          opacity: 1;
          transform: translateX(0);
        }
        
        body.dark .notification {
          background-color: #2a2a2a;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        }
        
        .notification__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          padding: 0 5px;
          font-size: 1.4rem;
        }
        
        .notification-info .notification__icon {
          background-color: #3498db;
          color: white;
        }
        
        .notification-success .notification__icon {
          background-color: #2ecc71;
          color: white;
        }
        
        .notification-warning .notification__icon {
          background-color: #f39c12;
          color: white;
        }
        
        .notification-error .notification__icon {
          background-color: #e74c3c;
          color: white;
        }
        
        .notification__content {
          flex: 1;
          padding: 15px 15px 12px;
          position: relative;
        }
        
        .notification__message {
          color: #333;
          margin-bottom: 8px;
          font-size: 0.95rem;
        }
        
        body.dark .notification__message {
          color: #f0f0f0;
        }
        
        .notification__progress {
          height: 3px;
          background-color: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }
        
        body.dark .notification__progress {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .notification__progress-bar {
          height: 100%;
          width: 100%;
          border-radius: 3px;
          transform-origin: left;
          transform: scaleX(0);
        }
        
        .notification-info .notification__progress-bar {
          background-color: #3498db;
        }
        
        .notification-success .notification__progress-bar {
          background-color: #2ecc71;
        }
        
        .notification-warning .notification__progress-bar {
          background-color: #f39c12;
        }
        
        .notification-error .notification__progress-bar {
          background-color: #e74c3c;
        }
        
        .notification__close {
          background: none;
          border: none;
          color: #999;
          font-size: 0.9rem;
          padding: 8px;
          cursor: pointer;
          align-self: flex-start;
          margin: 5px 5px 0 0;
          transition: color 0.2s ease;
        }
        
        .notification__close:hover {
          color: #333;
        }
        
        body.dark .notification__close {
          color: #777;
        }
        
        body.dark .notification__close:hover {
          color: #f0f0f0;
        }
        
        @keyframes progressAnimation {
          0% { transform: scaleX(1); }
          100% { transform: scaleX(0); }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Анимируем появление уведомления
    setTimeout(() => {
      notification.classList.add('visible');
    }, 10);
    
    // Анимируем прогресс-бар
    const progressBar = notification.querySelector('.notification__progress-bar');
    progressBar.style.animation = `progressAnimation ${duration / 1000}s linear forwards`;
    
    // Добавляем обработчик для кнопки закрытия
    const closeButton = notification.querySelector('.notification__close');
    closeButton.addEventListener('click', () => {
      closeNotification(notification);
    });
    
    // Автоматически закрываем уведомление через указанное время
    const notificationTimeout = setTimeout(() => {
      closeNotification(notification);
    }, duration);
    
    // Останавливаем таймер при наведении мыши
    notification.addEventListener('mouseenter', () => {
      clearTimeout(notificationTimeout);
      progressBar.style.animationPlayState = 'paused';
    });
    
    // Возобновляем таймер при уходе мыши
    notification.addEventListener('mouseleave', () => {
      const remainingTime = getRemainingTime(progressBar);
      progressBar.style.animation = `progressAnimation ${remainingTime / 1000}s linear forwards`;
      
      const newTimeout = setTimeout(() => {
        closeNotification(notification);
      }, remainingTime);
      
      notification._timeout = newTimeout;
    });
    
    // Сохраняем ссылку на таймер в элементе
    notification._timeout = notificationTimeout;
    
    // Функция для закрытия уведомления
    function closeNotification(notification) {
      // Очищаем таймер, если он существует
      if (notification._timeout) {
        clearTimeout(notification._timeout);
      }
      
      // Анимируем исчезновение
      notification.classList.remove('visible');
      notification.style.opacity = 0;
      notification.style.transform = 'translateX(30px)';
      
      // Удаляем элемент после завершения анимации
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
    
    // Функция для получения оставшегося времени анимации
    function getRemainingTime(element) {
      const computedStyle = window.getComputedStyle(element);
      const animationDuration = parseFloat(computedStyle.animationDuration) * 1000;
      const animationPlayState = computedStyle.animationPlayState;
      const animationDelay = parseFloat(computedStyle.animationDelay) * 1000;
      
      if (animationPlayState === 'paused') {
        const animationName = computedStyle.animationName;
        const keyframes = Array.from(document.styleSheets)
          .flatMap(sheet => {
            try {
              return Array.from(sheet.cssRules);
            } catch (e) {
              return [];
            }
          })
          .find(rule => rule.type === CSSRule.KEYFRAMES_RULE && rule.name === animationName);
        
        if (keyframes) {
          const currentTime = parseFloat(computedStyle.animationTimingFunction);
          return animationDuration * (1 - currentTime);
        }
      }
      
      // Возвращаем значение по умолчанию, если не можем определить оставшееся время
      return 2000;
    }
    
    return {
      close: () => closeNotification(notification)
    };
  }

  // Добавляем стили для истории заказов и избранного
  function addProfileStyles() {
    // Проверяем, существуют ли уже стили
    if (document.getElementById('profile-enhanced-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'profile-enhanced-styles';
    style.textContent = `
      /* Стили для истории заказов */
      .orders-list {
        width: 100%;
      }
      
      .orders-title {
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 15px;
        color: #333;
      }
      
      body.dark .orders-title {
        color: #f0f0f0;
      }
      
      .orders-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
        max-height: 400px;
        overflow-y: auto;
        padding-right: 5px;
      }
      
      .order-item {
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      
      body.dark .order-item {
        background-color: #333;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      
      .order-item:hover {
        transform: translateY(-3px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
      }
      
      body.dark .order-item:hover {
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      }
      
      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 15px;
        background-color: #f9f9f9;
        border-bottom: 1px solid #eee;
      }
      
      body.dark .order-header {
        background-color: #2a2a2a;
        border-bottom: 1px solid #444;
      }
      
      .order-info {
        display: flex;
        flex-direction: column;
      }
      
      .order-number {
        font-weight: 600;
        font-size: 0.95rem;
        color: #333;
        margin-bottom: 3px;
      }
      
      body.dark .order-number {
        color: #f0f0f0;
      }
      
      .order-date {
        font-size: 0.8rem;
        color: #777;
      }
      
      body.dark .order-date {
        color: #aaa;
      }
      
      .order-status {
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
      }
      
      .status-new {
        background-color: #e3f2fd;
        color: #1976d2;
      }
      
      .status-processing {
        background-color: #e8f5e9;
        color: #2e7d32;
      }
      
      .status-shipped {
        background-color: #fff8e1;
        color: #ff8f00;
      }
      
      .status-delivered {
        background-color: #e8f5e9;
        color: #2e7d32;
      }
      
      .status-completed {
        background-color: #e0f2f1;
        color: #00796b;
      }
      
      .status-cancelled {
        background-color: #ffebee;
        color: #c62828;
      }
      
      body.dark .status-new {
        background-color: rgba(25, 118, 210, 0.2);
        color: #64b5f6;
      }
      
      body.dark .status-processing {
        background-color: rgba(46, 125, 50, 0.2);
        color: #81c784;
      }
      
      body.dark .status-shipped {
        background-color: rgba(255, 143, 0, 0.2);
        color: #ffb74d;
      }
      
      body.dark .status-delivered {
        background-color: rgba(46, 125, 50, 0.2);
        color: #81c784;
      }
      
      body.dark .status-completed {
        background-color: rgba(0, 121, 107, 0.2);
        color: #4db6ac;
      }
      
      body.dark .status-cancelled {
        background-color: rgba(198, 40, 40, 0.2);
        color: #e57373;
      }
      
      .order-products {
        padding: 15px;
      }
      
      .order-product {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid #f0f0f0;
      }
      
      body.dark .order-product {
        border-bottom: 1px solid #444;
      }
      
      .order-product:last-child {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }
      
      .order-product-image {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 5px;
        margin-right: 12px;
      }
      
      .order-product-info {
        flex: 1;
      }
      
      .order-product-title {
        font-size: 0.9rem;
        font-weight: 500;
        color: #333;
        margin-bottom: 3px;
      }
      
      body.dark .order-product-title {
        color: #f0f0f0;
      }
      
      .order-product-price {
        font-size: 0.85rem;
        color: #777;
      }
      
      body.dark .order-product-price {
        color: #aaa;
      }
      
      .order-product-quantity {
        font-size: 0.85rem;
        color: #555;
        margin-left: 10px;
      }
      
      body.dark .order-product-quantity {
        color: #ccc;
      }
      
      .order-more-products {
        text-align: center;
        padding: 8px;
        background-color: #f5f5f5;
        border-radius: 5px;
        margin-top: 10px;
        font-size: 0.85rem;
        color: #666;
      }
      
      body.dark .order-more-products {
        background-color: #333;
        color: #bbb;
      }
      
      .order-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 15px;
        background-color: #f9f9f9;
        border-top: 1px solid #eee;
      }
      
      body.dark .order-footer {
        background-color: #2a2a2a;
        border-top: 1px solid #444;
      }
      
      .order-total {
        font-weight: 600;
        color: #333;
      }
      
      body.dark .order-total {
        color: #f0f0f0;
      }
      
      .order-total span {
        font-size: 1.1rem;
        color: #e74c3c;
      }
      
      body.dark .order-total span {
        color: #f77066;
      }
      
      .order-details-btn {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        background-color: #f0f0f0;
        border: none;
        border-radius: 5px;
        font-size: 0.85rem;
        color: #333;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .order-details-btn:hover {
        background-color: #e0e0e0;
        transform: translateY(-2px);
      }
      
      .order-details-btn i {
        margin-right: 8px;
      }
      
      body.dark .order-details-btn {
        background-color: #444;
        color: #f0f0f0;
      }
      
      body.dark .order-details-btn:hover {
        background-color: #555;
      }
      
      /* Стили для модального окна с деталями заказа */
      .modal-order-details {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }
      
      .modal-order-details[aria-hidden="false"] {
        opacity: 1;
        visibility: visible;
      }
      
      .modal-order-details__content {
        background: #fff;
        border-radius: 10px;
        padding: 25px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        transform: scale(0.8);
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      
      .modal-order-details[aria-hidden="false"] .modal-order-details__content {
        transform: scale(1);
      }
      
      body.dark .modal-order-details__content {
        background: #2a2a2a;
        color: #f0f0f0;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
      }
      
      .order-details-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #eee;
      }
      
      body.dark .order-details-header {
        border-bottom: 1px solid #444;
      }
      
      .order-details-header h3 {
        margin: 0;
        font-size: 1.3rem;
        font-weight: 600;
        color: #333;
      }
      
      body.dark .order-details-header h3 {
        color: #f0f0f0;
      }
      
      .order-details-close {
        background: transparent;
        border: none;
        font-size: 1.5rem;
        color: #777;
        cursor: pointer;
        transition: color 0.2s ease;
      }
      
      .order-details-close:hover {
        color: #333;
      }
      
      body.dark .order-details-close {
        color: #999;
      }
      
      body.dark .order-details-close:hover {
        color: #f0f0f0;
      }
      
      .order-details-info {
        margin-bottom: 20px;
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 15px;
      }
      
      body.dark .order-details-info {
        background-color: #333;
      }
      
      .order-details-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
      }
      
      body.dark .order-details-row {
        border-bottom: 1px solid #444;
      }
      
      .order-details-row:last-child {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }
      
      .order-details-label {
        font-weight: 600;
        color: #555;
      }
      
      body.dark .order-details-label {
        color: #ccc;
      }
      
      .order-details-value {
        color: #333;
      }
      
      body.dark .order-details-value {
        color: #f0f0f0;
      }
      
      .order-details-products {
        margin-bottom: 20px;
      }
      
      .order-details-products h4 {
        margin: 0 0 15px;
        font-size: 1.1rem;
        font-weight: 600;
        color: #333;
      }
      
      body.dark .order-details-products h4 {
        color: #f0f0f0;
      }
      
      .order-details-products-list {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      
      .order-details-product {
        display: flex;
        align-items: center;
        padding: 12px;
        border-radius: 8px;
        background-color: #f5f5f5;
      }
      
      body.dark .order-details-product {
        background-color: #333;
      }
      
      .order-details-product-image {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 5px;
        margin-right: 15px;
      }
      
      .order-details-product-info {
        flex: 1;
      }
      
      .order-details-product-title {
        font-weight: 500;
        color: #333;
        margin-bottom: 5px;
      }
      
      body.dark .order-details-product-title {
        color: #f0f0f0;
      }
      
      .order-details-product-price {
        font-size: 0.9rem;
        color: #777;
      }
      
      body.dark .order-details-product-price {
        color: #aaa;
      }
      
      .order-details-product-quantity {
        margin: 0 15px;
        color: #555;
        font-size: 0.9rem;
      }
      
      body.dark .order-details-product-quantity {
        color: #ccc;
      }
      
      .order-details-product-total {
        font-weight: 600;
        color: #e74c3c;
      }
      
      body.dark .order-details-product-total {
        color: #f77066;
      }
      
      .order-details-summary {
        margin-bottom: 20px;
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 15px;
      }
      
      body.dark .order-details-summary {
        background-color: #333;
      }
      
      .order-summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
        color: #555;
      }
      
      body.dark .order-summary-row {
        border-bottom: 1px solid #444;
        color: #ccc;
      }
      
      .order-summary-row:last-child {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }
      
      .order-summary-row.total {
        font-weight: 600;
        font-size: 1.1rem;
        color: #333;
      }
      
      body.dark .order-summary-row.total {
        color: #f0f0f0;
      }
      
      .order-summary-row.total span {
        color: #e74c3c;
      }
      
      body.dark .order-summary-row.total span {
        color: #f77066;
      }
      
      .order-details-actions {
        display: flex;
        justify-content: space-between;
        gap: 15px;
      }
      
      .order-repeat-btn,
      .order-cancel-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px 15px;
        border: none;
        border-radius: 8px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .order-repeat-btn {
        background-color: #3498db;
        color: white;
      }
      
      .order-repeat-btn:hover {
        background-color: #2980b9;
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
      }
      
      .order-repeat-btn i {
        margin-right: 8px;
      }
      
      .order-cancel-btn {
        background-color: #e74c3c;
        color: white;
      }
      
      .order-cancel-btn:hover {
        background-color: #c0392b;
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3);
      }
      
      .order-cancel-btn:disabled {
        background-color: #ccc;
        color: #777;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
      
      body.dark .order-cancel-btn:disabled {
        background-color: #555;
        color: #999;
      }
      
      .order-cancel-btn i {
        margin-right: 8px;
      }
      
      /* Стили для избранного */
      .wishlist-list {
        width: 100%;
      }
      
      .wishlist-title {
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 15px;
        color: #333;
      }
      
      body.dark .wishlist-title {
        color: #f0f0f0;
      }
      
      .wishlist-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 15px;
        max-height: 400px;
        overflow-y: auto;
        padding-right: 5px;
      }
      
      .wishlist-item {
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      
      body.dark .wishlist-item {
        background-color: #333;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      
      .wishlist-item:hover {
        transform: translateY(-3px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
      }
      
      body.dark .wishlist-item:hover {
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      }
      
      .wishlist-item-image {
        height: 120px;
        overflow: hidden;
      }
      
      .wishlist-item-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }
      
      .wishlist-item:hover .wishlist-item-image img {
        transform: scale(1.05);
      }
      
      .wishlist-item-info {
        padding: 12px;
      }
      
      .wishlist-item-title {
        font-weight: 500;
        font-size: 0.95rem;
        color: #333;
        margin-bottom: 5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      body.dark .wishlist-item-title {
        color: #f0f0f0;
      }
      
      .wishlist-item-price {
        font-size: 1.1rem;
        font-weight: 600;
        color: #e74c3c;
      }
      
      body.dark .wishlist-item-price {
        color: #f77066;
      }
      
      .wishlist-item-actions {
        display: flex;
        padding: 0 12px 12px;
        gap: 8px;
      }
      
      .wishlist-add-to-cart {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
        background-color: #3498db;
        border: none;
        border-radius: 5px;
        font-size: 0.85rem;
        color: white;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .wishlist-add-to-cart:hover {
        background-color: #2980b9;
      }
      
      .wishlist-add-to-cart i {
        margin-right: 5px;
      }
      
      .wishlist-remove {
        width: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f0f0f0;
        border: none;
        border-radius: 5px;
        color: #e74c3c;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .wishlist-remove:hover {
        background-color: #e74c3c;
        color: white;
      }
      
      body.dark .wishlist-remove {
        background-color: #444;
      }
      
      body.dark .wishlist-remove:hover {
        background-color: #c0392b;
      }
      
      /* Стили для кнопок в пустом состоянии */
      .btn-start-shopping,
      .btn-browse-catalog {
        padding: 10px 20px;
        background-color: #3498db;
        color: white;
        border: none;
        border-radius: 5px;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-top: 15px;
      }
      
      .btn-start-shopping:hover,
      .btn-browse-catalog:hover {
        background-color: #2980b9;
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
      }
      
      /* Адаптивные стили */
      @media (max-width: 768px) {
        .wishlist-container {
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        }
        
        .order-details-product {
          flex-wrap: wrap;
        }
        
        .order-details-product-quantity {
          width: 100%;
          margin: 10px 0 0;
        }
        
        .order-details-product-total {
          margin-top: 10px;
        }
        
        .order-details-actions {
          flex-direction: column;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  // Вызываем функцию при инициализации
  document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // Добавляем стили для профиля
    addProfileStyles();
    
    // ... existing code ...
  }); // Закрывающая скобка для DOMContentLoaded
}); // Закрывающая скобка для внешней анонимной функции