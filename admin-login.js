// Файл для добавления функционала автоматического входа с правами администратора

document.addEventListener('DOMContentLoaded', function() {
    // Константы для автоматического входа администратора
    const ADMIN_EMAIL = 'admin@example.com';
    const ADMIN_PASSWORD = 'Tru5t_M1';
    
    // Функция для перехвата отправки формы входа
    function interceptLoginForm() {
        console.log('🔒 Инициализация перехвата формы входа для админа...');
        
        // Находим форму входа
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) {
            console.log('❌ Форма входа не найдена');
            return;
        }
        
        // Сохраняем оригинальный обработчик отправки формы
        const originalSubmitHandler = loginForm.onsubmit;
        
        // Устанавливаем новый обработчик отправки формы
        loginForm.onsubmit = async function(event) {
            // Предотвращаем стандартное поведение формы
            event.preventDefault();
            
            // Получаем введенные данные
            const emailInput = loginForm.querySelector('#loginEmail');
            const passwordInput = loginForm.querySelector('#loginPassword');
            
            if (!emailInput || !passwordInput) {
                console.log('❌ Поля email или пароля не найдены');
                return false;
            }
            
            const email = emailInput.value;
            const password = passwordInput.value;
            
            // Проверяем, совпадают ли введенные данные с данными администратора
            if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
                console.log('✅ Обнаружен вход администратора');
                
                // Показываем индикатор загрузки
                const submitButton = loginForm.querySelector('.submit-button');
                if (submitButton) {
                    submitButton.classList.add('loading');
                    submitButton.disabled = true;
                }
                
                // Создаем данные администратора
                const adminData = {
                    name: 'Администратор',
                    email: ADMIN_EMAIL,
                    loggedIn: true,
                    loginTime: new Date().toISOString(),
                    isAdmin: true,
                    permissions: [
                        'admin_access',
                        'dashboard_access',
                        'user_management',
                        'content_management',
                        'order_management',
                        'settings_management',
                        'system_settings',
                        'full_access'
                    ]
                };
                
                // Сохраняем данные администратора
                localStorage.setItem('userData', JSON.stringify(adminData));
                localStorage.setItem('adminLoggedIn', 'true');
                
                // Показываем уведомление об успешном входе
                if (typeof showNotification === 'function') {
                    showNotification('Вход выполнен с правами администратора', 'success');
                } else {
                    alert('Вход выполнен с правами администратора');
                }
                
                // Имитируем задержку для эффекта загрузки
                setTimeout(() => {
                    // Перенаправляем на панель администратора
                    window.location.href = 'admin-dashboard.html';
                }, 1000);
                
                return false;
            }
            
            // Если это не администратор, вызываем оригинальный обработчик
            if (typeof originalSubmitHandler === 'function') {
                return originalSubmitHandler.call(this, event);
            }
            
            // Если оригинального обработчика нет, позволяем форме отправиться
            return true;
        };
        
        console.log('✅ Перехват формы входа для админа установлен');
    }
    
    // Функция для проверки наличия формы входа
    function checkForLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            interceptLoginForm();
        } else {
            // Если форма еще не загружена, пробуем снова через небольшой интервал
            setTimeout(checkForLoginForm, 500);
        }
    }
    
    // Функция для обновления интерфейса при входе администратора
    function updateUIForAdmin() {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        // Проверяем, вошел ли пользователь как администратор
        if (userData.isAdmin) {
            console.log('✅ Обнаружен вход администратора, обновляем интерфейс');
            
            // Добавляем индикатор администратора в хедер, если его еще нет
            const loginButton = document.getElementById('loginButton');
            if (loginButton && !document.querySelector('.admin-indicator')) {
                // Создаем индикатор администратора
                const adminIndicator = document.createElement('span');
                adminIndicator.className = 'admin-indicator';
                adminIndicator.textContent = 'ADMIN';
                adminIndicator.style.cssText = `
                    background-color: #ff5722;
                    color: white;
                    font-size: 10px;
                    padding: 2px 5px;
                    border-radius: 10px;
                    margin-left: 5px;
                    font-weight: bold;
                `;
                
                // Добавляем индикатор к кнопке входа
                loginButton.appendChild(adminIndicator);
            }
            
            // Добавляем ссылки на панель администратора в меню пользователя
            const userMenu = document.querySelector('.user-menu__items');
            if (userMenu && !userMenu.querySelector('[data-action="admin-panel"]')) {
                // Создаем пункт меню для панели администратора
                const adminMenuItem = document.createElement('li');
                adminMenuItem.className = 'user-menu__item';
                adminMenuItem.setAttribute('data-action', 'admin-panel');
                adminMenuItem.innerHTML = `
                    <i class="fas fa-shield-alt"></i>
                    <span>Панель администратора</span>
                `;
                
                // Добавляем обработчик клика
                adminMenuItem.addEventListener('click', function() {
                    window.location.href = 'admin-dashboard.html';
                });
                
                // Добавляем пункт меню в начало списка
                userMenu.insertBefore(adminMenuItem, userMenu.firstChild);
            }
        }
    }
    
    // Запускаем проверку формы входа
    checkForLoginForm();
    
    // Запускаем обновление интерфейса для администратора
    updateUIForAdmin();
    
    // Добавляем слушатель события для обновления интерфейса при изменении localStorage
    window.addEventListener('storage', function(event) {
        if (event.key === 'userData' || event.key === 'adminLoggedIn') {
            updateUIForAdmin();
        }
    });
    
    // Добавляем слушатель события для обновления интерфейса при клике на документ
    // (это нужно для случаев, когда меню пользователя создается динамически)
    document.addEventListener('click', function() {
        setTimeout(updateUIForAdmin, 100);
    });
}); 