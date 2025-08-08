/**
 * Скрипт для синхронизации данных компании в юридических документах
 * Подключается ко всем юридическим документам для автоматической синхронизации
 */
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Проверяем, была ли уже выполнена синхронизация в текущей сессии
    const syncTimestamp = sessionStorage.getItem('company_data_sync_timestamp');
    const currentTime = new Date().getTime();
    
    // Если синхронизация не выполнялась или прошло более 1 часа
    if (!syncTimestamp || (currentTime - parseInt(syncTimestamp)) > 3600000) {
      console.log('Запускаем синхронизацию данных компании...');
      
      // Получаем текущий путь страницы для определения типа документа
      const currentPath = window.location.pathname;
      const filename = currentPath.substring(currentPath.lastIndexOf('/') + 1);
      
      // Определяем тип документа для передачи в API
      let documentType = '';
      if (filename === 'terms-of-use.html') documentType = 'terms';
      else if (filename === 'privacy-policy.html') documentType = 'privacy';
      else if (filename === 'privacy-consent.html') documentType = 'consent';
      else if (filename === 'delivery-payment.html') documentType = 'delivery';
      else if (filename === 'licenses.html') documentType = 'licenses';
      else if (filename === 'warranty-return.html') documentType = 'warranty';
      
      // Вызываем API для синхронизации данных компании
      const response = await fetch('/api/sync-company-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_document: documentType
        })
      });
      
      if (response.ok) {
        console.log('Данные компании успешно синхронизированы');
        // Сохраняем метку времени синхронизации
        sessionStorage.setItem('company_data_sync_timestamp', currentTime.toString());
        
        // Проверяем, был ли обновлен текущий документ
        const result = await response.json();
        if (result.updated_files && result.updated_files.includes(filename)) {
          console.log('Текущий документ был обновлен, перезагружаем страницу');
          // Перезагружаем страницу для отображения обновленных данных
          window.location.reload();
        }
      } else {
        console.error('Ошибка при синхронизации данных компании');
      }
    } else {
      console.log('Синхронизация данных компании пропущена (выполнялась недавно)');
    }
  } catch (error) {
    console.error('Ошибка при синхронизации данных компании:', error);
  }
}); 