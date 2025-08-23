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
    
    # Создаем таблицу сообщений, если она не существует
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER,
        receiver_id INTEGER NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users (id),
        FOREIGN KEY (receiver_id) REFERENCES users (id)
    )
    ''')
    
    # Создаем таблицу подкатегорий, если она не существует
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS subcategories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_code TEXT NOT NULL,
        subcategory_code TEXT NOT NULL,
        subcategory_name TEXT NOT NULL,
        UNIQUE(category_code, subcategory_code)
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