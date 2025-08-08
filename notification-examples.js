// Заглушка для notification-examples.js
// Этот файл используется для примеров уведомлений
// Если нужны конкретные примеры, добавьте их здесь

console.log('notification-examples.js загружен');

// Примеры уведомлений (если нужны)
const notificationExamples = {
  success: {
    title: 'Успешно!',
    message: 'Операция выполнена успешно',
    type: 'success',
    duration: 3000
  },
  error: {
    title: 'Ошибка!',
    message: 'Произошла ошибка при выполнении операции',
    type: 'error',
    duration: 5000
  },
  warning: {
    title: 'Внимание!',
    message: 'Обратите внимание на эту информацию',
    type: 'warning',
    duration: 4000
  },
  info: {
    title: 'Информация',
    message: 'Полезная информация для пользователя',
    type: 'info',
    duration: 3000
  }
};

// Экспорт примеров в глобальную область видимости
window.notificationExamples = notificationExamples; 