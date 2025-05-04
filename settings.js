/**
 * Модуль управления настройками приложения Chern2
 * Версия 1.0
 */

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
  accentColor: '#BCB88A' // цвет акцента для активных элементов
};

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
  settingsModal.setAttribute('aria-hidden', 'false');
  
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
          <button class="modal-settings__save">
            <i class="fas fa-save"></i> Сохранить
          </button>
          <button class="modal-settings__close">
            <i class="fas fa-times"></i> Отмена
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
  const saveButton = settingsModal.querySelector('.modal-settings__save');
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
      // Воспроизведение звука переключения
      playSound('switch');
    });
  });
  
  // Обработчик для слайдера громкости
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
  
  // Обработчик для сохранения настроек
  if (saveButton) {
    saveButton.addEventListener('click', (event) => {
      // Предотвращаем всплытие события, чтобы клик не регистрировался в родительских элементах
      event.preventDefault();
      event.stopPropagation();
      
      // Сбор настроек из интерфейса
      const newSettings = { ...currentSettings };
      
      // Проверяем изменения темы
      const isDarkModeNow = settingsModal.querySelector('[data-action="toggle-theme"]').classList.contains('active');
      
      // Принудительно устанавливаем значение, даже если оно не изменилось
      // Это гарантирует применение изменений темы
      newSettings.isDarkMode = isDarkModeNow;
      
      // Обработка остальных переключателей
      newSettings.isAnimated = settingsModal.querySelector('[data-action="toggle-animations"]').classList.contains('active');
      newSettings.isSoundEnabled = settingsModal.querySelector('[data-action="toggle-sound"]').classList.contains('active');
      newSettings.notificationsEnabled = settingsModal.querySelector('[data-action="toggle-notifications"]').classList.contains('active');
      
      // Новые настройки
      newSettings.fullAnimations = settingsModal.querySelector('[data-action="toggle-full-animations"]').classList.contains('active');
      newSettings.lowResourceMode = settingsModal.querySelector('[data-action="toggle-low-resource"]').classList.contains('active');
      newSettings.analyticsEnabled = settingsModal.querySelector('[data-action="toggle-analytics"]').classList.contains('active');
      newSettings.autoCleanSession = settingsModal.querySelector('[data-action="toggle-auto-clean"]').classList.contains('active');
      
      // Обработка слайдера громкости
      newSettings.volume = parseInt(volumeSlider?.value || currentSettings.volume);
      
      // Обработка выпадающих списков
      const durationSelect = settingsModal.querySelector('select[data-action="notification-duration"]');
      newSettings.notificationDuration = parseInt(durationSelect?.value || currentSettings.notificationDuration);
      
      const fontSizeSelect = settingsModal.querySelector('select[data-action="font-size"]');
      newSettings.fontSize = fontSizeSelect?.value || currentSettings.fontSize;
      
      const cacheSizeSelect = settingsModal.querySelector('select[data-action="cache-size"]');
      newSettings.cacheSize = cacheSizeSelect?.value || currentSettings.cacheSize;
      
      // Настройки тем
      const themeSelect = settingsModal.querySelector('select[data-action="theme"]');
      newSettings.theme = themeSelect?.value || currentSettings.theme;
      
      // Получаем выбранный цвет акцента
      const activeColorOption = settingsModal.querySelector('.color-option.active');
      if (activeColorOption) {
        newSettings.accentColor = activeColorOption.dataset.color || currentSettings.accentColor;
      }
      
      // Сохраняем настройки
      if (saveSettings(newSettings)) {
        // Принудительно применяем настройки, независимо от того, изменились ли они
        applySettings(newSettings);
        
        // Дополнительная проверка применения темной темы
        if (newSettings.isDarkMode) {
          document.body.setAttribute('data-theme', 'dark');
          document.documentElement.setAttribute('data-theme', 'dark');
          document.body.classList.add('dark');
          document.body.classList.remove('light');
        } else {
          document.body.setAttribute('data-theme', 'light');
          document.documentElement.setAttribute('data-theme', 'light');
          document.body.classList.remove('dark');
          document.body.classList.add('light');
        }
        
        // Уведомление об успешном сохранении
        showNotification('Настройки сохранены', 'success');
        
        // Воспроизведение звука успеха
        playSound('success');
        
        // Явно убеждаемся, что модальное окно закроется
        setTimeout(() => {
          closeSettingsModal(settingsModal);
        }, 100);
      } else {
        // Уведомление об ошибке
        showNotification('Не удалось сохранить настройки', 'error');
        
        // Воспроизведение звука ошибки
        playSound('error');
      }
    });
  }
  
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
      
      // Гарантируем, что кнопка сохранения будет доступна
      if (saveButton) {
        // Явно убеждаемся, что кнопка сохранения видима и активна
        saveButton.style.display = 'flex';
        saveButton.style.pointerEvents = 'auto';
        saveButton.style.opacity = '1';
        
        // Прокручиваем к кнопке сохранения для маленьких экранов
        setTimeout(() => {
          saveButton.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
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
  
  // Установим явный флаг, что модальное окно закрывается
  modalElement.setAttribute('aria-hidden', 'true');
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
 * Воспроизведение звукового эффекта
 * @param {string} soundName Имя звукового эффекта
 */
function playSound(soundName) {
  // Проверяем, включены ли звуки
  const settings = loadSettings();
  if (!settings.isSoundEnabled) return;
  
  // Находим или создаем аудио элемент
  let soundElement = document.getElementById(`sound-${soundName}`);
  
  if (!soundElement) {
    soundElement = document.createElement('audio');
    soundElement.id = `sound-${soundName}`;
    
    // Сначала пробуем загрузить WAV, а если не удалось - пробуем MP3
    const tryPlaySound = (extension) => {
      soundElement.src = `sounds/${soundName}.${extension}`;
      soundElement.preload = 'auto';
      document.body.appendChild(soundElement);
      
      // Устанавливаем громкость
      soundElement.volume = settings.volume / 100;
      
      // Воспроизводим звук
      soundElement.play().catch(e => {
        console.error(`Ошибка воспроизведения звука ${extension}:`, e);
        
        // Если WAV не воспроизвелся, пробуем MP3
        if (extension === 'wav') {
          document.body.removeChild(soundElement);
          tryPlaySound('mp3');
        }
      });
    };
    
    // Начинаем с WAV формата
    tryPlaySound('wav');
  } else {
    // Для существующего элемента просто воспроизводим
    // Устанавливаем громкость
    soundElement.volume = settings.volume / 100;
    
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
    closeSettingsModal
  };
  
  // Инициализируем настройки при загрузке страницы
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Модуль настроек загружен');
    
    // Хак для гарантии работы кнопки сохранения
    // Добавляем глобальный обработчик для проверки и исправления кнопки сохранения
    const checkSaveButton = function() {
      const saveButton = document.querySelector('.modal-settings__save');
      if (saveButton) {
        // Проверяем, кликабельна ли кнопка
        const style = window.getComputedStyle(saveButton);
        if (style.pointerEvents === 'none' || style.opacity !== '1' || style.visibility !== 'visible') {
          console.log('Восстанавливаем кнопку сохранения...');
          // Принудительно делаем кнопку видимой и кликабельной
          saveButton.style.pointerEvents = 'auto';
          saveButton.style.opacity = '1';
          saveButton.style.visibility = 'visible';
          saveButton.style.display = 'flex';
          saveButton.style.position = 'relative';
          saveButton.style.zIndex = '20';
        }
      }
    };
    
    // Проверяем каждую секунду, пока окно настроек открыто
    let saveButtonInterval;
    
    // Модифицируем функцию showSettingsModal, чтобы добавить интервал
    const originalShowSettingsModal = window.settingsModule.showSettingsModal;
    window.settingsModule.showSettingsModal = function() {
      // Вызываем оригинальную функцию
      originalShowSettingsModal.apply(this, arguments);
      
      // Запускаем интервал проверки
      saveButtonInterval = setInterval(checkSaveButton, 1000);
      
      // Также добавим проверку через 500мс после открытия,
      // чтобы быстро восстановить кнопку, если она не активна
      setTimeout(checkSaveButton, 500);
    };
    
    // Модифицируем функцию closeSettingsModal, чтобы удалить интервал
    const originalCloseSettingsModal = window.settingsModule.closeSettingsModal;
    window.settingsModule.closeSettingsModal = function() {
      // Останавливаем интервал
      if (saveButtonInterval) {
        clearInterval(saveButtonInterval);
        saveButtonInterval = null;
      }
      
      // Вызываем оригинальную функцию
      originalCloseSettingsModal.apply(this, arguments);
    };
    
    initSettings();
    
    // Добавляем обработчики для существующих элементов
    const settingsButtons = document.querySelectorAll('[data-action="settings"]');
    settingsButtons.forEach(button => {
      button.addEventListener('click', showSettingsModal);
    });
  });
})(); 