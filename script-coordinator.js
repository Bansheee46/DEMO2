// Глобальный координатор для решения конфликтов между скриптами
window.scriptCoordinator = {
    // Состояние инициализации
    initialized: false,
    
    // Хранение активных обработчиков событий
    eventHandlers: {},
    
    // Функция регистрации обработчика
    registerHandler: function(element, eventType, handler) {
        if (!element || !eventType || !handler) return;
        
        // Создаем уникальный ключ для обработчика
        const key = `${element.id || 'unknown'}_${eventType}_${Date.now()}`;
        
        // Сохраняем оригинальный обработчик
        this.eventHandlers[key] = {
            element: element,
            eventType: eventType,
            handler: handler
        };
        
        // Добавляем обработчик к элементу
        element.addEventListener(eventType, handler);
        
        return key;
    },
    
    // Функция удаления обработчика по ключу
    removeHandler: function(key) {
        if (!this.eventHandlers[key]) return;
        
        const handler = this.eventHandlers[key];
        handler.element.removeEventListener(handler.eventType, handler.handler);
        delete this.eventHandlers[key];
    },
    
    // Функция удаления всех обработчиков для элемента
    removeAllHandlers: function(element) {
        if (!element) return;
        
        for (const key in this.eventHandlers) {
            if (this.eventHandlers[key].element === element) {
                this.removeHandler(key);
            }
        }
    },
    
    // Главный метод инициализации после выхода из системы
    resetAfterLogout: function() {
        // Удаляем все меню пользователя
        const userMenus = document.querySelectorAll('.user-menu');
        userMenus.forEach(menu => {
            if (menu.parentNode) {
                menu.parentNode.removeChild(menu);
            }
        });
        
        // Обновляем состояние кнопки входа
        const loginButton = document.getElementById('loginButton');
        if (loginButton) {
            // Клонируем кнопку, чтобы удалить все слушатели событий
            const newButton = loginButton.cloneNode(true);
            loginButton.parentNode.replaceChild(newButton, loginButton);
            
            // Обновляем внешний вид кнопки
            newButton.innerHTML = `<i class="fas fa-user"></i><span>Войти</span>`;
            newButton.classList.remove('logged-in');
            
            // Проверяем, какой обработчик нужно присвоить
            const isLoginSystemPage = document.querySelector('.auth-modal');
            if (isLoginSystemPage) {
                // Если мы на странице с модальным окном входа
                newButton.addEventListener('click', function() {
                    if (typeof openModal === 'function') {
                        openModal();
                    }
                });
            } else {
                // Если мы на странице без модального окна
                newButton.addEventListener('click', function() {
                    if (typeof showLoginModal === 'function') {
                        showLoginModal();
                    }
                });
            }
        }
        
        console.log('✅ Состояние UI успешно сброшено');
    }
};

// Координатор выхода из системы
window.logoutCoordinator = {
    // Выполнение выхода из аккаунта
    performLogout: function() {
        // Очищаем данные пользователя
        localStorage.removeItem('userData');
        localStorage.removeItem('userName');
        localStorage.removeItem('isLoggedIn');
        
        // Сбрасываем состояние UI
        window.scriptCoordinator.resetAfterLogout();
        
        // Показываем уведомление, если функция доступна
        if (typeof showNotification === 'function') {
            showNotification('Вы успешно вышли из системы', 'success');
        } else {
            console.log('Выход выполнен успешно');
        }
        
        // Добавляем небольшую задержку перед перезагрузкой страницы,
        // чтобы пользователь успел увидеть уведомление
        setTimeout(function() {
            location.reload();
        }, 1000);
    }
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Скрипт-координатор инициализирован');
    window.scriptCoordinator.initialized = true;
}); 