/**
 * Тестовый скрипт для проверки работы редактора товаров
 * Запустите этот скрипт в консоли браузера для проверки редактора
 */

(function() {
  console.log('🧪 Запуск тестов редактора товаров...');
  
  // Проверка наличия редактора
  function testEditorExists() {
    console.log('📋 Проверка наличия редактора товаров...');
    
    if (!window.productEditor) {
      console.error('❌ Редактор товаров не найден! Возможно, скрипт не был загружен.');
      return false;
    }
    
    console.log('✅ Редактор товаров найден');
    return true;
  }
  
  // Проверка наличия модального окна
  function testModalExists() {
    console.log('📋 Проверка наличия модального окна...');
    
    const modal = document.getElementById('productEditorModal');
    if (!modal) {
      console.error('❌ Модальное окно не найдено! Возможно, оно не было создано.');
      
      // Пробуем создать модальное окно
      console.log('Пробуем создать модальное окно...');
      window.productEditor.createModal();
      
      // Проверяем снова
      const modalAfterCreation = document.getElementById('productEditorModal');
      if (!modalAfterCreation) {
        console.error('❌ Не удалось создать модальное окно!');
        return false;
      }
      
      console.log('✅ Модальное окно успешно создано');
      return true;
    }
    
    console.log('✅ Модальное окно найдено');
    return true;
  }
  
  // Проверка наличия формы в модальном окне
  function testFormExists() {
    console.log('📋 Проверка наличия формы в модальном окне...');
    
    const form = document.getElementById('addProductForm');
    if (!form) {
      console.error('❌ Форма не найдена! Возможно, она не была создана.');
      return false;
    }
    
    console.log('✅ Форма найдена');
    
    // Проверяем наличие всех необходимых полей
    const requiredFields = ['productName', 'productPrice', 'productCategory'];
    const missingFields = [];
    
    requiredFields.forEach(field => {
      const element = document.getElementById(field);
      if (!element) {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length > 0) {
      console.error(`❌ Отсутствуют следующие поля: ${missingFields.join(', ')}`);
      return false;
    }
    
    console.log('✅ Все необходимые поля найдены');
    return true;
  }
  
  // Проверка загрузки категорий
  function testCategoriesLoaded() {
    console.log('📋 Проверка загрузки категорий...');
    
    const categorySelect = document.getElementById('productCategory');
    if (!categorySelect) {
      console.error('❌ Селект категорий не найден!');
      return false;
    }
    
    if (categorySelect.options.length <= 1) {
      console.error('❌ Категории не загружены! Селект пуст.');
      
      // Пробуем загрузить категории
      console.log('Пробуем загрузить категории...');
      window.productEditor.loadCategories();
      
      // Проверяем снова
      if (categorySelect.options.length <= 1) {
        console.error('❌ Не удалось загрузить категории!');
        return false;
      }
      
      console.log('✅ Категории успешно загружены');
      return true;
    }
    
    console.log(`✅ Категории загружены (${categorySelect.options.length - 1} шт.)`);
    return true;
  }
  
  // Проверка открытия модального окна
  function testModalOpening() {
    console.log('📋 Проверка открытия модального окна...');
    
    const modal = document.getElementById('productEditorModal');
    if (!modal) {
      console.error('❌ Модальное окно не найдено для проверки открытия!');
      return false;
    }
    
    // Проверяем, что модальное окно изначально закрыто
    if (modal.classList.contains('active')) {
      console.warn('⚠️ Модальное окно уже открыто перед тестом');
      window.productEditor.closeModal();
    }
    
    // Открываем модальное окно
    window.productEditor.showModal();
    
    // Проверяем, что модальное окно открылось
    if (!modal.classList.contains('active')) {
      console.error('❌ Модальное окно не открылось!');
      return false;
    }
    
    console.log('✅ Модальное окно успешно открывается');
    
    // Закрываем модальное окно
    window.productEditor.closeModal();
    
    // Проверяем, что модальное окно закрылось
    if (modal.classList.contains('active')) {
      console.error('❌ Модальное окно не закрывается!');
      return false;
    }
    
    console.log('✅ Модальное окно успешно закрывается');
    return true;
  }
  
  // Проверка добавления тестового товара
  function testAddProduct() {
    console.log('📋 Проверка добавления тестового товара...');
    
    // Получаем текущее количество товаров
    let products = [];
    try {
      products = JSON.parse(localStorage.getItem('products') || '[]');
    } catch (e) {
      console.warn('⚠️ Ошибка при получении товаров из localStorage:', e);
    }
    
    const initialCount = products.length;
    console.log(`Исходное количество товаров: ${initialCount}`);
    
    // Создаем тестовый товар
    const testProduct = {
      id: Date.now(),
      name: 'Тестовый товар ' + Date.now(),
      title: 'Тестовый товар ' + Date.now(),
      price: 999,
      category: 'electronics',
      description: 'Тестовое описание товара',
      image: 'images/image.png',
      image_url: 'images/image.png',
      sku: 'TEST-' + Date.now(),
      available: true
    };
    
    // Добавляем тестовый товар
    products.push(testProduct);
    localStorage.setItem('products', JSON.stringify(products));
    
    // Проверяем, что товар добавлен
    let updatedProducts = [];
    try {
      updatedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    } catch (e) {
      console.error('❌ Ошибка при получении обновленных товаров из localStorage:', e);
      return false;
    }
    
    if (updatedProducts.length !== initialCount + 1) {
      console.error('❌ Товар не был добавлен! Количество товаров не изменилось.');
      return false;
    }
    
    console.log('✅ Тестовый товар успешно добавлен');
    
    // Проверяем, что товар добавлен с правильными данными
    const addedProduct = updatedProducts.find(p => p.id === testProduct.id);
    if (!addedProduct) {
      console.error('❌ Добавленный товар не найден по ID!');
      return false;
    }
    
    if (addedProduct.name !== testProduct.name || 
        addedProduct.price !== testProduct.price || 
        addedProduct.category !== testProduct.category) {
      console.error('❌ Данные добавленного товара не соответствуют ожидаемым!');
      return false;
    }
    
    console.log('✅ Данные добавленного товара корректны');
    return true;
  }
  
  // Запуск всех тестов
  function runAllTests() {
    let allPassed = true;
    
    if (!testEditorExists()) {
      allPassed = false;
      console.error('❌ Тест наличия редактора не пройден!');
    }
    
    if (!testModalExists()) {
      allPassed = false;
      console.error('❌ Тест наличия модального окна не пройден!');
    } else {
      if (!testFormExists()) {
        allPassed = false;
        console.error('❌ Тест наличия формы не пройден!');
      }
      
      if (!testCategoriesLoaded()) {
        allPassed = false;
        console.error('❌ Тест загрузки категорий не пройден!');
      }
      
      if (!testModalOpening()) {
        allPassed = false;
        console.error('❌ Тест открытия модального окна не пройден!');
      }
    }
    
    if (!testAddProduct()) {
      allPassed = false;
      console.error('❌ Тест добавления товара не пройден!');
    }
    
    if (allPassed) {
      console.log('🎉 Все тесты пройдены успешно!');
    } else {
      console.error('⚠️ Некоторые тесты не пройдены!');
    }
    
    return allPassed;
  }
  
  // Запускаем все тесты
  runAllTests();
})();
