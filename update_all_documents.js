/**
 * Скрипт для автоматического обновления всех юридических документов одновременно
 * Запускается из командной строки: node update_all_documents.js
 */

const fetch = require('node-fetch');

async function updateAllDocuments() {
  console.log('Запуск обновления всех юридических документов...');
  
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
    
    // Собираем данные о датах обновления документов
    const documentDates = {
      terms_last_update: settings.terms_last_update || '',
      privacy_last_update: settings.privacy_last_update || '',
      consent_last_update: settings.consent_last_update || '',
      delivery_last_update: settings.delivery_last_update || '',
      licenses_last_update: settings.licenses_last_update || '',
      warranty_last_update: settings.warranty_last_update || ''
    };
    
    // Собираем дополнительную информацию о документах
    const documentInfo = {
      terms_additional_info: settings.terms_additional_info || '',
      privacy_additional_info: settings.privacy_additional_info || '',
      consent_additional_info: settings.consent_additional_info || '',
      delivery_additional_info: settings.delivery_additional_info || '',
      licenses_additional_info: settings.licenses_additional_info || '',
      warranty_additional_info: settings.warranty_additional_info || ''
    };
    
    // Вызываем API для синхронизации документов
    console.log('Синхронизация документов...');
    const syncResponse = await fetch('http://localhost:5000/api/sync-company-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        document_dates: documentDates,
        document_info: documentInfo,
        update_all: true
      })
    });
    
    if (!syncResponse.ok) {
      throw new Error(`Ошибка синхронизации документов: ${syncResponse.status} ${syncResponse.statusText}`);
    }
    
    const result = await syncResponse.json();
    console.log(`Документы успешно синхронизированы. Обновлено файлов: ${result.updated_files.length}`);
    console.log('Обновленные файлы:', result.updated_files);
    
    // Очищаем метку времени синхронизации в sessionStorage
    console.log('Очистка метки времени синхронизации...');
    
    return {
      success: true,
      message: `Документы успешно синхронизированы. Обновлено файлов: ${result.updated_files.length}`,
      updatedFiles: result.updated_files
    };
  } catch (error) {
    console.error('Ошибка при обновлении документов:', error);
    return {
      success: false,
      message: `Ошибка при обновлении документов: ${error.message}`
    };
  }
}

// Запускаем обновление документов при вызове скрипта напрямую
if (require.main === module) {
  updateAllDocuments()
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
  module.exports = updateAllDocuments;
} 