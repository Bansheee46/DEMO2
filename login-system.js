document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginButton = document.querySelector('.toggle-auth-button') || document.getElementById('loginButton');
    const authModal = document.querySelector('.auth-modal');
    const authOverlay = document.querySelector('.auth-modal__overlay');
    const closeButton = document.querySelector('.auth-modal__close');
    const tabs = document.querySelectorAll('.auth-tab');
    let forms = document.querySelectorAll('.auth-form');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const counterpartyForm = document.getElementById('counterpartyForm');
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
    
 
    
    // Проверка статуса авторизации при загрузке
    checkLoginStatus();
    
    // Инициализация карточки контрагента
    if (counterpartyForm) {
        initCounterpartyCard();
    }
    
    // Функция для отображения уведомлений
    function showNotification(message, type = 'info', duration = 5000) {
        // Проверяем, существует ли уже глобальная функция showNotification
        if (window.showNotification && typeof window.showNotification === 'function' && window.showNotification !== showNotification) {
            return window.showNotification(message, type, duration);
        }
        
        // Если глобальная функция недоступна, используем локальную реализацию
        console.log('Используем локальную функцию showNotification:', message);
        
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
        
        // Очищаем старые данные для избежания конфликтов
        localStorage.removeItem('registeredUsers');
        localStorage.removeItem('testUsersCreated');
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
            const returnTo = this.getAttribute('data-return-to') || 'login';
            switchTab(returnTo);
        });
    }
    
    // Переключение видимости пароля
    if (togglePasswordButtons && togglePasswordButtons.length > 0) {
        togglePasswordButtons.forEach(button => {
            button.addEventListener('click', function() {
                const input = this.parentElement.querySelector('input');
                const icon = this.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    }
    
    // Обработчик для ссылки "Забыли пароль?"
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            switchTab('forgot');
        });
    }
    
    // Обработчики отправки форм
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
    }
    
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function(e) {
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
        // Предотвращаем стандартное поведение формы
        event.preventDefault();
        
        // Проверяем, валидна ли форма
        if (!validateForm(form)) {
            return false;
        }
        
        // Показываем индикатор загрузки
        const submitButton = form.querySelector('.submit-button');
        submitButton.classList.add('loading');
        submitButton.disabled = true;
        
        try {
            // В зависимости от типа формы выполняем соответствующие действия
            if (type === 'login') {
                const email = form.querySelector('#loginEmail').value;
                const password = form.querySelector('#loginPassword').value;
                const rememberMe = form.querySelector('#rememberMe').checked;
                
                // Проверка блокировки аккаунта
                const blockStatus = isAccountBlocked(email);
                if (blockStatus.blocked) {
                    showNotification(blockStatus.message || 'Аккаунт временно заблокирован из-за слишком большого количества неудачных попыток входа. Попробуйте позже.', 'error');
                    submitButton.classList.remove('loading');
                    submitButton.disabled = false;
                    return;
                }
                
                // Получаем список зарегистрированных пользователей
                const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
                
                // Ищем пользователя с указанным email
                const user = users.find(user => user.email.toLowerCase() === email.toLowerCase());
                
                // Если пользователь найден и пароль совпадает
                if (user && user.password === password) {
                    // Обновляем информацию о последнем входе
                    user.lastLogin = new Date().toISOString();
                    localStorage.setItem('registeredUsers', JSON.stringify(users));
                    
                    // Сохраняем информацию о текущем пользователе
                    const userData = {
                        name: user.name,
                        email: user.email,
                        loggedIn: true,
                        loginTime: new Date().toISOString()
                    };
                    
                    localStorage.setItem('userData', JSON.stringify(userData));
                    
                    // Если пользователь выбрал "Запомнить меня", устанавливаем куки
                    if (rememberMe) {
                        // В реальном приложении здесь должна быть более безопасная логика
                        const expirationDate = new Date();
                        expirationDate.setDate(expirationDate.getDate() + 30); // 30 дней
                        document.cookie = `remembered_user=${email}; expires=${expirationDate.toUTCString()}; path=/`;
                    }
                    
                    // Отслеживаем успешную попытку входа
                    trackLoginAttempts(email, true);
                    
                    // Очищаем данные о попытках входа для этого пользователя
                    clearLoginAttempts(email);
                    
                    // Показываем экран успешного входа
                    setTimeout(() => {
                        showSuccessScreen('login');
                        
                        // Закрываем модальное окно через 2 секунды
                        setTimeout(() => {
                            closeModal();
                            
                            // Обновляем UI после успешного входа
                            checkLoginStatus();
                            
                            // Перезагружаем страницу, если это не главная страница
                            if (!window.location.pathname.endsWith('/') && !window.location.pathname.endsWith('/index.html')) {
                                window.location.reload();
                            }
                        }, 2000);
                    }, 500);
                } else {
                    // Отслеживаем неудачную попытку входа
                    trackLoginAttempts(email, false);
                    
                    // Показываем ошибку
                    showNotification('Неверный email или пароль', 'error');
                }
            } else if (type === 'register') {
                const name = form.querySelector('#registerName').value;
                const email = form.querySelector('#registerEmail').value;
                const password = form.querySelector('#registerPassword').value;
                
                console.log('Начинаем регистрацию пользователя:', { name, email });
                
                // Получаем список зарегистрированных пользователей
                const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
                
                // Проверяем, не зарегистрирован ли уже пользователь с таким email
                if (users.some(user => user.email.toLowerCase() === email.toLowerCase())) {
                    showNotification('Пользователь с таким email уже зарегистрирован', 'error');
                    return;
                }
                
                // Сохраняем пароль в открытом виде для совместимости
                const hashedPassword = password;
                
                // Создаем нового пользователя
                const newUser = {
                    name,
                    email,
                    password: hashedPassword,
                    registrationDate: new Date().toISOString(),
                    lastLogin: null,
                    orders: []
                };
                
                console.log('Создан новый пользователь:', { name: newUser.name, email: newUser.email });
                
                // Сохраняем пользователя во временное хранилище для завершения регистрации после заполнения карточки контрагента
                sessionStorage.setItem('tempUser', JSON.stringify(newUser));
                console.log('Пользователь сохранен в sessionStorage');
                
                // Переключаемся на форму карточки контрагента
                switchTab('counterparty');
                
            } else if (type === 'forgotPassword') {
                const email = form.querySelector('#forgotEmail').value;
                
                // В реальном приложении здесь должна быть логика для отправки письма для сброса пароля
                // Для демонстрации просто показываем уведомление
                showNotification(`Инструкции по сбросу пароля отправлены на ${email}`, 'success');
                
                // Возвращаемся к форме входа через 2 секунды
                setTimeout(() => {
                    switchTab('login');
                }, 2000);
            } else if (type === 'counterparty') {
                // Получаем данные карточки контрагента
                const orgName = form.querySelector('#orgName').value;
                const legalAddress = form.querySelector('#legalAddress').value;
                const inn = form.querySelector('#inn').value;
                const kpp = form.querySelector('#kpp').value;
                const ogrn = form.querySelector('#ogrn').value;
                const contactPerson = form.querySelector('#contactPerson').value;
                const contactPosition = form.querySelector('#contactPosition').value;
                const workPhone = form.querySelector('#workPhone').value;
                const contactEmail = form.querySelector('#contactEmail').value;
                const contactMethod = form.querySelector('input[name="contactMethod"]:checked')?.value || '';
                const bankName = form.querySelector('#bankName').value;
                const bankAccount = form.querySelector('#bankAccount').value;
                const corrAccount = form.querySelector('#corrAccount').value;
                const bik = form.querySelector('#bik').value;
                
                // Создаем объект с данными контрагента
                const counterpartyData = {
                    orgName,
                    legalAddress,
                    inn,
                    kpp,
                    ogrn,
                    contactPerson,
                    contactPosition,
                    workPhone,
                    contactEmail,
                    contactMethod,
                    bankDetails: {
                        bankName,
                        bankAccount,
                        corrAccount,
                        bik
                    }
                };
                
                // Получаем данные пользователя из временного хранилища
                let tempUser = JSON.parse(sessionStorage.getItem('tempUser'));
                
                // Если tempUser не найден, попробуем получить из localStorage
                if (!tempUser) {
                    console.warn('tempUser не найден в sessionStorage, проверяем localStorage...');
                    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                    if (userData.name && userData.email) {
                        // Создаем временного пользователя из данных в localStorage
                        tempUser = {
                            name: userData.name,
                            email: userData.email,
                            hashedPassword: '', // Пароль не сохраняется в userData
                            registrationDate: userData.registrationDate || new Date().toISOString(),
                            lastLogin: null,
                            orders: []
                        };
                        console.log('Создан tempUser из localStorage:', tempUser);
                    }
                }
                
                if (tempUser) {
                    // Добавляем данные контрагента к пользователю
                    tempUser.counterparty = counterpartyData;
                    
                    // Получаем список зарегистрированных пользователей
                    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
                    
                    // Проверяем, не зарегистрирован ли уже пользователь с таким email
                    const existingUserIndex = users.findIndex(user => user.email.toLowerCase() === tempUser.email.toLowerCase());
                    if (existingUserIndex !== -1) {
                        // Обновляем существующего пользователя
                        users[existingUserIndex] = { ...users[existingUserIndex], ...tempUser };
                        console.log('Обновлен существующий пользователь');
                    } else {
                        // Добавляем нового пользователя
                        users.push(tempUser);
                        console.log('Добавлен новый пользователь');
                    }
                    
                    // Сохраняем обновленный список пользователей
                    localStorage.setItem('registeredUsers', JSON.stringify(users));
                    
                    // Очищаем временное хранилище
                    sessionStorage.removeItem('tempUser');
                    
                    // Автоматически входим в систему
                    const userData = {
                        name: tempUser.name,
                        email: tempUser.email,
                        loggedIn: true,
                        loginTime: new Date().toISOString()
                    };
                    
                    localStorage.setItem('userData', JSON.stringify(userData));
                    
                    // Показываем экран успешной регистрации
                    setTimeout(() => {
                        showSuccessScreen('register');
                        
                        // Создаем конфетти для эффекта празднования
                        createConfetti();
                        
                        // Закрываем модальное окно через 3 секунды
                        setTimeout(() => {
                            closeModal();
                            
                            // Обновляем UI после успешного входа
                            checkLoginStatus();
                            
                            // Перезагружаем страницу, если это не главная страница
                            if (!window.location.pathname.endsWith('/') && !window.location.pathname.endsWith('/index.html')) {
                                window.location.reload();
                            }
                        }, 3000);
                    }, 500);
                } else {
                    console.error('Не удалось получить данные пользователя для завершения регистрации');
                    console.log('sessionStorage tempUser:', sessionStorage.getItem('tempUser'));
                    console.log('localStorage userData:', localStorage.getItem('userData'));
                    
                    // Проверяем, может быть пользователь уже зарегистрирован
                    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
                    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                    
                    if (userData.loggedIn && userData.name && userData.email) {
                        console.log('Пользователь уже в системе, показываем успешное завершение');
                        
                        // Показываем экран успешной регистрации
                        setTimeout(() => {
                            showSuccessScreen('register');
                            
                            // Создаем конфетти для эффекта празднования
                            createConfetti();
                            
                            // Закрываем модальное окно через 3 секунды
                            setTimeout(() => {
                                closeModal();
                                
                                // Обновляем UI после успешного входа
                                checkLoginStatus();
                                
                                // Перезагружаем страницу, если это не главная страница
                                if (!window.location.pathname.endsWith('/') && !window.location.pathname.endsWith('/index.html')) {
                                    window.location.reload();
                                }
                            }, 3000);
                        }, 500);
                    } else {
                        showNotification('Произошла ошибка при регистрации. Пожалуйста, попробуйте снова.', 'error');
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showNotification('Произошла ошибка. Пожалуйста, попробуйте снова.', 'error');
        } finally {
            // Убираем индикатор загрузки
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
        }
    }
    
    // Функция для обработки карточки контрагента
    function initCounterpartyCard() {
        console.log('Вызвана функция initCounterpartyCard');
        
        const counterpartyForm = document.getElementById('counterpartyForm');
        console.log('Поиск формы контрагента в initCounterpartyCard:', counterpartyForm ? 'Найдена' : 'Не найдена');
        
        // Проверяем существование формы контрагента
        if (!counterpartyForm) {
            console.warn('Форма контрагента не найдена в initCounterpartyCard');
            
            // Проверяем содержимое модального окна
            const modalContent = document.querySelector('.auth-modal__content-wrapper');
            console.log('Содержимое модального окна в initCounterpartyCard:', 
                modalContent ? `Найдено (первые 100 символов: ${modalContent.innerHTML.substring(0, 100)}...)` : 'Не найдено');
            
            // Проверяем все формы в DOM
            const allForms = document.querySelectorAll('form');
            console.log('Все формы в DOM в initCounterpartyCard:', 
                Array.from(allForms).map(form => `${form.id} (class: ${form.className})`));
            
            return;
        }
        
        console.log('Форма контрагента найдена, начинаем инициализацию');
        
        const progressIndicator = document.querySelector('.progress-indicator');
        const progressPercent = document.querySelector('.progress-percent');
        const inputs = counterpartyForm.querySelectorAll('input[required]');
        const backButton = counterpartyForm.querySelector('.back-button');
        
        console.log('Элементы формы:', {
            progressIndicator: progressIndicator ? 'Найден' : 'Не найден',
            progressPercent: progressPercent ? 'Найден' : 'Не найден',
            inputs: inputs.length,
            backButton: backButton ? 'Найден' : 'Не найден'
        });
        
        // Обработчик для кнопки "Назад"
        if (backButton) {
            backButton.addEventListener('click', function() {
                const returnTo = this.getAttribute('data-return-to') || 'login';
                switchTab(returnTo);
            });
            console.log('Добавлен обработчик для кнопки "Назад"');
        }
        
        // Функция для обновления прогресса заполнения
        function updateProgress() {
            console.log('Вызвана функция updateProgress');
            
            let filledInputs = 0;
            
            inputs.forEach(input => {
                if (input.value.trim() !== '') {
                    filledInputs++;
                    input.classList.add('filled');
                } else {
                    input.classList.remove('filled');
                }
            });
            
            const percent = Math.round((filledInputs / inputs.length) * 100);
            console.log(`Заполнено полей: ${filledInputs}/${inputs.length} (${percent}%)`);
            
            // Анимируем прогресс-бар
            if (progressIndicator && progressPercent) {
                progressIndicator.style.width = `${percent}%`;
                progressPercent.textContent = `${percent}%`;
                console.log('Прогресс-бар обновлен');
            } else {
                console.warn('Элементы прогресс-бара не найдены');
            }
            
            // Добавляем класс success для полей, которые заполнены
            inputs.forEach(input => {
                const container = input.closest('.input-container');
                if (container) {
                    if (input.value.trim() !== '') {
                        container.classList.add('success');
                    } else {
                        container.classList.remove('success');
                    }
                }
            });
        }
        
        // Добавляем обработчики событий для всех полей ввода
        console.log('Добавляем обработчики событий для полей ввода');
        inputs.forEach(input => {
            input.addEventListener('input', updateProgress);
            input.addEventListener('blur', function() {
                // Простая валидация при потере фокуса
                const container = this.closest('.input-container');
                const formGroup = this.closest('.form-group');
                const errorMessage = formGroup.querySelector('.error-message');
                
                // Проверяем ИНН
                if (this.id === 'inn' && this.value.trim() !== '') {
                    if (!/^\d{10}$|^\d{12}$/.test(this.value.trim())) {
                        errorMessage.textContent = 'ИНН должен содержать 10 или 12 цифр';
                        formGroup.classList.add('error');
                    } else {
                        errorMessage.textContent = '';
                        formGroup.classList.remove('error');
                    }
                }
                
                // Проверяем КПП
                if (this.id === 'kpp' && this.value.trim() !== '') {
                    if (!/^\d{9}$/.test(this.value.trim())) {
                        errorMessage.textContent = 'КПП должен содержать 9 цифр';
                        formGroup.classList.add('error');
                    } else {
                        errorMessage.textContent = '';
                        formGroup.classList.remove('error');
                    }
                }
                
                // Проверяем ОГРН
                if (this.id === 'ogrn' && this.value.trim() !== '') {
                    if (!/^\d{13}$|^\d{15}$/.test(this.value.trim())) {
                        errorMessage.textContent = 'ОГРН должен содержать 13 или 15 цифр';
                        formGroup.classList.add('error');
                    } else {
                        errorMessage.textContent = '';
                        formGroup.classList.remove('error');
                    }
                }
                
                // Проверяем телефон
                if (this.id === 'workPhone' && this.value.trim() !== '') {
                    if (!/^\+7\s?\(\d{3}\)\s?\d{3}-\d{2}-\d{2}$/.test(this.value.trim())) {
                        errorMessage.textContent = 'Телефон должен быть в формате +7 (999) 123-45-67';
                        formGroup.classList.add('error');
                    } else {
                        errorMessage.textContent = '';
                        formGroup.classList.remove('error');
                    }
                }
                
                // Проверяем email
                if (this.id === 'contactEmail' && this.value.trim() !== '') {
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value.trim())) {
                        errorMessage.textContent = 'Введите корректный email';
                        formGroup.classList.add('error');
                    } else {
                        errorMessage.textContent = '';
                        formGroup.classList.remove('error');
                    }
                }
            });
        });
        console.log('Обработчики для полей ввода добавлены');
        
        // Добавляем маску для телефона
        const phoneInput = document.getElementById('workPhone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function(e) {
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
            console.log('Маска для телефона добавлена');
        } else {
            console.warn('Поле для телефона не найдено');
        }
        
        // Обработчик отправки формы
        if (counterpartyForm) {
            counterpartyForm.addEventListener('submit', function(e) {
                console.log('Обработка отправки формы контрагента');
                handleFormSubmit(this, 'counterparty');
            });
            console.log('Обработчик отправки формы добавлен');
        }
        
        // Добавляем анимацию для полей ввода
        document.querySelectorAll('.counterparty-card__content .form-group').forEach((group, index) => {
            group.style.animationDelay = `${0.1 + index * 0.05}s`;
        });
        console.log('Анимация для полей ввода добавлена');
        
        // Добавляем эффекты для карточки
        const counterpartyCard = document.querySelector('.counterparty-card');
        if (counterpartyCard) {
            // Добавляем эффект свечения при наведении
            counterpartyCard.addEventListener('mousemove', function(e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                this.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 60%), var(--surface-color)`;
            });
            
            counterpartyCard.addEventListener('mouseleave', function() {
                this.style.background = 'var(--surface-color)';
            });
            console.log('Эффекты для карточки добавлены');
        } else {
            console.warn('Карточка контрагента не найдена');
        }
        
        console.log('Инициализация карточки контрагента завершена успешно');
    }
    
    // Валидация полей формы
    function validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input:not([type="checkbox"])');
        
        inputs.forEach(input => {
            const formGroup = input.closest('.form-group');
            if (!formGroup) return; // Пропускаем, если не найден form-group
            
            const errorMessage = formGroup.querySelector('.error-message');
            if (!errorMessage) return; // Пропускаем, если не найден error-message
            
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
                const password = document.getElementById('registerPassword');
                if (password && input.value !== password.value) {
                    formGroup.classList.add('error');
                    errorMessage.textContent = 'Пароли не совпадают';
                    isValid = false;
                }
            }
        });
        
        // Проверка согласия с условиями при регистрации
        if (form.id === 'registerForm') {
            const termsCheckbox = form.querySelector('input[type="checkbox"]');
            if (termsCheckbox) {
                const formGroup = termsCheckbox.closest('.form-group');
                if (formGroup) {
                    const errorMessage = formGroup.querySelector('.error-message');
                    
                    if (!termsCheckbox.checked) {
                        formGroup.classList.add('error');
                        if (errorMessage) {
                            errorMessage.textContent = 'Вы должны принять условия';
                        }
                        isValid = false;
                    } else {
                        // Убираем ошибку, если чекбокс отмечен
                        formGroup.classList.remove('error');
                        if (errorMessage) {
                            errorMessage.textContent = '';
                        }
                    }
                }
            }
        }
        
        return isValid;
    }
    
    // Функция для определения блокировки аккаунта
    function isAccountBlocked(email) {
        // Получаем данные о попытках входа из localStorage
        const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
        
        // Проверяем наличие данных по email
        if (!loginAttempts[email]) {
            return { blocked: false };
        }
        
        const userData = loginAttempts[email];
        
        // Если стоит флаг блокировки, проверяем срок её действия
        if (userData.blocked) {
            const now = new Date();
            const blockEndTime = new Date(userData.blockUntil);
            
            // Если время блокировки истекло, сбрасываем блокировку
            if (now > blockEndTime) {
                userData.blocked = false;
                userData.count = 0;
                loginAttempts[email] = userData;
                localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
                return { blocked: false };
            }
            
            // Если блокировка ещё действует, возвращаем информацию
            const minutesLeft = Math.ceil((blockEndTime - now) / (1000 * 60));
            return { 
                blocked: true, 
                message: `Аккаунт временно заблокирован. Повторите через ${minutesLeft} мин.` 
            };
        }
        
        // Если нет блокировки, возвращаем статус
        return { blocked: false };
    }

    // Функция для отслеживания попыток входа
    function trackLoginAttempts(email, isSuccessful) {
        // Получаем данные о попытках входа из localStorage
        const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
        
        // Инициализируем объект для email, если его еще нет
        if (!loginAttempts[email]) {
            loginAttempts[email] = {
                count: 0,
                lastAttempt: new Date().toISOString(),
                blocked: false
            };
        }
        
        // Если вход успешный, сбрасываем счетчик
        if (isSuccessful) {
            loginAttempts[email].count = 0;
            loginAttempts[email].blocked = false;
        } else {
            // Увеличиваем счетчик неудачных попыток
            loginAttempts[email].count += 1;
            loginAttempts[email].lastAttempt = new Date().toISOString();
            
            // Если превышено максимальное количество попыток, блокируем аккаунт
            if (loginAttempts[email].count >= 5) {
                // Блокируем на 30 минут
                const blockUntil = new Date();
                blockUntil.setMinutes(blockUntil.getMinutes() + 30);
                
                loginAttempts[email].blocked = true;
                loginAttempts[email].blockUntil = blockUntil.toISOString();
            }
        }
        
        // Сохраняем обновленные данные
        localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
        
        // Возвращаем текущий статус для удобства
        return loginAttempts[email];
    }
    
    // Функция для очистки данных о попытках входа
    function clearLoginAttempts(email) {
        // Если email указан, очищаем только для этого пользователя
        if (email) {
            const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
            if (loginAttempts[email]) {
                loginAttempts[email] = {
                    count: 0,
                    lastAttempt: new Date().toISOString(),
                    blocked: false
                };
                localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
                console.log(`Данные о попытках входа для ${email} очищены`);
                return true;
            }
            return false;
        } 
        // Если email не указан, очищаем для всех пользователей
        else {
            localStorage.removeItem('loginAttempts');
            console.log('Данные о попытках входа для всех пользователей очищены');
            return true;
        }
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
        console.log('Вызвана функция openModal');
        
        const authModal = document.querySelector('.auth-modal');
        console.log('Модальное окно в DOM:', authModal ? 'Найдено' : 'Не найдено');
        
        if (authModal) {
            authModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            console.log('Модальное окно активировано (добавлен класс active)');
            
            // Удаляем атрибут aria-hidden и добавляем inert на все остальные элементы страницы
            // кроме модального окна для правильного управления фокусом
            if (authModal.hasAttribute('aria-hidden')) {
                authModal.removeAttribute('aria-hidden');
                console.log('Удален атрибут aria-hidden');
            }
            
            // Сбрасываем состояние форм при открытии
            forms.forEach(form => form.reset());
            console.log('Формы сброшены');
            
            // По умолчанию показываем форму входа
            console.log('Переключаемся на вкладку входа по умолчанию');
            switchTab('login');
            
            // Создаем интерактивный фон
            console.log('Создаем интерактивный фон');
            createInteractiveBackground();
        } else {
            console.log('Модальное окно не найдено, создаем новое');
            // Если модального окна нет, создаем его
            createModalWindow();
            
            console.log('Ожидаем создания модального окна и активируем его через setTimeout');
            setTimeout(() => {
                const newModal = document.querySelector('.auth-modal');
                console.log('Новое модальное окно:', newModal ? 'Найдено' : 'Не найдено');
                
                if (newModal) {
                    newModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    console.log('Новое модальное окно активировано');
                    
                    // Проверяем наличие формы контрагента после активации
                    const counterpartyForm = document.getElementById('counterpartyForm');
                    console.log('Форма контрагента после активации модального окна:', counterpartyForm ? 'Найдена' : 'Не найдена');
                    
                    createInteractiveBackground();
                } else {
                    console.error('Не удалось найти модальное окно после его создания');
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
        console.log(`Вызвана функция switchTab с параметром: ${tabName}`);
        
        // Скрываем все формы
        forms.forEach(form => form.classList.remove('active'));
        console.log('Все формы скрыты');
        
        // Убираем активный класс со всех вкладок
        tabs.forEach(tab => {
            tab.classList.remove('active');
        });
        console.log('Активный класс убран со всех вкладок');
        
        // Скрываем экран успеха
        if (successScreen) {
            successScreen.style.display = 'none';
            console.log('Экран успеха скрыт');
        }
        
        // Показываем соответствующую форму
        if (tabName === 'login') {
            const loginForm = document.getElementById('loginForm');
            const loginTab = document.querySelector('[data-tab="login"]');
            if (loginForm) loginForm.classList.add('active');
            if (loginTab) loginTab.classList.add('active');
            console.log('Активирована вкладка входа:', loginForm ? 'Форма найдена' : 'Форма не найдена');
        } else if (tabName === 'register') {
            const registerForm = document.getElementById('registerForm');
            const registerTab = document.querySelector('[data-tab="register"]');
            if (registerForm) registerForm.classList.add('active');
            if (registerTab) registerTab.classList.add('active');
            console.log('Активирована вкладка регистрации:', registerForm ? 'Форма найдена' : 'Форма не найдена');
        } else if (tabName === 'forgot') {
            const forgotPasswordForm = document.getElementById('forgotPasswordForm');
            if (forgotPasswordForm) forgotPasswordForm.classList.add('active');
            console.log('Активирована вкладка восстановления пароля:', forgotPasswordForm ? 'Форма найдена' : 'Форма не найдена');
            // Не активируем вкладку, так как это дополнительный экран
        } else if (tabName === 'counterparty') {
            console.log('Попытка активировать вкладку контрагента');
            const counterpartyForm = document.getElementById('counterpartyForm');
            console.log('Форма контрагента в switchTab:', counterpartyForm ? 'Найдена' : 'Не найдена');
            
            if (counterpartyForm) {
                counterpartyForm.classList.add('active');
                console.log('Класс active добавлен к форме контрагента');
            } else {
                console.error('Форма контрагента не найдена в DOM при переключении вкладки');
                // Проверяем содержимое модального окна
                const modalContent = document.querySelector('.auth-modal__content-wrapper');
                console.log('Содержимое модального окна в switchTab:', modalContent ? modalContent.innerHTML.substring(0, 100) + '...' : 'Контент-враппер не найден');
                
                // Проверяем все формы в DOM
                const allForms = document.querySelectorAll('form');
                console.log('Все формы в DOM:', Array.from(allForms).map(form => form.id));
                
                // Если форма не найдена, но есть контент-враппер, добавляем форму
                if (modalContent && !modalContent.innerHTML.includes('id="counterpartyForm"')) {
                    console.log('Форма контрагента отсутствует, добавляем её динамически');
                    
                    // Добавляем форму контрагента в конец содержимого модального окна
                    modalContent.innerHTML += `
                    <!-- Форма карточки контрагента -->
                    <form id="counterpartyForm" class="auth-form counterparty-form active">
                        <button type="button" class="back-button" data-return-to="register">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        
                        <h2>Карточка контрагента</h2>
                        <p class="form-subtitle">Заполните данные вашей организации</p>
                        
                        <div class="counterparty-card">
                            <div class="counterparty-card__header">
                                <div class="counterparty-card__icon">
                                    <i class="fas fa-building"></i>
                                </div>
                                <div class="counterparty-progress">
                                    <div class="progress-bar">
                                        <div class="progress-indicator"></div>
                                    </div>
                                    <span class="progress-text">Заполнено: <span class="progress-percent">0%</span></span>
                                </div>
                            </div>
                            
                            <div class="counterparty-card__content">
                                <div class="form-group">
                                    <label for="orgName">Наименование организации</label>
                                    <div class="input-container">
                                        <i class="fas fa-building input-icon"></i>
                                        <input type="text" id="orgName" placeholder="ООО 'Компания'" required>
                                    </div>
                                    <span class="error-message"></span>
                                </div>
                                
                                <div class="form-group">
                                    <label for="legalAddress">Юридический адрес</label>
                                    <div class="input-container">
                                        <i class="fas fa-map-marker-alt input-icon"></i>
                                        <input type="text" id="legalAddress" placeholder="г. Москва, ул. Примерная, д. 1" required>
                                    </div>
                                    <span class="error-message"></span>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="inn">ИНН</label>
                                        <div class="input-container">
                                            <i class="fas fa-id-card input-icon"></i>
                                            <input type="text" id="inn" placeholder="7700000000" required>
                                        </div>
                                        <span class="error-message"></span>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="kpp">КПП</label>
                                        <div class="input-container">
                                            <i class="fas fa-id-card input-icon"></i>
                                            <input type="text" id="kpp" placeholder="770000000" required>
                                        </div>
                                        <span class="error-message"></span>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="ogrn">ОГРН</label>
                                    <div class="input-container">
                                        <i class="fas fa-file-alt input-icon"></i>
                                        <input type="text" id="ogrn" placeholder="1000000000000" required>
                                    </div>
                                    <span class="error-message"></span>
                                </div>
                                
                                <div class="form-group">
                                    <label for="contactPerson">Контактное лицо</label>
                                    <div class="input-container">
                                        <i class="fas fa-user input-icon"></i>
                                        <input type="text" id="contactPerson" placeholder="Иванов Иван Иванович" required>
                                    </div>
                                    <span class="error-message"></span>
                                </div>
                                
                                <div class="form-group">
                                    <label for="contactPosition">Должность</label>
                                    <div class="input-container">
                                        <i class="fas fa-briefcase input-icon"></i>
                                        <input type="text" id="contactPosition" placeholder="Генеральный директор" required>
                                    </div>
                                    <span class="error-message"></span>
                                </div>
                                
                                <div class="form-group">
                                    <label for="workPhone">Рабочий телефон</label>
                                    <div class="input-container">
                                        <i class="fas fa-phone input-icon"></i>
                                        <input type="tel" id="workPhone" placeholder="+7 (999) 123-45-67" required>
                                    </div>
                                    <span class="error-message"></span>
                                </div>
                                
                                <div class="form-group">
                                    <label for="contactEmail">Email для связи</label>
                                    <div class="input-container">
                                        <i class="fas fa-envelope input-icon"></i>
                                        <input type="email" id="contactEmail" placeholder="contact@company.ru" required>
                                    </div>
                                    <span class="error-message"></span>
                                </div>
                                
                                <div class="form-group">
                                    <label>Предпочтительный способ связи</label>
                                    <div class="radio-group">
                                        <div class="radio-option">
                                            <input type="radio" id="contactMethodWhatsapp" name="contactMethod" value="whatsapp">
                                            <label for="contactMethodWhatsapp"><i class="fab fa-whatsapp"></i> WhatsApp</label>
                                        </div>
                                        <div class="radio-option">
                                            <input type="radio" id="contactMethodTelegram" name="contactMethod" value="telegram">
                                            <label for="contactMethodTelegram"><i class="fab fa-telegram"></i> Telegram</label>
                                        </div>
                                        <div class="radio-option">
                                            <input type="radio" id="contactMethodPhone" name="contactMethod" value="phone">
                                            <label for="contactMethodPhone"><i class="fas fa-phone"></i> Телефон</label>
                                        </div>
                                        <div class="radio-option">
                                            <input type="radio" id="contactMethodEmail" name="contactMethod" value="email" checked>
                                            <label for="contactMethodEmail"><i class="fas fa-envelope"></i> Email</label>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="form-section">
                                    <h3>Банковские реквизиты</h3>
                                    
                                    <div class="form-group">
                                        <label for="bankName">Наименование банка</label>
                                        <div class="input-container">
                                            <i class="fas fa-university input-icon"></i>
                                            <input type="text" id="bankName" placeholder="АО 'Банк'" required>
                                        </div>
                                        <span class="error-message"></span>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="bankAccount">Расчетный счет</label>
                                        <div class="input-container">
                                            <i class="fas fa-money-check input-icon"></i>
                                            <input type="text" id="bankAccount" placeholder="40700000000000000000" required>
                                        </div>
                                        <span class="error-message"></span>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="corrAccount">Корреспондентский счет</label>
                                        <div class="input-container">
                                            <i class="fas fa-money-check-alt input-icon"></i>
                                            <input type="text" id="corrAccount" placeholder="30100000000000000000" required>
                                        </div>
                                        <span class="error-message"></span>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="bik">БИК</label>
                                        <div class="input-container">
                                            <i class="fas fa-hashtag input-icon"></i>
                                            <input type="text" id="bik" placeholder="044500000" required>
                                        </div>
                                        <span class="error-message"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <button type="submit" class="submit-button">
                            <span class="button-text">Сохранить данные</span>
                            <span class="loading-spinner"></span>
                        </button>
                    </form>
                    `;
                    
                    console.log('Форма контрагента добавлена в DOM');
                    
                    // Обновляем глобальные переменные
                    forms = document.querySelectorAll('.auth-form');
                    console.log('Обновлены глобальные переменные, количество форм:', forms.length);
                    
                    // Инициализируем карточку контрагента
                    initCounterpartyCard();
                }
            }
            // Не активируем вкладку, так как это дополнительный экран
            
            // Инициализируем карточку контрагента
            console.log('Вызываем initCounterpartyCard');
            initCounterpartyCard();
        }
    }
    
    // Отображение экрана успеха
    function showSuccessScreen(type) {
        // Скрыть все формы
        forms.forEach(form => form.classList.remove('active'));
        
        // Показать экран успеха
        if (successScreen) {
            // Настраиваем текст в зависимости от типа операции
            const successTitle = successScreen.querySelector('h2');
            const successMessage = successScreen.querySelector('.success-message');
            
            if (successTitle && successMessage) {
                if (type === 'login') {
                    successTitle.textContent = 'Вход выполнен!';
                    successMessage.textContent = 'Вы успешно вошли в систему. Добро пожаловать!';
                } else if (type === 'register') {
                    successTitle.textContent = 'Регистрация завершена!';
                    successMessage.textContent = 'Ваш аккаунт успешно создан. Добро пожаловать!';
                } else if (type === 'forgotPassword') {
                    successTitle.textContent = 'Ссылка отправлена!';
                    successMessage.textContent = 'Проверьте вашу электронную почту для получения инструкций по восстановлению пароля.';
                } else if (type === 'counterparty') {
                    successTitle.textContent = 'Данные сохранены!';
                    successMessage.textContent = 'Карточка контрагента успешно заполнена и сохранена.';
                }
            }
            
            successScreen.style.display = 'block';
            
            // Установить таймер для показа меню пользователя через 2 секунды
            setTimeout(() => {
                // Скрыть экран успеха
                successScreen.style.display = 'none';
                
                // Показать меню пользователя в модальном окне или закрыть модальное окно
                if (type === 'login' || type === 'register' || type === 'counterparty') {
                    // Для входа и регистрации показываем меню пользователя
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
            newButton.innerHTML = `<i class="fas fa-sign-in-alt" style="color: white;"></i><span>Войти</span>`;
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
            newButton.innerHTML = `<i class="fas fa-sign-in-alt" style="color: white;"></i><span>Войти</span>`;
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
        
        // Анимированная перезагрузка страницы после выхода из аккаунта
        if (typeof window.animatedReload === 'function') {
            // Используем функцию анимированной перезагрузки с минималистичной темой
            window.animatedReload(400, false, '', '', 'minimal');
        } else {
            // Резервный вариант с обычной перезагрузкой
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
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
                                </div>
                            </div>
                            <div class="user-menu__email">${userData.email}</div>
                        </div>
                        <div class="logout-button" data-action="logout" title="Выйти">
                            <i class="fas fa-sign-out-alt"></i>
                        </div>
                    </div>
                    
                    <ul class="user-menu__items">
                        <li class="user-menu__item" data-action="profile">
                            <i class="fas fa-id-card"></i>
                            <span>Профиль</span>
                        </li>
                        <li class="user-menu__item" data-action="counterparty">
                            <i class="fas fa-building"></i>
                            <span>Данные контрагента</span>
                        </li>
                        <li class="user-menu__item" data-action="orders">
                            <i class="fas fa-shopping-bag"></i>
                            <span>Заказы</span>
                        </li>
                        <li class="user-menu__item" data-action="settings">
                            <i class="fas fa-cog"></i>
                            <span>Настройки</span>
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
                    
                    .user-menu__email {
                        font-size: 14px;
                        color: ${document.body.classList.contains('dark') ? '#aaa' : '#666'};
                    }
                    
                    .logout-button {
                        position: absolute;
                        top: 15px;
                        right: 15px;
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: ${document.body.classList.contains('dark') ? '#444' : '#f1f1f1'};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        z-index: 5;
                        box-shadow: 0 2px 6px rgba(244, 67, 54, 0.2);
                        overflow: hidden;
                    }
                    
                    .logout-button:before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: radial-gradient(circle at center, rgba(244, 67, 54, 0.2) 0%, transparent 70%);
                        opacity: 0;
                        transition: opacity 0.3s ease;
                    }
                    
                    .logout-button:hover {
                        background: ${document.body.classList.contains('dark') ? '#555' : '#e5e5e5'};
                        transform: scale(1.15) rotate(5deg);
                        box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
                    }
                    
                    .logout-button:hover:before {
                        opacity: 1;
                    }
                    
                    .logout-button i {
                        color: #f44336;
                        font-size: 16px;
                        transition: all 0.3s ease;
                    }
                    
                    .logout-button:hover i {
                        transform: scale(1.2);
                    }
                    
                    .logout-button:after {
                        content: 'Выйти';
                        position: absolute;
                        top: -30px;
                        left: 50%;
                        transform: translateX(-50%) translateY(10px);
                        background: ${document.body.classList.contains('dark') ? '#333' : '#fff'};
                        color: ${document.body.classList.contains('dark') ? '#fff' : '#333'};
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        opacity: 0;
                        visibility: hidden;
                        transition: all 0.3s ease;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                        white-space: nowrap;
                        pointer-events: none;
                    }
                    
                    .logout-button:hover:after {
                        opacity: 1;
                        visibility: visible;
                        transform: translateX(-50%) translateY(0);
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
                        margin-bottom: 10px;
                        border-bottom: 1px solid ${document.body.classList.contains('dark') ? '#444' : '#eee'};
                        padding-bottom: 15px;
                        background-color: ${document.body.classList.contains('dark') ? '#3a3a3a' : '#f5f5f5'};
                        border-radius: 8px;
                    }
                    
                    .user-menu__item[data-action="logout"] i {
                        color: #f44336;
                    }
                    
                    .user-menu__item[data-action="logout"]:hover {
                        background-color: ${document.body.classList.contains('dark') ? '#4a4a4a' : '#ebebeb'};
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
                
                // Добавляем обработчик для кнопки выхода
                const logoutButton = contentWrapper.querySelector('.logout-button');
                if (logoutButton) {
                    logoutButton.addEventListener('click', function(e) {
                        e.stopPropagation();
                        logoutUser();
                    });
                }
                
                // Добавляем обработчики к пунктам меню
                const menuItems = contentWrapper.querySelectorAll('.user-menu__item');
                menuItems.forEach(item => {
                    item.addEventListener('click', function(e) {
                        e.stopPropagation(); // Предотвращаем всплытие
                        const action = this.getAttribute('data-action');
                        console.log(`Modal menu item clicked: ${action}`);
                        
                        // Выполняем соответствующее действие
                        if (action === 'profile') {
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
                        } else if (action === 'counterparty') {
                            // Закрываем модальное окно
                            closeModal();
                            // Вызываем функцию редактирования данных контрагента
                            editCounterpartyData();
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
                
                // Добавляем обработчик для кнопки выхода
                const logoutButton = userMenu.querySelector('.logout-button');
                if (logoutButton) {
                    logoutButton.addEventListener('click', function(e) {
                        e.stopPropagation();
                        
                        // Скрываем меню
                        userMenu.style.opacity = '0';
                        userMenu.style.visibility = 'hidden';
                        userMenu.style.transform = 'translateY(10px)';
                        
                        // Выполняем выход после анимации скрытия
                        setTimeout(() => {
                            logoutUser();
                            
                            // Удаляем меню из DOM
                            if (userMenu.parentNode) {
                                userMenu.parentNode.removeChild(userMenu);
                            }
                        }, 300);
                    });
                }
                
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
                            } else if (action === 'counterparty') {
                                // Вызываем функцию редактирования данных контрагента
                                editCounterpartyData();
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
        console.log('Вызвана функция createModalWindow');
        
        if (document.querySelector('.auth-modal')) {
            console.log('Модальное окно уже существует, выходим из функции');
            return;
        }
        
        console.log('Создаем новое модальное окно');
        
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
        console.log('Базовая структура модального окна добавлена в DOM');
        
        // Добавляем обработчики событий
        const newModal = document.querySelector('.auth-modal');
        const newOverlay = document.querySelector('.auth-modal__overlay');
        const newCloseButton = document.querySelector('.auth-modal__close');
        const contentWrapper = document.querySelector('.auth-modal__content-wrapper');
        
        console.log('Получены ссылки на элементы модального окна:', {
            modal: newModal ? 'Найдено' : 'Не найдено',
            overlay: newOverlay ? 'Найдено' : 'Не найдено',
            closeButton: newCloseButton ? 'Найдено' : 'Не найдено',
            contentWrapper: contentWrapper ? 'Найдено' : 'Не найдено'
        });
        
        // Копируем содержимое модального окна из HTML-файла
        const templateContent = document.querySelector('#auth-modal-template');
        console.log('Шаблон модального окна:', templateContent ? 'Найден' : 'Не найден');
        
        if (templateContent) {
            // Если есть шаблон, используем его
            contentWrapper.innerHTML = templateContent.innerHTML;
            console.log('Содержимое модального окна скопировано из шаблона');
        } else {
            console.log('Шаблон не найден, создаем содержимое программно');
            // Если шаблона нет, создаем содержимое программно
            contentWrapper.innerHTML = `
                <div class="auth-modal__header">
                    <div class="auth-tabs">
                        <button class="auth-tab active" data-tab="login">Вход</button>
                        <button class="auth-tab" data-tab="register">Регистрация</button>
                    </div>
                </div>
                
                <div class="auth-modal__content">
                    <!-- Форма входа -->
                    <form id="loginForm" class="auth-form active">
                        <h2>Вход в аккаунт</h2>
                        
                        <div class="social-login">
                            <button type="button" class="social-button google">
                                <i class="fab fa-google"></i>
                                <span>Google</span>
                            </button>
                            <button type="button" class="social-button vk">
                                <i class="fab fa-vk"></i>
                                <span>ВКонтакте</span>
                            </button>
                        </div>
                        
                        <div class="divider">
                            <span>или через email</span>
                        </div>
                        
                        <div class="form-group">
                            <label for="loginEmail">Email</label>
                            <div class="input-container">
                                <i class="fas fa-envelope input-icon"></i>
                                <input type="email" id="loginEmail" placeholder="your@email.com" required>
                            </div>
                            <span class="error-message"></span>
                        </div>
                        
                        <div class="form-group">
                            <label for="loginPassword">Пароль</label>
                            <div class="input-container">
                                <i class="fas fa-lock input-icon"></i>
                                <input type="password" id="loginPassword" placeholder="••••••••" required>
                                <button type="button" class="toggle-password">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                            <span class="error-message"></span>
                        </div>
                        
                        <div class="form-group checkbox-group">
                            <div class="checkbox-container">
                                <input type="checkbox" id="rememberMe">
                                <label for="rememberMe">Запомнить меня</label>
                            </div>
                            <a href="#" class="forgot-password-link">Забыли пар1оль?</a>
                        </div>
                        
                        <button type="submit" class="submit-button">
                            <span class="button-text">Войти</span>
                            <span class="loading-spinner"></span>
                        </button>
                    </form>
                    
                    <!-- Форма регистрации -->
                    <form id="registerForm" class="auth-form">
                        <h2>Создать аккаунт</h2>
                        
                        <div class="form-group">
                            <label for="registerName">Имя и фамилия</label>
                            <div class="input-container">
                                <i class="fas fa-user input-icon"></i>
                                <input type="text" id="registerName" placeholder="Иван Иванов" required>
                            </div>
                            <span class="error-message"></span>
                        </div>
                        
                        <div class="form-group">
                            <label for="registerEmail">Email</label>
                            <div class="input-container">
                                <i class="fas fa-envelope input-icon"></i>
                                <input type="email" id="registerEmail" placeholder="your@email.com" required>
                            </div>
                            <span class="error-message"></span>
                        </div>
                        
                        <div class="form-group">
                            <label for="registerPassword">Пароль</label>
                            <div class="input-container">
                                <i class="fas fa-lock input-icon"></i>
                                <input type="password" id="registerPassword" placeholder="••••••••" required>
                                <button type="button" class="toggle-password">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                            <span class="error-message"></span>
                            
                            <div class="password-strength">
                                <div class="strength-meter">
                                    <div class="strength-indicator"></div>
                                </div>
                                <span class="strength-text"></span>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="registerPasswordConfirm">Подтвердите пароль</label>
                            <div class="input-container">
                                <i class="fas fa-lock input-icon"></i>
                                <input type="password" id="registerPasswordConfirm" placeholder="••••••••" required>
                                <button type="button" class="toggle-password">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                            <span class="error-message"></span>
                        </div>
                        
                        <div class="form-group">
                            <div class="agreement-checkbox">
                                <input type="checkbox" id="termsAgreement" required>
                                <label for="termsAgreement">Я согласен с <a href="#">Условиями использования</a> и <a href="#">Политикой конфиденциальности</a></label>
                            </div>
                            <span class="error-message"></span>
                        </div>
                        
                        <button type="submit" class="submit-button">
                            <span class="button-text">Создать аккаунт</span>
                            <span class="loading-spinner"></span>
                        </button>
                    </form>
                    
                    <!-- Форма карточки контрагента -->
                    <form id="counterpartyForm" class="auth-form counterparty-form">
                        <button type="button" class="back-button" data-return-to="register">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        
                        <h2>Карточка контрагента</h2>
                        <p class="form-subtitle">Заполните данные вашей организации</p>
                        
                        <div class="counterparty-card">
                            <div class="counterparty-card__header">
                                <div class="counterparty-card__icon">
                                    <i class="fas fa-building"></i>
                                </div>
                                <div class="counterparty-progress">
                                    <div class="progress-bar">
                                        <div class="progress-indicator"></div>
                                    </div>
                                    <span class="progress-text">Заполнено: <span class="progress-percent">0%</span></span>
                                </div>
                            </div>
                            
                            <div class="counterparty-card__content">
                                <div class="form-group">
                                    <label for="orgName">Наименование организации</label>
                                    <div class="input-container">
                                        <i class="fas fa-building input-icon"></i>
                                        <input type="text" id="orgName" placeholder="ООО 'Компания'" required>
                                    </div>
                                    <span class="error-message"></span>
                                </div>
                                
                                <div class="form-group">
                                    <label for="legalAddress">Юридический адрес</label>
                                    <div class="input-container">
                                        <i class="fas fa-map-marker-alt input-icon"></i>
                                        <input type="text" id="legalAddress" placeholder="г. Москва, ул. Примерная, д. 1" required>
                                    </div>
                                    <span class="error-message"></span>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="inn">ИНН</label>
                                        <div class="input-container">
                                            <i class="fas fa-id-card input-icon"></i>
                                            <input type="text" id="inn" placeholder="7700000000" required>
                                        </div>
                                        <span class="error-message"></span>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="kpp">КПП</label>
                                        <div class="input-container">
                                            <i class="fas fa-id-card input-icon"></i>
                                            <input type="text" id="kpp" placeholder="770000000" required>
                                        </div>
                                        <span class="error-message"></span>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="ogrn">ОГРН</label>
                                    <div class="input-container">
                                        <i class="fas fa-file-alt input-icon"></i>
                                        <input type="text" id="ogrn" placeholder="1000000000000" required>
                                    </div>
                                    <span class="error-message"></span>
                                </div>
                                
                                <div class="form-group">
                                    <label for="contactPerson">Контактное лицо</label>
                                    <div class="input-container">
                                        <i class="fas fa-user input-icon"></i>
                                        <input type="text" id="contactPerson" placeholder="Иванов Иван Иванович" required>
                                    </div>
                                    <span class="error-message"></span>
                                </div>
                                
                                <div class="form-group">
                                    <label for="contactPosition">Должность</label>
                                    <div class="input-container">
                                        <i class="fas fa-briefcase input-icon"></i>
                                        <input type="text" id="contactPosition" placeholder="Генеральный директор" required>
                                    </div>
                                    <span class="error-message"></span>
                                </div>
                                
                                <div class="form-group">
                                    <label for="workPhone">Рабочий телефон</label>
                                    <div class="input-container">
                                        <i class="fas fa-phone input-icon"></i>
                                        <input type="tel" id="workPhone" placeholder="+7 (999) 123-45-67" required>
                                    </div>
                                    <span class="error-message"></span>
                                </div>
                                
                                <div class="form-group">
                                    <label for="contactEmail">Email для связи</label>
                                    <div class="input-container">
                                        <i class="fas fa-envelope input-icon"></i>
                                        <input type="email" id="contactEmail" placeholder="contact@company.ru" required>
                                    </div>
                                    <span class="error-message"></span>
                                </div>
                                
                                <div class="form-group">
                                    <label>Предпочтительный способ связи</label>
                                    <div class="radio-group">
                                        <div class="radio-option">
                                            <input type="radio" id="contactMethodWhatsapp" name="contactMethod" value="whatsapp">
                                            <label for="contactMethodWhatsapp"><i class="fab fa-whatsapp"></i> WhatsApp</label>
                                        </div>
                                        <div class="radio-option">
                                            <input type="radio" id="contactMethodTelegram" name="contactMethod" value="telegram">
                                            <label for="contactMethodTelegram"><i class="fab fa-telegram"></i> Telegram</label>
                                        </div>
                                        <div class="radio-option">
                                            <input type="radio" id="contactMethodPhone" name="contactMethod" value="phone">
                                            <label for="contactMethodPhone"><i class="fas fa-phone"></i> Телефон</label>
                                        </div>
                                        <div class="radio-option">
                                            <input type="radio" id="contactMethodEmail" name="contactMethod" value="email" checked>
                                            <label for="contactMethodEmail"><i class="fas fa-envelope"></i> Email</label>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="form-section">
                                    <h3>Банковские реквизиты</h3>
                                    
                                    <div class="form-group">
                                        <label for="bankName">Наименование банка</label>
                                        <div class="input-container">
                                            <i class="fas fa-university input-icon"></i>
                                            <input type="text" id="bankName" placeholder="АО 'Банк'" required>
                                        </div>
                                        <span class="error-message"></span>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="bankAccount">Расчетный счет</label>
                                        <div class="input-container">
                                            <i class="fas fa-money-check input-icon"></i>
                                            <input type="text" id="bankAccount" placeholder="40700000000000000000" required>
                                        </div>
                                        <span class="error-message"></span>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="corrAccount">Корреспондентский счет</label>
                                        <div class="input-container">
                                            <i class="fas fa-money-check-alt input-icon"></i>
                                            <input type="text" id="corrAccount" placeholder="30100000000000000000" required>
                                        </div>
                                        <span class="error-message"></span>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="bik">БИК</label>
                                        <div class="input-container">
                                            <i class="fas fa-hashtag input-icon"></i>
                                            <input type="text" id="bik" placeholder="044500000" required>
                                        </div>
                                        <span class="error-message"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <button type="submit" class="submit-button">
                            <span class="button-text">Сохранить данные</span>
                            <span class="loading-spinner"></span>
                        </button>
                    </form>
                    
                    <!-- Экран успеха -->
                    <div class="success-screen">
                        <div class="success-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <h2>Успешно!</h2>
                        <p class="success-message">Операция выполнена успешно.</p>
                    </div>
                    
                    <!-- Форма восстановления пароля -->
                    <form id="forgotPasswordForm" class="auth-form">
                        <button type="button" class="back-button" data-return-to="login">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        
                        <h2>Восстановление пароля</h2>
                        <p class="form-subtitle">Укажите email, на который будет отправлена ссылка для сброса пароля</p>
                        
                        <div class="form-group">
                            <label for="forgotEmail">Email</label>
                            <div class="input-container">
                                <i class="fas fa-envelope input-icon"></i>
                                <input type="email" id="forgotEmail" placeholder="your@email.com" required>
                            </div>
                            <span class="error-message"></span>
                        </div>
                        
                        <button type="submit" class="submit-button">
                            <span class="button-text">Отправить ссылку</span>
                            <span class="loading-spinner"></span>
                        </button>
                    </form>
                </div>
            `;
            console.log('Содержимое модального окна создано программно');
        }
        
        // Проверяем наличие формы контрагента
        const counterpartyForm = document.getElementById('counterpartyForm');
        console.log('Форма контрагента после создания модального окна:', counterpartyForm ? 'Найдена' : 'Не найдена');
        
        // Добавляем обработчики событий для модального окна
        if (newOverlay) {
            newOverlay.addEventListener('click', closeModal);
            console.log('Добавлен обработчик клика для overlay');
        }
        
        if (newCloseButton) {
            newCloseButton.addEventListener('click', closeModal);
            console.log('Добавлен обработчик клика для кнопки закрытия');
        }
        
        // Обновляем ссылки на формы и вкладки
        forms = document.querySelectorAll('.auth-form');
        tabs = document.querySelectorAll('.auth-tab');
        successScreen = document.querySelector('.success-screen');
        
        console.log('Обновлены глобальные переменные:', {
            forms: forms.length,
            tabs: tabs.length,
            successScreen: successScreen ? 'Найден' : 'Не найден'
        });
        
        // Добавляем обработчики для вкладок
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.getAttribute('data-tab');
                switchTab(tabName);
            });
        });
        console.log('Добавлены обработчики для вкладок');
        
        // Добавляем обработчики для кнопок "назад"
        const backButtons = document.querySelectorAll('.back-button');
        backButtons.forEach(button => {
            button.addEventListener('click', function() {
                const returnTo = this.getAttribute('data-return-to');
                switchTab(returnTo);
            });
        });
        console.log('Добавлены обработчики для кнопок "назад"');
        
        // Добавляем обработчик для ссылки "Забыли пароль"
        const forgotPasswordLink = document.querySelector('.forgot-password-link');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', function(e) {
                e.preventDefault();
                switchTab('forgot');
            });
            console.log('Добавлен обработчик для ссылки "Забыли пароль"');
        }
        
        // Добавляем обработчики для кнопок показа/скрытия пароля
        const togglePasswordButtons = document.querySelectorAll('.toggle-password');
        togglePasswordButtons.forEach(button => {
            button.addEventListener('click', function() {
                const input = this.parentElement.querySelector('input');
                const icon = this.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
        console.log('Добавлены обработчики для кнопок показа/скрытия пароля');
        
        // Добавляем обработчики для отправки форм
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                handleFormSubmit(this, this.id.replace('Form', ''));
            });
        });
        console.log('Добавлены обработчики для отправки форм');
        
        // Добавляем обработчик для проверки силы пароля
        const registerPasswordInput = document.getElementById('registerPassword');
        if (registerPasswordInput) {
            registerPasswordInput.addEventListener('input', checkPasswordStrength);
            console.log('Добавлен обработчик для проверки силы пароля');
        }
        
        // Инициализируем карточку контрагента, если форма существует
        if (counterpartyForm) {
            initCounterpartyCard();
            console.log('Инициализирована карточка контрагента');
        }
        
        console.log('Модальное окно успешно создано и настроено');
    }

    // Экспортируем функцию showUserMenu в глобальное пространство имен
    window.showUserMenu = showUserMenu;
    
    // Экспортируем функцию openModal в глобальное пространство имен
    window.openModal = openModal;
    
    // Экспортируем функцию closeModal в глобальное пространство имен
    window.closeModal = closeModal;
    
    // Экспортируем функцию switchTab в глобальное пространство имен
    window.switchTab = switchTab;
    
    // Экспортируем функцию редактирования данных контрагента в глобальное пространство имен
    window.editCounterpartyData = editCounterpartyData;

    // Добавляем функцию для редактирования данных контрагента
    function editCounterpartyData() {
        console.log('Вызвана функция editCounterpartyData');
        
        // Получаем текущего пользователя и его данные
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        console.log('Данные пользователя:', userData);
        
        if (!userData.loggedIn || !userData.email) {
            showNotification('Для редактирования данных контрагента необходимо войти в систему', 'error');
            return;
        }
        
        // Получаем список зарегистрированных пользователей
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        console.log('Количество зарегистрированных пользователей:', users.length);
        
        // Находим текущего пользователя
        const currentUser = users.find(user => user.email.toLowerCase() === userData.email.toLowerCase());
        console.log('Найден текущий пользователь:', currentUser ? 'Да' : 'Нет');
        
        if (!currentUser) {
            showNotification('Не удалось найти данные пользователя', 'error');
            return;
        }
        
        // Открываем модальное окно
        console.log('Открываем модальное окно');
        openModal();
        
        // Проверяем наличие модального окна
        const modalExists = document.querySelector('.auth-modal');
        console.log('Модальное окно создано:', modalExists ? 'Да' : 'Нет');
        
        // Проверяем наличие формы контрагента перед переключением вкладки
        const counterpartyFormBeforeSwitch = document.getElementById('counterpartyForm');
        console.log('Форма контрагента перед переключением вкладки:', counterpartyFormBeforeSwitch ? 'Найдена' : 'Не найдена');
        
        // Если форма контрагента не найдена, проверяем содержимое модального окна
        if (!counterpartyFormBeforeSwitch) {
            console.log('Форма контрагента не найдена, пытаемся исправить ситуацию');
            
            const contentWrapper = document.querySelector('.auth-modal__content-wrapper');
            if (contentWrapper) {
                console.log('Проверяем, содержит ли контент-враппер форму контрагента');
                
                // Проверяем, есть ли в HTML-коде форма контрагента
                if (!contentWrapper.innerHTML.includes('id="counterpartyForm"')) {
                    console.log('Форма контрагента отсутствует в HTML, добавляем её');
                    
                    // Добавляем форму контрагента в конец содержимого модального окна
                    contentWrapper.innerHTML += `
                    <!-- Форма карточки контрагента -->
                    <form id="counterpartyForm" class="auth-form counterparty-form">
                        <button type="button" class="back-button" data-return-to="register">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        
                        <h2>Карточка контрагента</h2>
                        <p class="form-subtitle">Заполните данные вашей организации</p>
                        
                        <div class="counterparty-card">
                            <div class="counterparty-card__header">
                                <div class="counterparty-card__icon">
                                    <i class="fas fa-building"></i>
                                </div>
                                <div class="counterparty-progress">
                                    <div class="progress-bar">
                                        <div class="progress-indicator"></div>
                                    </div>
                                    <span class="progress-text">Заполнено: <span class="progress-percent">0%</span></span>
                                </div>
                            </div>
                            
                            <div class="counterparty-card__content">
                                <div class="form-group">
                                    <label for="orgName">Наименование организации</label>
                                    <div class="input-container">
                                        <i class="fas fa-building input-icon"></i>
                                        <input type="text" id="orgName" placeholder="ООО 'Компания'" required>
                                    </div>
                                    <span class="error-message"></span>
                                </div>
                                
                                <div class="form-group">
                                    <label for="legalAddress">Юридический адрес</label>
                                    <div class="input-container">
                                        <i class="fas fa-map-marker-alt input-icon"></i>
                                        <input type="text" id="legalAddress" placeholder="г. Москва, ул. Примерная, д. 1" required>
                                    </div>
                                    <span class="error-message"></span>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="inn">ИНН</label>
                                        <div class="input-container">
                                            <i class="fas fa-id-card input-icon"></i>
                                            <input type="text" id="inn" placeholder="7700000000" required>
                                        </div>
                                        <span class="error-message"></span>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="kpp">КПП</label>
                                        <div class="input-container">
                                            <i class="fas fa-id-card input-icon"></i>
                                            <input type="text" id="kpp" placeholder="770000000" required>
                                        </div>
                                        <span class="error-message"></span>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="ogrn">ОГРН</label>
                                    <div class="input-container">
                                        <i class="fas fa-file-alt input-icon"></i>
                                        <input type="text" id="ogrn" placeholder="1000000000000" required>
                                    </div>
                                    <span class="error-message"></span>
                                </div>
                                
                                <div class="form-group">
                                    <label for="contactPerson">Контактное лицо</label>
                                    <div class="input-container">
                                        <i class="fas fa-user input-icon"></i>
                                        <input type="text" id="contactPerson" placeholder="Иванов Иван Иванович" required>
                                    </div>
                                    <span class="error-message"></span>
                                </div>
                                
                                <div class="form-group">
                                    <label for="contactPosition">Должность</label>
                                    <div class="input-container">
                                        <i class="fas fa-briefcase input-icon"></i>
                                        <input type="text" id="contactPosition" placeholder="Генеральный директор" required>
                                    </div>
                                    <span class="error-message"></span>
                                </div>
                                
                                <div class="form-group">
                                    <label for="workPhone">Рабочий телефон</label>
                                    <div class="input-container">
                                        <i class="fas fa-phone input-icon"></i>
                                        <input type="tel" id="workPhone" placeholder="+7 (999) 123-45-67" required>
                                    </div>
                                    <span class="error-message"></span>
                                </div>
                                
                                <div class="form-group">
                                    <label for="contactEmail">Email для связи</label>
                                    <div class="input-container">
                                        <i class="fas fa-envelope input-icon"></i>
                                        <input type="email" id="contactEmail" placeholder="contact@company.ru" required>
                                    </div>
                                    <span class="error-message"></span>
                                </div>
                                
                                <div class="form-group">
                                    <label>Предпочтительный способ связи</label>
                                    <div class="radio-group">
                                        <div class="radio-option">
                                            <input type="radio" id="contactMethodWhatsapp" name="contactMethod" value="whatsapp">
                                            <label for="contactMethodWhatsapp"><i class="fab fa-whatsapp"></i> WhatsApp</label>
                                        </div>
                                        <div class="radio-option">
                                            <input type="radio" id="contactMethodTelegram" name="contactMethod" value="telegram">
                                            <label for="contactMethodTelegram"><i class="fab fa-telegram"></i> Telegram</label>
                                        </div>
                                        <div class="radio-option">
                                            <input type="radio" id="contactMethodPhone" name="contactMethod" value="phone">
                                            <label for="contactMethodPhone"><i class="fas fa-phone"></i> Телефон</label>
                                        </div>
                                        <div class="radio-option">
                                            <input type="radio" id="contactMethodEmail" name="contactMethod" value="email" checked>
                                            <label for="contactMethodEmail"><i class="fas fa-envelope"></i> Email</label>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="form-section">
                                    <h3>Банковские реквизиты</h3>
                                    
                                    <div class="form-group">
                                        <label for="bankName">Наименование банка</label>
                                        <div class="input-container">
                                            <i class="fas fa-university input-icon"></i>
                                            <input type="text" id="bankName" placeholder="АО 'Банк'" required>
                                        </div>
                                        <span class="error-message"></span>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="bankAccount">Расчетный счет</label>
                                        <div class="input-container">
                                            <i class="fas fa-money-check input-icon"></i>
                                            <input type="text" id="bankAccount" placeholder="40700000000000000000" required>
                                        </div>
                                        <span class="error-message"></span>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="corrAccount">Корреспондентский счет</label>
                                        <div class="input-container">
                                            <i class="fas fa-money-check-alt input-icon"></i>
                                            <input type="text" id="corrAccount" placeholder="30100000000000000000" required>
                                        </div>
                                        <span class="error-message"></span>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="bik">БИК</label>
                                        <div class="input-container">
                                            <i class="fas fa-hashtag input-icon"></i>
                                            <input type="text" id="bik" placeholder="044500000" required>
                                        </div>
                                        <span class="error-message"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <button type="submit" class="submit-button">
                            <span class="button-text">Сохранить данные</span>
                            <span class="loading-spinner"></span>
                        </button>
                    </form>`;
                    
                    console.log('Форма контрагента добавлена в DOM');
                    
                    // Обновляем глобальные переменные
                    forms = document.querySelectorAll('.auth-form');
                    console.log('Обновлены глобальные переменные, количество форм:', forms.length);
                    
                    // Инициализируем карточку контрагента
                    initCounterpartyCard();
                } else {
                    console.log('Форма контрагента присутствует в HTML, но не найдена через getElementById');
                }
            } else {
                console.error('Контент-враппер модального окна не найден');
            }
        }
        
        // Переключаемся на форму контрагента
        console.log('Переключаемся на вкладку контрагента');
        switchTab('counterparty');
        
        // Заполняем форму данными контрагента
        console.log('Ищем форму контрагента в DOM');
        const counterpartyForm = document.getElementById('counterpartyForm');
        console.log('Форма контрагента после переключения вкладки:', counterpartyForm ? 'Найдена' : 'Не найдена');
        
        if (!counterpartyForm) {
            console.error('Форма контрагента не найдена. Проверяем содержимое модального окна:');
            const modalContent = document.querySelector('.auth-modal__content-wrapper');
            console.log('Содержимое модального окна:', modalContent ? modalContent.innerHTML : 'Контент-враппер не найден');
            
            showNotification('Форма контрагента не найдена', 'error');
            return;
        }
        
        // Если есть данные контрагента, заполняем форму
        if (currentUser.counterparty) {
            const cp = currentUser.counterparty;
            console.log('Данные контрагента для заполнения формы:', cp);
            
            // Заполняем основные поля
            if (counterpartyForm.querySelector('#orgName')) 
                counterpartyForm.querySelector('#orgName').value = cp.orgName || '';
            
            if (counterpartyForm.querySelector('#legalAddress')) 
                counterpartyForm.querySelector('#legalAddress').value = cp.legalAddress || '';
            
            if (counterpartyForm.querySelector('#inn')) 
                counterpartyForm.querySelector('#inn').value = cp.inn || '';
            
            if (counterpartyForm.querySelector('#kpp')) 
                counterpartyForm.querySelector('#kpp').value = cp.kpp || '';
            
            if (counterpartyForm.querySelector('#ogrn')) 
                counterpartyForm.querySelector('#ogrn').value = cp.ogrn || '';
            
            if (counterpartyForm.querySelector('#contactPerson')) 
                counterpartyForm.querySelector('#contactPerson').value = cp.contactPerson || '';
            
            if (counterpartyForm.querySelector('#contactPosition')) 
                counterpartyForm.querySelector('#contactPosition').value = cp.contactPosition || '';
            
            if (counterpartyForm.querySelector('#workPhone')) 
                counterpartyForm.querySelector('#workPhone').value = cp.workPhone || '';
            
            if (counterpartyForm.querySelector('#contactEmail')) 
                counterpartyForm.querySelector('#contactEmail').value = cp.contactEmail || '';
            
            // Заполняем банковские реквизиты
            if (cp.bankDetails) {
                if (counterpartyForm.querySelector('#bankName')) 
                    counterpartyForm.querySelector('#bankName').value = cp.bankDetails.bankName || '';
                
                if (counterpartyForm.querySelector('#bankAccount')) 
                    counterpartyForm.querySelector('#bankAccount').value = cp.bankDetails.bankAccount || '';
                
                if (counterpartyForm.querySelector('#corrAccount')) 
                    counterpartyForm.querySelector('#corrAccount').value = cp.bankDetails.corrAccount || '';
                
                if (counterpartyForm.querySelector('#bik')) 
                    counterpartyForm.querySelector('#bik').value = cp.bankDetails.bik || '';
            }
            
            // Устанавливаем предпочтительный способ связи
            if (cp.contactMethod) {
                const contactMethodRadio = counterpartyForm.querySelector(`input[name="contactMethod"][value="${cp.contactMethod}"]`);
                if (contactMethodRadio) contactMethodRadio.checked = true;
            }
            
            // Обновляем прогресс-бар
            const inputs = counterpartyForm.querySelectorAll('input[required]');
            let filledInputs = 0;
            
            inputs.forEach(input => {
                if (input.value.trim() !== '') {
                    filledInputs++;
                    input.classList.add('filled');
                    const container = input.closest('.input-container');
                    if (container) container.classList.add('success');
                }
            });
            
            const progressIndicator = document.querySelector('.progress-indicator');
            const progressPercent = document.querySelector('.progress-percent');
            
            if (progressIndicator && progressPercent) {
                const percent = Math.round((filledInputs / inputs.length) * 100);
                progressIndicator.style.width = `${percent}%`;
                progressPercent.textContent = `${percent}%`;
            }
        } else {
            console.log('Данные контрагента отсутствуют');
        }
        
        // Изменяем заголовок и текст кнопки
        const formTitle = counterpartyForm.querySelector('h2');
        if (formTitle) formTitle.textContent = 'Редактирование данных контрагента';
        
        const formSubtitle = counterpartyForm.querySelector('.form-subtitle');
        if (formSubtitle) formSubtitle.textContent = 'Внесите изменения в данные вашей организации';
        
        const submitButton = counterpartyForm.querySelector('.submit-button .button-text');
        if (submitButton) submitButton.textContent = 'Сохранить изменения';
        
        console.log('Форма контрагента успешно настроена');
        
        // Переопределяем обработчик отправки формы для сохранения изменений
        counterpartyForm.onsubmit = function(e) {
            e.preventDefault();
            
            // Проверяем валидность формы
            if (!validateForm(this)) {
                return false;
            }
            
            // Показываем индикатор загрузки
            const submitBtn = this.querySelector('.submit-button');
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            
            try {
                // Получаем данные из формы
                const orgName = this.querySelector('#orgName').value;
                const legalAddress = this.querySelector('#legalAddress').value;
                const inn = this.querySelector('#inn').value;
                const kpp = this.querySelector('#kpp').value;
                const ogrn = this.querySelector('#ogrn').value;
                const contactPerson = this.querySelector('#contactPerson').value;
                const contactPosition = this.querySelector('#contactPosition').value;
                const workPhone = this.querySelector('#workPhone').value;
                const contactEmail = this.querySelector('#contactEmail').value;
                const contactMethod = this.querySelector('input[name="contactMethod"]:checked')?.value || '';
                const bankName = this.querySelector('#bankName').value;
                const bankAccount = this.querySelector('#bankAccount').value;
                const corrAccount = this.querySelector('#corrAccount').value;
                const bik = this.querySelector('#bik').value;
                
                // Создаем объект с данными контрагента
                const counterpartyData = {
                    orgName,
                    legalAddress,
                    inn,
                    kpp,
                    ogrn,
                    contactPerson,
                    contactPosition,
                    workPhone,
                    contactEmail,
                    contactMethod,
                    bankDetails: {
                        bankName,
                        bankAccount,
                        corrAccount,
                        bik
                    }
                };
                
                // Обновляем данные пользователя
                currentUser.counterparty = counterpartyData;
                
                // Сохраняем обновленный список пользователей
                localStorage.setItem('registeredUsers', JSON.stringify(users));
                
                // Показываем уведомление об успешном сохранении
                showNotification('Данные контрагента успешно обновлены', 'success');
                
                // Закрываем модальное окно через 2 секунды
                setTimeout(() => {
                    closeModal();
                }, 2000);
                
            } catch (error) {
                console.error('Ошибка при сохранении данных контрагента:', error);
                showNotification('Произошла ошибка при сохранении данных', 'error');
            } finally {
                // Убираем индикатор загрузки
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        };
    }

    // Функция для проверки и очистки устаревших блокировок
    function cleanupExpiredBlockedAccounts() {
        const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
        const now = new Date();
        let updated = false;
        
        // Проверяем каждую запись
        for (const email in loginAttempts) {
            if (loginAttempts[email].blocked) {
                const blockEndTime = new Date(loginAttempts[email].blockUntil);
                
                // Если время блокировки истекло, сбрасываем блокировку
                if (now > blockEndTime) {
                    loginAttempts[email].blocked = false;
                    loginAttempts[email].count = 0;
                    updated = true;
                    console.log(`Блокировка для ${email} истекла и была снята`);
                }
            }
        }
        
        // Если были изменения, сохраняем обновленные данные
        if (updated) {
            localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
        }
    }
    
    // Вызываем функцию очистки устаревших блокировок при загрузке страницы
    cleanupExpiredBlockedAccounts();
    
    // Проверка статуса авторизации при загрузке
    checkLoginStatus();
    
    // Дополнительная инициализация и проверка форм
    console.log('Дополнительная инициализация форм...');
    
    // Обновляем список форм
    forms = document.querySelectorAll('.auth-form');
    console.log('Найдено форм:', forms.length);
    forms.forEach((form, index) => {
        console.log(`Форма ${index + 1}:`, form.id, form.className);
    });
    
    // Проверяем и инициализируем форму контрагента, если она есть
    const counterpartyFormCheck = document.getElementById('counterpartyForm');
    if (counterpartyFormCheck) {
        console.log('Форма контрагента найдена, инициализируем...');
        initCounterpartyCard();
    } else {
        console.log('Форма контрагента не найдена в DOM');
    }
    
    // Проверяем обработчики событий для форм
    if (registerForm) {
        console.log('Проверяем обработчики для формы регистрации...');
        const existingHandlers = registerForm._eventListeners || [];
        console.log('Существующие обработчики:', existingHandlers.length);
    }
    
    // Проверка статуса авторизации при загрузке
    checkLoginStatus();
    
    console.log('Инициализация login-system.js завершена');
}); 