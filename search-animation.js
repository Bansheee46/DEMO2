// Скрипт для плавной анимации поля поиска
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.querySelector('.search-bar__input');
  const searchBar = document.querySelector('.search-bar');
  const island = document.querySelector('.island');
  const searchOptionItems = document.querySelectorAll('.search-option');
  const searchOptionsContainer = document.querySelector('.search-options-container');
  
  // Функция для проверки видимости элемента в окне просмотра
  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
  
  // Функция для анимации появления кнопок поиска
  function animateSearchOptions() {
    if (!searchOptionsContainer) return;
    
    searchOptionItems.forEach((option, index) => {
      // Добавляем небольшую задержку для каждой кнопки
      setTimeout(() => {
        option.style.opacity = '0';
        option.style.transform = 'translateY(20px)';
        
        // Анимируем появление
        setTimeout(() => {
          option.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
          option.style.opacity = '1';
          option.style.transform = 'translateY(0)';
        }, 50);
      }, index * 100);
    });
  }
  
  // Вызываем анимацию при загрузке страницы
  animateSearchOptions();
  
  if (searchInput && searchBar && island) {
    // Добавляем обработчики событий для фокуса и потери фокуса
    searchInput.addEventListener('focus', function() {
      // Добавляем класс для анимации
      searchBar.classList.add('search-bar--expanded');
      island.classList.add('island--search-expanded');
      
      // Запускаем анимацию через CSS-переменные
      document.documentElement.style.setProperty('--search-animation', 'running');
      searchInput.style.setProperty('--search-width', '250px');
    });
    
    searchInput.addEventListener('blur', function() {
      // Если поле не пустое, не сворачиваем поиск
      if (this.value.trim() !== '') {
        return;
      }
      
      // Удаляем класс для анимации
      searchBar.classList.remove('search-bar--expanded');
      island.classList.remove('island--search-expanded');
      
      // Запускаем анимацию через CSS-переменные
      document.documentElement.style.setProperty('--search-animation', 'running');
      searchInput.style.setProperty('--search-width', '200px');
    });
    
    // Обработчики для кнопок поиска
    if (searchOptionItems && searchOptionItems.length > 0) {
      let activeOption = null;
      
      searchOptionItems.forEach(option => {
        option.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          // Удаляем активный класс у всех кнопок
          searchOptionItems.forEach(opt => opt.classList.remove('option-active'));
          
          // Добавляем активный класс текущей кнопке
          this.classList.add('option-active');
          activeOption = this;
          
          // Получаем тип поиска из атрибута
          const searchType = this.getAttribute('data-search-type');
          const currentValue = searchInput.value.trim().replace(/^(название:|артикул:|категория:)\s*/, '');
          
          // Устанавливаем префикс в зависимости от типа поиска
          switch (searchType) {
            case 'name':
              searchInput.value = `название: ${currentValue}`;
              searchInput.setAttribute('placeholder', 'Поиск по названию...');
              break;
            case 'sku':
              searchInput.value = `артикул: ${currentValue}`;
              searchInput.setAttribute('placeholder', 'Поиск по артикулу...');
              break;
            case 'category':
              searchInput.value = `категория: ${currentValue}`;
              searchInput.setAttribute('placeholder', 'Поиск по категории...');
              break;
          }
          
          // Добавляем эффект пульсации
          this.classList.add('pulse-effect');
          setTimeout(() => {
            this.classList.remove('pulse-effect');
          }, 500);
          
          // Фокусируемся на поле ввода
          searchInput.focus();
          
          // Запускаем поиск
          const event = new Event('input', { bubbles: true });
          searchInput.dispatchEvent(event);
        });
      });
    }
    
    // Добавляем прямой обработчик поиска
    searchInput.addEventListener('input', function() {
      // Проверяем наличие глобальной функции handleSearchInput
      if (typeof window.handleSearchInput === 'function') {
        window.handleSearchInput.call(this);
      } else {
        // Простая реализация поиска
        const query = this.value.trim().toLowerCase();
        if (query.length === 0) {
          // Показываем все товары
          document.querySelectorAll('.product-card').forEach(card => {
            card.style.display = '';
          });
          return;
        }
        
        // Определяем тип поиска
        let searchType = 'all';
        let searchQuery = query;
        
        if (query.startsWith('название:')) {
          searchType = 'name';
          searchQuery = query.replace('название:', '').trim();
          
          // Активируем соответствующую кнопку, если она еще не активна
          const nameOption = document.querySelector('.search-option[data-search-type="name"]');
          if (nameOption && !nameOption.classList.contains('option-active')) {
            document.querySelectorAll('.search-option').forEach(opt => opt.classList.remove('option-active'));
            nameOption.classList.add('option-active');
          }
        } else if (query.startsWith('артикул:')) {
          searchType = 'sku';
          searchQuery = query.replace('артикул:', '').trim();
          
          // Активируем соответствующую кнопку, если она еще не активна
          const skuOption = document.querySelector('.search-option[data-search-type="sku"]');
          if (skuOption && !skuOption.classList.contains('option-active')) {
            document.querySelectorAll('.search-option').forEach(opt => opt.classList.remove('option-active'));
            skuOption.classList.add('option-active');
          }
        } else if (query.startsWith('категория:')) {
          searchType = 'category';
          searchQuery = query.replace('категория:', '').trim();
          
          // Активируем соответствующую кнопку, если она еще не активна
          const categoryOption = document.querySelector('.search-option[data-search-type="category"]');
          if (categoryOption && !categoryOption.classList.contains('option-active')) {
            document.querySelectorAll('.search-option').forEach(opt => opt.classList.remove('option-active'));
            categoryOption.classList.add('option-active');
          }
        }
        
        // Скрываем все товары
        document.querySelectorAll('.product-card').forEach(card => {
          card.style.display = 'none';
        });
        
        // Показываем только те, которые соответствуют запросу
        let visibleCount = 0;
        document.querySelectorAll('.product-card').forEach(card => {
          let match = false;
          
          if (searchType === 'name') {
            const titleElement = card.querySelector('.product-card__title');
            if (titleElement && titleElement.textContent.toLowerCase().includes(searchQuery)) {
              match = true;
            }
          } else if (searchType === 'sku') {
            const skuElement = card.querySelector('.product-card__sku');
            if (skuElement && skuElement.textContent.toLowerCase().includes(searchQuery)) {
              match = true;
            }
          } else if (searchType === 'category') {
            const category = card.getAttribute('data-category');
            if (category && category.toLowerCase().includes(searchQuery)) {
              match = true;
            }
          } else {
            // Поиск по всем полям
            const cardText = card.textContent.toLowerCase();
            if (cardText.includes(searchQuery)) {
              match = true;
            }
          }
          
          if (match) {
            card.style.display = '';
            card.classList.add('search-highlight');
            setTimeout(() => {
              card.classList.remove('search-highlight');
            }, 1500);
            visibleCount++;
          }
        });
      }
    });
    
    // Закрываем опции поиска при клике вне поля поиска
    document.addEventListener('click', function(e) {
      if (!searchBar.contains(e.target)) {
        searchInput.blur();
      }
    });
  }
}); 