/**
 * Администрирование сайта
 * Управление товарами, категориями, подкатегориями и настройками
 */

class SiteAdmin {
    constructor() {
        this.currentTab = 'products';
        this.products = [];
        this.categories = [];
        this.subcategories = [];
        this.settings = {};
        
        this.init();
    }

    init() {
        console.log('Инициализация админ-панели...');
        
        // Загружаем данные из localStorage
        this.loadData();
        
        // Инициализируем обработчики событий
        this.initEventListeners();
        
        // Загружаем контент текущей вкладки
        this.loadTabContent();
        
        // Загружаем настройки в форму
        this.loadSettings();
    }

    initEventListeners() {
        // Обработчики вкладок
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });

        // Обработчики форм
        document.getElementById('productForm').addEventListener('submit', (e) => this.handleProductSubmit(e));
        document.getElementById('categoryForm').addEventListener('submit', (e) => this.handleCategorySubmit(e));
        document.getElementById('subcategoryForm').addEventListener('submit', (e) => this.handleSubcategorySubmit(e));
        document.getElementById('settingsForm').addEventListener('submit', (e) => this.handleSettingsSubmit(e));

        // Автоматическое обновление кода категории
        document.getElementById('categoryName').addEventListener('input', (e) => {
            const code = e.target.value.toLowerCase().replace(/[^a-zа-я0-9]/g, '-').replace(/-+/g, '-');
            document.getElementById('categoryCode').value = code;
        });

        // Автоматическое обновление кода подкатегории
        document.getElementById('subcategoryName').addEventListener('input', (e) => {
            const code = e.target.value.toLowerCase().replace(/[^a-zа-я0-9]/g, '-').replace(/-+/g, '-');
            document.getElementById('subcategoryCode').value = code;
        });
    }

    loadData() {
        try {
            // Загружаем товары
            this.products = JSON.parse(localStorage.getItem('products') || '[]');
            
            // Загружаем категории
            this.categories = JSON.parse(localStorage.getItem('categories') || '[]');
            if (this.categories.length === 0) {
                this.categories = this.getDefaultCategories();
                this.saveCategories();
            }
            
            // Загружаем подкатегории
            this.subcategories = JSON.parse(localStorage.getItem('subcategories') || '[]');
            
            // Загружаем настройки
            this.settings = JSON.parse(localStorage.getItem('siteSettings') || '{}');
            
            console.log('Данные загружены:', {
                products: this.products.length,
                categories: this.categories.length,
                subcategories: this.subcategories.length,
                settings: Object.keys(this.settings).length
            });
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.showNotification('Ошибка загрузки данных', 'error');
        }
    }

    getDefaultCategories() {
        return [];
    }

    switchTab(tabId) {
        // Обновляем активную кнопку
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Обновляем активный контент
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');

        this.currentTab = tabId;
        this.loadTabContent();
    }

    loadTabContent() {
        switch (this.currentTab) {
            case 'products':
                this.loadProductsTab();
                break;
            case 'categories':
                this.loadCategoriesTab();
                break;
            case 'subcategories':
                this.loadSubcategoriesTab();
                break;
            case 'settings':
                this.loadSettingsTab();
                break;
        }
    }

    loadProductsTab() {
        // Загружаем категории в селект
        const categorySelect = document.getElementById('productCategory');
        categorySelect.innerHTML = '<option value="">Выберите категорию</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.code;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });

        // Загружаем список товаров
        this.renderProductsList();
    }

    loadCategoriesTab() {
        this.renderCategoriesList();
        this.updateCategoriesPreview();
    }

    loadSubcategoriesTab() {
        // Загружаем категории в селект
        const parentSelect = document.getElementById('subcategoryParent');
        parentSelect.innerHTML = '<option value="">Выберите категорию</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.code;
            option.textContent = category.name;
            parentSelect.appendChild(option);
        });

        this.renderSubcategoriesList();
    }

    loadSettingsTab() {
        // Настройки уже загружены в loadSettings()
    }

    handleProductSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const product = {
            id: Date.now(),
            name: document.getElementById('productName').value,
            price: parseFloat(document.getElementById('productPrice').value),
            category: document.getElementById('productCategory').value,
            sku: document.getElementById('productSku').value,
            description: document.getElementById('productDescription').value,
            image: document.getElementById('productImage').value,
            createdAt: new Date().toISOString()
        };

        // Валидация
        if (!product.name || !product.price || !product.category) {
            this.showNotification('Заполните все обязательные поля', 'error');
            return;
        }

        // Добавляем товар
        this.products.push(product);
        this.saveProducts();
        
        // Очищаем форму
        e.target.reset();
        
        // Обновляем список
        this.renderProductsList();
        
        this.showNotification('Товар успешно добавлен', 'success');
        console.log('Товар добавлен:', product);
    }

    handleCategorySubmit(e) {
        e.preventDefault();
        
        const category = {
            id: Date.now(),
            name: document.getElementById('categoryName').value,
            code: document.getElementById('categoryCode').value,
            icon: document.getElementById('categoryIcon').value,
            image: document.getElementById('categoryImage').value,
            createdAt: new Date().toISOString()
        };

        // Валидация
        if (!category.name || !category.code) {
            this.showNotification('Заполните все обязательные поля', 'error');
            return;
        }

        // Проверяем уникальность кода
        if (this.categories.find(cat => cat.code === category.code)) {
            this.showNotification('Категория с таким кодом уже существует', 'error');
            return;
        }

        // Добавляем категорию
        this.categories.push(category);
        this.saveCategories();
        
        // Очищаем форму
        e.target.reset();
        
        // Обновляем списки и предварительный просмотр
        this.renderCategoriesList();
        this.updateCategoriesPreview();
        this.updateIslandCategories();
        
        this.showNotification('Категория успешно добавлена', 'success');
        console.log('Категория добавлена:', category);
    }

    handleSubcategorySubmit(e) {
        e.preventDefault();
        
        const subcategory = {
            id: Date.now(),
            name: document.getElementById('subcategoryName').value,
            parent: document.getElementById('subcategoryParent').value,
            code: document.getElementById('subcategoryCode').value,
            icon: document.getElementById('subcategoryIcon').value,
            createdAt: new Date().toISOString()
        };

        // Валидация
        if (!subcategory.name || !subcategory.parent || !subcategory.code) {
            this.showNotification('Заполните все обязательные поля', 'error');
            return;
        }

        // Проверяем уникальность кода
        if (this.subcategories.find(sub => sub.code === subcategory.code)) {
            this.showNotification('Подкатегория с таким кодом уже существует', 'error');
            return;
        }

        // Добавляем подкатегорию
        this.subcategories.push(subcategory);
        this.saveSubcategories();
        
        // Очищаем форму
        e.target.reset();
        
        // Обновляем список
        this.renderSubcategoriesList();
        this.updateSubcategoriesDisplay();
        
        this.showNotification('Подкатегория успешно добавлена', 'success');
        console.log('Подкатегория добавлена:', subcategory);
    }

    handleSettingsSubmit(e) {
        e.preventDefault();
        
        const settings = {
            siteTitle: document.getElementById('siteTitle').value,
            siteDescription: document.getElementById('siteDescription').value,
            footerCompany: document.getElementById('footerCompany').value,
            footerAddress: document.getElementById('footerAddress').value,
            footerPhone: document.getElementById('footerPhone').value,
            footerEmail: document.getElementById('footerEmail').value,
            footerWorkingHours: document.getElementById('footerWorkingHours').value,
            updatedAt: new Date().toISOString()
        };

        // Сохраняем настройки Telegram отдельно для безопасности
        const telegramSettings = {
            botToken: document.getElementById('telegramBotToken').value,
            chatId: document.getElementById('telegramChatId').value
        };

        // Сохраняем Telegram настройки только если они заполнены
        if (telegramSettings.botToken && telegramSettings.chatId) {
            localStorage.setItem('telegramSettings', JSON.stringify(telegramSettings));
            console.log('Настройки Telegram сохранены');
        } else if (telegramSettings.botToken || telegramSettings.chatId) {
            // Если заполнено только одно поле - показываем предупреждение
            this.showNotification('Заполните оба поля для Telegram или оставьте их пустыми', 'warning');
            return;
        }

        this.settings = { ...this.settings, ...settings };
        this.saveSettings();
        
        // Попытка обновить настройки в реальном времени
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'updateSettings', settings: this.settings }, '*');
        }
        
        this.showNotification('Настройки сохранены! Обновите главную страницу для отображения изменений в футере.', 'success');
        console.log('Настройки сохранены:', this.settings);
    }

    renderProductsList() {
        const container = document.getElementById('productsList');
        
        if (this.products.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Товары не найдены</p>';
            return;
        }

        container.innerHTML = this.products.map(product => `
            <div class="item-card">
                <div class="item-info">
                    <h3>${product.name}</h3>
                    <p>Цена: ${product.price} ₽ | Категория: ${this.getCategoryName(product.category)} | Артикул: ${product.sku || 'Не указан'}</p>
                </div>
                <div class="item-actions">
                    <button class="btn btn-secondary btn-small" onclick="siteAdmin.editProduct(${product.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-small" onclick="siteAdmin.deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderCategoriesList() {
        const container = document.getElementById('categoriesList');
        
        if (this.categories.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Категории не найдены</p>';
            return;
        }

        container.innerHTML = this.categories.map(category => `
            <div class="item-card">
                <div class="item-info">
                    <h3><i class="${category.icon || 'fas fa-tag'}"></i> ${category.name}</h3>
                    <p>Код: ${category.code} | Товаров: ${this.getProductsCountByCategory(category.code)}</p>
                </div>
                <div class="item-actions">
                    <button class="btn btn-secondary btn-small" onclick="siteAdmin.editCategory(${category.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-small" onclick="siteAdmin.deleteCategory(${category.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderSubcategoriesList() {
        const container = document.getElementById('subcategoriesList');
        
        if (this.subcategories.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Подкатегории не найдены</p>';
            return;
        }

        container.innerHTML = this.subcategories.map(subcategory => `
            <div class="item-card">
                <div class="item-info">
                    <h3><i class="${subcategory.icon || 'fas fa-layer-group'}"></i> ${subcategory.name}</h3>
                    <p>Родительская категория: ${this.getCategoryName(subcategory.parent)} | Код: ${subcategory.code}</p>
                </div>
                <div class="item-actions">
                    <button class="btn btn-secondary btn-small" onclick="siteAdmin.editSubcategory(${subcategory.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-small" onclick="siteAdmin.deleteSubcategory(${subcategory.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateCategoriesPreview() {
        const container = document.getElementById('categoriesPreview');
        container.innerHTML = this.categories.map(category => `
            <div class="preview-category">
                <i class="${category.icon || 'fas fa-tag'}"></i> ${category.name}
            </div>
        `).join('');
    }

    updateIslandCategories() {
        // Обновляем категории на главных страницах сайта
        try {
            localStorage.setItem('categories', JSON.stringify(this.categories));
            console.log('Категории обновлены в localStorage для синхронизации с основным сайтом');
            
            // Попытка обновить категории в реальном времени, если главная страница открыта
            if (window.parent && window.parent !== window) {
                // Если админ-панель открыта в iframe или popup
                window.parent.postMessage({ type: 'updateCategories', categories: this.categories }, '*');
            }
            
            // Уведомляем пользователя о необходимости обновления главной страницы
            this.showNotification('Категории обновлены! Обновите главную страницу для отображения изменений.', 'success');
        } catch (error) {
            console.error('Ошибка обновления категорий:', error);
        }
    }

    updateSubcategoriesDisplay() {
        // Обновляем подкатегории на главных страницах сайта
        try {
            localStorage.setItem('subcategories', JSON.stringify(this.subcategories));
            console.log('Подкатегории обновлены в localStorage для синхронизации с основным сайтом');
            
            // Попытка обновить подкатегории в реальном времени
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'updateSubcategories', subcategories: this.subcategories }, '*');
            }
            
            this.showNotification('Подкатегории обновлены! Обновите главную страницу для отображения изменений.', 'success');
        } catch (error) {
            console.error('Ошибка обновления подкатегорий:', error);
        }
    }

    loadSettings() {
        // Загружаем настройки в форму
        Object.keys(this.settings).forEach(key => {
            const input = document.getElementById(key);
            if (input && this.settings[key]) {
                input.value = this.settings[key];
            }
        });

        // Загружаем настройки Telegram
        try {
            let telegramSettings = JSON.parse(localStorage.getItem('telegramSettings') || '{}');
            
            // Встроенные настройки по умолчанию
            const defaultTelegramSettings = {
                botToken: '7939563786:AAFhyZELlsYsDKTdl8ofC4K4bRO0sYubFaE',
                chatId: '5214842448'
            };
            
            // Если настройки не найдены, используем встроенные
            if (!telegramSettings.botToken || !telegramSettings.chatId) {
                telegramSettings = defaultTelegramSettings;
                localStorage.setItem('telegramSettings', JSON.stringify(telegramSettings));
                console.log('Установлены встроенные настройки Telegram');
            }
            
            if (telegramSettings.botToken) {
                document.getElementById('telegramBotToken').value = telegramSettings.botToken;
            }
            if (telegramSettings.chatId) {
                document.getElementById('telegramChatId').value = telegramSettings.chatId;
            }
        } catch (error) {
            console.log('Ошибка загрузки настроек Telegram:', error);
        }
    }

    getCategoryName(code) {
        const category = this.categories.find(cat => cat.code === code);
        return category ? category.name : 'Неизвестная категория';
    }

    getProductsCountByCategory(categoryCode) {
        return this.products.filter(product => product.category === categoryCode).length;
    }

    // Методы сохранения данных
    saveProducts() {
        localStorage.setItem('products', JSON.stringify(this.products));
    }

    saveCategories() {
        localStorage.setItem('categories', JSON.stringify(this.categories));
    }

    saveSubcategories() {
        localStorage.setItem('subcategories', JSON.stringify(this.subcategories));
    }

    saveSettings() {
        localStorage.setItem('siteSettings', JSON.stringify(this.settings));
    }

    // Методы удаления
    deleteProduct(id) {
        if (confirm('Вы уверены, что хотите удалить этот товар?')) {
            this.products = this.products.filter(product => product.id !== id);
            this.saveProducts();
            this.renderProductsList();
            this.showNotification('Товар удален', 'success');
        }
    }

    deleteCategory(id) {
        if (confirm('Вы уверены, что хотите удалить эту категорию? Все товары этой категории останутся без категории.')) {
            this.categories = this.categories.filter(category => category.id !== id);
            this.saveCategories();
            this.renderCategoriesList();
            this.updateCategoriesPreview();
            this.updateIslandCategories();
            this.showNotification('Категория удалена', 'success');
        }
    }

    deleteSubcategory(id) {
        if (confirm('Вы уверены, что хотите удалить эту подкатегорию?')) {
            this.subcategories = this.subcategories.filter(subcategory => subcategory.id !== id);
            this.saveSubcategories();
            this.renderSubcategoriesList();
            this.updateSubcategoriesDisplay();
            this.showNotification('Подкатегория удалена', 'success');
        }
    }

    // Методы редактирования (заглушки для будущей реализации)
    editProduct(id) {
        this.showNotification('Функция редактирования товаров будет добавлена в следующей версии', 'warning');
    }

    editCategory(id) {
        this.showNotification('Функция редактирования категорий будет добавлена в следующей версии', 'warning');
    }

    editSubcategory(id) {
        this.showNotification('Функция редактирования подкатегорий будет добавлена в следующей версии', 'warning');
    }

    showNotification(message, type = 'success') {
        // Удаляем предыдущие уведомления
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Показываем уведомление
        setTimeout(() => notification.classList.add('show'), 100);

        // Скрываем уведомление через 3 секунды
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Глобальные переменные для селектора иконок
let currentIconInput = null;
const POPULAR_ICONS = [
    'fas fa-laptop', 'fas fa-mobile-alt', 'fas fa-tablet-alt', 'fas fa-desktop',
    'fas fa-tshirt', 'fas fa-shoe-prints', 'fas fa-hat-cowboy', 'fas fa-glasses',
    'fas fa-blender', 'fas fa-microwave', 'fas fa-tv', 'fas fa-washing-machine',
    'fas fa-gamepad', 'fas fa-puzzle-piece', 'fas fa-dice', 'fas fa-robot',
    'fas fa-gem', 'fas fa-ring', 'fas fa-watch', 'fas fa-crown',
    'fas fa-home', 'fas fa-car', 'fas fa-bicycle', 'fas fa-plane',
    'fas fa-book', 'fas fa-music', 'fas fa-film', 'fas fa-camera',
    'fas fa-utensils', 'fas fa-coffee', 'fas fa-wine-glass', 'fas fa-pizza-slice',
    'fas fa-heart', 'fas fa-star', 'fas fa-fire', 'fas fa-bolt',
    'fas fa-leaf', 'fas fa-tree', 'fas fa-flower', 'fas fa-sun',
    'fas fa-tools', 'fas fa-wrench', 'fas fa-hammer', 'fas fa-screwdriver',
    'fas fa-paint-brush', 'fas fa-palette', 'fas fa-scissors', 'fas fa-pen',
    'fas fa-shopping-cart', 'fas fa-store', 'fas fa-gift', 'fas fa-tag',
    'fas fa-user', 'fas fa-users', 'fas fa-baby', 'fas fa-child'
];

// Функция для открытия селектора иконок
function openIconSelector(inputId) {
    currentIconInput = inputId;
    const modal = document.getElementById('iconModal');
    const iconGrid = document.getElementById('iconGrid');
    
    // Очищаем сетку иконок
    iconGrid.innerHTML = '';
    
    // Заполняем сетку популярными иконками
    POPULAR_ICONS.forEach(iconClass => {
        const iconOption = document.createElement('div');
        iconOption.className = 'icon-option';
        iconOption.onclick = () => selectIcon(iconClass);
        
        const iconName = iconClass.split(' ')[1].replace('fa-', '');
        
        iconOption.innerHTML = `
            <i class="${iconClass}"></i>
            <span>${iconName}</span>
        `;
        
        iconGrid.appendChild(iconOption);
    });
    
    // Показываем модальное окно
    modal.classList.add('show');
    
    // Очищаем поиск
    document.getElementById('iconSearch').value = '';
}

// Функция для закрытия селектора иконок
function closeIconSelector() {
    const modal = document.getElementById('iconModal');
    modal.classList.remove('show');
    currentIconInput = null;
}

// Функция для выбора иконки
function selectIcon(iconClass) {
    if (currentIconInput) {
        const input = document.getElementById(currentIconInput);
        input.value = iconClass;
        
        // Обновляем отображение иконки в кнопке
        const button = input.parentElement.querySelector('.icon-selector-btn i');
        if (button) {
            button.className = iconClass;
        }
    }
    
    closeIconSelector();
}

// Функция для фильтрации иконок
function filterIcons() {
    const searchTerm = document.getElementById('iconSearch').value.toLowerCase();
    const iconOptions = document.querySelectorAll('.icon-option');
    
    iconOptions.forEach(option => {
        const iconName = option.querySelector('span').textContent.toLowerCase();
        if (iconName.includes(searchTerm)) {
            option.style.display = 'flex';
        } else {
            option.style.display = 'none';
        }
    });
}

// Глобальная функция для тестирования подключения к Telegram
async function testTelegramConnection() {
    const botToken = document.getElementById('telegramBotToken').value;
    const chatId = document.getElementById('telegramChatId').value;
    
    if (!botToken || !chatId) {
        if (window.siteAdmin) {
            window.siteAdmin.showNotification('Заполните токен бота и Chat ID для тестирования', 'warning');
        }
        return;
    }
    
    // Показываем индикатор загрузки
    const testButton = document.querySelector('button[onclick="testTelegramConnection()"]');
    const originalText = testButton.innerHTML;
    testButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Проверяем...';
    testButton.disabled = true;
    
    try {
        // Отправляем тестовое сообщение
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: '🎉 Подключение к Telegram Bot успешно настроено!\n\nТеперь все экспорты настроек сайта будут автоматически приходить в этот чат.',
                parse_mode: 'HTML'
            })
        });
        
        if (response.ok) {
            if (window.siteAdmin) {
                window.siteAdmin.showNotification('✅ Подключение успешно! Проверьте Telegram - должно прийти тестовое сообщение.', 'success');
            }
            console.log('Тестовое сообщение отправлено в Telegram');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.description || 'Неизвестная ошибка');
        }
        
    } catch (error) {
        console.error('Ошибка тестирования Telegram:', error);
        let errorMessage = 'Ошибка подключения к Telegram';
        
        if (error.message.includes('chat not found')) {
            errorMessage = 'Неверный Chat ID. Убедитесь, что вы отправили сообщение боту.';
        } else if (error.message.includes('bot token')) {
            errorMessage = 'Неверный токен бота. Проверьте токен у @BotFather.';
        } else if (error.message) {
            errorMessage = `Ошибка: ${error.message}`;
        }
        
        if (window.siteAdmin) {
            window.siteAdmin.showNotification(errorMessage, 'error');
        }
    } finally {
        // Возвращаем кнопку в исходное состояние
        testButton.innerHTML = originalText;
        testButton.disabled = false;
    }
}

// Инициализируем админ-панель после загрузки страницы
let siteAdmin;

document.addEventListener('DOMContentLoaded', () => {
    siteAdmin = new SiteAdmin();
});

// Альтернативная инициализация если DOMContentLoaded уже произошел
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => {
        if (!siteAdmin) {
            siteAdmin = new SiteAdmin();
        }
    }, 100);
}
