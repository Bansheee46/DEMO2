/**
 * Примеры использования редизайна уведомлений с максимальным фокусом на эстетику
 * Для тестирования подключите этот файл после notification.js
 */

// Функция для демонстрации всех типов уведомлений
function showAllNotificationTypes() {
    // Стандартное уведомление
    showNotification('Информационное уведомление с новым дизайном', 'info', 5000, true, {
        animation: 'fade'
    });
    
    // Уведомление об успехе
    setTimeout(() => {
        showNotification('Операция успешно выполнена!', 'success', 5000, true, {
            animation: 'bounce'
        });
    }, 1000);
    
    // Уведомление об ошибке
    setTimeout(() => {
        showNotification('Произошла ошибка при выполнении операции', 'error', 5000, true, {
            animation: 'shake'
        });
    }, 2000);
    
    // Предупреждение
    setTimeout(() => {
        showNotification('Внимание! Это важное предупреждение', 'warning', 5000, true, {
            animation: 'zoom'
        });
    }, 3000);
}

// Функция для демонстрации различных анимаций
function showAnimationExamples() {
    // Анимация bounce
    showNotification('Пружинистая анимация "bounce"', 'info', 5000, true, {
        animation: 'bounce',
        position: 'top-right'
    });
    
    // Анимация fade
    setTimeout(() => {
        showNotification('Плавная анимация "fade"', 'info', 5000, true, {
            animation: 'fade',
            position: 'top-right'
        });
    }, 700);
    
    // Анимация shake
    setTimeout(() => {
        showNotification('Анимация тряски "shake"', 'info', 5000, true, {
            animation: 'shake',
            position: 'top-right'
        });
    }, 1400);
    
    // Анимация pulse
    setTimeout(() => {
        showNotification('Анимация пульсации "pulse"', 'info', 5000, true, {
            animation: 'pulse',
            position: 'top-right'
        });
    }, 2100);
    
    // Анимация flip
    setTimeout(() => {
        showNotification('Анимация переворота "flip"', 'info', 5000, true, {
            animation: 'flip',
            position: 'top-right'
        });
    }, 2800);
    
    // Анимация zoom
    setTimeout(() => {
        showNotification('Анимация увеличения "zoom"', 'info', 5000, true, {
            animation: 'zoom',
            position: 'top-right'
        });
    }, 3500);
    
    // Анимация glitch для ошибок
    setTimeout(() => {
        showNotification('Глюк-эффект для ошибок "glitch"', 'error', 5000, true, {
            animation: 'glitch',
            position: 'top-right'
        });
    }, 4200);
}

// Функция для демонстрации различных позиций
function showPositionExamples() {
    // Верхний правый угол (по умолчанию)
    showNotification('Верхний правый угол (по умолчанию)', 'info', 8000, true, {
        position: 'top-right',
        theme: 'gradient'
    });
    
    // Верхний левый угол
    setTimeout(() => {
        showNotification('Верхний левый угол', 'success', 8000, true, {
            position: 'top-left',
            theme: 'gradient'
        });
    }, 500);
    
    // Верхний центр
    setTimeout(() => {
        showNotification('Верхний центр', 'warning', 8000, true, {
            position: 'top-center',
            theme: 'gradient'
        });
    }, 1000);
    
    // Нижний правый угол
    setTimeout(() => {
        showNotification('Нижний правый угол', 'error', 8000, true, {
            position: 'bottom-right',
            theme: 'gradient'
        });
    }, 1500);
    
    // Нижний левый угол
    setTimeout(() => {
        showNotification('Нижний левый угол', 'info', 8000, true, {
            position: 'bottom-left',
            theme: 'gradient'
        });
    }, 2000);
    
    // Нижний центр
    setTimeout(() => {
        showNotification('Нижний центр', 'success', 8000, true, {
            position: 'bottom-center',
            theme: 'gradient'
        });
    }, 2500);
}

// Функция для демонстрации различных тем
function showThemeExamples() {
    // Тема по умолчанию (светлая)
    showNotification('Тема по умолчанию (светлая)', 'info', 8000, true);
    
    // Темная тема
    setTimeout(() => {
        showNotification('Темная тема', 'info', 8000, true, {
            theme: 'dark'
        });
    }, 1000);
    
    // Стеклянная тема
    setTimeout(() => {
        showNotification('Стеклянная тема', 'info', 8000, true, {
            theme: 'glass'
        });
    }, 2000);
    
    // Неоновая тема
    setTimeout(() => {
        showNotification('Неоновая тема', 'info', 8000, true, {
            theme: 'neon'
        });
    }, 3000);
    
    // Градиентная тема
    setTimeout(() => {
        showNotification('Градиентная тема', 'info', 8000, true, {
            theme: 'gradient'
        });
    }, 4000);
    
    // Минималистичная тема
    setTimeout(() => {
        showNotification('Минималистичная тема', 'info', 8000, true, {
            theme: 'minimal'
        });
    }, 5000);
    
    // Тема "размытая карточка" (новая)
    setTimeout(() => {
        showNotification('Новая тема "размытая карточка"', 'info', 8000, true, {
            theme: 'blurred-card'
        });
    }, 6000);
    
    // Тема "soft-ui" (новая)
    setTimeout(() => {
        showNotification('Новая тема "soft-ui"', 'info', 8000, true, {
            theme: 'soft-ui'
        });
    }, 7000);
    
    // Тема "frosted" (новая)
    setTimeout(() => {
        showNotification('Новая тема "frosted"', 'info', 8000, true, {
            theme: 'frosted'
        });
    }, 8000);
}

// Функция для демонстрации эмодзи и изображений
function showEmojiAndImageExamples() {
    // Уведомление с эмодзи
    showNotification('Уведомление с эмодзи вместо иконки', 'info', 5000, true, {
        emoji: '🚀',
        theme: 'blurred-card'
    });
    
    // Еще примеры с эмодзи
    setTimeout(() => {
        showNotification('Успешное выполнение!', 'success', 5000, true, {
            emoji: '✅',
            theme: 'glass'
        });
    }, 1000);
    
    setTimeout(() => {
        showNotification('Ошибка!', 'error', 5000, true, {
            emoji: '❌',
            theme: 'frosted'
        });
    }, 2000);
    
    setTimeout(() => {
        showNotification('Предупреждение!', 'warning', 5000, true, {
            emoji: '⚠️',
            theme: 'neon'
        });
    }, 3000);
    
    // Уведомление с изображением
    setTimeout(() => {
        showNotification('Уведомление с изображением', 'info', 5000, true, {
            imageUrl: 'https://via.placeholder.com/50',
            theme: 'soft-ui'
        });
    }, 4000);
    
    // Анимированный эмодзи с эффектом парения
    setTimeout(() => {
        showNotification('Анимированный эмодзи с эффектом парения', 'success', 5000, true, {
            emoji: '🎈',
            animation: 'zoom',
            theme: 'gradient'
        });
    }, 5000);
}

// Функция для демонстрации кликабельных уведомлений
function showClickableNotifications() {
    // Информационное уведомление с детальной информацией
    showNotification('Нажмите, чтобы узнать больше о новом функционале', 'info', 15000, true, {
        animation: 'zoom',
        theme: 'glass',
        notificationData: {
            details: 'Этот новый функционал позволяет вам взаимодействовать с уведомлениями напрямую! Просто кликните на уведомление, чтобы увидеть дополнительную информацию или выполнить связанные действия.<br><br>Для каждого типа уведомления предусмотрен свой уникальный интерфейс взаимодействия.',
            url: '#documentation'
        }
    });
    
    // Уведомление об успехе с опцией продолжения
    setTimeout(() => {
        showNotification('Заказ #23456 успешно оформлен!', 'success', 15000, true, {
            animation: 'bounce',
            theme: 'gradient',
            notificationData: {
                details: 'Ваш заказ был успешно оформлен и передан в обработку. Ожидаемое время доставки: 2-3 рабочих дня.',
                action: function() {
                    // Здесь могла бы быть функция для перехода к отслеживанию заказа
                    showNotification('Переход к отслеживанию заказа...', 'info', 3000);
                },
                actionText: 'Отследить заказ'
            }
        });
    }, 2000);
    
    // Уведомление об ошибке с опцией повторной попытки
    setTimeout(() => {
        showNotification('Ошибка при загрузке данных профиля', 'error', 15000, true, {
            animation: 'shake',
            theme: 'neon',
            notificationData: {
                details: 'Не удалось загрузить данные вашего профиля из-за временных проблем с сервером. Пожалуйста, попробуйте позже или свяжитесь с технической поддержкой.',
                errorCode: 'ERR_PROFILE_LOAD_500',
                helpUrl: '#support',
                retryAction: function() {
                    // Здесь могла бы быть функция для повторной попытки загрузки профиля
                    showNotification('Повторная загрузка данных...', 'info', 3000);
                }
            }
        });
    }, 4000);
    
    // Предупреждение с несколькими вариантами действий
    setTimeout(() => {
        showNotification('Обнаружены несохраненные изменения', 'warning', 15000, true, {
            animation: 'pulse',
            theme: 'minimal',
            notificationData: {
                details: 'У вас есть несохраненные изменения в документе. Если вы покинете страницу без сохранения, все изменения будут потеряны.',
                onIgnore: function() {
                    showNotification('Предупреждение проигнорировано', 'info', 3000);
                },
                actions: [
                    {
                        id: 'save',
                        text: 'Сохранить изменения',
                        icon: 'save',
                        handler: function() {
                            showNotification('Документ сохранен', 'success', 3000);
                        }
                    },
                    {
                        id: 'discard',
                        text: 'Отменить изменения',
                        icon: 'trash',
                        handler: function() {
                            showNotification('Изменения отменены', 'info', 3000);
                        }
                    },
                    {
                        id: 'preview',
                        text: 'Предварительный просмотр',
                        icon: 'eye',
                        handler: function() {
                            showNotification('Открыт предварительный просмотр', 'info', 3000);
                        }
                    }
                ]
            }
        });
    }, 6000);
    
    // Уведомление с прямым URL
    setTimeout(() => {
        showNotification('Доступна новая версия приложения 2.0', 'info', 15000, true, {
            animation: 'fade',
            theme: 'blurred-card',
            actionUrl: '#download',
            customIcon: 'download'
        });
    }, 8000);
    
    // Кастомное уведомление с собственным обработчиком клика
    setTimeout(() => {
        showNotification('Вы выиграли приз!', 'custom', 15000, true, {
            animation: 'flip',
            theme: 'frosted',
            emoji: '🎁',
            onClick: function() {
                showNotification('Открываем призовое окно...', 'success', 3000, true, {
                    showConfetti: true
                });
                setTimeout(() => {
                    alert('Поздравляем! Вы выиграли скидку 15% на следующую покупку!');
                }, 1000);
            }
        });
    }, 10000);
}

// Функция для демонстрации практического использования кликабельных уведомлений
function showNotificationRealExamples() {
    // Уведомление о новом сообщении
    showNotification('Новое сообщение от Александра', 'info', 8000, true, {
        animation: 'zoom',
        emoji: '✉️',
        notificationData: {
            details: 'Александр: Привет! Когда мы сможем обсудить новый проект? У меня есть несколько интересных идей, которые я хотел бы предложить...',
            actions: [
                {
                    id: 'reply',
                    text: 'Ответить',
                    icon: 'reply',
                    handler: function() {
                        showNotification('Открываем окно чата...', 'info', 3000);
                    }
                },
                {
                    id: 'later',
                    text: 'Напомнить позже',
                    icon: 'clock',
                    handler: function() {
                        showNotification('Напоминание установлено', 'success', 3000);
                    }
                }
            ]
        }
    });
    
    // Уведомление о завершении загрузки файла
    setTimeout(() => {
        showNotification('Файл "Презентация.pptx" загружен', 'success', 8000, true, {
            animation: 'slide',
            theme: 'glass',
            customIcon: 'file-powerpoint',
            notificationData: {
                details: 'Файл успешно загружен на сервер и готов к использованию.',
                actions: [
                    {
                        id: 'open',
                        text: 'Открыть файл',
                        icon: 'eye',
                        handler: function() {
                            showNotification('Открываем файл...', 'info', 3000);
                        }
                    },
                    {
                        id: 'share',
                        text: 'Поделиться',
                        icon: 'share',
                        handler: function() {
                            showNotification('Открываем опции шаринга...', 'info', 3000);
                        }
                    }
                ]
            }
        });
    }, 2000);
    
    // Уведомление о низком заряде батареи
    setTimeout(() => {
        showNotification('Низкий заряд батареи: 15%', 'warning', 8000, true, {
            animation: 'pulse',
            theme: 'soft-ui',
            customIcon: 'battery-quarter',
            notificationData: {
                details: 'Устройство скоро отключится. Рекомендуется подключить зарядное устройство.',
                actions: [
                    {
                        id: 'powersave',
                        text: 'Включить режим энергосбережения',
                        icon: 'leaf',
                        handler: function() {
                            showNotification('Режим энергосбережения активирован', 'success', 3000);
                        }
                    }
                ]
            }
        });
    }, 4000);
    
    // Уведомление о завершении обновления системы
    setTimeout(() => {
        showNotification('Обновление системы завершено', 'success', 8000, true, {
            animation: 'bounce',
            theme: 'gradient',
            customIcon: 'sync',
            notificationData: {
                details: 'Система была обновлена до версии 2.5.1. Включены новые функции и исправлены ошибки безопасности.',
                action: function() {
                    showNotification('Открываем список изменений...', 'info', 3000);
                },
                actionText: 'Что нового?'
            }
        });
    }, 6000);
}

// Экспортируем функции для использования в других файлах
window.showAllNotificationTypes = showAllNotificationTypes;
window.showAnimationExamples = showAnimationExamples;
window.showPositionExamples = showPositionExamples;
window.showThemeExamples = showThemeExamples;
window.showEmojiAndImageExamples = showEmojiAndImageExamples;
window.showClickableNotifications = showClickableNotifications;
window.showNotificationRealExamples = showNotificationRealExamples; 