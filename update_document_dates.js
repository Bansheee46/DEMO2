/**
 * Скрипт для автоматического обновления дат в юридических документах
 * Запускается из командной строки: node update_document_dates.js
 */

const fetch = require('node-fetch');

// Функция для форматирования даты в формате "DD месяц YYYY"
function formatDateRussian(date) {
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
}

async function updateDocumentDates() {
  console.log('Запуск обновления дат в юридических документах...');
  
  try {
    // Получаем текущие настройки
    console.log('Получение текущих настроек...');
    const settingsResponse = await fetch('http://localhost:5000/api/settings', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!settingsResponse.ok) {
      throw new Error(`Ошибка получения настроек: ${settingsResponse.status} ${settingsResponse.statusText}`);
    }
    
    const settings = await settingsResponse.json();
    console.log('Настройки успешно получены');
    
    // Текущая дата в формате "DD месяц YYYY"
    const currentDate = formatDateRussian(new Date());
    console.log(`Текущая дата: ${currentDate}`);
    
    // Обновляем даты в настройках
    const updatedSettings = {
      ...settings,
      terms_last_update: currentDate,
      privacy_last_update: currentDate,
      consent_last_update: currentDate,
      delivery_last_update: currentDate,
      licenses_last_update: currentDate,
      warranty_last_update: currentDate
    };
    
    // Сохраняем обновленные настройки
    console.log('Сохранение обновленных настроек...');
    const saveResponse = await fetch('http://localhost:5000/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedSettings)
    });
    
    if (!saveResponse.ok) {
      throw new Error(`Ошибка сохранения настроек: ${saveResponse.status} ${saveResponse.statusText}`);
    }
    
    console.log('Настройки успешно сохранены');
    
    // Синхронизируем документы с обновленными датами
    console.log('Синхронизация документов с обновленными датами...');
    const syncResponse = await fetch('http://localhost:5000/api/sync-company-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        document_dates: {
          terms_last_update: currentDate,
          privacy_last_update: currentDate,
          consent_last_update: currentDate,
          delivery_last_update: currentDate,
          licenses_last_update: currentDate,
          warranty_last_update: currentDate
        },
        update_all: true
      })
    });
    
    if (!syncResponse.ok) {
      throw new Error(`Ошибка синхронизации документов: ${syncResponse.status} ${syncResponse.statusText}`);
    }
    
    const result = await syncResponse.json();
    console.log(`Документы успешно синхронизированы. Обновлено файлов: ${result.updated_files.length}`);
    console.log('Обновленные файлы:', result.updated_files);
    
    return {
      success: true,
      message: `Даты в документах успешно обновлены на ${currentDate}. Обновлено файлов: ${result.updated_files.length}`,
      updatedFiles: result.updated_files
    };
  } catch (error) {
    console.error('Ошибка при обновлении дат в документах:', error);
    return {
      success: false,
      message: `Ошибка при обновлении дат в документах: ${error.message}`
    };
  }
}

// Запускаем обновление дат при вызове скрипта напрямую
if (require.main === module) {
  updateDocumentDates()
    .then(result => {
      if (result.success) {
        console.log('✅', result.message);
        process.exit(0);
      } else {
        console.error('❌', result.message);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Критическая ошибка:', error);
      process.exit(1);
    });
} else {
  // Экспортируем функцию для использования в других скриптах
  module.exports = updateDocumentDates;
} 