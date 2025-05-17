// Скрипт для плавной анимации поля поиска
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.querySelector('.search-bar__input');
  const searchBar = document.querySelector('.search-bar');
  const island = document.querySelector('.island');
  
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
      // Удаляем класс для анимации
      searchBar.classList.remove('search-bar--expanded');
      island.classList.remove('island--search-expanded');
      
      // Запускаем анимацию через CSS-переменные
      document.documentElement.style.setProperty('--search-animation', 'running');
      searchInput.style.setProperty('--search-width', '200px');
    });
  }
}); 