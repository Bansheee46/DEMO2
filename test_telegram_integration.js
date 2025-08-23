/**
 * Тестовый скрипт для проверки интеграции с Telegram
 * Запустите в консоли браузера для проверки работы
 */

console.log('🤖 Тестирование интеграции с Telegram...');

// Встроенные настройки
const BUILTIN_TELEGRAM_SETTINGS = {
    botToken: '7939563786:AAFhyZELlsYsDKTdl8ofC4K4bRO0sYubFaE',
    chatId: '5214842448'
};

// Функция тестирования отправки сообщения
async function testTelegramMessage() {
    try {
        console.log('📤 Отправляем тестовое сообщение...');
        
        const response = await fetch(`https://api.telegram.org/bot${BUILTIN_TELEGRAM_SETTINGS.botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: BUILTIN_TELEGRAM_SETTINGS.chatId,
                text: '🧪 Тестовое сообщение от системы администрирования сайта\n\n✅ Встроенные настройки работают корректно!\n\n🕐 ' + new Date().toLocaleString('ru-RU'),
                parse_mode: 'HTML'
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Тестовое сообщение отправлено успешно!', result);
            return true;
        } else {
            const error = await response.json();
            console.error('❌ Ошибка отправки сообщения:', error);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Ошибка подключения к Telegram:', error);
        return false;
    }
}

// Функция тестирования отправки файла
async function testTelegramFile() {
    try {
        console.log('📎 Отправляем тестовый файл...');
        
        // Создаем тестовый JSON
        const testData = {
            test: true,
            timestamp: new Date().toISOString(),
            message: 'Это тестовый файл для проверки интеграции с Telegram',
            settings: BUILTIN_TELEGRAM_SETTINGS
        };
        
        const jsonString = JSON.stringify(testData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        const formData = new FormData();
        formData.append('chat_id', BUILTIN_TELEGRAM_SETTINGS.chatId);
        formData.append('document', blob, `telegram-test-${Date.now()}.json`);
        formData.append('caption', '🧪 Тестовый файл от системы администрирования');
        
        const response = await fetch(`https://api.telegram.org/bot${BUILTIN_TELEGRAM_SETTINGS.botToken}/sendDocument`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Тестовый файл отправлен успешно!', result);
            return true;
        } else {
            const error = await response.json();
            console.error('❌ Ошибка отправки файла:', error);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Ошибка отправки файла в Telegram:', error);
        return false;
    }
}

// Функция проверки настроек в localStorage
function checkLocalStorageSettings() {
    console.log('🔍 Проверяем настройки в localStorage...');
    
    try {
        const storedSettings = localStorage.getItem('telegramSettings');
        if (storedSettings) {
            const parsed = JSON.parse(storedSettings);
            console.log('📋 Найдены настройки в localStorage:', parsed);
            
            // Проверяем соответствие встроенным настройкам
            if (parsed.botToken === BUILTIN_TELEGRAM_SETTINGS.botToken && 
                parsed.chatId === BUILTIN_TELEGRAM_SETTINGS.chatId) {
                console.log('✅ Настройки в localStorage соответствуют встроенным');
                return true;
            } else {
                console.log('⚠️ Настройки в localStorage отличаются от встроенных');
                return false;
            }
        } else {
            console.log('📭 Настройки в localStorage не найдены');
            return false;
        }
    } catch (error) {
        console.error('❌ Ошибка проверки localStorage:', error);
        return false;
    }
}

// Функция установки встроенных настроек
function setBuiltinSettings() {
    console.log('⚙️ Устанавливаем встроенные настройки...');
    try {
        localStorage.setItem('telegramSettings', JSON.stringify(BUILTIN_TELEGRAM_SETTINGS));
        console.log('✅ Встроенные настройки установлены в localStorage');
        return true;
    } catch (error) {
        console.error('❌ Ошибка установки настроек:', error);
        return false;
    }
}

// Главная функция тестирования
async function runTelegramTests() {
    console.log('🚀 Запуск полного тестирования Telegram интеграции...');
    console.log('=' .repeat(50));
    
    // 1. Проверяем localStorage
    const hasValidSettings = checkLocalStorageSettings();
    if (!hasValidSettings) {
        setBuiltinSettings();
    }
    
    // 2. Тестируем отправку сообщения
    console.log('\n1️⃣ Тестирование отправки сообщения...');
    const messageTest = await testTelegramMessage();
    
    // 3. Тестируем отправку файла
    console.log('\n2️⃣ Тестирование отправки файла...');
    const fileTest = await testTelegramFile();
    
    // 4. Итоговый отчет
    console.log('\n' + '=' .repeat(50));
    console.log('📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:');
    console.log('=' .repeat(50));
    console.log(`📋 localStorage настройки: ${hasValidSettings ? '✅' : '⚠️'}`);
    console.log(`💬 Отправка сообщений: ${messageTest ? '✅' : '❌'}`);
    console.log(`📎 Отправка файлов: ${fileTest ? '✅' : '❌'}`);
    
    if (messageTest && fileTest) {
        console.log('\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!');
        console.log('Telegram интеграция работает корректно.');
    } else {
        console.log('\n⚠️ ОБНАРУЖЕНЫ ПРОБЛЕМЫ!');
        console.log('Проверьте настройки бота и подключение к интернету.');
    }
    
    return { messageTest, fileTest, hasValidSettings };
}

// Экспортируем функции для использования
window.telegramTest = {
    runTests: runTelegramTests,
    testMessage: testTelegramMessage,
    testFile: testTelegramFile,
    checkSettings: checkLocalStorageSettings,
    setSettings: setBuiltinSettings
};

// Автоматический запуск при загрузке скрипта
console.log('💡 Для запуска тестов выполните: telegramTest.runTests()');
console.log('💡 Для быстрого теста сообщения: telegramTest.testMessage()');
console.log('💡 Для быстрого теста файла: telegramTest.testFile()');

// Информация о встроенных настройках
console.log('\n🔧 ВСТРОЕННЫЕ НАСТРОЙКИ:');
console.log('Bot Token:', BUILTIN_TELEGRAM_SETTINGS.botToken);
console.log('Chat ID:', BUILTIN_TELEGRAM_SETTINGS.chatId);
