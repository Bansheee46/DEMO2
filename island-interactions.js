// Скрипт для интерактивности элемента island
document.addEventListener('DOMContentLoaded', function() {
  const island = document.querySelector('.island');
  
  if (!island) return;
  
  // Добавляем элемент свечения
  const glow = document.createElement('div');
  glow.classList.add('island__glow');
  island.appendChild(glow);
  
  // Обработка движения мыши над island
  island.addEventListener('mousemove', function(e) {
    // Вычисляем относительное положение курсора внутри island
    const rect = island.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Применяем положение курсора к градиенту через CSS переменные
    island.style.setProperty('--x', `${x}%`);
    island.style.setProperty('--y', `${y}%`);
  });
  
  // Добавляем эффект пульсации при клике на island
  island.addEventListener('click', function(e) {
    // Не добавляем эффект, если клик был на кнопке внутри острова
    if (e.target !== island && !e.target.classList.contains('island__actions')) return;
    
    // Добавляем класс для анимации пульсации
    island.classList.add('pulse');
    
    // Создаем эффект ряби при клике
    const ripple = document.createElement('div');
    ripple.classList.add('island__ripple');
    
    // Позиционируем эффект ряби в точке клика
    const rect = island.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    island.appendChild(ripple);
    
    // Удаляем эффект ряби и класс пульсации после завершения анимации
    setTimeout(() => {
      ripple.remove();
      island.classList.remove('pulse');
    }, 600);
  });
  
  // Обработка нажатий на категории
  const categoryButtons = document.querySelectorAll('.island__category');
  categoryButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Добавляем класс для анимации клика
      this.classList.add('clicked');
      
      // Удаляем класс после завершения анимации
      setTimeout(() => {
        this.classList.remove('clicked');
      }, 400);
    });
  });
  
  // Добавляем интерактивность для поисковой строки и иконки корзины
  const searchBar = island.querySelector('.search-bar');
  const cartIcon = island.querySelector('.cart-icon');
  
  if (searchBar) {
    searchBar.addEventListener('click', function(e) {
      // Предотвращаем срабатывание эффекта пульсации острова
      e.stopPropagation();
      
      // Создаем эффект ряби на поисковой строке
      const ripple = document.createElement('div');
      ripple.classList.add('island__ripple');
      
      const rect = searchBar.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      searchBar.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  }
  
  if (cartIcon) {
    cartIcon.addEventListener('click', function(e) {
      // Предотвращаем срабатывание эффекта пульсации острова
      e.stopPropagation();
      
      // Добавляем мягкую анимацию нажатия на иконку корзины
      this.style.transform = 'scale(1.2)';
      
      setTimeout(() => {
        this.style.transform = '';
      }, 300);
    });
  }

  /* === Логика неактивности (взаимодействие с островом) === */
  let inactivityTimer;

  // Функция для деактивации острова
  const setIslandInactive = () => {
    if (island) {
      island.classList.add('island--inactive');
    }
  };

  // Функция для активации острова и сброса таймера
  const makeIslandActive = () => {
    if (island) {
      island.classList.remove('island--inactive');
    }
    clearTimeout(inactivityTimer);
  };
  
  // Функция для запуска таймера неактивности
  const startInactivityTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(setIslandInactive, 5000); // 5 секунд
  };

  // События, указывающие на активность на острове
  island.addEventListener('mouseenter', makeIslandActive);
  island.addEventListener('focusin', makeIslandActive); // Для доступности с клавиатуры
  island.addEventListener('touchstart', makeIslandActive, { passive: true });

  // События, указывающие на уход с острова
  island.addEventListener('mouseleave', startInactivityTimer);
  island.addEventListener('focusout', startInactivityTimer); // Для доступности с клавиатуры

  // Изначально запускаем таймер, чтобы остров стал неактивным
  startInactivityTimer();
}); 