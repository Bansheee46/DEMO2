/**
 * Ультрасовременная функция для отображения уведомлений с WAW-эффектом и продвинутыми анимациями
 * @param {string} message - Текст сообщения
 * @param {string} type - Тип уведомления: 'info', 'success', 'error', 'warning', 'custom'
 * @param {number} duration - Длительность отображения в миллисекундах
 * @param {boolean} showProgress - Показывать ли прогресс-бар
 * @param {Object} options - Дополнительные опции для настройки уведомления
 * @param {string} options.emoji - Эмодзи для отображения вместо иконки
 * @param {string} options.imageUrl - URL изображения для отображения вместо иконки
 * @param {string} options.animation - Тип анимации: 'bounce', 'fade', 'slide', 'shake', 'pulse', 'flip', 'zoom', 'glitch'
 * @param {string} options.position - Позиция: 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'
 * @param {string} options.customClass - Дополнительный CSS класс
 * @param {string} options.customIcon - Кастомная иконка (имя класса Font Awesome)
 * @param {string} options.theme - Тема: 'light', 'dark', 'glass', 'neon', 'gradient', 'minimal'
 * @param {boolean} options.showConfetti - Показывать ли конфетти эффект (только для типа 'success')
 * @param {boolean} options.useSound - Воспроизводить ли звук (по умолчанию true)
 * @param {string} options.soundName - Кастомное имя звука для воспроизведения
 * @param {function} options.onClick - Функция, вызываемая при клике на уведомление
 * @param {string} options.actionUrl - URL для перехода при клике на уведомление
 * @param {Object} options.notificationData - Дополнительные данные, связанные с уведомлением
 */
function showNotification(message, type = 'info', duration = 5000, showProgress = true, options = {}) {
    // Проверка, загружены ли стили
    if (!document.getElementById('notification-styles-link')) {
        const link = document.createElement('link');
        link.id = 'notification-styles-link';
        link.rel = 'stylesheet';
        link.href = 'notifications.css';
        document.head.appendChild(link);
    }
    
    // Воспроизводим звук уведомления, если доступен и не отключен
    if ((options.useSound !== false) && window.settingsModule && typeof window.settingsModule.playSound === 'function') {
        if (options.soundName) {
            window.settingsModule.playSound(options.soundName);
        } else if (type === 'error') {
            window.settingsModule.playSound('error');
        } else if (type === 'success') {
            window.settingsModule.playSound('success');
        } else if (type === 'warning') {
            window.settingsModule.playSound('warning');
        } else {
            window.settingsModule.playSound('notification');
        }
    }
    
    // Определяем иконку в зависимости от типа
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    if (options.customIcon) icon = options.customIcon;
    
    // Создаем ID для уведомления
    const notificationId = `notification-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.id = notificationId;
    
    // Добавляем основной класс и тип
    notification.className = `notification notification--${type}`;
    
    // Добавляем тему, если указана
    if (options.theme) {
        notification.classList.add(`notification--theme-${options.theme}`);
    }
    
    // Добавляем класс для эмодзи, если используется
    if (options.emoji) {
        notification.classList.add('notification--emoji-style');
    }
    
    // Добавляем кастомный класс, если указан
    if (options.customClass) {
        notification.classList.add(options.customClass);
    }
    
    // Устанавливаем позицию, если указана
    if (options.position) {
        notification.classList.add(`notification--${options.position}`);
    }
    
    // Если есть actionUrl или onClick, добавляем класс курсора-указателя
    if (options.actionUrl || options.onClick) {
        notification.classList.add('notification--clickable');
    }
    
    // Добавляем декоративные элементы для стиля
    const decorativeElement = document.createElement('div');
    decorativeElement.className = 'notification__decorative';
    
    // Определяем содержимое для иконки
    let iconContent = `<i class="fas fa-${icon}"></i>`;
    
    // Если указан эмодзи, используем его вместо иконки
    if (options.emoji) {
        iconContent = `<span class="notification__emoji">${options.emoji}</span>`;
    }
    
    // Если указан URL изображения, используем его вместо иконки
    if (options.imageUrl) {
        iconContent = `<img src="${options.imageUrl}" alt="Notification" class="notification__image">`;
    }
    
    // Формируем HTML уведомления
    notification.innerHTML = `
        <div class="notification__icon">
            ${iconContent}
        </div>
        <div class="notification__content">
            <div class="notification__message">${message}</div>
        </div>
        <button class="notification__close" aria-label="Закрыть">
            <i class="fas fa-times"></i>
        </button>
        ${showProgress ? '<div class="notification__progress"></div>' : ''}
    `;
    
    // Добавляем уведомление в DOM
    document.body.appendChild(notification);
    
    // Добавляем анимацию появления
    const animationType = options.animation || 'slide';
    notification.classList.add(`notification--animation-${animationType}`);
    
    // Активируем анимацию появления
    setTimeout(() => {
        notification.classList.add('notification--active');
    }, 10);
    
    // Создаем эффект конфетти для уведомлений успеха, если указано
    if (options.showConfetti && type === 'success') {
        createConfettiEffect(notification);
    }
    
    // Анимируем прогресс-бар
    if (showProgress && duration > 0) {
        const progressBar = notification.querySelector('.notification__progress');
        if (progressBar) {
            progressBar.style.transition = `transform ${duration}ms linear`;
            progressBar.style.transform = 'scaleX(1)';
            
            setTimeout(() => {
                progressBar.style.transform = 'scaleX(0)';
            }, 50);
        }
    }
    
    // Добавляем эффект при наведении
    notification.addEventListener('mouseenter', () => {
        // Приостанавливаем анимацию прогресс-бара при наведении
        const progressBar = notification.querySelector('.notification__progress');
        if (progressBar && showProgress) {
            progressBar.style.transitionProperty = 'none';
        }
        
        // Добавляем интерактивный эффект при наведении
        notification.classList.add('notification--hover');
    });
    
    notification.addEventListener('mouseleave', () => {
        // Возобновляем анимацию прогресс-бара
        const progressBar = notification.querySelector('.notification__progress');
        if (progressBar && showProgress) {
            progressBar.style.transitionProperty = 'transform';
        }
        
        // Убираем интерактивный эффект при уходе курсора
        notification.classList.remove('notification--hover');
    });
    
    // Обработчик для клика по уведомлению
    notification.addEventListener('click', (e) => {
        // Если клик не по кнопке закрытия, значит по самому уведомлению или его контенту
        if (!e.target.closest('.notification__close')) {
            // Если задан обработчик onClick, вызываем его
    if (typeof options.onClick === 'function') {
            options.onClick(e);
            } 
            // Если задан URL, переходим по нему
            else if (options.actionUrl) {
                window.location.href = options.actionUrl;
            }
            // Иначе обрабатываем клик в зависимости от типа уведомления
            else {
                handleNotificationClick(notification, type, message, options.notificationData);
            }
        }
    });
    
    // Добавляем обработчик для закрытия уведомления
    const closeButton = notification.querySelector('.notification__close');
    if (closeButton) {
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            closeNotification(notification);
        });
    }
    
    // Закрываем уведомление автоматически через указанное время
    let timeoutId;
    if (duration > 0) {
        timeoutId = setTimeout(() => {
            closeNotification(notification);
        }, duration);
    }
    
    // Сохраняем ID таймера для возможной отмены
    notification.dataset.timeoutId = timeoutId;
    
    // Возвращаем ID уведомления для возможности управления им извне
    return notificationId;
}

/**
 * Обработчик клика на уведомление в зависимости от его типа
 * @param {HTMLElement} notification - DOM-элемент уведомления
 * @param {string} type - Тип уведомления
 * @param {string} message - Текст уведомления
 * @param {Object} data - Дополнительные данные уведомления
 */
function handleNotificationClick(notification, type, message, data = {}) {
    // Красивая пульсация при клике
    notification.classList.add('notification--pulse-click');
    setTimeout(() => {
        notification.classList.remove('notification--pulse-click');
    }, 300);
    
    switch(type) {
        case 'info':
            // Показываем модальное окно с подробной информацией
            showInfoModal(message, data);
            break;
            
        case 'success':
            // Показываем анимацию празднования и дополнительные действия
            showSuccessAction(message, data);
            break;
            
        case 'error':
            // Показываем подробности ошибки и возможные пути решения
            showErrorDetails(message, data);
            break;
            
        case 'warning':
            // Показываем предупреждение с деталями и возможными действиями
            showWarningOptions(message, data);
            break;
            
        default:
            // Для кастомных типов можно определить свою логику
            if (typeof window.customNotificationHandler === 'function') {
                window.customNotificationHandler(type, message, data);
            }
    }
    
    // Закрываем уведомление при клике
    closeNotification(notification);
}

/**
 * Показывает модальное окно с подробной информацией
 * @param {string} message - Текст уведомления
 * @param {Object} data - Дополнительные данные
 */
function showInfoModal(message, data = {}) {
    // Создаем красивое модальное окно для информационного сообщения
    const modal = document.createElement('div');
    modal.className = 'notification-modal notification-modal--info';
    
    // Добавляем красивую анимацию появления
    modal.innerHTML = `
        <div class="notification-modal__backdrop"></div>
        <div class="notification-modal__content" data-aos="zoom-in">
            <div class="notification-modal__header">
                <h3>Дополнительная информация</h3>
                <button class="notification-modal__close"><i class="fas fa-times"></i></button>
            </div>
            <div class="notification-modal__body">
                <div class="notification-modal__icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="notification-modal__message">
                    <p>${message}</p>
                    ${data.details ? `<div class="notification-modal__details">${data.details}</div>` : ''}
                </div>
            </div>
            <div class="notification-modal__footer">
                <button class="notification-modal__button notification-modal__button--primary">OK</button>
                ${data.url ? `<a href="${data.url}" class="notification-modal__button notification-modal__button--secondary">Подробнее</a>` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Анимация появления
    setTimeout(() => {
        modal.classList.add('notification-modal--active');
    }, 10);
    
    // Обработчики закрытия
    const closeModal = () => {
        modal.classList.remove('notification-modal--active');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    };
    
    modal.querySelector('.notification-modal__close').addEventListener('click', closeModal);
    modal.querySelector('.notification-modal__button--primary').addEventListener('click', closeModal);
    modal.querySelector('.notification-modal__backdrop').addEventListener('click', closeModal);
}

/**
 * Показывает анимацию празднования успеха
 * @param {string} message - Текст уведомления
 * @param {Object} data - Дополнительные данные
 */
function showSuccessAction(message, data = {}) {
    // Создаем модальное окно с анимацией успеха
    const modal = document.createElement('div');
    modal.className = 'notification-modal notification-modal--success';
    
    modal.innerHTML = `
        <div class="notification-modal__backdrop"></div>
        <div class="notification-modal__content" data-aos="flip-in">
            <div class="notification-modal__header">
                <h3>Успех!</h3>
                <button class="notification-modal__close"><i class="fas fa-times"></i></button>
            </div>
            <div class="notification-modal__body">
                <div class="notification-modal__icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="notification-modal__message">
                    <p>${message}</p>
                    ${data.details ? `<div class="notification-modal__details">${data.details}</div>` : ''}
                </div>
            </div>
            <div class="notification-modal__footer">
                <button class="notification-modal__button notification-modal__button--primary">Отлично!</button>
                ${data.action ? `<button class="notification-modal__button notification-modal__button--action">${data.actionText || 'Продолжить'}</button>` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Создаем эффект конфетти для празднования
    setTimeout(() => {
        if (typeof createSuccessParticles === 'function') {
            createSuccessParticles(['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B']);
        }
    }, 200);
    
    // Анимация появления
    setTimeout(() => {
        modal.classList.add('notification-modal--active');
    }, 10);
    
    // Обработчики закрытия
    const closeModal = () => {
        modal.classList.remove('notification-modal--active');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    };
    
    modal.querySelector('.notification-modal__close').addEventListener('click', closeModal);
    modal.querySelector('.notification-modal__button--primary').addEventListener('click', closeModal);
    modal.querySelector('.notification-modal__backdrop').addEventListener('click', closeModal);
    
    // Обработчик действия, если оно указано
    const actionButton = modal.querySelector('.notification-modal__button--action');
    if (actionButton && data.action) {
        actionButton.addEventListener('click', () => {
            closeModal();
            if (typeof data.action === 'function') {
                data.action();
            }
        });
    }
}

/**
 * Показывает подробности ошибки
 * @param {string} message - Текст уведомления
 * @param {Object} data - Дополнительные данные
 */
function showErrorDetails(message, data = {}) {
    // Создаем модальное окно с объяснением ошибки
    const modal = document.createElement('div');
    modal.className = 'notification-modal notification-modal--error';
    
    modal.innerHTML = `
        <div class="notification-modal__backdrop"></div>
        <div class="notification-modal__content" data-aos="shake">
            <div class="notification-modal__header">
                <h3>Ошибка</h3>
                <button class="notification-modal__close"><i class="fas fa-times"></i></button>
            </div>
            <div class="notification-modal__body">
                <div class="notification-modal__icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="notification-modal__message">
                    <p>${message}</p>
                    ${data.details ? `<div class="notification-modal__details">${data.details}</div>` : ''}
                    ${data.errorCode ? `<div class="notification-modal__error-code">Код ошибки: ${data.errorCode}</div>` : ''}
                </div>
            </div>
            <div class="notification-modal__footer">
                <button class="notification-modal__button notification-modal__button--primary">Понятно</button>
                ${data.helpUrl ? `<a href="${data.helpUrl}" class="notification-modal__button notification-modal__button--help">Помощь</a>` : ''}
                ${data.retryAction ? `<button class="notification-modal__button notification-modal__button--retry">Попробовать снова</button>` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Анимация появления
    setTimeout(() => {
        modal.classList.add('notification-modal--active');
    }, 10);
    
    // Обработчики закрытия
    const closeModal = () => {
        modal.classList.remove('notification-modal--active');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    };
    
    modal.querySelector('.notification-modal__close').addEventListener('click', closeModal);
    modal.querySelector('.notification-modal__button--primary').addEventListener('click', closeModal);
    modal.querySelector('.notification-modal__backdrop').addEventListener('click', closeModal);
    
    // Обработчик повторной попытки, если она указана
    const retryButton = modal.querySelector('.notification-modal__button--retry');
    if (retryButton && data.retryAction) {
        retryButton.addEventListener('click', () => {
            closeModal();
            if (typeof data.retryAction === 'function') {
                data.retryAction();
            }
        });
    }
}

/**
 * Показывает варианты действий для предупреждения
 * @param {string} message - Текст уведомления
 * @param {Object} data - Дополнительные данные
 */
function showWarningOptions(message, data = {}) {
    // Создаем модальное окно с вариантами действий
    const modal = document.createElement('div');
    modal.className = 'notification-modal notification-modal--warning';
    
    // Формируем список действий, если они переданы
    let actionsHtml = '';
    if (data.actions && Array.isArray(data.actions)) {
        actionsHtml = `
            <div class="notification-modal__actions">
                <h4>Возможные действия:</h4>
                <ul>
                    ${data.actions.map(action => `
                        <li>
                            <button class="notification-modal__action" data-action-id="${action.id}">
                                <i class="fas fa-${action.icon || 'arrow-right'}"></i>
                                ${action.text}
                            </button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div class="notification-modal__backdrop"></div>
        <div class="notification-modal__content" data-aos="bounce">
            <div class="notification-modal__header">
                <h3>Предупреждение</h3>
                <button class="notification-modal__close"><i class="fas fa-times"></i></button>
            </div>
            <div class="notification-modal__body">
                <div class="notification-modal__icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <div class="notification-modal__message">
                    <p>${message}</p>
                    ${data.details ? `<div class="notification-modal__details">${data.details}</div>` : ''}
                </div>
                ${actionsHtml}
            </div>
            <div class="notification-modal__footer">
                <button class="notification-modal__button notification-modal__button--ignore">Игнорировать</button>
                <button class="notification-modal__button notification-modal__button--primary">OK</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Анимация появления
    setTimeout(() => {
        modal.classList.add('notification-modal--active');
    }, 10);
    
    // Обработчики закрытия
    const closeModal = () => {
        modal.classList.remove('notification-modal--active');
                setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    };
    
    modal.querySelector('.notification-modal__close').addEventListener('click', closeModal);
    modal.querySelector('.notification-modal__button--primary').addEventListener('click', closeModal);
    modal.querySelector('.notification-modal__backdrop').addEventListener('click', closeModal);
    
    // Обработчик игнорирования
    const ignoreButton = modal.querySelector('.notification-modal__button--ignore');
    if (ignoreButton) {
        ignoreButton.addEventListener('click', () => {
            closeModal();
            if (typeof data.onIgnore === 'function') {
                data.onIgnore();
            }
        });
    }
    
    // Обработчики действий
    if (data.actions && Array.isArray(data.actions)) {
        const actionButtons = modal.querySelectorAll('.notification-modal__action');
        actionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const actionId = button.getAttribute('data-action-id');
                const action = data.actions.find(a => a.id === actionId);
                
                if (action && typeof action.handler === 'function') {
                    closeModal();
                    action.handler();
                }
            });
        });
    }
}

// Добавляем стили для анимаций
if (!document.getElementById('notification-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-animation-styles';
    style.textContent = `
        .notification__message {
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .notification__icon {
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        /* Позиционирование уведомлений */
        .notification--top-left {
            top: 20px;
            left: 20px;
            right: auto;
        }
        
        .notification--top-center {
            top: 20px;
            left: 50%;
            right: auto;
            transform: translateX(-50%);
        }
        
        .notification--bottom-right {
            top: auto;
            bottom: 20px;
            right: 20px;
        }
        
        .notification--bottom-left {
            top: auto;
            bottom: 20px;
            left: 20px;
            right: auto;
        }
        
        .notification--bottom-center {
            top: auto;
            bottom: 20px;
            left: 50%;
            right: auto;
            transform: translateX(-50%);
        }
        
        /* Новые анимации для флип-эффекта */
        @keyframes notification-flip-in {
            0% { opacity: 0; transform: perspective(400px) rotateX(90deg); }
            40% { transform: perspective(400px) rotateX(-10deg); }
            70% { transform: perspective(400px) rotateX(10deg); }
            100% { opacity: 1; transform: perspective(400px) rotateX(0deg); }
        }
        
        @keyframes notification-flip-out {
            0% { opacity: 1; transform: perspective(400px) rotateX(0deg); }
            30% { transform: perspective(400px) rotateX(-10deg); }
            100% { opacity: 0; transform: perspective(400px) rotateX(90deg); }
        }
        
        /* Новые анимации для зум-эффекта */
        @keyframes notification-zoom-in {
            0% { opacity: 0; transform: scale(0.3); }
            50% { opacity: 1; transform: scale(1.05); }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); }
        }
        
        @keyframes notification-zoom-out {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
            100% { opacity: 0; transform: scale(0.3); }
        }
        
        /* Новые анимации для глитч-эффекта */
        @keyframes notification-glitch-in {
            0% { 
                opacity: 0; 
                transform: translateX(-20px); 
                clip-path: inset(0 0 0 0);
            }
            10% { 
                transform: translateX(10px); 
                clip-path: inset(10% 0 20% 0);
            }
            20% { 
                transform: translateX(-8px); 
                clip-path: inset(30% 0 40% 0);
            }
            30% { 
                transform: translateX(6px); 
                clip-path: inset(50% 0 60% 0);
            }
            40% { 
                transform: translateX(-4px); 
                clip-path: inset(70% 0 80% 0);
            }
            50% { 
                transform: translateX(2px); 
                clip-path: inset(10% 0 90% 0);
            }
            60% { 
                transform: translateX(-1px); 
                clip-path: inset(0 0 0 0);
            }
            100% { 
                opacity: 1; 
                transform: translateX(0); 
                clip-path: inset(0 0 0 0);
            }
        }
        
        @keyframes notification-glitch-out {
            0% { 
                opacity: 1; 
                transform: translateX(0); 
                clip-path: inset(0 0 0 0);
            }
            10% { 
                transform: translateX(5px); 
                clip-path: inset(10% 0 20% 0);
            }
            20% { 
                transform: translateX(-8px); 
                clip-path: inset(30% 0 40% 0);
            }
            30% { 
                transform: translateX(6px); 
                clip-path: inset(50% 0 60% 0);
            }
            40% { 
                transform: translateX(-4px); 
                clip-path: inset(70% 0 80% 0);
            }
            50% { 
                transform: translateX(2px); 
                clip-path: inset(10% 0 90% 0);
            }
            60% { 
                transform: translateX(-1px); 
                clip-path: inset(0 0 0 0);
            }
            100% { 
                opacity: 0; 
                transform: translateX(20px);
            }
        }
        
        /* Эффект вспышки для привлечения внимания */
        @keyframes notification-flash {
            0%, 100% { box-shadow: 0 0 0 transparent; }
            50% { box-shadow: 0 0 30px rgba(255, 255, 255, 0.8); }
        }
        
        .notification--flash-attention {
            animation: notification-flash 0.7s 2;
        }
        
        /* Применение анимаций */
        .notification--animation-flip.notification--active {
            animation: notification-flip-in 0.7s forwards;
        }
        
        .notification--animation-zoom.notification--active {
            animation: notification-zoom-in 0.5s forwards;
        }
        
        .notification--animation-glitch.notification--active {
            animation: notification-glitch-in 0.8s forwards;
        }
        
        /* Темы уведомлений */
        .notification--theme-gradient {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 240, 250, 0.8));
            border: none;
        }
        
        .notification--theme-minimal {
            background: rgba(255, 255, 255, 0.95);
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
            border-radius: 12px;
            border: none;
        }
        
        .notification--theme-minimal::before {
            display: none;
        }
        
        .notification--theme-minimal .notification__icon::after {
            opacity: 0.1;
        }
        
        body.dark .notification--theme-gradient {
            background: linear-gradient(135deg, rgba(50, 50, 60, 0.9), rgba(30, 30, 40, 0.8));
        }
        
        body.dark .notification--theme-minimal {
            background: rgba(40, 40, 50, 0.95);
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        }
    `;
    document.head.appendChild(style);
}

/**
 * Закрывает уведомление с анимацией
 * @param {HTMLElement} notificationElement - DOM-элемент уведомления
 */
function closeNotification(notificationElement) {
    // Отменяем таймер, если он существует
    const timeoutId = notificationElement.dataset.timeoutId;
    if (timeoutId) {
        clearTimeout(parseInt(timeoutId));
    }
    
    // Получаем тип анимации
    let animationType = 'slide';
    for (const className of notificationElement.classList) {
        if (className.startsWith('notification--animation-')) {
            animationType = className.replace('notification--animation-', '');
            break;
        }
    }
    
    // Удаляем класс активности
    notificationElement.classList.remove('notification--active');
    
    // Применяем соответствующую анимацию закрытия
    if (animationType === 'bounce') {
        notificationElement.style.animation = 'notification-bounce-out 0.5s forwards';
    } else if (animationType === 'fade') {
        notificationElement.style.animation = 'notification-fade-out 0.3s forwards';
    } else if (animationType === 'shake') {
        notificationElement.style.animation = 'notification-shake-out 0.5s forwards';
    } else if (animationType === 'pulse') {
        notificationElement.style.animation = 'notification-bounce-out 0.5s forwards';
    } else if (animationType === 'flip') {
        notificationElement.style.animation = 'notification-flip-out 0.5s forwards';
    } else if (animationType === 'zoom') {
        notificationElement.style.animation = 'notification-zoom-out 0.4s forwards';
    } else if (animationType === 'glitch') {
        notificationElement.style.animation = 'notification-fade-out 0.6s forwards';
    } else {
        notificationElement.style.animation = 'slide-out 0.3s forwards';
    }
    
    // Удаляем элемент после завершения анимации
    setTimeout(() => {
        if (notificationElement.parentNode) {
            notificationElement.parentNode.removeChild(notificationElement);
        }
    }, 600);
}

/**
 * Функция для создания эффекта конфетти
 * @param {HTMLElement} notificationElement - DOM-элемент уведомления
 */
function createConfettiEffect(notificationElement) {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'notification__confetti-container';
    confettiContainer.style.cssText = `
        position: absolute;
        top: -20px;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        pointer-events: none;
        z-index: -1;
    `;
    
    // Добавляем 20 конфетти
    for (let i = 0; i < 20; i++) {
        const confetti = document.createElement('div');
        const size = Math.random() * 8 + 4;
        const colors = ['#FFD700', '#FF6347', '#7CFC00', '#4169E1', '#FF69B4', '#00FFFF'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const rotation = Math.random() * 360;
        const duration = Math.random() * 1.5 + 1;
        const delay = Math.random() * 0.5;
        
        confetti.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            transform: rotate(${rotation}deg);
            opacity: 0;
            animation: confetti-fall ${duration}s ease-in ${delay}s forwards;
            pointer-events: none;
        `;
        
        confettiContainer.appendChild(confetti);
    }
    
    notificationElement.appendChild(confettiContainer);
    
    // Добавляем CSS для анимации
    if (!document.getElementById('confetti-styles')) {
        const style = document.createElement('style');
        style.id = 'confetti-styles';
        style.textContent = `
            @keyframes confetti-fall {
                0% {
                    transform: translateY(-20px) rotate(0deg) scale(0);
                    opacity: 1;
                }
                100% {
                    transform: translateY(100px) rotate(360deg) scale(1);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Экспортируем функцию в глобальный объект window
window.showNotification = showNotification; 