

// Объект с настройками по умолчанию
const DEFAULT_SETTINGS = {
  isDarkMode: false,
  isAnimated: true,
  isSoundEnabled: true,
  volume: 50,
  notificationsEnabled: true,
  notificationDuration: 5000,
  // Новые настройки интерфейса
  fontSize: 'normal', // normal, small, large
  fullAnimations: true, // полные или сокращенные анимации
  // Настройки производительности
  lowResourceMode: false, // режим экономии ресурсов
  cacheSize: 'medium', // small, medium, large
  // Настройки приватности
  analyticsEnabled: true, // сбор аналитики
  autoCleanSession: false, // автоматическое очищение данных сессии
  // Настройки тем оформления
  theme: 'default', // default, dark, contrast, elegant, nature, neon, pastel, vintage, tech
  accentColor: '#BCB88A', // цвет акцента для активных элементов
  // Настройки API
  apiEnabled: true, // включение/выключение API
  apiDebugMode: true // режим отладки API
};

// Настройки API для отправки заказов
window.API_BASE_URL = 'https://api.damax.ru/api';
window.API_BACKUP_URL = 'https://backup-api.damax.ru';
window.API_DEBUG = true; // Включаем режим отладки по умолчанию

// Статические методы оплаты и доставки
window.STATIC_PAYMENT_METHODS = [
  { value: 'card', label: 'Банковская карта' },
  { value: 'cash', label: 'Наличными при получении' },
  { value: 'online', label: 'Онлайн-оплата' }
];

window.STATIC_DELIVERY_METHODS = [
  { value: 'courier', label: 'Курьер' },
  { value: 'pickup', label: 'Самовывоз' },
  { value: 'post', label: 'Почта' }
];

// Глобальные обработчики событий для модального окна настроек
let currentHandleOutsideClick = null;
let currentHandleEscape = null;

/**
 * Инициализация настроек приложения
 */
function initSettings() {
  // Загружаем настройки из localStorage или используем значения по умолчанию
  const savedSettings = loadSettings();
  
  // Применяем загруженные настройки
  applySettings(savedSettings);
}

/**
 * Загрузка настроек из localStorage
 * @returns {Object} Объект с настройками приложения
 */
function loadSettings() {
  const savedSettings = localStorage.getItem('userSettings');
  
  if (savedSettings) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
    } catch (error) {
      console.error('Ошибка при загрузке настроек:', error);
      return DEFAULT_SETTINGS;
    }
  }
  
  // Проверяем существующие настройки темы и звука (для обратной совместимости)
  const theme = localStorage.getItem('theme');
  const sound = localStorage.getItem('sound');
  
  const settings = { ...DEFAULT_SETTINGS };
  
  if (theme) {
    settings.isDarkMode = theme === 'dark';
  }
  
  if (sound) {
    settings.isSoundEnabled = sound !== 'muted';
  }
  
  return settings;
}

/**
 * Применение настроек к интерфейсу
 * @param {Object} settings Объект с настройками
 */
function applySettings(settings) {
  // 1. Применение темной темы
  if (settings.isDarkMode) {
    document.body.setAttribute('data-theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark');
    document.body.classList.remove('light');
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    
    // Обновляем иконки
    document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
      const sunIcon = btn.querySelector('i.fa-sun');
      const moonIcon = btn.querySelector('i.fa-moon');
      
      if (sunIcon && moonIcon) {
        sunIcon.style.cssText = 'display: none !important';
        moonIcon.style.cssText = 'display: inline-block !important';
      }
    });
  } else {
    document.body.setAttribute('data-theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.classList.remove('dark');
    document.body.classList.add('light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    
    // Обновляем иконки
    document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
      const sunIcon = btn.querySelector('i.fa-sun');
      const moonIcon = btn.querySelector('i.fa-moon');
      
      if (sunIcon && moonIcon) {
        sunIcon.style.cssText = 'display: inline-block !important';
        moonIcon.style.cssText = 'display: none !important';
      }
    });
  }
  
  // 2. Применение настроек звука
  if (settings.isSoundEnabled) {
    document.body.classList.remove('muted');
  } else {
    document.body.classList.add('muted');
  }
  
  // 3. Применение настроек анимаций
  if (settings.isAnimated) {
    document.body.classList.remove('no-animations');
  } else {
    document.body.classList.add('no-animations');
  }
  
  // 4. Применение громкости звука
  window.soundVolume = settings.volume / 100;
  
  // 5. Применение настроек уведомлений
  window.notificationsEnabled = settings.notificationsEnabled;
  window.notificationDuration = parseInt(settings.notificationDuration) || 5000;
  
  // 6. Применение размера шрифта
  document.body.classList.remove('font-small', 'font-normal', 'font-large');
  document.body.classList.add(`font-${settings.fontSize}`);
  
  // 7. Применение настроек полных/сокращенных анимаций
  if (settings.fullAnimations) {
    document.body.classList.remove('reduced-animations');
  } else {
    document.body.classList.add('reduced-animations');
  }
  
  // 8. Применение режима экономии ресурсов
  if (settings.lowResourceMode) {
    document.body.classList.add('low-resource-mode');
    // Отключаем тяжелые эффекты
    window.lowResourceMode = true;
  } else {
    document.body.classList.remove('low-resource-mode');
    window.lowResourceMode = false;
  }
  
  // 9. Настройка размера кэша
  window.cacheSize = settings.cacheSize;
  localStorage.setItem('cacheSize', settings.cacheSize);
  
  // 10. Настройка аналитики
  window.analyticsEnabled = settings.analyticsEnabled;
  
  // 11. Настройка автоочистки сессии
  window.autoCleanSession = settings.autoCleanSession;
  if (settings.autoCleanSession) {
    // Устанавливаем периодическую очистку данных сессии
    if (!window.sessionCleanInterval) {
      window.sessionCleanInterval = setInterval(() => {
        // Очистка временных данных, не затрагивая основные настройки
        const keysToPreserve = ['userSettings', 'theme', 'sound'];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (!keysToPreserve.includes(key)) {
            sessionStorage.removeItem(key);
          }
        }
      }, 3600000); // Каждый час (3600000 мс)
    }
  } else {
    // Отключаем периодическую очистку
    if (window.sessionCleanInterval) {
      clearInterval(window.sessionCleanInterval);
      window.sessionCleanInterval = null;
    }
  }
  
  // 12. Применение темы оформления
  // Сначала удаляем все классы тем
  const themeClasses = ['theme-default', 'theme-dark', 'theme-contrast', 'theme-elegant', 'theme-nature', 
                        'theme-neon', 'theme-pastel', 'theme-vintage', 'theme-tech'];
  document.body.classList.remove(...themeClasses);
  
  // Применяем новую тему
  document.body.classList.add(`theme-${settings.theme}`);
  
  // Если тема не dark и не contrast, но включен isDarkMode, 
  // то включаем соответствующую темную версию
  if (settings.isDarkMode && settings.theme !== 'dark' && settings.theme !== 'contrast') {
    document.body.classList.add('theme-dark-mode');
  } else {
    document.body.classList.remove('theme-dark-mode');
  }
  
  // 13. Применение цвета акцента
  document.documentElement.style.setProperty('--accent-primary', settings.accentColor);
  document.documentElement.style.setProperty('--accent-light', lightenColor(settings.accentColor, 20));
  document.documentElement.style.setProperty('--accent-dark', darkenColor(settings.accentColor, 20));
}

/**
 * Сохранение настроек в localStorage
 * @param {Object} settings Объект с настройками для сохранения
 */
function saveSettings(settings) {
  try {
    localStorage.setItem('userSettings', JSON.stringify(settings));
    
    // Для обратной совместимости сохраняем также в отдельных ключах
    localStorage.setItem('theme', settings.isDarkMode ? 'dark' : 'light');
    localStorage.setItem('sound', settings.isSoundEnabled ? 'unmuted' : 'muted');
    
    return true;
  } catch (error) {
    console.error('Ошибка при сохранении настроек:', error);
    return false;
  }
}

/**
 * Отображение модального окна настроек
 */
function showSettingsModal() {
  // Получаем текущие настройки
  const currentSettings = loadSettings();
  
  // Получаем доступные темы и цвета акцента
  const availableThemes = getAvailableThemes();
  const accentColors = getAccentColors();
  
  // Создаем элемент модального окна
  const settingsModal = document.createElement('div');
  settingsModal.className = 'modal-settings';
  
  // Блокируем прокрутку основного содержимого страницы
  document.body.style.overflow = 'hidden';
  
  // Создаем содержимое модального окна
  settingsModal.innerHTML = `
    <div class="modal-settings__content">
      <button class="modal-settings__close-top" title="Закрыть"><i class="fas fa-times"></i></button>
      <div class="settings-content">
        <h2 class="modal-settings__title">Настройки</h2>
        
        <div class="settings-section">
          <h3>Внешний вид</h3>
          
          <div class="settings-option">
            <div class="settings-option__info">
              <div class="settings-option__title">Темная тема</div>
              <div class="settings-option__description">Включить темный режим интерфейса</div>
            </div>
            <div class="settings-switch${currentSettings.isDarkMode ? ' active' : ''}" data-action="toggle-theme">
              <div class="settings-switch__track"></div>
              <div class="settings-switch__thumb"></div>
            </div>
          </div>
          
          <div class="settings-option">
            <div class="settings-option__info">
              <div class="settings-option__title">Анимации</div>
              <div class="settings-option__description">Включить анимации интерфейса</div>
            </div>
            <div class="settings-switch${currentSettings.isAnimated ? ' active' : ''}" data-action="toggle-animations">
              <div class="settings-switch__track"></div>
              <div class="settings-switch__thumb"></div>
            </div>
          </div>
          
          <div class="settings-option">
            <div class="settings-option__info">
              <div class="settings-option__title">Размер шрифта</div>
              <div class="settings-option__description">Настройка размера шрифта интерфейса</div>
            </div>
            <div class="settings-select">
              <select class="settings-select__input" data-action="font-size">
                <option value="small"${currentSettings.fontSize === 'small' ? ' selected' : ''}>Мелкий</option>
                <option value="normal"${currentSettings.fontSize === 'normal' ? ' selected' : ''}>Обычный</option>
                <option value="large"${currentSettings.fontSize === 'large' ? ' selected' : ''}>Крупный</option>
              </select>
            </div>
          </div>
          
          <div class="settings-option">
            <div class="settings-option__info">
              <div class="settings-option__title">Полные анимации</div>
              <div class="settings-option__description">Использовать расширенные анимации</div>
            </div>
            <div class="settings-switch${currentSettings.fullAnimations ? ' active' : ''}" data-action="toggle-full-animations">
              <div class="settings-switch__track"></div>
              <div class="settings-switch__thumb"></div>
            </div>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>Тема оформления</h3>
          
          <div class="settings-option">
            <div class="settings-option__info">
              <div class="settings-option__title">Тема</div>
              <div class="settings-option__description">Выберите тему интерфейса</div>
            </div>
            <div class="settings-select">
              <select class="settings-select__input" data-action="theme">
                ${availableThemes.map(theme => 
                  `<option value="${theme.id}"${currentSettings.theme === theme.id ? ' selected' : ''}>${theme.name}</option>`
                ).join('')}
              </select>
            </div>
          </div>
          
          <div class="theme-description">${availableThemes.find(t => t.id === currentSettings.theme)?.description || ''}</div>
          
          <div class="theme-gallery">
            ${availableThemes.map(theme => 
              `<div class="theme-preview${currentSettings.theme === theme.id ? ' active' : ''}" data-theme="${theme.id}">
                <div class="theme-preview__sample theme-preview__sample--${theme.id}">
                  <div class="preview-header"></div>
                  <div class="preview-body">
                    <div class="preview-item"></div>
                    <div class="preview-item"></div>
                    <div class="preview-button"></div>
                  </div>
                </div>
                <div class="theme-preview__name">${theme.name}</div>
              </div>`
            ).join('')}
          </div>
          
          <div class="settings-option">
            <div class="settings-option__info">
              <div class="settings-option__title">Цвет акцента</div>
              <div class="settings-option__description">Цвет активных элементов</div>
            </div>
            <div class="color-picker">
              <div class="color-preview" style="background-color: ${currentSettings.accentColor}"></div>
              <div class="color-options">
                ${accentColors.map(color => 
                  `<div class="color-option${currentSettings.accentColor === color.value ? ' active' : ''}" 
                        style="background-color: ${color.value}" 
                        data-color="${color.value}" 
                        title="${color.name}"></div>`
                ).join('')}
              </div>
            </div>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>Звук</h3>
          
          <div class="settings-option">
            <div class="settings-option__info">
              <div class="settings-option__title">Звуковые эффекты</div>
              <div class="settings-option__description">Включить звуки при взаимодействии</div>
            </div>
            <div class="settings-switch${currentSettings.isSoundEnabled ? ' active' : ''}" data-action="toggle-sound">
              <div class="settings-switch__track"></div>
              <div class="settings-switch__thumb"></div>
            </div>
          </div>
          
          <div class="settings-option">
            <div class="settings-option__info">
              <div class="settings-option__title">Громкость</div>
              <div class="settings-option__description">Регулировка громкости звуков</div>
            </div>
            <div class="settings-slider">
              <input type="range" min="0" max="100" value="${currentSettings.volume}" class="settings-slider__input" data-action="volume">
              <div class="settings-slider__value">${currentSettings.volume}%</div>
            </div>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>Уведомления</h3>
          
          <div class="settings-option">
            <div class="settings-option__info">
              <div class="settings-option__title">Показывать уведомления</div>
              <div class="settings-option__description">Включить всплывающие уведомления</div>
            </div>
            <div class="settings-switch${currentSettings.notificationsEnabled ? ' active' : ''}" data-action="toggle-notifications">
              <div class="settings-switch__track"></div>
              <div class="settings-switch__thumb"></div>
            </div>
          </div>
          
          <div class="settings-option">
            <div class="settings-option__info">
              <div class="settings-option__title">Длительность показа</div>
              <div class="settings-option__description">Время отображения уведомлений</div>
            </div>
            <div class="settings-select">
              <select class="settings-select__input" data-action="notification-duration">
                <option value="3000"${currentSettings.notificationDuration === 3000 ? ' selected' : ''}>3 секунды</option>
                <option value="5000"${currentSettings.notificationDuration === 5000 ? ' selected' : ''}>5 секунд</option>
                <option value="7000"${currentSettings.notificationDuration === 7000 ? ' selected' : ''}>7 секунд</option>
                <option value="10000"${currentSettings.notificationDuration === 10000 ? ' selected' : ''}>10 секунд</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>Производительность</h3>
          
          <div class="settings-option">
            <div class="settings-option__info">
              <div class="settings-option__title">Режим экономии ресурсов</div>
              <div class="settings-option__description">Снижает нагрузку на устройство</div>
            </div>
            <div class="settings-switch${currentSettings.lowResourceMode ? ' active' : ''}" data-action="toggle-low-resource">
              <div class="settings-switch__track"></div>
              <div class="settings-switch__thumb"></div>
            </div>
          </div>
          
          <div class="settings-option">
            <div class="settings-option__info">
              <div class="settings-option__title">Размер кэша</div>
              <div class="settings-option__description">Объем хранимой информации</div>
            </div>
            <div class="settings-select">
              <select class="settings-select__input" data-action="cache-size">
                <option value="small"${currentSettings.cacheSize === 'small' ? ' selected' : ''}>Маленький (быстрее)</option>
                <option value="medium"${currentSettings.cacheSize === 'medium' ? ' selected' : ''}>Средний</option>
                <option value="large"${currentSettings.cacheSize === 'large' ? ' selected' : ''}>Большой (больше данных)</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>Приватность</h3>
          
          <div class="settings-option">
            <div class="settings-option__info">
              <div class="settings-option__title">Сбор аналитики</div>
              <div class="settings-option__description">Помогает улучшать приложение</div>
            </div>
            <div class="settings-switch${currentSettings.analyticsEnabled ? ' active' : ''}" data-action="toggle-analytics">
              <div class="settings-switch__track"></div>
              <div class="settings-switch__thumb"></div>
            </div>
          </div>
          
          <div class="settings-option">
            <div class="settings-option__info">
              <div class="settings-option__title">Авто-очистка данных</div>
              <div class="settings-option__description">Регулярная очистка временных данных</div>
            </div>
            <div class="settings-switch${currentSettings.autoCleanSession ? ' active' : ''}" data-action="toggle-auto-clean">
              <div class="settings-switch__track"></div>
              <div class="settings-switch__thumb"></div>
            </div>
          </div>
          
          <div class="settings-option">
            <div class="settings-option__info">
              <div class="settings-option__title">Очистить данные</div>
              <div class="settings-option__description">Удалить все временные данные</div>
            </div>
            <button class="settings-button" data-action="clean-data">
              <i class="fas fa-trash-alt"></i> Очистить сейчас
            </button>
          </div>
        </div>
        
        <div class="settings-actions">
          <button class="modal-settings__close">
            <i class="fas fa-times"></i> Закрыть
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Добавляем стили для корректной прокрутки модального окна
  const settingsStyle = document.createElement('style');
  settingsStyle.id = 'modal-settings-scroll-style';
  settingsStyle.textContent = `
    .modal-settings {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      overflow: hidden;
    }
    
    .modal-settings__content {
      max-height: 90vh;
      overflow-y: auto;
      overscroll-behavior: contain;
      max-width: 90%;
      width: 550px;
      background-color: #fff;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      position: relative;
      padding: 25px;
    }
    
    body.dark .modal-settings__content {
      background-color: #333;
      color: #f0f0f0;
    }
    
    .settings-content {
      width: 100%;
    }
    
    /* Добавляем свойства прокрутки для Firefox */
    .modal-settings__content {
      scrollbar-width: thin;
      scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
    }
    
    /* Добавляем свойства прокрутки для Chrome, Edge, и Safari */
    .modal-settings__content::-webkit-scrollbar {
      width: 8px;
    }
    
    .modal-settings__content::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .modal-settings__content::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.3);
      border-radius: 20px;
      border: 2px solid transparent;
    }
    
    body.dark .modal-settings__content::-webkit-scrollbar-thumb {
      background-color: rgba(255, 255, 255, 0.3);
    }
  `;
  
  // Добавляем стили в документ
  document.head.appendChild(settingsStyle);
  
  // Добавляем модальное окно в документ
  document.body.appendChild(settingsModal);
  
  // Получаем ссылки на элементы управления
  const closeButtons = settingsModal.querySelectorAll('.modal-settings__close, .modal-settings__close-top');
  const modalContent = settingsModal.querySelector('.modal-settings__content');
  
  // Обработчик для клика вне модального окна
  const handleOutsideClick = (event) => {
    // Проверяем, что клик был не на контенте модального окна и его дочерних элементах
    if (event.target === settingsModal && !modalContent.contains(event.target)) {
      closeSettingsModal(settingsModal);
    }
  };
  
  // Обработчик для клавиши Escape
  const handleEscape = (event) => {
    if (event.key === 'Escape') {
      closeSettingsModal(settingsModal);
    }
  };
  
  // Сохраняем ссылки на текущие обработчики в глобальных переменных
  currentHandleOutsideClick = handleOutsideClick;
  currentHandleEscape = handleEscape;
  
  // Обработчик для переключателей (toggle switches)
  const toggleSwitches = settingsModal.querySelectorAll('.settings-switch');
  toggleSwitches.forEach(switchEl => {
    switchEl.addEventListener('click', () => {
      switchEl.classList.toggle('active');
      playSound('switch');
      saveAndApplyCurrentSettings(settingsModal); // Сохраняем и применяем немедленно
    });
  });

  // Обработчики для других изменяемых элементов, которые вызывают сохранение
  const settingsToSave = settingsModal.querySelectorAll('select.settings-select__input, input.settings-slider__input');
  settingsToSave.forEach(element => {
    element.addEventListener('change', () => {
      saveAndApplyCurrentSettings(settingsModal);
    });
  });
  
  // Обработчик для слайдера громкости, чтобы обновлять текст
  const volumeSlider = settingsModal.querySelector('input[data-action="volume"]');
  const volumeValue = settingsModal.querySelector('.settings-slider__value');
  if (volumeSlider && volumeValue) {
    volumeSlider.addEventListener('input', () => {
      volumeValue.textContent = `${volumeSlider.value}%`;
    });
  }
  
  // Обработчик для кнопки очистки данных
  const cleanDataButton = settingsModal.querySelector('[data-action="clean-data"]');
  if (cleanDataButton) {
    cleanDataButton.addEventListener('click', () => {
      // Очистка sessionStorage
      sessionStorage.clear();
      
      // Очистка кэша (только временных данных)
      const keysToPreserve = ['userSettings', 'theme', 'sound'];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!keysToPreserve.includes(key) && key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      }
      
      // Уведомление пользователя
      showNotification('Временные данные очищены', 'success');
      playSound('success');
    });
  }
  
  // Удаляем старый обработчик кнопки "Сохранить"
  
  // Добавляем обработчики для выбора темы и предпросмотра
  const themeSelect = settingsModal.querySelector('select[data-action="theme"]');
  const themeDescription = settingsModal.querySelector('.theme-description');
  const themePreviews = settingsModal.querySelectorAll('.theme-preview');
  
  if (themeSelect) {
    // Обновление предпросмотра при изменении выбора в выпадающем списке
    themeSelect.addEventListener('change', () => {
      const selectedThemeId = themeSelect.value;
      
      // Обновляем описание
      const selectedTheme = availableThemes.find(t => t.id === selectedThemeId);
      if (selectedTheme && themeDescription) {
        themeDescription.textContent = selectedTheme.description;
      }
      
      // Обновляем активный предпросмотр
      themePreviews.forEach(preview => {
        if (preview.dataset.theme === selectedThemeId) {
          preview.classList.add('active');
        } else {
          preview.classList.remove('active');
        }
      });
      
      // Воспроизводим звук переключения
      playSound('switch');
      
      // Вызываем сохранение после изменения темы
      saveAndApplyCurrentSettings(settingsModal);
    });
  }
  
  // Обработчики для миниатюр тем
  themePreviews.forEach(preview => {
    preview.addEventListener('click', () => {
      const themeId = preview.dataset.theme;
      
      // Обновляем выбор в выпадающем списке
      if (themeSelect) {
        themeSelect.value = themeId;
        
        // Вызываем событие изменения, чтобы сработали все обработчики
        const changeEvent = new Event('change');
        themeSelect.dispatchEvent(changeEvent);
      }
    });
  });
  
  // Обработчики для выбора цвета
  const colorOptions = settingsModal.querySelectorAll('.color-option');
  const colorPreview = settingsModal.querySelector('.color-preview');
  
  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Снимаем активное состояние со всех опций
      colorOptions.forEach(op => op.classList.remove('active'));
      
      // Устанавливаем активное состояние на выбранную опцию
      option.classList.add('active');
      
      // Обновляем предпросмотр
      if (colorPreview) {
        colorPreview.style.backgroundColor = option.dataset.color;
      }
      
      // Воспроизводим звук переключения
      playSound('switch');
      
      // Сохраняем настройку цвета
      saveAndApplyCurrentSettings(settingsModal);
    });
  });
  
  // Добавляем обработчики событий
  closeButtons.forEach(button => {
    button.addEventListener('click', () => closeSettingsModal(settingsModal));
  });
  
  settingsModal.addEventListener('click', handleOutsideClick);
  document.addEventListener('keydown', handleEscape);
  
  // Анимация появления
  setTimeout(() => {
    modalContent.style.transform = 'translateY(0)';
    modalContent.style.opacity = '1';
  }, 10);
}

/**
 * Закрытие модального окна настроек
 * @param {HTMLElement} modalElement - Элемент модального окна
 */
function closeSettingsModal(modalElement) {
  if (!modalElement) return;
  
  // Снимаем фокус со всех элементов внутри модального окна перед закрытием
  const focusedElement = document.activeElement;
  if (focusedElement && modalElement.contains(focusedElement)) {
    focusedElement.blur();
  }
  
  // Установим явный флаг, что модальное окно закрывается
  modalElement.setAttribute('inert', '');
  modalElement.classList.add('closing');
  
  // Получаем содержимое модального окна
  const modalContent = modalElement.querySelector('.modal-settings__content');
  
  // Анимация скрытия
  if (modalContent) {
    modalContent.style.transform = 'translateY(20px)';
    modalContent.style.opacity = '0';
  }
  
  // Удаляем обработчики событий, используя глобальные ссылки
  if (currentHandleEscape) {
    document.removeEventListener('keydown', currentHandleEscape);
  }
  if (currentHandleOutsideClick) {
    modalElement.removeEventListener('click', currentHandleOutsideClick);
  }
  
  // Очищаем глобальные ссылки
  currentHandleEscape = null;
  currentHandleOutsideClick = null;
  
  // Сразу восстанавливаем прокрутку страницы
  document.body.style.overflow = '';
  
  // Удаляем модальное окно после завершения анимации
  setTimeout(() => {
    // Удаляем элемент из DOM
    if (modalElement && modalElement.parentNode) {
      modalElement.parentNode.removeChild(modalElement);
    }
    
    // Воспроизводим звук закрытия
    playSound('close');
  }, 200);
  
  // Дополнительная подстраховка - если по какой-то причине модальное окно 
  // не было удалено через 500мс, удаляем его принудительно
  setTimeout(() => {
    const modalStillExists = document.querySelector('.modal-settings');
    if (modalStillExists) {
      console.warn('Модальное окно не было удалено автоматически, выполняем принудительное удаление');
      if (modalStillExists.parentNode) {
        modalStillExists.parentNode.removeChild(modalStillExists);
      }
    }
  }, 500);
}

/**
 * Функция для сбора, сохранения и применения настроек
 * @param {HTMLElement} modalElement - Элемент модального окна
 */
function saveAndApplyCurrentSettings(modalElement) {
  if (!modalElement) return;

  const currentSettings = loadSettings();
  const newSettings = { ...currentSettings };

  // Обработка переключателей
  newSettings.isDarkMode = modalElement.querySelector('[data-action="toggle-theme"]').classList.contains('active');
  newSettings.isAnimated = modalElement.querySelector('[data-action="toggle-animations"]').classList.contains('active');
  newSettings.isSoundEnabled = modalElement.querySelector('[data-action="toggle-sound"]').classList.contains('active');
  newSettings.notificationsEnabled = modalElement.querySelector('[data-action="toggle-notifications"]').classList.contains('active');
  newSettings.fullAnimations = modalElement.querySelector('[data-action="toggle-full-animations"]').classList.contains('active');
  newSettings.lowResourceMode = modalElement.querySelector('[data-action="toggle-low-resource"]').classList.contains('active');
  newSettings.analyticsEnabled = modalElement.querySelector('[data-action="toggle-analytics"]').classList.contains('active');
  newSettings.autoCleanSession = modalElement.querySelector('[data-action="toggle-auto-clean"]').classList.contains('active');

  // Обработка слайдера громкости
  const volumeSlider = modalElement.querySelector('input[data-action="volume"]');
  if (volumeSlider) {
    newSettings.volume = parseInt(volumeSlider.value);
  }

  // Обработка выпадающих списков
  const durationSelect = modalElement.querySelector('select[data-action="notification-duration"]');
  if (durationSelect) {
    newSettings.notificationDuration = parseInt(durationSelect.value);
  }
  
  const fontSizeSelect = modalElement.querySelector('select[data-action="font-size"]');
  if (fontSizeSelect) {
    newSettings.fontSize = fontSizeSelect.value;
  }

  const cacheSizeSelect = modalElement.querySelector('select[data-action="cache-size"]');
  if (cacheSizeSelect) {
    newSettings.cacheSize = cacheSizeSelect.value;
  }

  const themeSelect = modalElement.querySelector('select[data-action="theme"]');
  if (themeSelect) {
    newSettings.theme = themeSelect.value;
  }
  
  // Получаем выбранный цвет акцента
  const activeColorOption = modalElement.querySelector('.color-option.active');
  if (activeColorOption) {
    newSettings.accentColor = activeColorOption.dataset.color || currentSettings.accentColor;
  }

  // Сохраняем и применяем настройки
  if (saveSettings(newSettings)) {
    applySettings(newSettings);
    // Не показываем уведомление при каждом изменении, чтобы не спамить
  } else {
    showNotification('Ошибка применения настройки', 'error');
  }
}

/**
 * Воспроизведение звукового эффекта
 * @param {string} soundName Имя звукового эффекта
 * @param {number} volumeMultiplier Множитель громкости (опционально, от 0 до 1)
 */
function playSound(soundName, volumeMultiplier = 1) {
  // Если звуки отключены, ничего не делаем
  const settings = loadSettings();
  if (!settings.isSoundEnabled) return;
  
  let soundElement = document.getElementById(`sound-${soundName}`);
  
  if (!soundElement) {
    soundElement = document.createElement('audio');
    soundElement.id = `sound-${soundName}`;
    
    // Функция для проверки и воспроизведения звука с учетом регистра
    const tryPlaySound = (extension) => {
      // Массив возможных вариантов имени файла (с разным регистром)
      const possibleFileNames = [
        `sounds/${soundName}.${extension}`,
        `sounds/${soundName.toLowerCase()}.${extension}`,
        `sounds/${soundName.charAt(0).toUpperCase() + soundName.slice(1)}.${extension}`,
        `sounds/${soundName.toUpperCase()}.${extension}`
      ];
      
      // Функция для проверки существования файла
      const checkAndPlay = (index) => {
        if (index >= possibleFileNames.length) {
          console.error(`Не удалось найти звуковой файл для ${soundName}.${extension}`);
          // Если WAV не воспроизвелся, пробуем MP3
          if (extension === 'wav') {
            // Проверяем, является ли элемент частью DOM перед удалением
            if (document.body.contains(soundElement)) {
              document.body.removeChild(soundElement);
            }
            tryPlaySound('mp3');
          }
          return;
        }
        
        soundElement.src = possibleFileNames[index];
        soundElement.preload = 'auto';
        document.body.appendChild(soundElement);
        
        // Устанавливаем громкость с учетом дополнительного множителя
        soundElement.volume = (settings.volume / 100) * volumeMultiplier;
        
        // Воспроизводим звук
        soundElement.play().catch(e => {
          console.error(`Ошибка воспроизведения звука ${extension} (${possibleFileNames[index]}):`, e);
          // Если не удалось воспроизвести текущий вариант, пробуем следующий
          // Проверяем, является ли элемент частью DOM перед удалением
          if (document.body.contains(soundElement)) {
            document.body.removeChild(soundElement);
          }
          checkAndPlay(index + 1);
        });
      };
      
      // Начинаем с первого варианта
      checkAndPlay(0);
    };
    
    // Начинаем с WAV формата
    tryPlaySound('wav');
  } else {
    // Для существующего элемента просто воспроизводим
    // Устанавливаем громкость с учетом дополнительного множителя
    soundElement.volume = (settings.volume / 100) * volumeMultiplier;
    
    // Воспроизводим звук
    soundElement.currentTime = 0;
    soundElement.play().catch(e => console.error('Ошибка воспроизведения звука:', e));
  }
}

/**
 * Осветляет цвет в формате HEX на указанное количество процентов
 * @param {string} color - Цвет в формате HEX
 * @param {number} percent - Процент осветления (0-100)
 * @returns {string} - Осветленный цвет в формате HEX
 */
function lightenColor(color, percent) {
  // Убираем # из начала строки если он есть
  color = color.replace(/^#/, '');
  
  // Преобразуем HEX в RGB
  let r = parseInt(color.substring(0, 2), 16);
  let g = parseInt(color.substring(2, 4), 16);
  let b = parseInt(color.substring(4, 6), 16);
  
  // Осветляем каждый канал
  r = Math.min(255, Math.round(r + (255 - r) * (percent / 100)));
  g = Math.min(255, Math.round(g + (255 - g) * (percent / 100)));
  b = Math.min(255, Math.round(b + (255 - b) * (percent / 100)));
  
  // Преобразуем обратно в HEX
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Затемняет цвет в формате HEX на указанное количество процентов
 * @param {string} color - Цвет в формате HEX
 * @param {number} percent - Процент затемнения (0-100)
 * @returns {string} - Затемненный цвет в формате HEX
 */
function darkenColor(color, percent) {
  // Убираем # из начала строки если он есть
  color = color.replace(/^#/, '');
  
  // Преобразуем HEX в RGB
  let r = parseInt(color.substring(0, 2), 16);
  let g = parseInt(color.substring(2, 4), 16);
  let b = parseInt(color.substring(4, 6), 16);
  
  // Затемняем каждый канал
  r = Math.max(0, Math.round(r * (1 - percent / 100)));
  g = Math.max(0, Math.round(g * (1 - percent / 100)));
  b = Math.max(0, Math.round(b * (1 - percent / 100)));
  
  // Преобразуем обратно в HEX
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Получает массив с предустановленными цветами акцента
 * @returns {Array} - Массив объектов с названием и значением цвета
 */
function getAccentColors() {
  return [
    { name: 'Песочный', value: '#BCB88A' },
    { name: 'Голубой', value: '#61A0AF' },
    { name: 'Мятный', value: '#7FC6A4' },
    { name: 'Лавандовый', value: '#A292D9' },
    { name: 'Коралловый', value: '#FF7F6B' },
    { name: 'Тыквенный', value: '#E8871E' },
    { name: 'Вишневый', value: '#9E3344' },
    { name: 'Изумрудный', value: '#168F73' },
    { name: 'Сиреневый', value: '#9370DB' },
    { name: 'Морской', value: '#076FA1' }
  ];
}

/**
 * Получает массив с информацией о доступных темах
 * @returns {Array} - Массив объектов с информацией о темах
 */
function getAvailableThemes() {
  return [
    {
      id: 'default',
      name: 'Стандартная',
      description: 'Классический светлый дизайн интерфейса'
    },
    {
      id: 'dark',
      name: 'Темная',
      description: 'Темный интерфейс, снижающий нагрузку на глаза'
    },
    {
      id: 'contrast',
      name: 'Контрастная',
      description: 'Повышенная контрастность для лучшей читаемости'
    },
    {
      id: 'elegant',
      name: 'Элегантная',
      description: 'Утонченный дизайн с изящными деталями'
    },
    {
      id: 'nature',
      name: 'Природная',
      description: 'Натуральные оттенки и органичные формы'
    },
    {
      id: 'neon',
      name: 'Неоновая',
      description: 'Яркие цвета в стиле киберпанк'
    },
    {
      id: 'pastel',
      name: 'Пастельная',
      description: 'Нежные приглушенные оттенки'
    },
    {
      id: 'vintage',
      name: 'Винтажная',
      description: 'Дизайн в ретро-стиле с эффектом старины'
    },
    {
      id: 'tech',
      name: 'Технологичная',
      description: 'Минималистичный интерфейс в стиле хай-тек'
    }
  ];
}


 //Функция для загрузки и применения настроек сайта из Flask-сервера
async function loadAndApplySettings() {
  console.log('settings:1118 Начало загрузки настроек...');
  try {
    // Попытка получить настройки с разных URL
    const urls = [
      '/api/settings',  // Относительный путь
      'http://localhost:5000/api/settings'  // Абсолютный путь к серверу Flask
    ];
    
    let settingsData = null;
    let successUrl = '';
    
    // Пробуем каждый URL по очереди
    for (const url of urls) {
      try {
        const response = await fetch(url);
        console.log(`settings:1121 Статус ответа от ${url}: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const responseText = await response.text();
          console.log(`settings:1128 Получен ответ от сервера: ${responseText.substring(0, 100)}...`);
          settingsData = JSON.parse(responseText);
          console.log('settings:1133 JSON успешно распарсен');
          successUrl = url;
          break;
        }
      } catch (err) {
        console.log(`settings:1138 Ошибка при загрузке с ${url}: ${err.message}`);
      }
    }
    
    // Если удалось получить настройки
    if (settingsData) {
      console.log('settings:1141 Полученные настройки:', settingsData);
      
      // Применяем фавиконку
      if (settingsData.site_favicon) {
        // Формируем URL для фавиконки
        let faviconUrl = settingsData.site_favicon;
        if (!faviconUrl.startsWith('http') && !faviconUrl.startsWith('/')) {
          faviconUrl = '/' + faviconUrl;
        }
        
        // Если URL относительный, сделаем его абсолютным относительно Flask-сервера
        if (faviconUrl.startsWith('/uploads/') && successUrl.includes('localhost:5000')) {
          faviconUrl = 'http://localhost:5000' + faviconUrl;
          console.log('settings:1534 Преобразован URL фавиконки:', faviconUrl);
        }
        
        // Удаляем существующие теги favicon
        const existingIcons = document.querySelectorAll('link[rel="icon"]');
        existingIcons.forEach(icon => icon.remove());
        
        // Создаем новый тег favicon и добавляем его в head
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = faviconUrl;
        link.type = 'image/x-icon';  // Или другой тип в зависимости от расширения файла
        document.head.appendChild(link);
        console.log('settings:1546 Фавиконка успешно применена:', faviconUrl);
      } else {
        console.log('settings:1548 Не удалось получить favicon из настроек');
      }
      
      // Применяем название сайта
      if (settingsData.site_name) {
        // Обновляем заголовок страницы
        document.title = settingsData.site_name;
        console.log('settings:1554 Название сайта обновлено:', settingsData.site_name);
        
        // Обновляем логотипы на странице
        const logoElements = document.querySelectorAll('.top-cloud__logo, .header__logo, .auth-modal__logo, .footer__company-name');
        logoElements.forEach(element => {
          element.textContent = settingsData.site_name;
          console.log('settings:1559 Логотип обновлен:', element);
        });
      }
      
      // Обрабатываем телефон
      const phoneElements = document.querySelectorAll('.footer__phone');
      if (settingsData.contact_phone && settingsData.contact_phone.trim() !== '') {
        phoneElements.forEach(element => {
          element.style.display = '';
          const phoneLink = element.querySelector('a');
          if (phoneLink) {
            phoneLink.href = `tel:${settingsData.contact_phone.replace(/\D/g, '')}`;
            phoneLink.textContent = settingsData.contact_phone;
          } else {
            element.innerHTML = `Телефон: ${settingsData.contact_phone}`;
          }
        });
        console.log('settings:1575 Контактный телефон обновлен:', settingsData.contact_phone);
      } else {
        phoneElements.forEach(element => {
          element.style.display = 'none';
        });
        console.log('settings:1683 Телефон не указан, скрываем элементы');
      }
      
      // Обрабатываем email
      const emailElements = document.querySelectorAll('.footer__email');
      if (settingsData.contact_email && settingsData.contact_email.trim() !== '') {
        emailElements.forEach(element => {
          element.style.display = '';
          const emailLink = element.querySelector('a');
          if (emailLink) {
            emailLink.href = `mailto:${settingsData.contact_email}`;
            emailLink.textContent = settingsData.contact_email;
          } else {
            element.innerHTML = `Email: ${settingsData.contact_email}`;
          }
        });
        console.log('settings:1698 Контактный email обновлен:', settingsData.contact_email);
      } else {
        emailElements.forEach(element => {
          element.style.display = 'none';
        });
        console.log('settings:1702 Email не указан, скрываем элементы');
      }
      
      // Обрабатываем адрес
      const addressElements = document.querySelectorAll('.footer__address');
      if (settingsData.address && settingsData.address.trim() !== '') {
        addressElements.forEach(element => {
          element.style.display = '';
          const addressLink = element.querySelector('a');
          if (addressLink) {
            addressLink.href = `https://maps.google.com/maps?q=${encodeURIComponent(settingsData.address)}`;
            addressLink.textContent = settingsData.address;
          } else {
            element.innerHTML = `Адрес: ${settingsData.address}`;
          }
        });
        
        // Также обновляем обычные ссылки на карту
        const mapLinks = document.querySelectorAll('a[href^="https://maps.google.com"]');
        mapLinks.forEach(link => {
          link.href = `https://maps.google.com/maps?q=${encodeURIComponent(settingsData.address)}`;
          if (!link.querySelector('i')) {
            link.textContent = settingsData.address;
          }
        });
        
        console.log('settings:1724 Адрес обновлен:', settingsData.address);
      } else {
        addressElements.forEach(element => {
          element.style.display = 'none';
        });
        console.log('settings:1728 Адрес не указан, скрываем элементы');
      }
      
      // Обрабатываем режим работы
      const hoursElements = document.querySelectorAll('.footer__hours');
      if (settingsData.working_hours && settingsData.working_hours.trim() !== '') {
        hoursElements.forEach(element => {
          element.style.display = '';
          if (element.tagName.toLowerCase() === 'p') {
            element.innerHTML = `Режим работы: ${settingsData.working_hours}`;
          } else {
            element.textContent = settingsData.working_hours;
          }
        });
        console.log('settings:1742 Режим работы обновлен:', settingsData.working_hours);
      } else {
        hoursElements.forEach(element => {
          element.style.display = 'none';
        });
        console.log('settings:1746 Режим работы не указан, скрываем элементы');
      }
      
      // Обновляем ссылки на соцсети
      const socialLinks = {
        'instagram': settingsData.social_instagram,
        'facebook': settingsData.social_facebook,
        'twitter': settingsData.social_twitter,
        'youtube': settingsData.social_youtube,
        'telegram': settingsData.social_telegram,
        'whatsapp': settingsData.social_whatsapp
      };
      
      // Сначала скроем все иконки соцсетей
      const allSocialLinks = document.querySelectorAll('.footer__social-link, a[aria-label^="Instagram"], a[aria-label^="Facebook"], a[aria-label^="Twitter"], a[aria-label^="YouTube"], a[aria-label^="Telegram"], a[aria-label^="WhatsApp"]');
      allSocialLinks.forEach(link => {
        link.style.display = 'none'; // По умолчанию скрываем все
      });
      
      // Показываем и обновляем только те соцсети, для которых указаны URL
      for (const [platform, url] of Object.entries(socialLinks)) {
        if (url && url.trim() !== '') {
          // Показываем и обновляем ссылки соответствующие текущей платформе
          const socialLinks = document.querySelectorAll(`.footer__social-${platform}`);
          socialLinks.forEach(link => {
            link.href = url;
            link.style.display = ''; // Показываем ссылку
            console.log(`settings:1774 Ссылка на ${platform} обновлена:`, url);
          });
          
          // Для совместимости ищем также по старым селекторам
          const oldIconElements = document.querySelectorAll(`.fab.fa-${platform}`);
          oldIconElements.forEach(icon => {
            const parentLink = icon.closest('a');
            if (parentLink && !parentLink.classList.contains(`footer__social-${platform}`)) {
              parentLink.href = url;
              parentLink.style.display = ''; // Показываем ссылку
            }
          });
          
          // Также проверяем элементы по aria-label
          const ariaLinks = document.querySelectorAll(`a[aria-label^="${platform.charAt(0).toUpperCase() + platform.slice(1)}"]`);
          ariaLinks.forEach(link => {
            link.href = url;
            link.style.display = ''; // Показываем ссылку
          });
        } else {
          console.log(`settings:1794 Соцсеть ${platform} не имеет URL - скрываем иконку`);
        }
      }
      
      // Проверяем, есть ли видимые соцсети
      const visibleSocialLinks = document.querySelectorAll('.footer__social-link:not([style*="display: none"]), a[aria-label^="Instagram"]:not([style*="display: none"]), a[aria-label^="Facebook"]:not([style*="display: none"]), a[aria-label^="Twitter"]:not([style*="display: none"]), a[aria-label^="YouTube"]:not([style*="display: none"]), a[aria-label^="Telegram"]:not([style*="display: none"]), a[aria-label^="WhatsApp"]:not([style*="display: none"])');
      
      // Если нет видимых соцсетей, скрываем весь блок соцсетей
      if (visibleSocialLinks.length === 0) {
        // Ищем секции с соцсетями
        const socialSections = document.querySelectorAll('.footer__social');
        socialSections.forEach(section => {
          section.style.display = 'none';
          console.log('settings:1806 Все соцсети скрыты, скрываем блок footer__social');
        });
        
        // Находим секции, которые содержат иконки соцсетей
        document.querySelectorAll('.footer__social-icons').forEach(iconsBlock => {
          const parentSection = iconsBlock.closest('.footer__section');
          if (parentSection) {
            parentSection.style.display = 'none';
            console.log('settings:1814 Все соцсети скрыты, скрываем родительскую секцию');
          }
        });
      } else {
        // Если есть видимые соцсети, показываем блок
        const socialSections = document.querySelectorAll('.footer__social');
        socialSections.forEach(section => {
          section.style.display = '';
          console.log('settings:1822 Есть видимые соцсети, показываем блок footer__social');
        });
        
        // Находим секции, которые содержат иконки соцсетей
        document.querySelectorAll('.footer__social-icons').forEach(iconsBlock => {
          const parentSection = iconsBlock.closest('.footer__section');
          if (parentSection) {
            parentSection.style.display = '';
            console.log('settings:1830 Есть видимые соцсети, показываем родительскую секцию');
          }
        });
      }
      
      // Проверяем, есть ли видимые контакты
      const visibleContacts = document.querySelectorAll('.footer__contact:not([style*="display: none"])');
      // Если нет видимых контактов, скрываем весь блок контактов
      const contactSections = document.querySelectorAll('.footer__contacts, .footer__section:first-child');
      
      if (visibleContacts.length === 0) {
        contactSections.forEach(section => {
          section.style.display = 'none';
          console.log('settings:1756 Нет видимых контактов, скрываем блок контактов');
        });
      } else {
        contactSections.forEach(section => {
          section.style.display = '';
          console.log('settings:1760 Есть видимые контакты, показываем блок контактов');
        });
      }
      
      // В конце функции, перед вызовом toggleDeliveryBlocks, добавляем проверку:
      // Проверяем, существует ли функция toggleDeliveryBlocks в глобальном контексте
      if (typeof window.toggleDeliveryBlocks === 'function') {
        // Функция существует, вызываем ее
        window.toggleDeliveryBlocks();
      } else if (typeof toggleDeliveryBlocks === 'function') {
        // Пробуем вызвать без window, если функция доступна
        toggleDeliveryBlocks();
      } else {
        // Функция не существует, пропускаем вызов
        console.log('settings:1360 Функция toggleDeliveryBlocks не найдена в глобальном контексте');
      }
      
      console.log('settings:1364 Все настройки успешно применены');
    } else {
      console.log('settings:1366 Не удалось получить настройки');
    }
  } catch (error) {
    console.error('settings:1364 Ошибка при загрузке настроек:', error);
  }
}

// Запускаем загрузку настроек при загрузке страницы
document.addEventListener('DOMContentLoaded', loadAndApplySettings);

/**
 * Инициализация модуля настроек как глобального объекта
 */
(function() {
  // Создаем глобальный объект для модуля настроек
  window.settingsModule = {
    // Экспортируем функции модуля
    showSettingsModal,
    applySettings,
    loadSettings,
    saveSettings,
    playSound,
    closeSettingsModal,
    getAvailablePaymentMethods,
    getAvailableDeliveryMethods,
    toggleDeliveryBlocks,
    initSettings // Экспортируем initSettings
  };
  
  // Инициализируем настройки при загрузке страницы
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Модуль настроек загружен');
    
    // Удаляем старый хак для кнопки сохранения, он больше не нужен
    
    initSettings();
    
    // Добавляем обработчики для существующих элементов
    const settingsButtons = document.querySelectorAll('[data-action="settings"]');
    settingsButtons.forEach(button => {
      button.addEventListener('click', showSettingsModal);
    });
  });
})();

/**
 * Получение доступных методов оплаты
 * @returns {Array} Массив методов оплаты
 */
function getAvailablePaymentMethods() {
  // Возвращаем статические методы оплаты
  return window.STATIC_PAYMENT_METHODS || [
    { value: 'card', label: 'Банковская карта' },
    { value: 'cash', label: 'Наличными при получении' },
    { value: 'online', label: 'Онлайн-оплата' }
  ];
}

/**
 * Получение доступных методов доставки
 * @returns {Array} Массив методов доставки
 */
function getAvailableDeliveryMethods() {
  // Возвращаем статические методы доставки
  return window.STATIC_DELIVERY_METHODS || [
    { value: 'courier', label: 'Курьер' },
    { value: 'pickup', label: 'Самовывоз' },
    { value: 'post', label: 'Почта' }
  ];
}

function toggleDeliveryBlocks() {
  // Эта функция больше не нужна, так как методы оплаты и доставки теперь статичные
}

// Экспортируем функцию в глобальный контекст для совместимости
window.toggleDeliveryBlocks = toggleDeliveryBlocks; 