/**
 * Тестовый скрипт для отладки проблем с футером
 * Запустите в консоли браузера для диагностики
 */

console.log('🔍 Диагностика проблем с футером...');

// Функция проверки элементов футера
function checkFooterElements() {
  console.log('=' .repeat(50));
  console.log('🔍 ПРОВЕРКА ЭЛЕМЕНТОВ ФУТЕРА');
  console.log('=' .repeat(50));
  
  const elements = {
    '.footer__company-name': document.querySelector('.footer__company-name'),
    '.footer__phone a': document.querySelector('.footer__phone a'),
    '.footer__email a': document.querySelector('.footer__email a'),
    '.footer__address': document.querySelector('.footer__address'),
    '.footer__hours': document.querySelector('.footer__hours')
  };
  
  Object.entries(elements).forEach(([selector, element]) => {
    if (element) {
      console.log(`✅ ${selector}: найден`);
      console.log(`   Текст: "${element.textContent}"`);
      console.log(`   HTML: ${element.outerHTML.substring(0, 100)}...`);
    } else {
      console.log(`❌ ${selector}: НЕ НАЙДЕН`);
    }
  });
  
  return elements;
}

// Функция проверки настроек в localStorage
function checkLocalStorageSettings() {
  console.log('\n' + '=' .repeat(50));
  console.log('📋 ПРОВЕРКА НАСТРОЕК В LOCALSTORAGE');
  console.log('=' .repeat(50));
  
  try {
    const siteSettings = localStorage.getItem('siteSettings');
    if (siteSettings) {
      const parsed = JSON.parse(siteSettings);
      console.log('✅ siteSettings найден:', parsed);
      
      // Проверяем конкретные поля футера
      const footerFields = ['footerCompany', 'footerPhone', 'footerEmail', 'footerAddress', 'footerWorkingHours', 'siteTitle'];
      footerFields.forEach(field => {
        if (parsed[field]) {
          console.log(`   ${field}: "${parsed[field]}"`);
        } else {
          console.log(`   ${field}: не задано`);
        }
      });
      
      return parsed;
    } else {
      console.log('❌ siteSettings не найден в localStorage');
      return null;
    }
  } catch (error) {
    console.error('❌ Ошибка при чтении siteSettings:', error);
    return null;
  }
}

// Функция проверки DOM готовности
function checkDOMReadiness() {
  console.log('\n' + '=' .repeat(50));
  console.log('🌐 ПРОВЕРКА ГОТОВНОСТИ DOM');
  console.log('=' .repeat(50));
  
  console.log(`document.readyState: ${document.readyState}`);
  console.log(`document.body: ${!!document.body}`);
  console.log(`footer элемент: ${!!document.querySelector('footer')}`);
  
  if (document.readyState === 'loading') {
    console.log('⚠️ DOM еще загружается');
  } else if (document.readyState === 'interactive') {
    console.log('✅ DOM интерактивен');
  } else if (document.readyState === 'complete') {
    console.log('✅ DOM полностью загружен');
  }
}

// Функция тестирования обновления футера
function testFooterUpdate() {
  console.log('\n' + '=' .repeat(50));
  console.log('🧪 ТЕСТИРОВАНИЕ ОБНОВЛЕНИЯ ФУТЕРА');
  console.log('=' .repeat(50));
  
  // Создаем тестовые настройки
  const testSettings = {
    footerCompany: 'Тестовая Компания',
    footerPhone: '+7 (999) 999-99-99',
    footerEmail: 'test@example.com',
    footerAddress: 'Тестовый адрес, 123',
    footerWorkingHours: 'Пн-Вс 24/7',
    siteTitle: 'Тестовый сайт'
  };
  
  console.log('📝 Устанавливаем тестовые настройки...');
  localStorage.setItem('siteSettings', JSON.stringify(testSettings));
  
  console.log('🔄 Вызываем updateFooterFromSettings...');
  if (typeof updateFooterFromSettings === 'function') {
    updateFooterFromSettings();
  } else {
    console.log('❌ Функция updateFooterFromSettings не найдена');
  }
  
  // Проверяем результат через небольшую задержку
  setTimeout(() => {
    console.log('\n📊 РЕЗУЛЬТАТ ТЕСТИРОВАНИЯ:');
    checkFooterElements();
  }, 1000);
}

// Функция полной диагностики
function runFullDiagnostic() {
  console.log('🚀 ЗАПУСК ПОЛНОЙ ДИАГНОСТИКИ ФУТЕРА');
  console.log('=' .repeat(60));
  
  checkDOMReadiness();
  checkLocalStorageSettings();
  checkFooterElements();
  
  console.log('\n' + '=' .repeat(60));
  console.log('💡 РЕКОМЕНДАЦИИ:');
  console.log('=' .repeat(60));
  
  const elements = checkFooterElements();
  const settings = checkLocalStorageSettings();
  
  if (!settings) {
    console.log('1️⃣ Сначала настройте футер в админ-панели');
  } else if (Object.values(elements).some(el => !el)) {
    console.log('2️⃣ Некоторые элементы футера не найдены - проверьте HTML структуру');
  } else {
    console.log('3️⃣ Все элементы найдены, настройки есть - футер должен работать');
  }
  
  console.log('\n🔧 КОМАНДЫ ДЛЯ ТЕСТИРОВАНИЯ:');
  console.log('   runFullDiagnostic() - полная диагностика');
  console.log('   checkFooterElements() - проверка элементов');
  console.log('   checkLocalStorageSettings() - проверка настроек');
  console.log('   testFooterUpdate() - тест обновления');
  console.log('   forceUpdateFooter() - принудительное обновление (если доступно)');
}

// Экспортируем функции для использования
window.footerDebug = {
  runFullDiagnostic,
  checkFooterElements,
  checkLocalStorageSettings,
  checkDOMReadiness,
  testFooterUpdate
};

// Автоматический запуск при загрузке скрипта
console.log('💡 Для запуска диагностики выполните: footerDebug.runFullDiagnostic()');
console.log('💡 Для быстрой проверки элементов: footerDebug.checkFooterElements()');
console.log('💡 Для проверки настроек: footerDebug.checkLocalStorageSettings()');
console.log('💡 Для тестирования обновления: footerDebug.testFooterUpdate()');

// Информация о доступных функциях
console.log('\n🔧 ДОСТУПНЫЕ ФУНКЦИИ:');
console.log('   footerDebug.runFullDiagnostic() - полная диагностика');
console.log('   footerDebug.checkFooterElements() - проверка элементов футера');
console.log('   footerDebug.checkLocalStorageSettings() - проверка настроек');
console.log('   footerDebug.checkDOMReadiness() - проверка готовности DOM');
console.log('   footerDebug.testFooterUpdate() - тест обновления футера');
