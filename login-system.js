document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginButton = document.querySelector('.toggle-auth-button') || document.getElementById('loginButton');
    const authModal = document.querySelector('.auth-modal');
    const authOverlay = document.querySelector('.auth-modal__overlay');
    const closeButton = document.querySelector('.auth-modal__close');
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const backButton = document.querySelector('.back-button');
    const successScreen = document.querySelector('.auth-success');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    const siteLoginButton = document.getElementById('loginButton');
    
    // Для переключения темы
    const darkModeBtns = document.querySelectorAll('[data-action="toggle-theme"]');
    /* Отключаем обработчик клика в этом файле, т.к. он уже обрабатывается в desktop.js
    if (darkModeBtns) {
        darkModeBtns.forEach(btn => {
            btn.addEventListener('click', toggleDarkMode);
        });
    }
    */
    
    // Проверка сохраненного состояния темы
    /*
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
    }
    */
    
    // Проверка статуса авторизации при загрузке
    checkLoginStatus();
    
    // Открыть модальное окно при нажатии на кнопку входа
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            openModal();
        });
    }
    
    // Обработка клика по кнопке в хедере
    if (siteLoginButton) {
        siteLoginButton.addEventListener('click', function() {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            
            if (userData.loggedIn) {
                // Если пользователь уже вошел, показываем меню с опциями в модальном окне
                showUserMenu(this);
            } else {
                // Если не вошел, открываем модальное окно входа
                openModal();
            }
        });
    }
    
    // Закрыть модальное окно при нажатии на кнопку закрытия или оверлей
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }
    if (authOverlay) {
        authOverlay.addEventListener('click', closeModal);
    }
    
    // Закрыть модальное окно при нажатии клавиши ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && authModal && authModal.classList.contains('active')) {
            closeModal();
        }
    });
    
    // Переключение между вкладками
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
    
    // Вернуться к форме входа из формы восстановления пароля
    if (backButton) {
        backButton.addEventListener('click', function() {
            switchTab('login');
        });
    }
    
    // Переключение видимости пароля
    if (togglePasswordButtons && togglePasswordButtons.length > 0) {
        togglePasswordButtons.forEach(button => {
            // Добавляем событие на клик для каждой кнопки
            button.addEventListener('click', function(e) {
                e.preventDefault(); // Предотвращаем поведение по умолчанию
                
                // Находим родительский контейнер input
                const container = this.closest('.input-container');
                if (!container) return;
                
                // Находим поле ввода пароля внутри этого контейнера
                const passwordField = container.querySelector('input[type="password"], input[type="text"]');
                if (!passwordField) return;
                
                console.log('Toggle button clicked, found password field:', passwordField);
                
                // Меняем тип поля между password и text
                if (passwordField.type === 'password') {
                    passwordField.type = 'text';
                    this.innerHTML = '<i class="fas fa-eye-slash"></i>';
                    console.log('Changed to text');
                } else {
                    passwordField.type = 'password';
                    this.innerHTML = '<i class="fas fa-eye"></i>';
                    console.log('Changed to password');
                }
            });
        });
    }
    
    // Создание интерактивного фона вместо цветных палочек
    if (typeof createInteractiveBackground === 'function') {
        createInteractiveBackground();
    } else {
        console.warn('createInteractiveBackground function not found');
    }
    
    // Обработка выхода из аккаунта
    document.addEventListener('click', function(e) {
        if (e.target && e.target.closest('[data-action="logout"]')) {
            e.preventDefault();
            logoutUser();
        }
    });
    
    // Обработка отправки форм
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmit(this, 'login');
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmit(this, 'register');
        });
        
        // Проверка силы пароля
        const passwordInput = document.getElementById('registerPassword');
        if (passwordInput) {
            const strengthContainer = document.querySelector('.password-strength');
            if (strengthContainer) {
                strengthContainer.style.display = 'block';
            }
            passwordInput.addEventListener('input', checkPasswordStrength);
        }
    }
    
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmit(this, 'forgot');
        });
    }
    
    // Обработка отправки форм
    function handleFormSubmit(form, type) {
        // Валидация формы
        if (!validateForm(form)) {
            return;
        }
        
        // Показать состояние загрузки
        const submitButton = form.querySelector('.submit-button');
        submitButton.classList.add('loading');
        
        // Имитация запроса к API
        setTimeout(() => {
            submitButton.classList.remove('loading');
            
            // Сохранение данных пользователя
            if (type === 'login') {
                const email = document.getElementById('loginEmail').value;
                // Для демо, используем email как имя (до символа @)
                const name = email.split('@')[0];
                
                // Ищем, есть ли регистрация с такой почтой
                const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
                const existingUser = registeredUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
                
                const userData = {
                    email: email,
                    name: name,
                    loggedIn: true,
                    registrationDate: existingUser ? existingUser.registrationDate : new Date().toISOString(),
                    orders: existingUser && existingUser.orders ? existingUser.orders : []
                };
                localStorage.setItem('userData', JSON.stringify(userData));
                
                // Установка сообщения об успешном входе
                document.querySelector('.auth-success h2').textContent = 'Вход выполнен!';
                document.querySelector('.success-message').textContent = `Добро пожаловать, ${name}!`;
            } else if (type === 'register') {
                const email = document.getElementById('registerEmail').value;
                const name = document.getElementById('registerName').value;
                const password = document.getElementById('registerPassword').value;
                
                // Получаем массив зарегистрированных пользователей
                let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
                
                // Проверяем, существует ли уже пользователь с таким email
                if (registeredUsers.some(user => user.email.toLowerCase() === email.toLowerCase())) {
                    // Показываем сообщение об ошибке
                    const formGroup = document.getElementById('registerEmail').closest('.form-group');
                    formGroup.classList.add('error');
                    formGroup.querySelector('.error-message').textContent = 'Пользователь с таким email уже существует';
                    
                    // Убираем загрузку с кнопки
                    submitButton.classList.remove('loading');
                    return;
                }
                
                // Сохраняем данные пользователя
                const userData = {
                    email: email,
                    name: name,
                    loggedIn: true,
                    registrationDate: new Date().toISOString(),
                    orders: []
                };
                
                // Сохраняем текущего пользователя
                localStorage.setItem('userData', JSON.stringify(userData));
                
                // Добавляем нового пользователя в массив
                registeredUsers.push({
                    name: name,
                    email: email,
                    password: password, // В реальной системе нужно хешировать
                    ip: 'Локальная регистрация',
                    registrationDate: new Date().toISOString()
                });
                
                // Сохраняем обновленный массив
                localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
                
                // Установка сообщения об успешной регистрации
                document.querySelector('.auth-success h2').textContent = 'Регистрация завершена';
                document.querySelector('.success-message').textContent = `Ваш аккаунт создан, ${name}!`;
            } else if (type === 'forgot') {
                // Установка сообщения об отправке инструкций
                document.querySelector('.auth-success h2').textContent = 'Ссылка отправлена';
                document.querySelector('.success-message').textContent = 'Проверьте вашу электронную почту для получения инструкций по восстановлению пароля.';
            }
            
            // Показать сообщение об успехе
            showSuccessScreen(type);
            
            // Очистить форму
            form.reset();
            
            // Создать анимацию конфетти при успехе
            createConfetti();
            
            // Закрыть модальное окно и обновить страницу после короткой задержки
            if (type === 'login' || type === 'register') {
                setTimeout(() => {
                    closeModal();
                    // Обновить состояние авторизации без перезагрузки страницы
                    checkLoginStatus();
                }, 2000);
            }
        }, 1500);
    }
    
    // Валидация полей формы
    function validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input:not([type="checkbox"])');
        
        inputs.forEach(input => {
            const formGroup = input.closest('.form-group');
            const errorMessage = formGroup.querySelector('.error-message');
            
            // Сбросить состояние ошибки
            formGroup.classList.remove('error');
            
            // Проверка на пустое поле
            if (input.value.trim() === '') {
                formGroup.classList.add('error');
                errorMessage.textContent = 'Это поле обязательно для заполнения';
                isValid = false;
                return;
            }
            
            // Валидация email
            if (input.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value)) {
                    formGroup.classList.add('error');
                    errorMessage.textContent = 'Пожалуйста, введите корректный email адрес';
                    isValid = false;
                }
            }
            
            // Валидация пароля
            if (input.type === 'password' && input.id === 'registerPassword') {
                if (input.value.length < 8) {
                    formGroup.classList.add('error');
                    errorMessage.textContent = 'Пароль должен содержать не менее 8 символов';
                    isValid = false;
                }
            }
            
            // Валидация подтверждения пароля
            if (input.id === 'registerPasswordConfirm') {
                const password = document.getElementById('registerPassword').value;
                if (input.value !== password) {
                    formGroup.classList.add('error');
                    errorMessage.textContent = 'Пароли не совпадают';
                    isValid = false;
                }
            }
        });
        
        // Проверка согласия с условиями при регистрации
        if (form.id === 'registerForm') {
            const termsCheckbox = form.querySelector('input[type="checkbox"]');
            const formGroup = termsCheckbox.closest('.form-group');
            
            if (!termsCheckbox.checked) {
                formGroup.classList.add('error');
                formGroup.querySelector('.error-message').textContent = 'Вы должны принять условия';
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    // Проверка силы пароля
    function checkPasswordStrength() {
        const password = this.value;
        const strengthBar = document.querySelector('.strength-indicator');
        const strengthText = document.querySelector('.strength-text');
        
        if (!strengthBar || !strengthText) return;
        
        let strength = 0;
        
        // Длина пароля
        if (password.length >= 8) strength += 1;
        if (password.length >= 12) strength += 1;
        
        // Наличие цифр
        if (/\d/.test(password)) strength += 1;
        
        // Наличие строчных и заглавных букв
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
        
        // Наличие специальных символов
        if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
        
        // Обновление индикатора и текста
        switch (true) {
            case (strength <= 2):
                strengthBar.style.width = '33%';
                strengthBar.style.backgroundColor = '#f44336';
                strengthText.textContent = 'Слабый';
                strengthText.style.color = '#f44336';
                break;
            case (strength === 3):
                strengthBar.style.width = '66%';
                strengthBar.style.backgroundColor = '#ff9800';
                strengthText.textContent = 'Средний';
                strengthText.style.color = '#ff9800';
                break;
            case (strength >= 4):
                strengthBar.style.width = '100%';
                strengthBar.style.backgroundColor = '#4caf50';
                strengthText.textContent = 'Сильный';
                strengthText.style.color = '#4caf50';
                break;
        }
    }
    
    // Создание анимации конфетти при успешном входе/регистрации
    function createConfetti() {
        const confetti = document.querySelector('.success-confetti');
        if (!confetti) return;
        
        confetti.innerHTML = '';
        
        const colors = ['#BCB88A', '#C9897B', '#4caf50', '#2196f3', '#ff9800'];
        
        for (let i = 0; i < 50; i++) {
            const confettiPiece = document.createElement('div');
            confettiPiece.className = 'confetti';
            confettiPiece.style.top = '0';
            confettiPiece.style.left = Math.random() * 100 + '%';
            
            // Случайный размер
            const size = Math.floor(Math.random() * 10) + 5;
            confettiPiece.style.width = size + 'px';
            confettiPiece.style.height = size + 'px';
            
            // Случайный цвет
            confettiPiece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            // Случайное время анимации
            const animationDuration = Math.random() * 2 + 1;
            confettiPiece.style.animation = `confettiDrop ${animationDuration}s ease forwards`;
            
            // Случайная задержка анимации
            confettiPiece.style.animationDelay = Math.random() * 0.5 + 's';
            
            // Случайное вращение
            const rotation = Math.random() * 360;
            confettiPiece.style.transform = `rotate(${rotation}deg)`;
            
            confetti.appendChild(confettiPiece);
        }
    }
    
    // Открытие модального окна
    function openModal() {
        if (authModal) {
            authModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Сбрасываем состояние форм при открытии
            forms.forEach(form => form.reset());
            
            // По умолчанию показываем форму входа
            switchTab('login');
            
            // Создаем интерактивный фон
            createInteractiveBackground();
        }
    }
    
    // Закрытие модального окна
    function closeModal() {
        if (authModal) {
            authModal.classList.remove('active');
            document.body.style.overflow = '';
            
            // Скрываем экран успеха
            if (successScreen) {
                successScreen.style.display = 'none';
            }
            
            // Сброс форм при закрытии
            forms.forEach(form => {
                form.reset();
                const formGroups = form.querySelectorAll('.form-group');
                formGroups.forEach(group => group.classList.remove('error'));
            });
        }
    }
    
    // Переключение между вкладками
    function switchTab(tabName) {
        // Активация вкладки
        tabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Скрываем сообщение об успехе
        if (successScreen) {
            successScreen.style.display = 'none';
        }
        
        // Отображение соответствующей формы
        forms.forEach(form => {
            if (form.id === `${tabName}Form`) {
                form.classList.add('active');
            } else {
                form.classList.remove('active');
            }
        });
    }
    
    // Отображение экрана успеха
    function showSuccessScreen(type) {
        // Скрыть все формы
        forms.forEach(form => form.classList.remove('active'));
        
        // Показать экран успеха
        if (successScreen) {
            successScreen.style.display = 'block';
            
            // Установить таймер для показа меню пользователя через 2 секунды
            setTimeout(() => {
                // Скрыть экран успеха
                successScreen.style.display = 'none';
                
                // Показать меню пользователя в модальном окне
                if (type === 'login' || type === 'register') {
                    showUserMenu(siteLoginButton);
                } else {
                    // Для других типов (например, forgot) просто закрываем модальное окно
                    closeModal();
                }
            }, 2000);
        }
    }
    
    // Переключение темной темы
    function toggleDarkMode() {
        console.log('LOGIN-SYSTEM.JS: Вызвана функция toggleDarkMode');
        console.log('LOGIN-SYSTEM.JS: Текущие классы body:', document.body.className);
        
        // Проверяем текущее состояние
        const isDarkNow = document.body.classList.contains('dark');
        console.log('LOGIN-SYSTEM.JS: Текущее состояние темной темы:', isDarkNow);
        
        if (isDarkNow) {
            // Если сейчас темная тема - переключаем на светлую
            document.body.classList.remove('dark');
            document.body.classList.add('light');
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
            console.log('LOGIN-SYSTEM.JS: Переключаем на светлую, новые классы body:', document.body.className);
        } else {
            // Если сейчас светлая тема - переключаем на темную
            document.body.classList.remove('light');
            document.body.classList.add('dark');
            document.documentElement.classList.remove('light');
            document.documentElement.classList.add('dark');
            console.log('LOGIN-SYSTEM.JS: Переключаем на темную, новые классы body:', document.body.className);
        }
        
        // Проверяем классы через 100мс
        setTimeout(() => {
            console.log('LOGIN-SYSTEM.JS: Классы body после 100мс:', document.body.className);
        }, 100);
        
        // Проверяем классы через 500мс
        setTimeout(() => {
            console.log('LOGIN-SYSTEM.JS: Классы body после 500мс:', document.body.className);
        }, 500);
        
        // Сохраняем состояние темы
        const isDark = document.body.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Принудительно обновляем отображение иконок
        document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
            const sunIcon = btn.querySelector('i.fa-sun');
            const moonIcon = btn.querySelector('i.fa-moon');
            
            if (sunIcon && moonIcon) {
                if (isDark) {
                    sunIcon.style.cssText = 'display: none !important';
                    moonIcon.style.cssText = 'display: inline-block !important';
                } else {
                    sunIcon.style.cssText = 'display: inline-block !important';
                    moonIcon.style.cssText = 'display: none !important';
                }
            }
        });
    }
    
    // Проверка статуса авторизации
    function checkLoginStatus() {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const isLoggedIn = userData.loggedIn || false;
        
        if (siteLoginButton) {
            if (isLoggedIn) {
                siteLoginButton.innerHTML = `<i class="fas fa-user"></i><span>${userData.name}</span>`;
                siteLoginButton.classList.add('logged-in');
            } else {
                siteLoginButton.innerHTML = `<i class="fas fa-sign-in-alt"></i><span>Войти</span>`;
                siteLoginButton.classList.remove('logged-in');
            }
        }
    }
    
    // Выход из аккаунта
    function logoutUser() {
        localStorage.removeItem('userData');
        checkLoginStatus();
        showNotification('Вы успешно вышли из системы', 'success');
        
        // Восстанавливаем оригинальное содержимое модального окна, если оно открыто
        const contentWrapper = document.querySelector('.auth-modal__content-wrapper');
        if (contentWrapper && contentWrapper.dataset.originalContent) {
            contentWrapper.innerHTML = contentWrapper.dataset.originalContent;
            // Переключаемся на вкладку входа
            switchTab('login');
        }
        
        // Закрыть модальное окно, если оно открыто
        if (authModal && authModal.classList.contains('active')) {
            closeModal();
        }
        
        // Закрыть меню пользователя, если оно открыто
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            userMenu.style.opacity = '0';
            userMenu.style.visibility = 'hidden';
            userMenu.style.transform = 'translateY(10px)';
        }
    }
    
    // Отображение меню пользователя
    function showUserMenu(button) {
        // Check if desktop menu is already open and use it instead if possible
        const desktopMenu = document.getElementById('userMenu');
        if (desktopMenu && desktopMenu.getAttribute('aria-hidden') === 'false') {
            return; // Desktop menu is already open, don't create another one
        }
        
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        // Проверяем, открыто ли модальное окно
        if (authModal && authModal.classList.contains('active')) {
            // Если модальное окно открыто, отображаем меню внутри него
            let userMenuContent = `
                <div class="user-menu-modal">
                    <div class="decorative-shape shape-1"></div>
                    <div class="decorative-shape shape-2"></div>
                    <div class="decorative-shape shape-3"></div>
                    
                    <div class="user-menu__header">
                        <div class="user-menu__avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="user-menu__name-container">
                            <div class="user-menu__name">
                                <span class="name-text">${userData.name}</span>
                                <div class="account-status">
                                    <div class="status-indicator"></div>
                                    <span>212</span>
                                </div>
                            </div>
                            <div class="user-menu__email">${userData.email}</div>
                        </div>
                    </div>
                    
                    <div class="user-menu-scrollable">
                        <div class="welcome-message">
                            <i class="fas fa-crown welcome-icon"></i>
                            <span>Добро пожаловать в личный кабинет!</span>
                        </div>
                        
                        <div class="user-menu__items">
                            <div class="user-menu__item" data-action="profile">
                                <i class="fas fa-user-circle"></i>
                                <span>Мой профиль</span>
                                <i class="fas fa-chevron-right item-chevron"></i>
                            </div>
                            <div class="user-menu__item" data-action="orders">
                                <i class="fas fa-shopping-bag"></i>
                                <span>Мои заказы</span>
                                <i class="fas fa-chevron-right item-chevron"></i>
                            </div>
                            <div class="user-menu__item" data-action="settings">
                                <i class="fas fa-cog"></i>
                                <span>Настройки</span>
                                <i class="fas fa-chevron-right item-chevron"></i>
                            </div>
                            <div class="user-menu__item" data-action="logout">
                                <i class="fas fa-sign-out-alt"></i>
                                <span>Выйти</span>
                                <i class="fas fa-chevron-right item-chevron"></i>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Находим контентную часть модального окна и заменяем её содержимое на меню пользователя
            const contentWrapper = document.querySelector('.auth-modal__content-wrapper');
            if (contentWrapper) {
                // Сохраняем оригинальное содержимое для возможного восстановления после выхода
                if (!contentWrapper.dataset.originalContent) {
                    contentWrapper.dataset.originalContent = contentWrapper.innerHTML;
                }
                contentWrapper.innerHTML = userMenuContent;
                
                // Добавляем анимацию для пунктов меню
                setTimeout(() => {
                    const menuItems = contentWrapper.querySelectorAll('.user-menu-scrollable .user-menu__item');
                    menuItems.forEach((item, index) => {
                        item.style.opacity = '0';
                        item.style.transform = 'translateY(20px)';
                        item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                        item.style.transitionDelay = `${0.1 + index * 0.1}s`;
                        
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, 50);
                    });
                }, 100);
                
                // Добавляем обработчики для пунктов меню
                const menuItems = contentWrapper.querySelectorAll('.user-menu__item');
                menuItems.forEach(item => {
                    item.addEventListener('click', function(e) {
                        const action = this.getAttribute('data-action');
                        
                        // Выполняем соответствующее действие
                        if (action === 'logout') {
                            logoutUser();
                            
                            // Восстанавливаем оригинальное содержимое модального окна
                            if (contentWrapper.dataset.originalContent) {
                                contentWrapper.innerHTML = contentWrapper.dataset.originalContent;
                                // Переключаемся на вкладку входа
                                switchTab('login');
                            }
                        } else if (action === 'profile') {
                            // Закрываем модальное окно
                            closeModal();
                            // Проверяем, есть ли функция showProfileModal
                            if (typeof showProfileModal === 'function') {
                                showProfileModal();
                            } else {
                                // Для совместимости с мобильной версией
                                showNotification(`Функция "${this.querySelector('span').textContent}" находится в разработке`, 'info');
                            }
                        } else if (action === 'orders') {
                            // Закрываем модальное окно
                            closeModal();
                            // Проверяем, есть ли функция showOrdersModal
                            if (typeof showOrdersModal === 'function') {
                                // Всегда показываем модальное окно заказов
                                showOrdersModal();
                            } else {
                                showNotification('Функция "Мои заказы" находится в разработке', 'info');
                            }
                        } else if (action === 'settings') {
                            // Закрываем модальное окно
                            closeModal();
                            // Проверяем, есть ли функция showSettingsModal
                            if (typeof showSettingsModal === 'function') {
                                showSettingsModal();
                            } else {
                                showNotification('Функция "Настройки" находится в разработке', 'info');
                            }
                        } else {
                            showNotification(`Функция "${this.querySelector('span').textContent}" находится в разработке`, 'info');
                        }
                    });
                });
            }
        } else {
            // Если модальное окно закрыто, открываем его и затем показываем меню пользователя
            openModal();
            
            // Используем setTimeout, чтобы дать время модальному окну открыться
            setTimeout(() => {
                showUserMenu(button);
            }, 100);
        }
    }
    
    // Отображение уведомлений
    function showNotification(message, type = 'info', duration = 3000) {
        // Проверяем, существует ли глобальная функция showNotification в desktop.js
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type, duration);
            return;
        }
        
        // Создаем элемент уведомления в современном стиле
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
          <div class="notification__icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
          </div>
          <div class="notification__content">
            <p>${message}</p>
          </div>
          <button class="notification__close">&times;</button>
        `;
        
        // Добавляем стили, если они еще не определены
        if (!document.getElementById('notification-styles')) {
          const style = document.createElement('style');
          style.id = 'notification-styles';
          style.textContent = `
            .notification {
              position: fixed;
              top: 20px;
              right: 20px;
              display: flex;
              align-items: center;
              padding: 15px 20px;
              background: white;
              border-radius: 12px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.2);
              z-index: 9999;
              max-width: 350px;
              transform: translateX(100%) scale(0.9);
              animation: slide-in 0.5s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .notification--success {
              border-left: 4px solid #4CAF50;
            }
            .notification--error {
              border-left: 4px solid #F44336;
            }
            .notification--info {
              border-left: 4px solid #2196F3;
            }
            .notification--warning {
              border-left: 4px solid #FF9800;
            }
            .notification__icon {
              margin-right: 15px;
              font-size: 20px;
            }
            .notification--success .notification__icon {
              color: #4CAF50;
            }
            .notification--error .notification__icon {
              color: #F44336;
            }
            .notification--info .notification__icon {
              color: #2196F3;
            }
            .notification--warning .notification__icon {
              color: #FF9800;
            }
            .notification__content {
              flex: 1;
            }
            .notification__content p {
              margin: 0;
              color: #333;
              font-size: 14px;
            }
            .notification__close {
              background: none;
              border: none;
              color: #999;
              cursor: pointer;
              font-size: 20px;
              transition: color 0.2s;
            }
            .notification__close:hover {
              color: #333;
            }
            body.dark .notification {
              background: #333;
              box-shadow: 0 10px 25px rgba(0,0,0,0.4);
            }
            body.dark .notification__content p {
              color: #f0f0f0;
            }
            body.dark .notification__close {
              color: #aaa;
            }
            body.dark .notification__close:hover {
              color: #f0f0f0;
            }
            @keyframes slide-in {
              to {
                transform: translateX(0) scale(1);
              }
            }
            @keyframes slide-out {
              to {
                transform: translateX(100%) scale(0.9);
              }
            }
          `;
          document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Используем data-attribute для отслеживания состояния
        notification.setAttribute('data-visible', 'true');
        
        const closeBtn = notification.querySelector('.notification__close');
          closeBtn.addEventListener('click', () => {
          notification.style.animation = 'slide-out 0.3s forwards';
          notification.setAttribute('data-visible', 'false');
          setTimeout(() => {
            notification.remove();
          }, 300);
        });
        
        setTimeout(() => {
          notification.style.animation = 'slide-out 0.3s forwards';
          notification.setAttribute('data-visible', 'false');
          setTimeout(() => {
            notification.remove();
          }, 300);
        }, duration);
    }
    
    // Создание интерактивного фона
    function createInteractiveBackground() {
        // Находим нужные элементы
        const background = document.querySelector('.animated-background');
        const particlesContainer = document.querySelector('.light-particles');
        
        if (!background || !particlesContainer) return;
        
        // Очищаем контейнер частиц
        particlesContainer.innerHTML = '';
        
        // Создаем светящиеся частицы
        for (let i = 0; i < 30; i++) {
            createParticle(particlesContainer);
        }
        
        // Создаем светящиеся линии
        for (let i = 0; i < 5; i++) {
            createGlowLine(background);
        }
        
        // Создаем светящиеся круги
        for (let i = 0; i < 8; i++) {
            createGlowCircle(background);
        }
        
        // Создаем пульсирующие точки
        for (let i = 0; i < 15; i++) {
            createPulseDot(background);
        }
        
        // Добавляем обработку движения курсора
        const brandSection = document.querySelector('.auth-modal__brand');
        if (brandSection) {
            brandSection.addEventListener('mousemove', handleMouseMove);
        }
    }

    // Функция создания светящейся частицы
    function createParticle(container) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Случайный размер
        const size = Math.random() * 50 + 20;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        // Случайная позиция
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        
        // Добавляем анимацию
        animateParticle(particle);
        
        // Добавляем в контейнер
        container.appendChild(particle);
    }

    // Функция анимации частицы
    function animateParticle(particle) {
        // Случайная продолжительность анимации
        const duration = Math.random() * 3000 + 2000;
        
        // Начальная прозрачность
        particle.style.opacity = '0';
        
        // Анимируем появление и исчезновение
        setTimeout(() => {
            particle.style.transition = `opacity ${duration/2}ms ease-in-out`;
            particle.style.opacity = Math.random() * 0.3 + 0.1;
            
            setTimeout(() => {
                particle.style.opacity = '0';
                
                // После завершения анимации, запускаем снова с новыми параметрами
                setTimeout(() => {
                    // Новая позиция
                    particle.style.transition = 'none';
                    particle.style.left = Math.random() * 100 + '%';
                    particle.style.top = Math.random() * 100 + '%';
                    
                    // Запускаем анимацию снова
                    animateParticle(particle);
                }, duration/2);
            }, duration/2);
        }, Math.random() * 1000);
    }

    // Функция создания светящейся линии
    function createGlowLine(container) {
        const line = document.createElement('div');
        line.className = 'glow-line';
        
        // Случайная позиция по вертикали
        line.style.top = Math.random() * 100 + '%';
        line.style.opacity = '0';
        
        // Добавляем анимацию
        animateGlowLine(line);
        
        // Добавляем в контейнер
        container.appendChild(line);
    }

    // Функция анимации светящейся линии
    function animateGlowLine(line) {
        // Случайная продолжительность анимации
        const duration = Math.random() * 3000 + 3000;
        const delay = Math.random() * 2000;
        
        setTimeout(() => {
            line.style.transition = `transform ${duration}ms linear, opacity ${duration/4}ms ease-in-out`;
            line.style.opacity = Math.random() * 0.2 + 0.1;
            line.style.transform = 'scaleX(1)';
            
            setTimeout(() => {
                line.style.opacity = '0';
                
                // После завершения анимации, запускаем снова с новыми параметрами
                setTimeout(() => {
                    // Новая позиция
                    line.style.transition = 'none';
                    line.style.transform = 'scaleX(0)';
                    line.style.top = Math.random() * 100 + '%';
                    
                    // Запускаем анимацию снова
                    animateGlowLine(line);
                }, duration/2);
            }, duration - duration/4);
        }, delay);
    }

    // Функция создания светящегося круга
    function createGlowCircle(container) {
        const circle = document.createElement('div');
        circle.className = 'glow-circle';
        
        // Случайный размер
        const size = Math.random() * 100 + 50;
        circle.style.width = size + 'px';
        circle.style.height = size + 'px';
        
        // Случайная позиция
        circle.style.left = Math.random() * 100 + '%';
        circle.style.top = Math.random() * 100 + '%';
        circle.style.opacity = '0';
        
        // Добавляем анимацию
        animateGlowCircle(circle);
        
        // Добавляем в контейнер
        container.appendChild(circle);
    }

    // Функция анимации светящегося круга
    function animateGlowCircle(circle) {
        // Случайная продолжительность анимации
        const duration = Math.random() * 6000 + 4000;
        const delay = Math.random() * 3000;
        
        setTimeout(() => {
            circle.style.transition = `transform ${duration}ms ease-in-out, opacity ${duration/3}ms ease-in-out`;
            circle.style.opacity = Math.random() * 0.2 + 0.1;
            circle.style.transform = 'scale(1.2)';
            
            setTimeout(() => {
                circle.style.opacity = '0';
                
                // После завершения анимации, запускаем снова с новыми параметрами
                setTimeout(() => {
                    // Новая позиция и размер
                    circle.style.transition = 'none';
                    circle.style.transform = 'scale(0.8)';
                    const size = Math.random() * 100 + 50;
                    circle.style.width = size + 'px';
                    circle.style.height = size + 'px';
                    circle.style.left = Math.random() * 100 + '%';
                    circle.style.top = Math.random() * 100 + '%';
                    
                    // Запускаем анимацию снова
                    animateGlowCircle(circle);
                }, duration/3);
            }, duration * 2/3);
        }, delay);
    }

    // Функция создания пульсирующей точки
    function createPulseDot(container) {
        const dot = document.createElement('div');
        dot.className = 'pulse-dot';
        
        // Случайная позиция
        dot.style.left = Math.random() * 100 + '%';
        dot.style.top = Math.random() * 100 + '%';
        
        // Случайный размер
        const size = Math.random() * 3 + 2;
        dot.style.width = size + 'px';
        dot.style.height = size + 'px';
        
        // Добавляем анимацию
        animatePulseDot(dot);
        
        // Добавляем в контейнер
        container.appendChild(dot);
    }

    // Функция анимации пульсирующей точки
    function animatePulseDot(dot) {
        // Случайная продолжительность анимации
        const duration = Math.random() * 2000 + 1000;
        
        // Анимация пульсации
        dot.style.animation = `mainPulse ${duration}ms ease-in-out infinite`;
    }

    // Обработка движения мыши для создания эффекта интерактивности
    function handleMouseMove(e) {
        const brandSection = e.currentTarget;
        const rect = brandSection.getBoundingClientRect();
        
        // Вычисляем координаты мыши относительно секции
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Создаем временную частицу при движении мыши
        if (Math.random() > 0.7) { // Ограничиваем количество создаваемых частиц
            const particlesContainer = brandSection.querySelector('.light-particles');
            if (particlesContainer) {
                const mouseParticle = document.createElement('div');
                mouseParticle.className = 'particle';
                
                // Размещаем частицу в позиции курсора
                mouseParticle.style.left = (x / rect.width * 100) + '%';
                mouseParticle.style.top = (y / rect.height * 100) + '%';
                
                // Задаем размер
                const size = Math.random() * 30 + 10;
                mouseParticle.style.width = size + 'px';
                mouseParticle.style.height = size + 'px';
                
                // Анимируем появление и исчезновение
                mouseParticle.style.opacity = '0';
                mouseParticle.style.transition = 'opacity 500ms ease-in-out';
                
                particlesContainer.appendChild(mouseParticle);
                
                // Появление
                setTimeout(() => {
                    mouseParticle.style.opacity = Math.random() * 0.2 + 0.1;
                    
                    // Исчезновение и удаление
                    setTimeout(() => {
                        mouseParticle.style.opacity = '0';
                        
                        setTimeout(() => {
                            if (particlesContainer.contains(mouseParticle)) {
                                particlesContainer.removeChild(mouseParticle);
                            }
                        }, 500);
                    }, 300);
                }, 10);
            }
        }
    }

    // Добавляем обработчики событий для регистрационных форм
    document.addEventListener('DOMContentLoaded', function() {
        // Запрет вставки пароля в поле подтверждения
        const confirmPasswordFields = document.querySelectorAll('#registerPasswordConfirm');
        
        confirmPasswordFields.forEach(function(field) {
            // Предотвращаем вставку из буфера обмена
            field.addEventListener('paste', function(e) {
                e.preventDefault();
                
                // Показываем сообщение
                const formGroup = field.closest('.form-group');
                const errorMessage = formGroup.querySelector('.error-message');
                formGroup.classList.add('error');
                errorMessage.textContent = 'Да, вот такие вот мы дотошные';
                
                // Удаляем сообщение через 3 секунды
                setTimeout(() => {
                    if (field.value.trim() === '') {  // Только если поле все еще пустое
                        formGroup.classList.remove('error');
                        errorMessage.textContent = '';
                    }
                }, 3000);
            });
        });
    });
}); 