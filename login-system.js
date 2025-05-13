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
    const forgotPasswordLink = document.querySelector('.forgot-password-link');
    
    // Флаг для использования модального меню пользователя
    const useModalUserMenu = true; // По умолчанию используем модальное меню
    
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
    
    // Функция для отображения уведомлений
    function showNotification(message, type = 'info', duration = 5000) {
        // Проверяем, существует ли уже глобальная функция showNotification
        if (window.showNotification && typeof window.showNotification === 'function' && window.showNotification !== showNotification) {
            window.showNotification(message, type, duration);
            return;
        }
        
        // Проверка, загружены ли стили
        if (!document.getElementById('notification-styles-link')) {
            const link = document.createElement('link');
            link.id = 'notification-styles-link';
            link.rel = 'stylesheet';
            link.href = 'notifications.css';
            document.head.appendChild(link);
        }
        
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        
        // Добавляем иконку в зависимости от типа уведомления
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        notification.innerHTML = `
            <div class="notification__icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="notification__content">
                <div class="notification__message">${message}</div>
            </div>
            <button class="notification__close" aria-label="Закрыть">
                <i class="fas fa-times"></i>
            </button>
            <div class="notification__progress"></div>
        `;
        
        // Добавляем уведомление в DOM
        document.body.appendChild(notification);
        
        // Активируем анимацию появления
        setTimeout(() => {
            notification.classList.add('notification--active');
        }, 10);
        
        // Анимируем прогресс-бар
        const progressBar = notification.querySelector('.notification__progress');
        if (progressBar && duration > 0) {
            progressBar.style.transition = `transform ${duration}ms linear`;
            progressBar.style.transform = 'scaleX(1)';
            
            setTimeout(() => {
                progressBar.style.transform = 'scaleX(0)';
            }, 50);
        }
        
        // Добавляем обработчик для закрытия уведомления
        const closeButton = notification.querySelector('.notification__close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                closeNotification(notification);
            });
        }
        
        // Автоматически закрываем уведомление через указанное время
        if (duration > 0) {
            setTimeout(() => {
                closeNotification(notification);
            }, duration);
        }
        
        // Функция для закрытия уведомления
        function closeNotification(notificationElement) {
            notificationElement.classList.remove('notification--active');
            notificationElement.style.animation = 'slide-out 0.3s forwards';
            
            // Удаляем элемент после завершения анимации
            setTimeout(() => {
                if (notificationElement.parentNode) {
                    notificationElement.parentNode.removeChild(notificationElement);
                }
            }, 300);
        }
        
        // Возвращаем объект с методами для управления уведомлением
        return {
            close: () => closeNotification(notification),
            update: (newMessage) => {
                const messageElement = notification.querySelector('.notification__message');
                if (messageElement) {
                    messageElement.textContent = newMessage;
                }
            },
            setType: (newType) => {
                notification.className = `notification notification--${newType} notification--active`;
                
                // Обновляем иконку
                let newIcon = 'info-circle';
                if (newType === 'success') newIcon = 'check-circle';
                if (newType === 'error') newIcon = 'exclamation-circle';
                if (newType === 'warning') newIcon = 'exclamation-triangle';
                
                const iconElement = notification.querySelector('.notification__icon i');
                if (iconElement) {
                    iconElement.className = `fas fa-${newIcon}`;
                }
            }
        };
    }
    
    // Создание тестовых пользователей для демонстрации
    function createTestUsers() {
        // Проверяем, создавались ли уже тестовые пользователи
        if (localStorage.getItem('testUsersCreated')) {
            return;
        }
        
        // Получаем текущий список пользователей или создаем пустой массив
        let users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        
        // Если список пуст, добавляем тестовых пользователей
        if (users.length === 0) {
            users.push({
                name: 'Иван',
                email: 'test@example.com',
                hashedPassword: 'kxspb7$1jm2hs', // пароль: password123
                registrationDate: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                orders: []
            });
            
            users.push({
                name: 'Мария',
                email: 'maria@example.com',
                hashedPassword: 'kxspb7$1jm2hs', // пароль: password123
                registrationDate: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                orders: []
            });
            
            // Сохраняем обновленный список пользователей
            localStorage.setItem('registeredUsers', JSON.stringify(users));
            
            // Отмечаем, что тестовые пользователи созданы
            localStorage.setItem('testUsersCreated', 'true');
            
            console.log('Созданы тестовые пользователи');
        }
    }
    
    // Вызываем функцию создания тестовых пользователей
    createTestUsers();
    
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
    
    // Создание интерактивного фона
    function createInteractiveBackground() {
        console.log('Создание интерактивного фона');
        // Проверяем, существует ли уже глобальная функция
        if (window.createInteractiveBackground && typeof window.createInteractiveBackground === 'function') {
            window.createInteractiveBackground();
            return;
        }
        
        // Простая заглушка для функции, если она не определена глобально
        const modalContent = document.querySelector('.auth-modal__content');
        if (!modalContent) return;
        
        // Добавляем декоративные элементы в фон
        const shapes = ['circle', 'square', 'triangle'];
        const colors = ['#BCB88A33', '#C9897B33', '#4caf5033', '#2196f333'];
        
        // Удаляем старые элементы, если они есть
        const oldShapes = modalContent.querySelectorAll('.bg-shape');
        oldShapes.forEach(shape => shape.remove());
        
        // Создаем новые декоративные элементы
        for (let i = 0; i < 5; i++) {
            const shape = document.createElement('div');
            shape.className = `bg-shape ${shapes[i % shapes.length]}`;
            shape.style.position = 'absolute';
            shape.style.opacity = '0.15';
            shape.style.backgroundColor = colors[i % colors.length];
            shape.style.width = `${Math.random() * 100 + 50}px`;
            shape.style.height = `${Math.random() * 100 + 50}px`;
            shape.style.top = `${Math.random() * 100}%`;
            shape.style.left = `${Math.random() * 100}%`;
            shape.style.transform = `rotate(${Math.random() * 360}deg)`;
            shape.style.borderRadius = shapes[i % shapes.length] === 'circle' ? '50%' : '0';
            shape.style.zIndex = '0';
            
            modalContent.appendChild(shape);
        }
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
    
    // Обработчик ссылки "Забыли пароль?"
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            switchTab('forgotPassword');
        });
    }
    
    // Обработка отправки форм
    async function handleFormSubmit(form, type) {
        // Валидация формы
        if (!validateForm(form)) {
            return;
        }
        
        // Показать состояние загрузки
        const submitButton = form.querySelector('.submit-button');
        submitButton.classList.add('loading');
        
        try {
            // Сохранение данных пользователя
            if (type === 'login') {
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                
                // Проверяем, заблокирован ли аккаунт из-за множества неудачных попыток
                const accountStatus = isAccountBlocked(email);
                if (accountStatus.blocked) {
                    // Показываем ошибку - аккаунт временно заблокирован
                    const formGroup = document.getElementById('loginEmail').closest('.form-group');
                    formGroup.classList.add('error');
                    formGroup.querySelector('.error-message').textContent = accountStatus.message;
                    submitButton.classList.remove('loading');
                    return;
                }
                
                // Получаем массив зарегистрированных пользователей
                const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
                const existingUser = registeredUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
                
                // Проверяем существует ли пользователь
                if (!existingUser) {
                    // Фиксируем неудачную попытку входа
                    trackLoginAttempts(email, false);
                    
                    // Показываем ошибку - пользователь не найден
                    const formGroup = document.getElementById('loginEmail').closest('.form-group');
                    formGroup.classList.add('error');
                    formGroup.querySelector('.error-message').textContent = 'Пользователь с таким email не найден';
                    submitButton.classList.remove('loading');
                    return;
                }
                
                // Проверяем правильность пароля
                let passwordIsCorrect = false;
                
                if (existingUser.hashedPassword) {
                    // Если используется хешированный пароль
                    passwordIsCorrect = await verifyPassword(password, existingUser.hashedPassword);
                } else {
                    // Для обратной совместимости со старыми аккаунтами
                    passwordIsCorrect = existingUser.password === password;
                }
                
                if (!passwordIsCorrect) {
                    // Фиксируем неудачную попытку входа
                    const attemptInfo = trackLoginAttempts(email, false);
                    
                    // Готовим сообщение об ошибке
                    let errorMessage = 'Неверный пароль';
                    
                    // Если это 3 или больше неудачная попытка, предупреждаем пользователя
                    if (attemptInfo && attemptInfo.count >= 3) {
                        const attemptsLeft = 5 - attemptInfo.count;
                        if (attemptsLeft > 0) {
                            errorMessage += `. Осталось попыток: ${attemptsLeft}`;
                        } else {
                            errorMessage += '. Аккаунт будет временно заблокирован.';
                        }
                    }
                    
                    // Показываем ошибку - неверный пароль
                    const formGroup = document.getElementById('loginPassword').closest('.form-group');
                    formGroup.classList.add('error');
                    formGroup.querySelector('.error-message').textContent = errorMessage;
                    submitButton.classList.remove('loading');
                    return;
                }
                
                // Фиксируем успешный вход
                trackLoginAttempts(email, true);
                
                // Успешный вход - берем данные из существующего пользователя
                const userData = {
                    email: existingUser.email,
                    name: existingUser.name,
                    loggedIn: true,
                    registrationDate: existingUser.registrationDate,
                    orders: existingUser.orders || []
                };
                localStorage.setItem('userData', JSON.stringify(userData));
                
                // Установка сообщения об успешном входе
                document.querySelector('.auth-success h2').textContent = 'Вход выполнен!';
                document.querySelector('.success-message').textContent = `Добро пожаловать, ${existingUser.name}!`;
                
                // Обновляем время последнего входа
                existingUser.lastLogin = new Date().toISOString();
                localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
                
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
                
                // Хешируем пароль
                const hashedPassword = await hashPassword(password);
                
                // Создаем объект нового пользователя
                const newUser = {
                    name: name,
                    email: email,
                    hashedPassword: hashedPassword, // Сохраняем хешированный пароль
                    ip: 'Локальная регистрация',
                    registrationDate: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    orders: []
                };
                
                // Добавляем нового пользователя в массив
                registeredUsers.push(newUser);
                
                // Сохраняем обновленный массив
                localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
                
                // Сохраняем данные текущего пользователя
                const userData = {
                    email: email,
                    name: name,
                    loggedIn: true,
                    registrationDate: new Date().toISOString(),
                    orders: []
                };
                localStorage.setItem('userData', JSON.stringify(userData));
                
                // Установка сообщения об успешной регистрации
                document.querySelector('.auth-success h2').textContent = 'Регистрация завершена';
                document.querySelector('.success-message').textContent = `Ваш аккаунт создан, ${name}!`;
            } else if (type === 'forgot') {
                const email = document.getElementById('forgotEmail').value;
                
                // Проверяем, существует ли пользователь с таким email
                const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
                const existingUser = registeredUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
                
                if (!existingUser) {
                    // Показываем ошибку - пользователь не найден
                    const formGroup = document.getElementById('forgotEmail').closest('.form-group');
                    formGroup.classList.add('error');
                    formGroup.querySelector('.error-message').textContent = 'Пользователь с таким email не найден';
                    submitButton.classList.remove('loading');
                    return;
                }
                
                // В реальном приложении здесь был бы код для отправки email
                // Для демо просто имитируем успешную отправку
                
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
        } finally {
            // В любом случае, убираем состояние загрузки через некоторое время
            setTimeout(() => {
                submitButton.classList.remove('loading');
            }, 500);
        }
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
        const authModal = document.querySelector('.auth-modal');
        if (authModal) {
            authModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Сбрасываем состояние форм при открытии
            forms.forEach(form => form.reset());
            
            // По умолчанию показываем форму входа
            switchTab('login');
            
            // Создаем интерактивный фон
            createInteractiveBackground();
        } else {
            // Если модального окна нет, создаем его
            createModalWindow();
            setTimeout(() => {
                const newModal = document.querySelector('.auth-modal');
                if (newModal) {
                    newModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    createInteractiveBackground();
                }
            }, 50);
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
        
        // Для формы восстановления пароля не переключаем tab-кнопки
        if (tabName === 'forgotPassword') {
            // Скрываем все вкладки, так как восстановление пароля - это отдельная форма
            tabs.forEach(tab => tab.parentElement.style.display = 'none');
            
            // Показываем кнопку "Назад"
            if (backButton) {
                backButton.style.display = 'block';
            }
        } else {
            // Показываем вкладки для остальных форм
            tabs.forEach(tab => tab.parentElement.style.display = '');
            
            // Скрываем кнопку "Назад" для основных форм
            if (backButton) {
                backButton.style.display = 'none';
            }
        }
        
        // Сбросить ошибки при переключении форм
        forms.forEach(form => {
            const formGroups = form.querySelectorAll('.form-group');
            formGroups.forEach(group => group.classList.remove('error'));
        });
        
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
        
        console.log('checkLoginStatus called, userData:', userData);
        console.log('isLoggedIn:', isLoggedIn);
        
        // Удаляем старые меню пользователя, если они есть
        const oldMenus = document.querySelectorAll('.user-menu, #userProfileMenu');
        oldMenus.forEach(menu => {
            if (menu && menu.parentNode) {
                menu.parentNode.removeChild(menu);
            }
        });
        
        const loginButton = document.getElementById('loginButton');
        if (!loginButton) {
            console.log('Login button not found');
            return;
        }
        
        // Клонируем кнопку, чтобы удалить все слушатели событий
        const newButton = loginButton.cloneNode(true);
        loginButton.parentNode.replaceChild(newButton, loginButton);
        
        if (isLoggedIn) {
            console.log('User is logged in, setting up user menu button');
            newButton.innerHTML = `<i class="fas fa-user"></i><span>${userData.name}</span>`;
            newButton.classList.add('logged-in');
            
            // Добавляем обработчик для клика
            newButton.addEventListener('click', function(e) {
                e.preventDefault(); // Предотвращаем стандартное поведение
                e.stopPropagation(); // Предотвращаем всплытие
                console.log('Login button clicked for logged in user');
                
                // Закрываем существующее меню перед открытием нового
                const existingMenu = document.getElementById('userProfileMenu');
                if (existingMenu) {
                    existingMenu.parentNode.removeChild(existingMenu);
                }
                
                showUserMenu(this);
            });
        } else {
            console.log('User is not logged in, setting up login button');
            newButton.innerHTML = `<i class="fas fa-sign-in-alt"></i><span>Войти</span>`;
            newButton.classList.remove('logged-in');
            
            // Добавляем обработчик для показа модального окна входа
            newButton.addEventListener('click', function(e) {
                e.preventDefault(); // Предотвращаем стандартное поведение
                console.log('Login button clicked for guest');
                openModal();
            });
        }
    }
    
    // Выход из аккаунта
    function logoutUser() {
        // Используем глобальный координатор для выхода
        if (window.logoutCoordinator && typeof window.logoutCoordinator.performLogout === 'function') {
            console.log('login-system.js: Using global logout coordinator');
            window.logoutCoordinator.performLogout();
            
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
            
            // Обновляем статус авторизации
            setTimeout(() => {
                checkLoginStatus();
            }, 100);
            
            return;
        }
        
        // Резервный вариант если координатор недоступен
        console.log('login-system.js: Using fallback logout method');
        
        // Полностью очищаем данные пользователя из localStorage
        localStorage.removeItem('userData');
        
        // Находим кнопку входа
        const loginButton = document.getElementById('loginButton');
        if (loginButton) {
            // Клонируем кнопку, чтобы удалить все слушатели событий
            const newButton = loginButton.cloneNode(true);
            loginButton.parentNode.replaceChild(newButton, loginButton);
            
            // Обновляем внешний вид кнопки
            newButton.innerHTML = `<i class="fas fa-sign-in-alt"></i><span>Войти</span>`;
            newButton.classList.remove('logged-in');
            
            // Добавляем новый обработчик для открытия модального окна
            newButton.addEventListener('click', function() {
                openModal();
            });
        }
        
        // Оповещаем пользователя
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
            
            // Полностью удаляем меню пользователя после исчезновения
            setTimeout(() => {
                if (userMenu && userMenu.parentNode) {
                    userMenu.parentNode.removeChild(userMenu);
                }
            }, 300);
        }
        
        // Обновляем статус авторизации
        setTimeout(() => {
            checkLoginStatus();
        }, 100);
        
        // Перезагрузка страницы через 1 секунду после выхода из аккаунта
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
    
    // Простая функция хеширования пароля для демонстрации
    // В реальном приложении нужно использовать более надежные методы
    function hashPassword(password) {
        // В реальном мире нужно использовать bcrypt или аналоги
        // Эта функция - заглушка для демонстрации
        return new Promise((resolve) => {
            // Простая хеш-функция для демонстрации
            let hash = 0;
            for (let i = 0; i < password.length; i++) {
                const char = password.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            
            // Добавляем соль и префикс для безопасности
            const salt = Date.now().toString(36);
            const hashedPassword = salt + '$' + (hash >>> 0).toString(36);
            
            // Имитируем асинхронную работу
            setTimeout(() => {
                resolve(hashedPassword);
            }, 100);
        });
    }
    
    // Функция для проверки пароля (для демонстрации)
    function verifyPassword(inputPassword, storedHash) {
        return new Promise((resolve) => {
            // Разделяем на соль и хеш
            const [salt, hash] = storedHash.split('$');
            
            // Хешируем введенный пароль с той же солью
            let calculatedHash = 0;
            for (let i = 0; i < inputPassword.length; i++) {
                const char = inputPassword.charCodeAt(i);
                calculatedHash = ((calculatedHash << 5) - calculatedHash) + char;
                calculatedHash = calculatedHash & calculatedHash;
            }
            
            // Сравниваем хеши
            const calculatedHashString = (calculatedHash >>> 0).toString(36);
            const matches = calculatedHashString === hash;
            
            // Имитируем асинхронную работу
            setTimeout(() => {
                resolve(matches);
            }, 100);
        });
    }
    
    // Отображение меню пользователя
    function showUserMenu(button) {
        console.log('showUserMenu called with button:', button);
        
        // Проверяем, авторизован ли пользователь
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (!userData.loggedIn) {
            console.log('User not logged in, showing auth modal instead');
            openModal();
            return;
        }
        
        // Отключаем обсервер меню, если он есть
        const menuObserver = window.disableMenuObserver ? window.disableMenuObserver() : null;
        
        // Получаем ссылку на модальное окно авторизации
        const authModal = document.querySelector('.auth-modal');
        
        // Проверяем, открыто ли модальное окно или нужно использовать модальный стиль меню
        if ((authModal && authModal.classList.contains('active')) || useModalUserMenu) {
            console.log('Modal is open or modal menu style is enabled, showing menu with modal style');
            
            // Если модальное окно не открыто, но нужно использовать модальный стиль меню,
            // создаем и открываем модальное окно
            if (!authModal || !authModal.classList.contains('active')) {
                // Создаем модальное окно, если его нет
                if (!authModal) {
                    createModalWindow();
                }
                // Открываем модальное окно
                openModal();
            }
            
            // Если модальное окно открыто или включен флаг модального меню, отображаем меню в модальном стиле
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
                                <div class="name-wrapper">
                                    <span class="name-text">${userData.name}</span>
                                    <div class="account-status">
                                        <div class="status-indicator"></div>
                                        <span>Премиум</span>
                                    </div>
                                </div>
                            </div>
                            <div class="user-menu__email">${userData.email}</div>
                        </div>
                    </div>
                    
                    <ul class="user-menu__items">
                        <li class="user-menu__item" data-action="profile">
                            <i class="fas fa-id-card"></i>
                            <span>Профиль</span>
                        </li>
                        <li class="user-menu__item" data-action="orders">
                            <i class="fas fa-shopping-bag"></i>
                            <span>Заказы</span>
                        </li>
                        <li class="user-menu__item" data-action="settings">
                            <i class="fas fa-cog"></i>
                            <span>Настройки</span>
                        </li>
                        <li class="user-menu__item" data-action="logout">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>Выйти</span>
                        </li>
                    </ul>
                </div>
            `;
            
            // Добавляем стили для модального меню, если их еще нет
            if (!document.getElementById('user-menu-modal-styles')) {
                const style = document.createElement('style');
                style.id = 'user-menu-modal-styles';
                style.textContent = `
                    .user-menu-modal {
                        position: relative;
                        width: 100%;
                        margin: 0 auto;
                        padding: 20px;
                        background: ${document.body.classList.contains('dark') ? '#2a2a2a' : 'white'};
                        border-radius: 12px;
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                        overflow: hidden;
                    }
                    
                    .decorative-shape {
                        position: absolute;
                        z-index: 0;
                        opacity: 0.1;
                    }
                    
                    .shape-1 {
                        top: -30px;
                        left: -30px;
                        width: 100px;
                        height: 100px;
                        background: linear-gradient(135deg, #BCB88A, #C9897B);
                        border-radius: 50%;
                    }
                    
                    .shape-2 {
                        bottom: -20px;
                        right: -20px;
                        width: 80px;
                        height: 80px;
                        background: linear-gradient(135deg, #4caf50, #2196f3);
                        border-radius: 50%;
                    }
                    
                    .shape-3 {
                        top: 50%;
                        right: 30px;
                        width: 60px;
                        height: 60px;
                        background: linear-gradient(135deg, #ff9800, #f44336);
                        border-radius: 50%;
                        transform: translateY(-50%);
                    }
                    
                    .user-menu__header {
                        position: relative;
                        z-index: 1;
                        display: flex;
                        align-items: center;
                        margin-bottom: 20px;
                        padding-bottom: 15px;
                        border-bottom: 1px solid ${document.body.classList.contains('dark') ? '#444' : '#eee'};
                    }
                    
                    .user-menu__avatar {
                        width: 60px;
                        height: 60px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #BCB88A, #C9897B);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-right: 15px;
                    }
                    
                    .user-menu__avatar i {
                        font-size: 24px;
                        color: white;
                    }
                    
                    .user-menu__name-container {
                        flex: 1;
                    }
                    
                    .user-menu__name {
                        display: flex;
                        flex-direction: column;
                        margin-bottom: 5px;
                    }
                    
                    .name-text {
                        font-size: 18px;
                        font-weight: 600;
                        color: ${document.body.classList.contains('dark') ? '#f0f0f0' : '#333'};
                        text-align: left;
                    }
                    
                    .name-wrapper {
                        display: flex;
                        align-items: center;
                        justify-content: flex-start;
                        width: 100%;
                    }
                    
                    .account-status {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 11px;
                        color: #BCB88A;
                        background: linear-gradient(135deg, rgba(188, 184, 138, 0.15), rgba(201, 137, 123, 0.15));
                        padding: 4px 8px;
                        border-radius: 50px;
                        box-shadow: 0 2px 10px rgba(201, 137, 123, 0.15);
                        font-weight: 600;
                        letter-spacing: 0.3px;
                        text-transform: uppercase;
                        margin-left: 8px;
                    }
                    
                    .status-indicator {
                        width: 8px;
                        height: 8px;
                        background: linear-gradient(135deg, #BCB88A, #C9897B);
                        border-radius: 50%;
                        margin-right: 0;
                        box-shadow: 0 0 0 2px rgba(201, 137, 123, 0.2);
                        position: relative;
                    }
                    
                    .user-menu__email {
                        font-size: 14px;
                        color: ${document.body.classList.contains('dark') ? '#aaa' : '#666'};
                    }
                    
                    .user-menu__items {
                        position: relative;
                        z-index: 1;
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }
                    
                    .user-menu__item {
                        padding: 12px 15px;
                        margin-bottom: 5px;
                        display: flex;
                        align-items: center;
                        cursor: pointer;
                        border-radius: 8px;
                        transition: background 0.2s ease;
                    }
                    
                    .user-menu__item:hover {
                        background: ${document.body.classList.contains('dark') ? '#444' : '#f5f5f5'};
                    }
                    
                    .user-menu__item i {
                        width: 24px;
                        margin-right: 12px;
                        font-size: 16px;
                        color: ${document.body.classList.contains('dark') ? '#aaa' : '#666'};
                    }
                    
                    .user-menu__item span {
                        font-size: 14px;
                        color: ${document.body.classList.contains('dark') ? '#f0f0f0' : '#333'};
                    }
                    
                    .user-menu__item[data-action="logout"] {
                        margin-top: 10px;
                        border-top: 1px solid ${document.body.classList.contains('dark') ? '#444' : '#eee'};
                        padding-top: 15px;
                    }
                    
                    .user-menu__item[data-action="logout"] i {
                        color: #f44336;
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Если модальное окно открыто, показываем меню внутри него
            if (authModal && authModal.classList.contains('active')) {
                // Получаем обертку для контента модального окна
                const contentWrapper = document.querySelector('.auth-modal__content-wrapper');
                
                // Сохраняем оригинальный контент если еще не сохранен
                if (!contentWrapper.dataset.originalContent) {
                    contentWrapper.dataset.originalContent = contentWrapper.innerHTML;
                }
                
                // Заменяем содержимое модального окна
                contentWrapper.innerHTML = userMenuContent;
                
                // Добавляем обработчики к пунктам меню
                const menuItems = contentWrapper.querySelectorAll('.user-menu__item');
                menuItems.forEach(item => {
                    item.addEventListener('click', function(e) {
                        e.stopPropagation(); // Предотвращаем всплытие
                        const action = this.getAttribute('data-action');
                        console.log(`Modal menu item clicked: ${action}`);
                        
                        // Выполняем соответствующее действие
                        if (action === 'logout') {
                            logoutUser();
                        } else if (action === 'profile') {
                            // Закрываем модальное окно
                            closeModal();
                            // Вызываем функцию showProfileModal из desktop.js
                            if (typeof window.showProfileModal === 'function') {
                                window.showProfileModal();
                            } else {
                                // При клике на "Профиль" показываем форму профиля
                                if (contentWrapper && contentWrapper.dataset.originalContent) {
                                    contentWrapper.innerHTML = contentWrapper.dataset.originalContent;
                                    // Переключаемся на вкладку входа
                                    switchTab('login');
                                    // Заполняем поле email
                                    const emailField = document.getElementById('loginEmail');
                                    if (emailField) {
                                        emailField.value = userData.email || '';
                                        // Фокусируемся на поле пароля
                                        const passwordField = document.getElementById('loginPassword');
                                        if (passwordField) passwordField.focus();
                                    }
                                }
                            }
                        } else if (action === 'orders') {
                            // Закрываем модальное окно
                            closeModal();
                            // Вызываем функцию showOrdersModal из desktop.js
                            if (typeof window.showOrdersModal === 'function') {
                                window.showOrdersModal();
                            } else {
                                showNotification('Функция просмотра заказов пока не реализована', 'info');
                            }
                        } else if (action === 'settings') {
                            // Закрываем модальное окно
                            closeModal();
                            // Вызываем функцию showSettingsModal
                            if (typeof window.showSettingsModal === 'function') {
                                window.showSettingsModal();
                            } else if (typeof window.settingsModule !== 'undefined' && 
                                      typeof window.settingsModule.showSettingsModal === 'function') {
                                window.settingsModule.showSettingsModal();
                            } else {
                                // Перенаправляем на страницу настроек, если она существует
                                if (window.location.href.includes('/desktop.html')) {
                                    showNotification('Переход на страницу настроек...', 'info');
                                    setTimeout(() => {
                                        window.location.href = 'settings.html';
                                    }, 500);
                                } else {
                                    showNotification('Функция настроек пока не реализована', 'info');
                                }
                            }
                        } else {
                            showNotification(`Действие "${action}" пока не реализовано`, 'info');
                        }
                    });
                });
            } else {
                // Если модальное окно не открыто, но нужно использовать модальный стиль меню,
                // создаем отдельное меню с модальным стилем
                console.log('Creating standalone menu with modal style');
                
                // Удаляем существующее меню, если оно есть
                const existingMenu = document.getElementById('userProfileMenu');
                if (existingMenu) {
                    existingMenu.parentNode.removeChild(existingMenu);
                }
                
                // Создаем элемент меню пользователя
                const userMenu = document.createElement('div');
                userMenu.className = 'user-menu login-system-menu';
                userMenu.id = 'userProfileMenu'; // Уникальный ID для меню
                userMenu.setAttribute('data-login-system-menu', 'true');
                userMenu.setAttribute('data-protected', 'true');
                
                // Позиционируем меню относительно кнопки
                const buttonRect = button.getBoundingClientRect();
                console.log('Button rectangle:', buttonRect);
                
                // Рассчитываем позицию меню
                const topPosition = buttonRect.bottom + 10; // Добавляем 10px отступа от кнопки
                const leftPosition = buttonRect.left + (buttonRect.width / 2) - 140; // Центрируем по кнопке
                
                // Добавляем стили для корректного отображения меню
                Object.assign(userMenu.style, {
                    position: 'fixed',
                    top: `${topPosition}px`,
                    left: `${Math.max(10, leftPosition)}px`,
                    zIndex: '9999',
                    width: '280px',
                    backgroundColor: document.body.classList.contains('dark') ? '#2a2a2a' : 'white',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                    opacity: '0',
                    visibility: 'hidden',
                    transition: 'opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease',
                    transform: 'translateY(10px)',
                    overflow: 'visible' // Для отображения стрелки
                });
                
                // Добавляем HTML содержимое меню
                userMenu.innerHTML = userMenuContent;
                
                // Добавляем меню на страницу
                document.body.appendChild(userMenu);
                console.log('Menu added to body:', userMenu);
                
                // Показываем меню с анимацией
                setTimeout(() => {
                    userMenu.style.opacity = '1';
                    userMenu.style.visibility = 'visible';
                    userMenu.style.transform = 'translateY(0)';
                }, 50);
                
                // Добавляем обработчики к пунктам меню
                const menuItems = userMenu.querySelectorAll('.user-menu__item');
                menuItems.forEach(item => {
                    item.addEventListener('click', function(e) {
                        e.stopPropagation(); // Предотвращаем всплытие
                        const action = this.getAttribute('data-action');
                        console.log(`Menu item clicked: ${action}`);
                        
                        // Скрываем меню
                        userMenu.style.opacity = '0';
                        userMenu.style.visibility = 'hidden';
                        userMenu.style.transform = 'translateY(10px)';
                        
                        // Выполняем действие после анимации скрытия
                        setTimeout(() => {
                            if (action === 'logout') {
                                logoutUser();
                            } else if (action === 'profile') {
                                // Вызываем функцию showProfileModal из desktop.js
                                if (typeof window.showProfileModal === 'function') {
                                    window.showProfileModal();
                                } else {
                                    // Открываем модальное окно профиля
                                    openModal();
                                    // Переключаем на вкладку входа
                                    switchTab('login');
                                    // Заполняем поле email
                                    const emailField = document.getElementById('loginEmail');
                                    if (emailField) {
                                        emailField.value = userData.email || '';
                                        // Фокусируемся на поле пароля
                                        const passwordField = document.getElementById('loginPassword');
                                        if (passwordField) passwordField.focus();
                                    }
                                }
                            } else if (action === 'orders') {
                                // Вызываем функцию showOrdersModal из desktop.js
                                if (typeof window.showOrdersModal === 'function') {
                                    window.showOrdersModal();
                                } else {
                                    showNotification('Функция просмотра заказов пока не реализована', 'info');
                                }
                            } else if (action === 'settings') {
                                // Вызываем функцию showSettingsModal
                                if (typeof window.showSettingsModal === 'function') {
                                    window.showSettingsModal();
                                } else if (typeof window.settingsModule !== 'undefined' && 
                                          typeof window.settingsModule.showSettingsModal === 'function') {
                                    window.settingsModule.showSettingsModal();
                                } else {
                                    // Перенаправляем на страницу настроек, если она существует
                                    if (window.location.href.includes('/desktop.html')) {
                                        showNotification('Переход на страницу настроек...', 'info');
                                        setTimeout(() => {
                                            window.location.href = 'settings.html';
                                        }, 500);
                                    } else {
                                        showNotification('Функция настроек пока не реализована', 'info');
                                    }
                                }
                            } else {
                                showNotification(`Действие "${action}" пока не реализовано`, 'info');
                            }
                            
                            // Удаляем меню из DOM
                            if (userMenu.parentNode) {
                                userMenu.parentNode.removeChild(userMenu);
                            }
                            
                            // Восстанавливаем обсервер меню, если он был отключен
                            if (menuObserver && window.enableMenuObserver) {
                                window.enableMenuObserver(menuObserver);
                            }
                        }, 300);
                    });
                });
                
                // Функция закрытия меню при клике вне его области
                function closeMenuOnOutsideClick(e) {
                    if (!userMenu.contains(e.target) && !button.contains(e.target)) {
                        userMenu.style.opacity = '0';
                        userMenu.style.visibility = 'hidden';
                        userMenu.style.transform = 'translateY(10px)';
                        
                        // Удаляем обработчик клика
                        document.removeEventListener('click', closeMenuOnOutsideClick);
                        document.removeEventListener('keydown', closeMenuOnEscape);
                        
                        // Удаляем меню после анимации
                        setTimeout(() => {
                            if (userMenu.parentNode) {
                                userMenu.parentNode.removeChild(userMenu);
                            }
                            
                            // Восстанавливаем обсервер меню, если он был отключен
                            if (menuObserver && window.enableMenuObserver) {
                                window.enableMenuObserver(menuObserver);
                            }
                        }, 300);
                    }
                }
                
                // Функция закрытия меню при нажатии Escape
                function closeMenuOnEscape(e) {
                    if (e.key === 'Escape') {
                        userMenu.style.opacity = '0';
                        userMenu.style.visibility = 'hidden';
                        userMenu.style.transform = 'translateY(10px)';
                        
                        // Удаляем обработчики
                        document.removeEventListener('keydown', closeMenuOnEscape);
                        document.removeEventListener('click', closeMenuOnOutsideClick);
                        
                        // Удаляем меню после анимации
                        setTimeout(() => {
                            if (userMenu.parentNode) {
                                userMenu.parentNode.removeChild(userMenu);
                            }
                            
                            // Восстанавливаем обсервер меню, если он был отключен
                            if (menuObserver && window.enableMenuObserver) {
                                window.enableMenuObserver(menuObserver);
                            }
                        }, 300);
                    }
                }
                
                // Добавляем обработчики для закрытия меню
                setTimeout(() => {
                    document.addEventListener('click', closeMenuOnOutsideClick);
                    document.addEventListener('keydown', closeMenuOnEscape);
                }, 100);
            }
        } else {
            // Стандартное меню пользователя (не модальное)
            console.log('Using standard user menu style');
            
            // Здесь может быть код для отображения стандартного меню
            // Но так как мы всегда используем модальное меню (useModalUserMenu = true),
            // этот код не будет выполняться
            showNotification('Используется модальный стиль меню пользователя', 'info');
        }
    }
    
    // Создание модального окна, если его нет в DOM
    function createModalWindow() {
        if (document.querySelector('.auth-modal')) return;
        
        // Создаем структуру модального окна
        const modalHTML = `
            <div class="auth-modal">
                <div class="auth-modal__overlay"></div>
                <div class="auth-modal__content">
                    <button class="auth-modal__close"><i class="fas fa-times"></i></button>
                    <div class="auth-modal__content-wrapper">
                        <!-- Здесь будет контент -->
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем модальное окно в DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);
        
        // Добавляем обработчики событий
        const newModal = document.querySelector('.auth-modal');
        const newOverlay = document.querySelector('.auth-modal__overlay');
        const newCloseButton = document.querySelector('.auth-modal__close');
        
        if (newCloseButton) {
            newCloseButton.addEventListener('click', closeModal);
        }
        
        if (newOverlay) {
            newOverlay.addEventListener('click', closeModal);
        }
        
        // Добавляем стили для модального окна, если их еще нет
        if (!document.getElementById('auth-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'auth-modal-styles';
            style.textContent = `
                .auth-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 0.3s ease, visibility 0.3s ease;
                }
                
                .auth-modal.active {
                    opacity: 1;
                    visibility: visible;
                }
                
                .auth-modal__overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(5px);
                }
                
                .auth-modal__content {
                    position: relative;
                    width: 90%;
                    max-width: 450px;
                    background: ${document.body.classList.contains('dark') ? '#333' : 'white'};
                    border-radius: 15px;
                    padding: 30px;
                    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
                    transform: translateY(20px);
                    transition: transform 0.3s ease;
                    overflow: hidden;
                }
                
                .auth-modal.active .auth-modal__content {
                    transform: translateY(0);
                }
                
                .auth-modal__close {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: none;
                    border: none;
                    font-size: 18px;
                    color: ${document.body.classList.contains('dark') ? '#aaa' : '#999'};
                    cursor: pointer;
                    z-index: 10;
                }
                
                .auth-modal__close:hover {
                    color: ${document.body.classList.contains('dark') ? '#fff' : '#333'};
                }
            `;
            document.head.appendChild(style);
        }
    }
}); 