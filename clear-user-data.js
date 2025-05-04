

// Функция очистки данных пользователя
function clearUserData() {
  // Удаляем все данные пользователя из localStorage
  localStorage.removeItem('userData');
  localStorage.removeItem('userLoggedIn');
  localStorage.removeItem('userName');
  
  // Очищаем массив зарегистрированных пользователей
  localStorage.setItem('registeredUsers', '[]');
  
  // Обновляем UI если возможно
  const loginButton = document.getElementById('loginButton');
  if (loginButton) {
    loginButton.innerHTML = '<i class="fas fa-user"></i>';
    loginButton.title = 'Войти в аккаунт';
    loginButton.classList.remove('logged-in');
    
    // Если есть функция showUserMenu, удаляем её как обработчик
    if (window.showUserMenu) {
      loginButton.removeEventListener('click', window.showUserMenu);
    }
    
    // Если есть функция showLoginModal, добавляем её как обработчик
    if (window.showLoginModal) {
      loginButton.addEventListener('click', window.showLoginModal);
    }
  }
  
  // Удаляем меню пользователя если оно существует
  const userMenu = document.getElementById('userMenu');
  if (userMenu) {
    userMenu.remove();
  }
  
  // Выводим сообщение
  console.log('✅ Данные пользователя успешно очищены!');
  alert('Данные пользователя успешно очищены!');
  
  // Если на странице есть функция showNotification, используем её
  if (typeof showNotification === 'function') {
    showNotification('Данные пользователя успешно очищены!', 'info');
  }
  
  // Перезагружаем страницу для применения изменений
  if (confirm('Перезагрузить страницу для применения изменений?')) {
    window.location.reload();
  }
}

// Запускаем функцию очистки
clearUserData(); 