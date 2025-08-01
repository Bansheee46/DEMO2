import sqlite3
import hashlib
import os
from datetime import datetime

# Путь к базе данных
DB_PATH = 'products.db'

def init_db():
    """Инициализация базы данных и создание таблиц"""
    
    # Проверяем, существует ли файл базы данных
    db_exists = os.path.exists(DB_PATH)
    
    # Подключаемся к базе данных
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Создаем таблицу товаров, если она не существует
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        image_url TEXT,
        category TEXT,
        sku TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Создаем таблицу пользователей, если она не существует
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT UNIQUE,
        role TEXT NOT NULL DEFAULT 'user',
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Создаем таблицу заказов, если она не существует
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT,
        customer_phone TEXT,
        shipping_address TEXT,
        status TEXT DEFAULT 'new',
        total_amount REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Создаем таблицу элементов заказа, если она не существует
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
    )
    ''')
    
    # Создаем таблицу логов действий администратора, если она не существует
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS admin_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        username TEXT,
        action TEXT,
        details TEXT,
        ip_address TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Создаем таблицу настроек, если она не существует
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Создаем учетную запись администратора, если таблица пользователей пуста
    cursor.execute('SELECT COUNT(*) FROM users')
    user_count = cursor.fetchone()[0]
    
    if user_count == 0:
        # Создаем учетную запись администратора
        admin_username = 'admin'
        admin_password = 'admin123'  # В реальном проекте использовать сложный пароль
        admin_email = 'admin@example.com'
        
        # Хешируем пароль
        password_hash = hashlib.sha256(admin_password.encode()).hexdigest()
        
        # Добавляем администратора в базу данных
        cursor.execute(
            'INSERT INTO users (username, password_hash, email, role, created_at) VALUES (?, ?, ?, ?, ?)',
            (admin_username, password_hash, admin_email, 'admin', datetime.now().isoformat())
        )
        
        print(f"Создана учетная запись администратора:")
        print(f"Логин: {admin_username}")
        print(f"Пароль: {admin_password}")
        print(f"Email: {admin_email}")
        print("ВНИМАНИЕ! Смените пароль после первого входа!")
    
    # Добавляем базовые настройки, если таблица настроек пуста
    cursor.execute('SELECT COUNT(*) FROM settings')
    settings_count = cursor.fetchone()[0]
    
    if settings_count == 0:
        # Добавляем базовые настройки
        settings = [
            ('site_name', 'Интернет-магазин', 'Название сайта'),
            ('contact_email', 'contact@example.com', 'Контактный email'),
            ('contact_phone', '+7 (999) 123-45-67', 'Контактный телефон'),
            ('address', 'г. Москва, ул. Примерная, д. 1', 'Адрес'),
            ('currency', 'RUB', 'Валюта'),
            ('currency_symbol', '₽', 'Символ валюты'),
            ('meta_keywords', 'магазин, товары, купить', 'Мета-ключевые слова'),
            ('meta_description', 'Интернет-магазин качественных товаров', 'Мета-описание'),
            # Настройки методов оплаты
            ('payment_cash', 'true', 'Оплата наличными при получении'),
            ('payment_card', 'true', 'Оплата картой при получении'),
            ('payment_online', 'false', 'Онлайн-оплата'),
            ('payment_api_key', '', 'API-ключ платежной системы'),
            ('payment_merchant_id', '', 'ID мерчанта платежной системы'),
            # Настройки доставки
            ('delivery_enabled', 'true', 'Включена ли доставка'),
            ('delivery_price', '300', 'Стоимость доставки'),
            ('free_delivery_threshold', '5000', 'Бесплатная доставка от суммы'),
            ('delivery_regions', 'Москва\nМосковская область', 'Регионы доставки'),
            # Пункты выдачи (JSON-строка с массивом объектов)
            ('pickup_points', '[]', 'Пункты выдачи'),
            # Юридические данные компании
            ('company_name', 'ООО "Дамакс"', 'Название компании'),
            ('company_inn', '1650421897', 'ИНН компании'),
            ('company_ogrn', '1231600009740', 'ОГРН компании'),
            ('company_kpp', '', 'КПП компании'),
            ('company_legal_address', '423816, Республика Татарстан, Г.О. Город Набережные Челны, Пр-кт Им Вахитова, Д. 44/78,КВ.16', 'Юридический адрес'),
            ('company_actual_address', '423816, Республика Татарстан, Г.О. Город Набережные Челны, Пр-кт Им Вахитова, Д. 44/78,КВ.16', 'Фактический адрес'),
            ('company_postal_address', '123456, г. Москва, ул. Примерная, д. 123', 'Почтовый адрес'),
            ('company_email', 'info@damax.ru', 'Email компании'),
            ('company_privacy_email', 'privacy@damax.ru', 'Email для вопросов приватности'),
            ('company_phone', '+7 (999) 123-45-67', 'Телефон компании'),
            # Банковские реквизиты
            ('company_bank_name', '', 'Название банка'),
            ('company_bank_account', '', 'Расчетный счет'),
            ('company_bank_corr_account', '', 'Корреспондентский счет'),
            ('company_bank_bik', '', 'БИК банка'),
            # Соцсети и мессенджеры
            ('social_instagram', '', 'Ссылка на Instagram'),
            ('social_facebook', '', 'Ссылка на Facebook'),
            ('social_twitter', '', 'Ссылка на Twitter'),
            ('social_youtube', '', 'Ссылка на YouTube'),
            ('social_telegram', '', 'Ссылка на Telegram'),
            ('social_whatsapp', '', 'Ссылка на WhatsApp'),
            # Логотип и favicon
            ('site_logo', '', 'URL логотипа сайта'),
            ('site_favicon', '', 'URL favicon сайта'),
            # Email для заказов и поддержки
            ('order_email', 'orders@example.com', 'Email для заказов'),
            ('support_email', 'support@example.com', 'Email для поддержки'),
            # Режим работы
            ('working_hours', '', 'Режим работы магазина')
        ]
        
        for key, value, description in settings:
            cursor.execute(
                'INSERT INTO settings (key, value, description, updated_at) VALUES (?, ?, ?, ?)',
                (key, value, description, datetime.now().isoformat())
            )
    
    # Добавить поле image_url в таблицу categories, если его нет
    try:
        cursor.execute("ALTER TABLE categories ADD COLUMN image_url TEXT")
        print('Поле image_url добавлено в categories')
    except Exception as e:
        print('Поле image_url уже существует или ошибка:', e)
    
    # Сохраняем изменения и закрываем соединение
    conn.commit()
    conn.close()
    
    print(f"База данных {DB_PATH} успешно инициализирована")

if __name__ == '__main__':
    init_db() 