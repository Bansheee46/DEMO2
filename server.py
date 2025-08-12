from flask import Flask, request, jsonify, send_from_directory, session, redirect, send_file, g
from flask_cors import CORS
import sqlite3
import os
import requests
from werkzeug.utils import secure_filename
import json
import time
from datetime import datetime, timezone
import hashlib
import uuid
import secrets
from functools import wraps
import re
import threading
import logging
from logging.handlers import RotatingFileHandler

app = Flask(__name__)
# Настройка CORS для всех маршрутов
CORS(app, resources={r"/*": {"origins": "*", "supports_credentials": True, "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization", "Accept", "X-Client-Version", "X-Platform"]}})  # Разрешаем кросс-доменные запросы для всех маршрутов
app.secret_key = os.environ.get('SECRET_KEY', 'default_secret_key_for_development')

# --- Централизованный логгер приложения ---
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO').upper()
LOG_BODY_PREVIEW_BYTES = int(os.environ.get('LOG_BODY_PREVIEW_BYTES', '2000'))
SLOW_REQUEST_THRESHOLD_S = float(os.environ.get('SLOW_REQUEST_THRESHOLD_S', '2.0'))

logger = logging.getLogger('app')
if not logger.handlers:
    logger.setLevel(LOG_LEVEL)
    formatter = logging.Formatter('%(asctime)s %(levelname)s [%(name)s] %(message)s')

    console_handler = logging.StreamHandler()
    console_handler.setLevel(LOG_LEVEL)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    file_handler = RotatingFileHandler('server.log', maxBytes=5*1024*1024, backupCount=3, encoding='utf-8')
    file_handler.setLevel(LOG_LEVEL)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

# Урезаем болтливость werkzeug access-логов, так как у нас есть свой
logging.getLogger('werkzeug').setLevel(logging.WARNING)

# Вспомогательные функции для логов
def _get_client_ip():
    forwarded_for = request.headers.get('X-Forwarded-For')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()
    return request.remote_addr

# Корреляционный ID и логирование запроса
@app.before_request
def assign_request_id_and_log_request():
    try:
        g.request_id = request.headers.get('X-Request-ID') or uuid.uuid4().hex
        g.request_start_ts = time.time()
        query_string = request.query_string.decode('utf-8', errors='ignore') if request.query_string else ''
        content_type = request.headers.get('Content-Type', '-')
        content_length = request.headers.get('Content-Length', '-')
        origin = request.headers.get('Origin', '-')
        referer = request.headers.get('Referer', '-')
        ua = request.headers.get('User-Agent', '-')

        # Безопасный предпросмотр тела запроса (ограниченный)
        body_preview = ''
        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                raw = request.get_data(cache=True) or b''
                body_preview = raw[:LOG_BODY_PREVIEW_BYTES].decode('utf-8', errors='replace')
            except Exception:
                body_preview = '<unavailable>'

        logger.info(
            f"REQ id={g.request_id} {request.method} {request.path} qs='{query_string}' "
            f"ip={_get_client_ip()} ct='{content_type}' clen={content_length} "
            f"origin='{origin}' referer='{referer}' ua='{ua}' body_preview='{body_preview}'"
        )
    except Exception as log_err:
        # Никогда не роняем обработку запроса из-за логирования
        print(f"[LOG_ERROR] before_request: {log_err}")

# Логирование ответа и добавление X-Request-ID
@app.after_request
def add_request_id_and_log_response(response):
    try:
        request_id = getattr(g, 'request_id', uuid.uuid4().hex)
        duration_ms = None
        if hasattr(g, 'request_start_ts'):
            duration_ms = int((time.time() - g.request_start_ts) * 1000)
        response.headers['X-Request-ID'] = request_id

        status = response.status_code
        content_length = response.calculate_content_length()
        level = logging.INFO
        if status >= 500:
            level = logging.ERROR
        elif status >= 400:
            level = logging.WARNING

        msg = f"RES id={request_id} {request.method} {request.path} status={status} dur_ms={duration_ms} rlen={content_length}"
        if duration_ms is not None and duration_ms >= int(SLOW_REQUEST_THRESHOLD_S * 1000):
            msg += " SLOW"
            level = max(level, logging.WARNING)
        logger.log(level, msg)
    except Exception as log_err:
        print(f"[LOG_ERROR] after_request: {log_err}")
    return response

# Унифицированные обработчики ошибок с логами
@app.errorhandler(404)
def handle_404(e):
    try:
        rid = getattr(g, 'request_id', '-')
        logger.warning(f"ERR id={rid} 404 {request.method} {request.path} qs={dict(request.args)}")
    except Exception:
        pass
    return e

@app.errorhandler(405)
def handle_405(e):
    try:
        rid = getattr(g, 'request_id', '-')
        logger.warning(f"ERR id={rid} 405 {request.method} {request.path} qs={dict(request.args)}")
    except Exception:
        pass
    return e

@app.errorhandler(Exception)
def handle_exception(e):
    try:
        rid = getattr(g, 'request_id', '-')
        logger.exception(f"ERR id={rid} 500 {request.method} {request.path}: {e}")
        # Не меняем глобально формат ответов, но добавляем request_id для отладки
        return jsonify({'success': False, 'message': 'Внутренняя ошибка сервера', 'request_id': rid}), 500
    except Exception:
        # На крайний случай
        return jsonify({'success': False, 'message': 'Критическая ошибка'}), 500

# Настройка для загрузки файлов
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Глобальные переменные для хранения путей к favicon и логотипу
SITE_FAVICON = None
SITE_LOGO = None

# Глобальная блокировка для работы с файлом site_status.json
SITE_STATUS_LOCK = threading.Lock()
SITE_STATUS_FILE = 'site_status.json'

# Функция для загрузки настроек сайта, включая favicon и логотип
def load_site_settings():
    global SITE_FAVICON, SITE_LOGO
    try:
        conn = sqlite3.connect('store.db')
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM settings WHERE key IN ('site_favicon', 'site_logo')")
        settings = cursor.fetchall()
        conn.close()
        
        for key, value in settings:
            if key == 'site_favicon':
                SITE_FAVICON = value
            elif key == 'site_logo':
                SITE_LOGO = value
        
        print(f"Загружены настройки сайта: favicon={SITE_FAVICON}, logo={SITE_LOGO}")
    except Exception as e:
        print(f"Ошибка при загрузке настроек сайта: {e}")

# Инициализация базы данных store.db
def init_store_db():
    """Инициализация базы данных store.db и создание таблицы settings"""
    try:
        # Проверяем, существует ли файл базы данных
        db_exists = os.path.exists('store.db')
        
        # Если база существует, но пуста (размер 0), удаляем ее
        if db_exists and os.path.getsize('store.db') == 0:
            os.remove('store.db')
            print(f"Удален пустой файл базы данных store.db")
            db_exists = False
        
        # Подключаемся к базе данных
        conn = sqlite3.connect('store.db')
        cursor = conn.cursor()
        
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
        
        # Сохраняем изменения и закрываем соединение
        conn.commit()
        conn.close()
        
        print(f"База данных store.db успешно инициализирована")
    except Exception as e:
        print(f"Ошибка при инициализации базы данных store.db: {e}")

# Загружаем настройки при запуске сервера
init_store_db()
load_site_settings()

# Генерация секретного ключа при запуске сервера
CSRF_TOKEN = secrets.token_hex(32)

# Добавляем поддержку CORS для всех маршрутов
@app.after_request
def cors_after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Client-Version,X-Platform')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Обработка OPTIONS запросов для CORS
# Удалено дублирование OPTIONS для /api/orders, так как оно обрабатывается универсальным маршрутом ниже

# Обработка OPTIONS запросов для API настроек
@app.route('/api/settings', methods=['OPTIONS'])
def handle_options_settings():
    response = app.make_default_options_response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Cache-Control')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

# Обработка OPTIONS запросов для API загрузки файлов
@app.route('/api/upload-logo', methods=['OPTIONS'])
def handle_options_upload_logo():
    response = app.make_default_options_response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
    return response

@app.route('/api/upload-favicon', methods=['OPTIONS'])
def handle_options_upload_favicon():
    response = app.make_default_options_response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
    return response

# Обработка OPTIONS запросов для API контакта с разработчиком
@app.route('/api/contact-dev', methods=['OPTIONS'])
def handle_options_contact_dev():
    response = app.make_default_options_response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
    return response

# Инициализация базы данных
def init_db():
    conn = sqlite3.connect('products.db')
    c = conn.cursor()
    # Таблица заказов
    c.execute('''CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT,
        customer_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        shipping_address TEXT,
        total_amount REAL,
        status TEXT,
        comment TEXT,
        contact_method TEXT,
        created_at TEXT,
        updated_at TEXT
    )''')
    # Таблица товаров в заказе
    c.execute('''CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        product_name TEXT,
        price REAL,
        quantity INTEGER,
        FOREIGN KEY(order_id) REFERENCES orders(id)
    )''')
    # Таблица контрагентов (опционально)
    c.execute('''CREATE TABLE IF NOT EXISTS counterparty_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        company_name TEXT,
        company_inn TEXT,
        company_kpp TEXT,
        company_ogrn TEXT,
        company_address TEXT,
        contact_name TEXT,
        contact_position TEXT,
        contact_phone TEXT,
        contact_email TEXT,
        additional_info TEXT,
        FOREIGN KEY(order_id) REFERENCES orders(id)
    )''')
    conn.commit()
    # Убираем преждевременное закрытие соединения
    # conn.close()  # закрываем соединение после миграции

    # --- Миграция существующей таблицы orders: добавляем отсутствующие колонки ---
    c.execute("PRAGMA table_info(orders)")
    existing_cols = [row[1] for row in c.fetchall()]
    # Словарь: имя колонки -> тип данных
    required_cols = {
        'comment': 'TEXT',
        'contact_method': 'TEXT',
        'updated_at': 'TEXT'
    }
    for col_name, col_type in required_cols.items():
        if col_name not in existing_cols:
            try:
                c.execute(f"ALTER TABLE orders ADD COLUMN {col_name} {col_type}")
            except Exception as alter_err:
                # Если колонка появилась между проверкой и ALTER (гонка) – игнорируем
                print(f"[DB MIGRATION] Не удалось добавить колонку {col_name}: {alter_err}")
    # -----------------------------------------------------------------------

    conn.commit()
    conn.close()  # теперь можно закрыть соединение

# Вызов инициализации базы данных при запуске сервера
init_db()

# Функция для сохранения изображения с удаленного URL
def save_image_from_url(image_url):
    try:
        # Получение имени файла из URL
        filename = secure_filename(os.path.basename(image_url))
        local_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Загрузка изображения
        response = requests.get(image_url, stream=True)
        if response.status_code == 200:
            with open(local_path, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            return os.path.join('uploads', filename)
        return image_url  # Если не удалось загрузить, возвращаем исходный URL
    except Exception as e:
        print(f"Ошибка при загрузке изображения: {e}")
        return image_url

# Упрощенный декоратор для админ-панели (без проверки авторизации)
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Без проверки авторизации, всегда разрешаем доступ
        return f(*args, **kwargs)
    return decorated_function

# Маршруты для доступа к файлам админ-панели
@app.route('/admin', methods=['GET'])
def admin_redirect():
    # Перенаправляем сразу на дашборд
    return redirect('/admin/dashboard')

@app.route('/admin/dashboard', methods=['GET'])
@admin_required
def admin_dashboard_page():
    # Отдаем страницу дашборда только для администраторов
    return send_file('admin-dashboard.html')

@app.route('/admin-dashboard.html', methods=['GET'])
def admin_dashboard_direct():
    # Отдаем страницу дашборда напрямую (для тестирования)
    return send_file('admin-dashboard.html')

@app.route('/admin/panel', methods=['GET'])
@admin_required
def admin_panel_page():
    # Отдаем страницу управления товарами только для администраторов
    return send_file('admin-panel.html')

@app.route('/admin/panel.html', methods=['GET'])
@admin_required
def admin_panel_html_page():
    # Дополнительный маршрут для обработки запросов к /admin/panel.html
    return send_file('admin-panel.html')

@app.route('/admin/orders', methods=['GET'])
@admin_required
def admin_orders_page():
    # Отдаем страницу управления заказами
    return send_file('admin-orders.html')

@app.route('/admin/orders.html', methods=['GET'])
@admin_required
def admin_orders_html_page():
    # Дополнительный маршрут для обработки запросов к /admin/orders.html
    return send_file('admin-orders.html')

@app.route('/admin/support', methods=['GET'])
@admin_required
def admin_support_page():
    # Временно перенаправляем на дашборд, пока нет отдельной страницы поддержки
    return send_file('admin-dashboard.html')

@app.route('/admin/profile', methods=['GET'])
@admin_required
def admin_profile_page():
    # Временно перенаправляем на дашборд, пока нет отдельной страницы профиля
    return send_file('admin-dashboard.html')

@app.route('/admin/settings', methods=['GET'])
@admin_required
def admin_settings_page():
    # Отдаем страницу настроек
    return send_file('admin-settings.html')

@app.route('/admin/settings.html', methods=['GET'])
@admin_required
def admin_settings_html_page():
    # Дополнительный маршрут для обработки запросов к /admin/settings.html
    return send_file('admin-settings.html')

@app.route('/admin-settings.html', methods=['GET'])
def admin_settings_direct():
    # Отдаем страницу настроек напрямую (для тестирования)
    return send_file('admin-settings.html')

# API для получения информации о текущем пользователе (упрощенная версия)
@app.route('/api/auth/user', methods=['GET'])
def get_current_user():
    # Возвращаем заглушку с информацией об администраторе
    return jsonify({
        'success': True,
        'user': {
            'id': 1,
            'username': 'admin',
            'email': 'admin@example.com',
            'role': 'admin',
            'full_name': 'Администратор'
        }
    }), 200

# --- Новый универсальный маршрут для /api/orders ---
@app.route('/api/orders', methods=['GET', 'POST', 'OPTIONS'])
def orders():
    print('>>> [DEBUG] /api/orders', request.method, dict(request.headers))
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Client-Version,X-Platform')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    elif request.method == 'GET':
        try:
            # Получаем параметры запроса
            page = request.args.get('page', 1, type=int)
            status = request.args.get('status', 'all')
            limit = request.args.get('limit', 10, type=int)
            offset = (page - 1) * limit
            email = request.args.get('email')
            
            conn = sqlite3.connect('products.db')
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Формируем запрос в зависимости от статуса и email
            query = '''SELECT * FROM orders WHERE status != "error"'''
            params = []
            if status != 'all':
                query += ' AND status = ?'
                params.append(status)
            if email:
                query += ' AND customer_email = ?'
                params.append(email)
            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
            params.extend([limit, offset])
            cursor.execute(query, params)
            orders = [dict(row) for row in cursor.fetchall()]
            
            # Получаем общее количество заказов для пагинации
            count_query = '''SELECT COUNT(*) FROM orders WHERE status != "error"'''
            count_params = []
            
            if status != 'all':
                count_query += ' AND status = ?'
                count_params.append(status)
                
            if email:
                count_query += ' AND customer_email = ?'
                count_params.append(email)
                
            cursor.execute(count_query, count_params)
            total_count = cursor.fetchone()[0]
            
            for order in orders:
                cursor.execute('''SELECT oi.*, p.title, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?''', (order['id'],))
                order['items'] = [dict(row) for row in cursor.fetchall()]
                
                # Проверяем существование таблицы counterparty_data перед запросом
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='counterparty_data'")
                if cursor.fetchone():
                    # Получаем данные о контрагенте, если таблица существует
                    cursor.execute('''SELECT * FROM counterparty_data WHERE order_id = ?''', (order['id'],))
                    counterparty = cursor.fetchone()
                    if counterparty:
                        order['counterparty_data'] = dict(counterparty)
                    
            conn.close()
            
            # Возвращаем результат с пагинацией
            return jsonify({
                'success': True, 
                'orders': orders,
                'pagination': {
                    'total': total_count,
                    'page': page,
                    'limit': limit,
                    'pages': (total_count + limit - 1) // limit
                }
            }), 200
        except Exception as e:
            print(f"Ошибка при получении списка заказов: {str(e)}")
            return jsonify({'success': False, 'message': f'Ошибка при получении списка заказов: {str(e)}'}), 500
    elif request.method == 'POST':
        print('>>> Вызван create_order')
        try:
            # Получаем и логируем данные запроса
            print('>>> [DEBUG] Получен POST запрос к /api/orders')
            print('>>> [DEBUG] Content-Type:', request.headers.get('Content-Type'))
            print('>>> [DEBUG] Данные запроса:', request.get_data(as_text=True))
            
            # Проверяем, что запрос содержит JSON
            if not request.is_json:
                print('>>> [ERROR] Запрос не содержит JSON данных')
                return jsonify({'success': False, 'message': 'Запрос должен содержать JSON данные'}), 400
            
            data = request.json
            print('>>> [DEBUG] Распарсенные JSON данные:', data)
            
            customer_name = data.get('customer_name')
            customer_email = data.get('customer_email')
            customer_phone = data.get('customer_phone')
            shipping_address = data.get('shipping_address')
            items = data.get('items', [])
            comment = data.get('comment', '')
            contact_method = data.get('contact_method', 'phone')
            order_number = data.get('order_number')
            counterparty_data = data.get('counterparty_data')
            
            if not customer_name or not items or len(items) == 0:
                print('>>> [ERROR] Отсутствуют обязательные поля: customer_name или items')
                return jsonify({'success': False, 'message': 'Необходимо указать имя клиента и хотя бы один товар'}), 400
            
            # Валидация товаров
            invalid_items = []
            valid_items = []
            total_amount = 0
            
            for item in items:
                if 'product_id' not in item or 'quantity' not in item:
                    invalid_items.append({
                        'item': item,
                        'reason': 'Отсутствуют обязательные поля product_id или quantity'
                    })
                    continue
                
                # Проверяем, что product_id является числом
                try:
                    product_id = int(item['product_id'])
                except (ValueError, TypeError):
                    invalid_items.append({
                        'item': item,
                        'reason': f'Некорректный ID товара: {item["product_id"]}'
                    })
                    continue
                
                # Проверяем, что quantity является положительным числом
                try:
                    quantity = int(item['quantity'])
                    if quantity <= 0:
                        invalid_items.append({
                            'item': item,
                            'reason': f'Количество должно быть больше 0: {quantity}'
                        })
                        continue
                except (ValueError, TypeError):
                    invalid_items.append({
                        'item': item,
                        'reason': f'Некорректное количество: {item["quantity"]}'
                    })
                    continue
                
                # Проверяем существование товара в базе данных
                conn = sqlite3.connect('products.db')
                cursor = conn.cursor()
                cursor.execute('SELECT id, title, price FROM products WHERE id = ?', (product_id,))
                product = cursor.fetchone()
                conn.close()
                
                if not product:
                    invalid_items.append({
                        'item': item,
                        'reason': f'Товар с ID {product_id} не найден в базе данных'
                    })
                    continue
                
                # Товар валиден, добавляем в список
                valid_items.append({
                    'product_id': product_id,
                    'quantity': quantity,
                    'price': product[2],
                    'title': product[1]
                })
                total_amount += product[2] * quantity
            
            # Если есть невалидные товары, возвращаем ошибку
            if invalid_items:
                error_message = 'Обнаружены некорректные товары:\n'
                for invalid_item in invalid_items:
                    error_message += f"- {invalid_item['reason']}\n"
                error_message += '\nПожалуйста, очистите корзину и добавьте товары заново.'
                
                print('>>> [ERROR] Некорректные товары:', invalid_items)
                return jsonify({
                    'success': False, 
                    'message': error_message,
                    'invalid_items': invalid_items
                }), 400
            
            # Если нет валидных товаров, возвращаем ошибку
            if not valid_items:
                print('>>> [ERROR] Нет валидных товаров для заказа')
                return jsonify({'success': False, 'message': 'Нет валидных товаров для заказа'}), 400
            
            conn = sqlite3.connect('products.db')
            cursor = conn.cursor()
            
            # Проверяем, существует ли таблица counterparty_data
            cursor.execute('''
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='counterparty_data'
            ''')
            if not cursor.fetchone():
                # Создаем таблицу для данных о контрагентах
                print('>>> [DEBUG] Создаем таблицу counterparty_data')
                cursor.execute('''
                    CREATE TABLE counterparty_data (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        order_id INTEGER NOT NULL,
                        company_name TEXT,
                        company_inn TEXT,
                        company_kpp TEXT,
                        company_ogrn TEXT,
                        company_address TEXT,
                        contact_name TEXT,
                        contact_position TEXT,
                        contact_phone TEXT,
                        contact_email TEXT,
                        additional_info TEXT,
                        created_at TEXT,
                        updated_at TEXT,
                        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
                    )
                ''')
                conn.commit()
            
            # Если не передан номер заказа, генерируем его
            if not order_number:
                order_number = f"ORD-{int(time.time())}-{str(uuid.uuid4())[:8]}"
                print('>>> [DEBUG] Сгенерирован номер заказа:', order_number)
            
            print('>>> [DEBUG] Вставляем заказ в БД')
            cursor.execute(
                'INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address, total_amount, status, comment, contact_method, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                (
                    order_number,
                    customer_name,
                    customer_email,
                    customer_phone,
                    shipping_address,
                    total_amount,
                    'new',
                    comment,
                    contact_method,
                    datetime.now().isoformat(),
                    datetime.now().isoformat()
                )
            )
            order_id = cursor.lastrowid
            print('>>> [DEBUG] Создан заказ с ID:', order_id)
            
            for item in valid_items:
                cursor.execute('SELECT price FROM products WHERE id = ?', (item['product_id'],))
                product = cursor.fetchone()
                price = product[0]
                cursor.execute(
                    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                    (order_id, item['product_id'], item['quantity'], price)
                )
                print('>>> [DEBUG] Добавлен товар в заказ:', item['product_id'])
            
            # Если есть данные о контрагенте, сохраняем их
            if counterparty_data:
                print('>>> [DEBUG] Сохраняем данные о контрагенте')
                cursor.execute(
                    '''
                    INSERT INTO counterparty_data (
                        order_id, company_name, company_inn, company_kpp, company_ogrn, 
                        company_address, contact_name, contact_position, contact_phone, 
                        contact_email, additional_info, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''',
                    (
                        order_id,
                        counterparty_data.get('company_name', ''),
                        counterparty_data.get('company_inn', ''),
                        counterparty_data.get('company_kpp', ''),
                        counterparty_data.get('company_ogrn', ''),
                        counterparty_data.get('company_address', ''),
                        counterparty_data.get('contact_name', ''),
                        counterparty_data.get('contact_position', ''),
                        counterparty_data.get('contact_phone', ''),
                        counterparty_data.get('contact_email', ''),
                        counterparty_data.get('additional_info', ''),
                        datetime.now().isoformat(),
                        datetime.now().isoformat()
                    )
                )
            
            conn.commit()
            conn.close()
            
            # Логируем действие создания заказа
            log_admin_action('create_order', {
                'order_id': order_id,
                'order_number': order_number,
                'customer_name': customer_name,
                'total_amount': total_amount
            })
            
            print('>>> [DEBUG] Заказ успешно создан')
            response_data = {
                'success': True, 
                'message': 'Заказ успешно создан', 
                'order_id': order_id, 
                'order_number': order_number
            }
            print('>>> [DEBUG] Отправляем ответ:', response_data)
            return jsonify(response_data), 201
        except Exception as e:
            print('>>> [ERROR] Ошибка при создании заказа:', str(e))
            return jsonify({'success': False, 'message': str(e)}), 500
# --- Конец универсального маршрута ---

# API для получения одного заказа по ID
@app.route('/api/orders/<int:order_id>', methods=['GET'])
@admin_required
def get_order(order_id):
    try:
        conn = sqlite3.connect('products.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Получаем заказ
        cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
        order = cursor.fetchone()
        
        if not order:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Заказ не найден'
            }), 404
            
        order_dict = dict(order)
        
        # Получаем товары заказа
        cursor.execute('''
            SELECT oi.*, p.title, p.image_url 
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        ''', (order_id,))
        order_dict['items'] = [dict(row) for row in cursor.fetchall()]
        
        # Получаем данные о контрагенте, если они есть
        cursor.execute('''SELECT * FROM counterparty_data WHERE order_id = ?''', (order_id,))
        counterparty = cursor.fetchone()
        if counterparty:
            order_dict['counterparty_data'] = dict(counterparty)
            
        conn.close()
        
        return jsonify({
            'success': True,
            'order': order_dict
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API для обновления статуса заказа
@app.route('/api/orders/<int:order_id>/status', methods=['PUT'])
@admin_required
def update_order_status(order_id):
    try:
        data = request.json
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({
                'success': False,
                'message': 'Необходимо указать новый статус'
            }), 400
            
        conn = sqlite3.connect('products.db')
        cursor = conn.cursor()
        
        # Проверяем, существует ли заказ
        cursor.execute('SELECT id, order_number, customer_name FROM orders WHERE id = ?', (order_id,))
        order = cursor.fetchone()
        if not order:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Заказ не найден'
            }), 404
        
        order_id_db, order_number, customer_name = order
        
        # Если статус "cancelled", удаляем заказ полностью
        if new_status == 'cancelled':
            # Удаляем связанные записи из order_items
            cursor.execute('DELETE FROM order_items WHERE order_id = ?', (order_id,))
            
            # Удаляем связанные записи из counterparty_data (если таблица существует)
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='counterparty_data'")
            if cursor.fetchone():
                cursor.execute('DELETE FROM counterparty_data WHERE order_id = ?', (order_id,))
            
            # Удаляем сам заказ
            cursor.execute('DELETE FROM orders WHERE id = ?', (order_id,))
            
            conn.commit()
            conn.close()
            
            # Логируем действие удаления заказа
            log_admin_action('delete_cancelled_order', {
                'order_id': order_id,
                'order_number': order_number,
                'customer_name': customer_name,
                'reason': 'Статус изменен на "cancelled"'
            })
            
            return jsonify({
                'success': True,
                'message': 'Заказ отменен и удален из системы'
            }), 200
        else:
            # Для других статусов просто обновляем статус
            cursor.execute(
                'UPDATE orders SET status = ?, updated_at = ? WHERE id = ?',
                (new_status, datetime.now().isoformat(), order_id)
            )
            conn.commit()
            conn.close()
            
            # Логируем действие обновления статуса
            log_admin_action('update_order_status', {
                'order_id': order_id,
                'order_number': order_number,
                'customer_name': customer_name,
                'new_status': new_status
            })
            
            return jsonify({
                'success': True,
                'message': 'Статус заказа успешно обновлен'
            }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API для получения статистики
@app.route('/api/stats', methods=['GET'])
@admin_required
def get_stats():
    try:
        conn = sqlite3.connect('products.db')
        cursor = conn.cursor()
        # Количество товаров
        cursor.execute('SELECT COUNT(*) FROM products')
        products_count = cursor.fetchone()[0]
        # Количество завершённых заказов (только выполненные или доставленные)
        cursor.execute('SELECT COUNT(*) FROM orders WHERE status IN ("completed", "delivered") AND status != "error"')
        orders_count = cursor.fetchone()[0]
        # Общая сумма завершённых заказов
        cursor.execute('SELECT SUM(total_amount) FROM orders WHERE status IN ("completed", "delivered") AND status != "error"')
        total_sales = cursor.fetchone()[0] or 0
        # Количество новых заказов
        cursor.execute('SELECT COUNT(*) FROM orders WHERE status = "new" AND status != "error"')
        new_orders_count = cursor.fetchone()[0]
        # Количество отменённых заказов (теперь всегда 0, так как они удаляются)
        cancelled_orders_count = 0
        # Количество заказов по статусам (без error)
        cursor.execute('SELECT status, COUNT(*) FROM orders WHERE status != "error" GROUP BY status')
        status_counts = {row[0]: row[1] for row in cursor.fetchall()}
        # Средний чек по завершённым заказам
        cursor.execute('SELECT AVG(total_amount) FROM orders WHERE status IN ("completed", "delivered") AND status != "error"')
        avg_check = cursor.fetchone()[0] or 0
        # Количество уникальных покупателей (по email)
        cursor.execute('SELECT COUNT(DISTINCT customer_email) FROM orders WHERE customer_email IS NOT NULL AND customer_email != "" AND status != "error"')
        unique_buyers = cursor.fetchone()[0]
        # Топ-5 самых продаваемых товаров (по количеству) — только из заказов без error
        cursor.execute('''
            SELECT p.title, SUM(oi.quantity) as total_sold
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != "error"
            GROUP BY oi.product_id
            ORDER BY total_sold DESC
            LIMIT 5
        ''')
        top_products = [{'title': row[0], 'sold': row[1]} for row in cursor.fetchall()]
        # Топ-5 самых активных покупателей (по количеству заказов, без error)
        cursor.execute('''
            SELECT customer_email, customer_name, COUNT(*) as orders_count
            FROM orders
            WHERE customer_email IS NOT NULL AND customer_email != "" AND status != "error"
            GROUP BY customer_email
            ORDER BY orders_count DESC
            LIMIT 5
        ''')
        top_customers = [{'email': row[0], 'name': row[1], 'orders': row[2]} for row in cursor.fetchall()]
        # Количество товаров без категории
        cursor.execute('SELECT COUNT(*) FROM products WHERE category IS NULL OR category = ""')
        products_without_category = cursor.fetchone()[0]
        # Количество товаров в наличии/нет в наличии (если есть поле наличия)
        # Если поля нет, пропускаем
        try:
            cursor.execute('SELECT COUNT(*) FROM products WHERE in_stock = 1')
            products_in_stock = cursor.fetchone()[0]
            cursor.execute('SELECT COUNT(*) FROM products WHERE in_stock = 0')
            products_out_of_stock = cursor.fetchone()[0]
        except Exception:
            products_in_stock = None
            products_out_of_stock = None
        # Динамика продаж по дням (за последние 30 дней, без error)
        cursor.execute('''
            SELECT DATE(created_at), SUM(total_amount) FROM orders
            WHERE status IN ("completed", "delivered") AND status != "error"
            AND created_at >= DATE('now', '-30 day')
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at)
        ''')
        sales_by_day = [{'date': row[0], 'total': row[1] or 0} for row in cursor.fetchall()]
        # Динамика новых заказов по дням (за последние 30 дней, без error)
        cursor.execute('''
            SELECT DATE(created_at), COUNT(*) FROM orders
            WHERE created_at >= DATE('now', '-30 day') AND status != "error"
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at)
        ''')
        orders_by_day = [{'date': row[0], 'count': row[1]} for row in cursor.fetchall()]
        # Количество непрочитанных сообщений (для админа с ID=1)
        cursor.execute('SELECT COUNT(*) FROM messages WHERE receiver_id = 1 AND is_read = 0')
        unread_messages_count = cursor.fetchone()[0]
        # Статистика по категориям товаров
        cursor.execute('''
            SELECT category, COUNT(*) as count
            FROM products
            WHERE category IS NOT NULL AND category != ''
            GROUP BY category
        ''')
        categories_stats = [{'category': row[0], 'count': row[1]} for row in cursor.fetchall()]
        conn.close()
        return jsonify({
            'success': True,
            'stats': {
                'products_count': products_count,
                'orders_count': orders_count,
                'total_sales': total_sales,
                'new_orders_count': new_orders_count,
                'cancelled_orders_count': cancelled_orders_count,
                'status_counts': status_counts,
                'avg_check': avg_check,
                'unique_buyers': unique_buyers,
                'top_products': top_products,
                'top_customers': top_customers,
                'products_without_category': products_without_category,
                'products_in_stock': products_in_stock,
                'products_out_of_stock': products_out_of_stock,
                'sales_by_day': sales_by_day,
                'orders_by_day': orders_by_day,
                'unread_messages_count': unread_messages_count,
                'categories': categories_stats
            }
        }), 200
    except Exception as e:
        print(f"Ошибка при получении статистики: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Упрощенный декоратор CSRF-защиты (без проверки токена)
def csrf_protected(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Без проверки CSRF-токена, всегда разрешаем доступ
        return f(*args, **kwargs)
    return decorated_function

# API для добавления нового товара
@app.route('/api/products', methods=['POST'])
@admin_required
@csrf_protected
def add_product():
    try:
        data = request.json
        required_fields = ['title', 'price', 'category']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'message': f'Поле {field} обязательно для заполнения'
                }), 400
        # Проверка обязательности подкатегории, если для категории есть подкатегории
        conn = sqlite3.connect('products.db')
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM subcategories WHERE category_code = ?', (data['category'],))
        subcat_count = cursor.fetchone()[0]
        if subcat_count > 0 and not data.get('subcategory_code'):
            conn.close()
            return jsonify({'success': False, 'message': 'Для выбранной категории требуется выбрать подкатегорию'}), 400
        # Обработка изображения, если указан URL
        image_url = data.get('image_url', '')
        if image_url:
            local_image_path = save_image_from_url(image_url)
            data['image_url'] = local_image_path
        
        conn = sqlite3.connect('products.db')
        cursor = conn.cursor()
        
        # Добавляем товар в базу данных
        cursor.execute(
            '''INSERT INTO products (title, description, price, image_url, category, sku, subcategory_code) 
               VALUES (?, ?, ?, ?, ?, ?, ?)''',
            (
                data['title'],
                data.get('description', ''),
                data['price'],
                data.get('image_url', ''),
                data['category'],
                data.get('sku', ''),
                data.get('subcategory_code', '')
            )
        )
        
        # Получаем ID добавленного товара
        product_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Товар успешно добавлен',
            'product_id': product_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API для получения всех товаров
@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        category = request.args.get('category', '')
        subcategory = request.args.get('subcategory', '')
        
        conn = sqlite3.connect('products.db')
        conn.row_factory = sqlite3.Row  # Возвращать словари вместо кортежей
        cursor = conn.cursor()
        
        # Логируем все категории в базе данных для отладки
        cursor.execute('SELECT DISTINCT category FROM products')
        available_categories = [row[0] for row in cursor.fetchall()]
        print(f"Доступные категории в базе данных: {available_categories}")
        
        if category and subcategory:
            # Добавляем логирование для отладки
            print(f"Запрос товаров по категории: {category} и подкатегории: {subcategory}")
            
            # Сначала проверяем, есть ли подкатегория с таким кодом
            cursor.execute('SELECT id FROM subcategories WHERE code = ? AND category_code = ?', (subcategory, category))
            subcat_id = cursor.fetchone()
            
            if subcat_id:
                # Если таблица products уже имеет поле subcategory_code
                cursor.execute("PRAGMA table_info(products)")
                columns = [column[1] for column in cursor.fetchall()]
                
                if 'subcategory_code' in columns:
                    cursor.execute(
                        'SELECT * FROM products WHERE LOWER(category) = ? AND subcategory_code = ? ORDER BY created_at DESC', 
                        (category.lower(), subcategory)
                    )
                else:
                    # Если нет поля subcategory_code, возвращаем товары только по категории
                    cursor.execute(
                        'SELECT * FROM products WHERE LOWER(category) = ? ORDER BY created_at DESC', 
                        (category.lower(),)
                    )
            else:
                # Если подкатегория не найдена, возвращаем товары только по категории
                cursor.execute(
                    'SELECT * FROM products WHERE LOWER(category) = ? ORDER BY created_at DESC', 
                    (category.lower(),)
                )
        elif category:
            # Приводим категорию к нижнему регистру для более надежного сравнения
            category_lower = category.lower()
            cursor.execute('SELECT * FROM products WHERE LOWER(category) = ? ORDER BY created_at DESC', (category_lower,))
        else:
            cursor.execute('SELECT * FROM products ORDER BY created_at DESC')
            
        products = [dict(row) for row in cursor.fetchall()]
        
        # Логируем количество найденных товаров и их категории
        print(f"Найдено товаров: {len(products)}")
        if products:
            product_categories = [p.get('category', 'None') for p in products]
            print(f"Категории найденных товаров: {product_categories}")
        
        conn.close()
        
        return jsonify({
            'success': True,
            'products': products
        }), 200
        
    except Exception as e:
        print(f"Ошибка при получении товаров: {str(e)}")
        return jsonify({'error': str(e)}), 500

# API для получения одного товара по ID
@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    try:
        conn = sqlite3.connect('products.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
        product = cursor.fetchone()
        conn.close()
        
        if product:
            return jsonify({
                'success': True,
                'product': dict(product)
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Товар не найден'
            }), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Маршрут для доступа к загруженным файлам
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    response = send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

# Отдельный маршрут для favicon.ico
@app.route('/favicon.ico')
def favicon():
    # Если указан пользовательский favicon в настройках
    if SITE_FAVICON:
        # Если это относительный путь к файлу в папке uploads
        if SITE_FAVICON.startswith('/uploads/'):
            filename = os.path.basename(SITE_FAVICON)
            if os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], filename)):
                response = send_from_directory(app.config['UPLOAD_FOLDER'], filename)
                # Добавляем заголовки для CORS, чтобы разрешить доступ с других доменов
                response.headers['Access-Control-Allow-Origin'] = '*'
                response.headers['Access-Control-Allow-Methods'] = 'GET'
                response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
                return response
        # Если путь к файлу в корневой директории
        elif os.path.exists(SITE_FAVICON.lstrip('/')):
            response = send_file(SITE_FAVICON.lstrip('/'))
            # Добавляем заголовки для CORS
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET'
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            return response
    
    # Пытаемся найти файлы favicon в директории uploads
    for filename in os.listdir(app.config['UPLOAD_FOLDER']):
        if filename.startswith('favicon_') and (filename.endswith('.png') or filename.endswith('.ico')):
            response = send_from_directory(app.config['UPLOAD_FOLDER'], filename)
            # Добавляем заголовки для CORS
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET'
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            return response
    
    # По умолчанию отдаем пустой ответ если ничего не найдено
    response = app.make_response(('', 204))
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response

# API для удаления товара
@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@admin_required
@csrf_protected
def delete_product(product_id):
    try:
        conn = sqlite3.connect('products.db')
        cursor = conn.cursor()
        
        # Получаем информацию о товаре перед удалением
        cursor.execute('SELECT image_url FROM products WHERE id = ?', (product_id,))
        product = cursor.fetchone()
        
        if not product:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Товар не найден'
            }), 404
        
        # Удаляем файл изображения, если он был сохранен локально
        image_url = product[0]
        if image_url and image_url.startswith('uploads/'):
            try:
                os.remove(os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(image_url)))
            except:
                pass  # Игнорируем ошибку, если файл не найден
        
        # Удаляем запись из базы данных
        cursor.execute('DELETE FROM products WHERE id = ?', (product_id,))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Товар успешно удален'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API для обновления данных товара
@app.route('/api/products/<int:product_id>', methods=['PUT'])
@admin_required
@csrf_protected
def update_product(product_id):
    try:
        data = request.json
        conn = sqlite3.connect('products.db')
        cursor = conn.cursor()
        # Проверяем, существует ли товар
        cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
        product = cursor.fetchone()
        if not product:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Товар не найден'
            }), 404
        # Проверка обязательности подкатегории, если для категории есть подкатегории
        category_code = data.get('category', product[5])
        cursor.execute('SELECT COUNT(*) FROM subcategories WHERE category_code = ?', (category_code,))
        subcat_count = cursor.fetchone()[0]
        if subcat_count > 0 and not data.get('subcategory_code'):
            conn.close()
            return jsonify({'success': False, 'message': 'Для выбранной категории требуется выбрать подкатегорию'}), 400
        # Обработка изображения, если указан новый URL
        image_url = data.get('image_url')
        if image_url and image_url != product[4]:  # Если URL изображения был изменен
            local_image_path = save_image_from_url(image_url)
            data['image_url'] = local_image_path
            
            # Удаляем старое изображение, если оно было локальным
            old_image = product[4]
            if old_image and old_image.startswith('uploads/'):
                try:
                    os.remove(os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(old_image)))
                except:
                    pass
        
        # Обновляем данные товара
        cursor.execute(
            '''UPDATE products 
               SET title = COALESCE(?, title),
                   description = COALESCE(?, description),
                   price = COALESCE(?, price),
                   image_url = COALESCE(?, image_url),
                   category = COALESCE(?, category),
                   sku = COALESCE(?, sku),
                   subcategory_code = COALESCE(?, subcategory_code)
               WHERE id = ?''',
            (
                data.get('title'), 
                data.get('description'),
                data.get('price'),
                data.get('image_url'),
                data.get('category'),
                data.get('sku'),
                data.get('subcategory_code'),
                product_id
            )
        )
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Товар успешно обновлен'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Основной маршрут для проверки работоспособности сервера
@app.route('/')
def index():
    return send_file('index.html')

@app.route('/<path:path>')
def serve_file(path):
    # Если запрашивается HTML файл, применяем динамический favicon и логотип
    if path.endswith('.html'):
        try:
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
                
                # Если есть настроенный favicon, заменяем стандартный
                if SITE_FAVICON:
                    favicon_url = SITE_FAVICON
                    if not favicon_url.startswith('/') and not favicon_url.startswith('http'):
                        favicon_url = '/' + favicon_url
                    
                    # Новый тег favicon для добавления
                    favicon_tag = f'<link rel="icon" href="{favicon_url}" type="image/x-icon">'
                    
                    # Ищем встроенные SVG-фавиконы, которые используются в проекте
                    # 1. Исправляем известный паттерн встроенного SVG-фавикона, используемого в проекте
                    svg_pattern = r'<link rel="icon" href="data:image/svg\+xml,[^"]+" type="image/svg\+xml">'
                    content = re.sub(svg_pattern, '', content)
                    
                    # Проверяем на остатки SVG-тегов
                    if '<text y=\'80\' font-size=\'80\' font-family=\'Cinzel\'>D</text>' in content:
                        content = content.replace('<text y=\'80\' font-size=\'80\' font-family=\'Cinzel\'>D</text>', '')
                    
                    # 2. Удаляем обычные теги favicon
                    favicon_pattern = r'<link\s+[^>]*rel=["\']icon["\'][^>]*>'
                    content = re.sub(favicon_pattern, '', content)
                    
                    # Добавляем новый тег favicon после тега head
                    head_pattern = r'(<head>)'
                    content = re.sub(head_pattern, r'\1\n  ' + favicon_tag, content)
                
                # Добавляем заголовки для отключения кеширования
                response = app.make_response(content)
                response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
                response.headers['Pragma'] = 'no-cache'
                response.headers['Expires'] = '0'
                return response
        except Exception as e:
            print(f"Ошибка при применении динамического favicon: {e}")
            print(f"Путь файла: {path}")
    
    # Для всех остальных файлов просто отдаем их
    return send_file(path)

# Добавляем логирование действий администратора
def log_admin_action(action, details=None):
    try:
        conn = sqlite3.connect('products.db')
        cursor = conn.cursor()
        
        # Проверяем, существует ли таблица admin_logs
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='admin_logs';")
        if cursor.fetchone() is None:
            # Создаем таблицу, если она не существует
            cursor.execute('''
            CREATE TABLE admin_logs (
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
        
        # Записываем действие в лог (используем фиксированные значения для администратора)
        cursor.execute(
            'INSERT INTO admin_logs (user_id, username, action, details, ip_address) VALUES (?, ?, ?, ?, ?)',
            (
                1,  # ID администратора
                'admin',  # Имя администратора
                action,
                json.dumps(details) if details else None,
                request.remote_addr
            )
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Ошибка при логировании действия администратора: {e}")

# Обновляем API для получения логов действий администратора
@app.route('/api/admin/logs', methods=['GET'])
@admin_required
def get_admin_logs():
    try:
        conn = sqlite3.connect('products.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Получаем логи с пагинацией
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        offset = (page - 1) * per_page
        
        cursor.execute('''
            SELECT * FROM admin_logs 
            ORDER BY timestamp DESC
            LIMIT ? OFFSET ?
        ''', (per_page, offset))
        
        logs = [dict(row) for row in cursor.fetchall()]
        
        # Получаем общее количество логов
        cursor.execute('SELECT COUNT(*) FROM admin_logs')
        total_logs = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'logs': logs,
            'total': total_logs,
            'page': page,
            'per_page': per_page,
            'pages': (total_logs + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

TELEGRAM_BOT_TOKEN = '7939563786:AAFhyZELlsYsDKTdl8ofC4K4bRO0sYubFaE'
TELEGRAM_CHAT_ID = '5214842448'

def parse_user_agent(ua):
    # Примитивный парсер User-Agent
    browser = 'Неизвестно'
    device = 'Неизвестно'
    os = 'Неизвестно'
    if 'Chrome' in ua and 'Edg' not in ua:
        browser = 'Chrome'
    elif 'Firefox' in ua:
        browser = 'Firefox'
    elif 'Safari' in ua and 'Chrome' not in ua:
        browser = 'Safari'
    elif 'Edg' in ua:
        browser = 'Edge'
    elif 'Opera' in ua or 'OPR' in ua:
        browser = 'Opera'
    elif 'MSIE' in ua or 'Trident' in ua:
        browser = 'Internet Explorer'
    # ОС
    if 'Windows' in ua:
        os = 'Windows'
    elif 'Mac OS X' in ua:
        os = 'macOS'
    elif 'Android' in ua:
        os = 'Android'
    elif 'iPhone' in ua or 'iPad' in ua:
        os = 'iOS'
    elif 'Linux' in ua:
        os = 'Linux'
    # Устройство
    if 'Mobile' in ua or 'Android' in ua or 'iPhone' in ua:
        device = 'Мобильное'
    else:
        device = 'Десктоп'
    return f'{browser} / {os} / {device}'

@app.route('/api/contact-dev', methods=['POST'])
def contact_dev():
    try:
        data = request.json
        message = data.get('message', '').strip()
        if not message:
            print('Пустое сообщение!')
            return jsonify({'success': False, 'error': 'Пустое сообщение'}), 400
        # Сохраняем в базу (таблица contact_requests)
        conn = sqlite3.connect('products.db')
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS contact_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute(
            'INSERT INTO contact_requests (message) VALUES (?)',
            (message,)
        )
        conn.commit()
        conn.close()
        # Формируем максимально точное время
        now = datetime.now(timezone.utc).astimezone()
        now_str = now.isoformat(timespec='microseconds')
        user_ip = request.remote_addr
        user_agent = request.headers.get('User-Agent', '-')
        ua_info = parse_user_agent(user_agent)
        text = (
            f'🕒 Время: {now_str}\n'
            f'🌐 Браузер/устройство: {ua_info}\n'
            f'🔑 IP: {user_ip}\n'
            f'\nТекст сообщения:\n{message}'
        )
        print('Пробую отправить в Telegram:', text)
        try:
            tg_url = f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage'
            resp = requests.post(tg_url, data={'chat_id': TELEGRAM_CHAT_ID, 'text': text})
            print('Ответ Telegram:', resp.status_code, resp.text)
        except Exception as tg_err:
            print(f'Ошибка отправки в Telegram: {tg_err}')
        
        # Добавляем заголовки CORS для ответа
        response = jsonify({'success': True})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    except Exception as e:
        print(f"Ошибка при отправке сообщения разработчику: {str(e)}")
        # Добавляем заголовки CORS для ответа с ошибкой
        response = jsonify({'success': False, 'error': str(e)})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response, 500

# --- Новый эндпоинт для загрузки фото категории ---
@app.route('/api/upload-category-image', methods=['POST'])
def upload_category_image():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'Нет файла'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'Пустое имя файла'}), 400
    filename = secure_filename(file.filename)
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(save_path)
    return jsonify({'success': True, 'url': f'uploads/{filename}'}), 200

# --- Обновлённый API для категорий ---
@app.route('/api/categories', methods=['GET', 'POST'])
def categories():
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    if request.method == 'GET':
        cursor.execute('SELECT id, name, code, image_url FROM categories ORDER BY id')
        cats = [{'id': row[0], 'name': row[1], 'code': row[2], 'image_url': row[3]} for row in cursor.fetchall()]
        conn.close()
        return jsonify({'success': True, 'categories': cats}), 200
    elif request.method == 'POST':
        data = request.json
        name = data.get('name', '').strip()
        code = data.get('code', '').strip()
        image_url = data.get('image_url', '').strip()
        if not name or not code or not image_url:
            conn.close()
            return jsonify({'success': False, 'message': 'Имя, код и фото обязательны'}), 400
        # Проверяем лимит
        cursor.execute('SELECT COUNT(*) FROM categories')
        if cursor.fetchone()[0] >= 7:
            conn.close()
            return jsonify({'success': False, 'message': 'Максимум 7 категорий'}), 400
        try:
            cursor.execute('INSERT INTO categories (name, code, image_url) VALUES (?, ?, ?)', (name, code, image_url))
            conn.commit()
            conn.close()
            return jsonify({'success': True}), 201
        except sqlite3.IntegrityError:
            conn.close()
            return jsonify({'success': False, 'message': 'Категория с таким именем или кодом уже существует'}), 400

@app.route('/api/categories/<int:cat_id>', methods=['PUT'])
def edit_category(cat_id):
    data = request.json
    name = data.get('name', '').strip()
    code = data.get('code', '').strip()
    image_url = data.get('image_url', '').strip()
    if not name or not code or not image_url:
        return jsonify({'success': False, 'message': 'Имя, код и фото обязательны'}), 400
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    cursor.execute('UPDATE categories SET name=?, code=?, image_url=? WHERE id=?', (name, code, image_url, cat_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True}), 200

# API для работы с подкатегориями
@app.route('/api/subcategories', methods=['GET', 'POST'])
def subcategories():
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    if request.method == 'GET':
        category_code = request.args.get('category', '').strip()
        if category_code:
            cursor.execute('SELECT id, name, code, category_code FROM subcategories WHERE category_code = ? ORDER BY id', (category_code,))
        else:
            cursor.execute('SELECT id, name, code, category_code FROM subcategories ORDER BY id')
        subs = [{'id': row[0], 'name': row[1], 'code': row[2], 'category_code': row[3]} for row in cursor.fetchall()]
        conn.close()
        return jsonify({'success': True, 'subcategories': subs}), 200
    elif request.method == 'POST':
        data = request.json
        name = data.get('name', '').strip()
        code = data.get('code', '').strip()
        category_code = data.get('category_code', '').strip()
        if not name or not code or not category_code:
            conn.close()
            return jsonify({'success': False, 'message': 'Имя, код и основная категория обязательны'}), 400
        try:
            cursor.execute('INSERT INTO subcategories (name, code, category_code) VALUES (?, ?, ?)', (name, code, category_code))
            conn.commit()
            conn.close()
            return jsonify({'success': True}), 201
        except sqlite3.IntegrityError:
            conn.close()
            return jsonify({'success': False, 'message': 'Подкатегория с таким кодом уже существует'}), 400

@app.route('/api/subcategories/<int:subcat_id>', methods=['PUT'])
@admin_required
def edit_subcategory(subcat_id):
    data = request.json
    name = data.get('name', '').strip()
    code = data.get('code', '').strip()
    category_code = data.get('category_code', '').strip()
    if not name or not code or not category_code:
        return jsonify({'success': False, 'message': 'Имя, код и основная категория обязательны'}), 400
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    try:
        cursor.execute('UPDATE subcategories SET name=?, code=?, category_code=? WHERE id=?', (name, code, category_code, subcat_id))
        conn.commit()
        conn.close()
        return jsonify({'success': True}), 200
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'success': False, 'message': 'Подкатегория с таким кодом уже существует'}), 400

@app.route('/api/subcategories/<int:subcat_id>', methods=['DELETE'])
@admin_required
def delete_subcategory(subcat_id):
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM subcategories WHERE id=?', (subcat_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True}), 200

def get_site_status():
    try:
        with SITE_STATUS_LOCK:
            if not os.path.exists(SITE_STATUS_FILE):
                return {'enabled': True, 'admin_token': None}
            with open(SITE_STATUS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print('Ошибка чтения site_status.json:', e)
        return {'enabled': True, 'admin_token': None}

def set_site_status(enabled, admin_token=None):
    try:
        with SITE_STATUS_LOCK:
            with open(SITE_STATUS_FILE, 'w', encoding='utf-8') as f:
                json.dump({'enabled': enabled, 'admin_token': admin_token}, f)
    except Exception as e:
        print('Ошибка записи site_status.json:', e)

@app.route('/api/site-status', methods=['GET', 'POST'])
@admin_required
def api_site_status():
    if request.method == 'GET':
        return jsonify(get_site_status())
    data = request.json or {}
    enabled = data.get('enabled', True)
    admin_token = data.get('admin_token')
    set_site_status(enabled, admin_token)
    return jsonify({'success': True, 'enabled': enabled})

# Мидлвар для проверки статуса сайта (кроме админки)
@app.before_request
def check_site_status():
    admin_paths = ['/admin', '/admin/', '/admin/dashboard', '/admin-dashboard.html', '/admin/panel', '/admin/orders', '/admin/support', '/admin/profile', '/admin/settings', '/api/site-status', '/site-offline.html']
    if any(request.path.startswith(p) for p in admin_paths):
        return  # Не блокируем админку и доступ к странице обслуживания
    status = get_site_status()
    if not status.get('enabled', True):
        # Проверяем токен админа в cookie
        admin_token = status.get('admin_token')
        if admin_token and request.cookies.get('admin_token') == admin_token:
            return  # Для текущего админа сайт доступен
        # Для остальных — отдаём страницу-заглушку
        return send_file('site-offline.html'), 503

# Явный маршрут для страницы обслуживания
@app.route('/site-offline.html')
def site_offline():
    return send_file('site-offline.html')

# API для работы с настройками сайта
@app.route('/api/settings', methods=['GET'])
def get_settings():
    try:
        print("Получен запрос к API настроек (GET)")
        conn = sqlite3.connect('store.db')
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM settings")
        settings_rows = cursor.fetchall()
        conn.close()
        
        settings = {}
        for key, value in settings_rows:
            settings[key] = value
        
        print(f"Отправляем настройки: {len(settings)} элементов")
        response = jsonify(settings)
        # Добавляем заголовки для CORS, чтобы разрешить доступ с других доменов
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET'
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return response
    except Exception as e:
        print(f"Ошибка при получении настроек: {e}")
        response = jsonify({"error": str(e)})
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response, 500

@app.route('/api/settings', methods=['POST'])
def update_settings():
    global SITE_FAVICON, SITE_LOGO
    try:
        print("Получен запрос к API настроек (POST)")
        settings = request.json
        print(f"Полученные настройки: {len(settings)} элементов")
        
        conn = sqlite3.connect('store.db')
        cursor = conn.cursor()
        
        for key, value in settings.items():
            cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, value))
            
            # Обновляем глобальные переменные для favicon и логотипа
            if key == 'site_favicon':
                SITE_FAVICON = value
            elif key == 'site_logo':
                SITE_LOGO = value
        
        conn.commit()
        conn.close()
        
        print(f"Обновлены настройки сайта: favicon={SITE_FAVICON}, logo={SITE_LOGO}")
        return jsonify({"success": True})
    except Exception as e:
        print(f"Ошибка при обновлении настроек: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/upload-logo', methods=['POST'])
def upload_logo():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'Нет файла'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'Пустое имя файла'}), 400
    filename = 'logo_' + secure_filename(file.filename)
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(save_path)
    return jsonify({'success': True, 'url': f'uploads/{filename}'}), 200

@app.route('/api/upload-favicon', methods=['POST'])
def upload_favicon():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'Нет файла'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'Пустое имя файла'}), 400
    filename = 'favicon_' + secure_filename(file.filename)
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(save_path)
    return jsonify({'success': True, 'url': f'uploads/{filename}'}), 200

# API для сохранения номера счета
@app.route('/api/orders/<int:order_id>/invoice', methods=['PUT'])
@admin_required
def update_order_invoice(order_id):
    try:
        data = request.json
        invoice_number = data.get('invoice_number')
        
        if not invoice_number:
            return jsonify({
                'success': False,
                'message': 'Необходимо указать номер счета'
            }), 400
            
        conn = sqlite3.connect('products.db')
        cursor = conn.cursor()
        
        # Проверяем, существует ли заказ
        cursor.execute('SELECT id FROM orders WHERE id = ?', (order_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Заказ не найден'
            }), 404
            
        # Проверяем, существует ли колонка invoice_number в таблице orders
        cursor.execute('PRAGMA table_info(orders)')
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'invoice_number' not in columns:
            # Добавляем колонку invoice_number
            cursor.execute('ALTER TABLE orders ADD COLUMN invoice_number TEXT')
            conn.commit()
        
        # Обновляем номер счета заказа
        cursor.execute(
            'UPDATE orders SET invoice_number = ?, updated_at = ? WHERE id = ?',
            (invoice_number, datetime.now().isoformat(), order_id)
        )
        conn.commit()
        
        # Логируем действие
        log_admin_action('update_invoice', {
            'order_id': order_id,
            'invoice_number': invoice_number
        })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Номер счета успешно обновлен'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API для обновления статуса экспорта заказа
@app.route('/api/orders/<int:order_id>/export-status', methods=['PUT'])
@admin_required
def update_order_export_status(order_id):
    try:
        data = request.json
        export_type = data.get('export_type')
        
        if not export_type or export_type not in ['excel', 'onec']:
            return jsonify({
                'success': False,
                'message': 'Необходимо указать корректный тип экспорта (excel или onec)'
            }), 400
            
        conn = sqlite3.connect('products.db')
        cursor = conn.cursor()
        
        # Проверяем, существует ли заказ
        cursor.execute('SELECT id FROM orders WHERE id = ?', (order_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Заказ не найден'
            }), 404
            
        # Проверяем, существуют ли колонки exported_to_excel и exported_to_onec в таблице orders
        cursor.execute('PRAGMA table_info(orders)')
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'exported_to_excel' not in columns:
            # Добавляем колонку exported_to_excel
            cursor.execute('ALTER TABLE orders ADD COLUMN exported_to_excel INTEGER DEFAULT 0')
            conn.commit()
            
        if 'exported_to_onec' not in columns:
            # Добавляем колонку exported_to_onec
            cursor.execute('ALTER TABLE orders ADD COLUMN exported_to_onec INTEGER DEFAULT 0')
            conn.commit()
        
        # Обновляем статус экспорта заказа
        if export_type == 'excel':
            cursor.execute(
                'UPDATE orders SET exported_to_excel = 1, updated_at = ? WHERE id = ?',
                (datetime.now().isoformat(), order_id)
            )
        else:
            cursor.execute(
                'UPDATE orders SET exported_to_onec = 1, updated_at = ? WHERE id = ?',
                (datetime.now().isoformat(), order_id)
            )
            
        conn.commit()
        
        # Логируем действие
        log_admin_action('export_order', {
            'order_id': order_id,
            'export_type': export_type
        })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Статус экспорта заказа в {export_type} успешно обновлен'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Новый эндпоинт для синхронизации данных компании с terms-of-use.html ---
@app.route('/api/sync-company-data', methods=['POST'])
@admin_required
def sync_company_data():
    try:
        print("Получен запрос на синхронизацию данных компании")
        
        # Получаем данные из запроса
        request_data = request.get_json() or {}
        
        # Получаем данные компании из настроек (база данных)
        conn = sqlite3.connect('store.db')
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM settings WHERE key IN ('company_name', 'company_inn', 'company_ogrn', 'company_kpp', 'company_legal_address', 'company_actual_address', 'company_postal_address', 'company_email', 'company_phone')")
        settings_rows = cursor.fetchall()
        conn.close()
        
        company_data = {}
        for key, value in settings_rows:
            company_data[key] = value
        
        # Если в запросе есть данные компании, используем их (приоритет над базой данных)
        if 'company_data' in request_data:
            request_company_data = request_data['company_data']
            company_data.update(request_company_data)
            print("Используются данные компании из запроса")
        else:
            print("Используются данные компании из базы данных")
        
        # Список файлов для обновления
        files_to_update = [
            'terms-of-use.html',
            'delivery-payment.html',
            'licenses.html',
            'privacy-consent.html',
            'privacy-policy.html',
            'warranty-return.html'
        ]
        
        # Формируем данные компании
        company_name = company_data.get('company_name', '')
        company_inn = company_data.get('company_inn', '')
        company_ogrn = company_data.get('company_ogrn', '')
        company_kpp = company_data.get('company_kpp', '')
        company_address = company_data.get('company_legal_address', '')
        postal_address = company_data.get('company_postal_address', '')
        email = company_data.get('company_email', '')
        phone = company_data.get('company_phone', '')
        
        updated_files = []
        
        # Обрабатываем каждый файл
        for filename in files_to_update:
            try:
                if not os.path.exists(filename):
                    print(f"Файл {filename} не найден")
                    continue
                    
                with open(filename, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                # Обновляем данные компании в файле
                updated_content = content
                
                # 1. Обработка terms-of-use.html
                if filename == 'terms-of-use.html':
                    # Заменяем данные компании в span элементах
                    updated_content = re.sub(r'<span id="company_name">[^<]+</span>', f'<span id="company_name">{company_name}</span>', updated_content)
                    updated_content = re.sub(r'<span id="company_inn">[^<]+</span>', f'<span id="company_inn">{company_inn}</span>', updated_content)
                    updated_content = re.sub(r'<span id="company_ogrn">[^<]+</span>', f'<span id="company_ogrn">{company_ogrn}</span>', updated_content)
                    updated_content = re.sub(r'<span id="company_legal_address">[^<]+</span>', f'<span id="company_legal_address">{company_address}</span>', updated_content)
                    updated_content = re.sub(r'<span id="company_postal_address">[^<]+</span>', f'<span id="company_postal_address">{postal_address}</span>', updated_content)
                    updated_content = re.sub(r'<span id="company_email">[^<]+</span>', f'<span id="company_email">{email}</span>', updated_content)
                    updated_content = re.sub(r'<span id="company_phone">[^<]+</span>', f'<span id="company_phone">{phone}</span>', updated_content)
                
                # 2. Обработка warranty-return.html
                elif filename == 'warranty-return.html':
                    # Заменяем данные компании в span элементах
                    updated_content = re.sub(r'<span id="company_name">[^<]+</span>', f'<span id="company_name">{company_name}</span>', updated_content)
                    updated_content = re.sub(r'<span id="company_inn">[^<]+</span>', f'<span id="company_inn">{company_inn}</span>', updated_content)
                    updated_content = re.sub(r'<span id="company_ogrn">[^<]+</span>', f'<span id="company_ogrn">{company_ogrn}</span>', updated_content)
                    updated_content = re.sub(r'<span id="company_legal_address">[^<]+</span>', f'<span id="company_legal_address">{company_address}</span>', updated_content)
                    updated_content = re.sub(r'<span id="company_postal_address">[^<]+</span>', f'<span id="company_postal_address">{postal_address}</span>', updated_content)
                    updated_content = re.sub(r'<span id="company_email">[^<]+</span>', f'<span id="company_email">{email}</span>', updated_content)
                    updated_content = re.sub(r'<span id="company_phone">[^<]+</span>', f'<span id="company_phone">{phone}</span>', updated_content)
                
                # 3. Обработка остальных файлов (delivery-payment.html, licenses.html, privacy-consent.html, privacy-policy.html)
                else:
                    # Ищем строку с данными компании (она содержит "ИНН:" и "ОГРН:")
                    company_info_pattern = r'Настоящие [^(]+ \(далее — «[^»]+»\) регулируют отношения между ([^(]+) \(ИНН: ([^,]+), ОГРН: ([^,]+), юридический адрес: ([^)]+)\)'
                    
                    # Формируем новую строку с данными компании
                    new_company_info = f'Настоящие Условия пользования (далее — «Условия») регулируют отношения между {company_name} (ИНН: {company_inn}, ОГРН: {company_ogrn}, юридический адрес: {company_address})'
                    
                    # Заменяем старую строку на новую, если она найдена
                    updated_content = re.sub(company_info_pattern, new_company_info, updated_content)
                    
                    # Обновляем контактную информацию в разделе "Контактная информация"
                    contact_info_pattern = r'<li class="[^"]+">Почтовый адрес: ([^<]+)</li>\s*<li class="[^"]+">Электронная почта: ([^<]+)</li>\s*<li class="[^"]+">Телефон: ([^<]+)</li>'
                    
                    new_contact_info = f'<li class="terms__list-item">Почтовый адрес: {postal_address}</li>\n                        <li class="terms__list-item">Электронная почта: {email}</li>\n                        <li class="terms__list-item">Телефон: {phone}</li>'
                    
                    updated_content = re.sub(contact_info_pattern, new_contact_info, updated_content)
                    
                    # Обновляем отдельные упоминания ИНН, КПП, ОГРН
                    updated_content = re.sub(r'ИНН: \d+', f'ИНН: {company_inn}', updated_content)
                    updated_content = re.sub(r'КПП: \d+', f'КПП: {company_kpp}', updated_content)
                    updated_content = re.sub(r'ОГРН: \d+', f'ОГРН: {company_ogrn}', updated_content)
                    
                    # Обновляем адрес компании
                    address_pattern = r'юридический адрес: [^<\)]+[<\)]'
                    updated_content = re.sub(address_pattern, f'юридический адрес: {company_address})', updated_content)
                
                # Записываем обновленный контент обратно в файл
                with open(filename, 'w', encoding='utf-8') as file:
                    file.write(updated_content)
                
                updated_files.append(filename)
                print(f"Файл {filename} успешно обновлен")
                
            except Exception as file_error:
                print(f"Ошибка при обновлении файла {filename}: {file_error}")
        
        return jsonify({
            "success": True, 
            "message": "Данные компании успешно синхронизированы", 
            "updated_files": updated_files
        }), 200
    except Exception as e:
        print(f"Ошибка при синхронизации данных компании: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# Обработка OPTIONS запросов для API синхронизации данных компании
@app.route('/api/sync-company-data', methods=['OPTIONS'])
def handle_options_sync_company_data():
    response = app.make_default_options_response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
    return response

@app.route('/api/cart', methods=['GET', 'POST'])
def user_cart():
    email = request.args.get('email') if request.method == 'GET' else request.json.get('email')
    if not email:
        return jsonify({'success': False, 'message': 'Email обязателен'}), 400

    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS carts (
            email TEXT PRIMARY KEY,
            cart_json TEXT
        )
    ''')
    if request.method == 'GET':
        cursor.execute('SELECT cart_json FROM carts WHERE email = ?', (email,))
        row = cursor.fetchone()
        conn.close()
        return jsonify({'success': True, 'cart': json.loads(row[0]) if row else []})
    else:
        cart = request.json.get('cart', [])
        cursor.execute('REPLACE INTO carts (email, cart_json) VALUES (?, ?)', (email, json.dumps(cart)))
        conn.commit()
        conn.close()
        return jsonify({'success': True})

# --- Создание таблицы пользователей, если не существует ---
def init_users_table():
    conn = sqlite3.connect('products.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password_hash TEXT NOT NULL,
        registration_date TEXT,
        last_login TEXT
    )''')
    conn.commit()
    conn.close()
init_users_table()

# --- Регистрация пользователя ---
@app.route('/api/register', methods=['POST'])
def api_register():
    print('>>> [REGISTER] Получен запрос на регистрацию')
    print('>>> [REGISTER] Headers:', dict(request.headers))
    print('>>> [REGISTER] Body:', request.get_data(as_text=True))
    
    data = request.json
    print('>>> [REGISTER] Parsed JSON:', data)
    
    email = data.get('email', '').strip().lower()
    name = data.get('name', '').strip()
    password = data.get('password', '')
    
    print(f'>>> [REGISTER] Email: "{email}", Name: "{name}", Password length: {len(password)}')
    
    if not email or not password:
        print('>>> [REGISTER] Ошибка: отсутствуют email или пароль')
        return jsonify({'success': False, 'message': 'Email и пароль обязательны'}), 400
    
    password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    print(f'>>> [REGISTER] Password hash: {password_hash[:10]}...')
    
    conn = sqlite3.connect('products.db')
    c = conn.cursor()
    
    # Проверяем существование пользователя
    c.execute('SELECT id FROM users WHERE email = ?', (email,))
    existing_user = c.fetchone()
    if existing_user:
        print(f'>>> [REGISTER] Ошибка: пользователь с email {email} уже существует')
        conn.close()
        return jsonify({'success': False, 'message': 'Пользователь с таким email уже существует'}), 409
    
    # Создаем нового пользователя
    try:
        c.execute('INSERT INTO users (email, name, password_hash, registration_date, last_login) VALUES (?, ?, ?, ?, ?)',
                  (email, name, password_hash, datetime.now().isoformat(), None))
        conn.commit()
        print(f'>>> [REGISTER] Успешно создан пользователь: {email}')
        conn.close()
        return jsonify({'success': True, 'message': 'Регистрация успешна'})
    except Exception as e:
        print(f'>>> [REGISTER] Ошибка при создании пользователя: {e}')
        conn.close()
        return jsonify({'success': False, 'message': f'Ошибка при регистрации: {str(e)}'}), 500

# --- Логин пользователя ---
@app.route('/api/login', methods=['POST'])
def api_login():
    print('>>> [LOGIN] Получен запрос на вход')
    print('>>> [LOGIN] Headers:', dict(request.headers))
    print('>>> [LOGIN] Body:', request.get_data(as_text=True))
    
    data = request.json
    print('>>> [LOGIN] Parsed JSON:', data)
    
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    print(f'>>> [LOGIN] Email: "{email}", Password length: {len(password)}')
    
    if not email or not password:
        print('>>> [LOGIN] Ошибка: отсутствуют email или пароль')
        return jsonify({'success': False, 'message': 'Email и пароль обязательны'}), 400
    
    password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    print(f'>>> [LOGIN] Password hash: {password_hash[:10]}...')
    
    conn = sqlite3.connect('products.db')
    c = conn.cursor()
    
    # Ищем пользователя
    c.execute('SELECT id, name FROM users WHERE email = ? AND password_hash = ?', (email, password_hash))
    row = c.fetchone()
    
    if not row:
        print(f'>>> [LOGIN] Ошибка: пользователь не найден или неверный пароль для {email}')
        conn.close()
        return jsonify({'success': False, 'message': 'Неверный email или пароль'}), 401
    
    user_id, name = row
    print(f'>>> [LOGIN] Найден пользователь: ID={user_id}, Name={name}')
    
    # Обновляем время последнего входа
    c.execute('UPDATE users SET last_login = ? WHERE id = ?', (datetime.now().isoformat(), user_id))
    conn.commit()
    conn.close()
    
    print(f'>>> [LOGIN] Успешный вход для пользователя: {email}')
    return jsonify({'success': True, 'user': {'email': email, 'name': name}})

if __name__ == '__main__':
    # Запуск сервера с поддержкой обновления при изменении кода
    app.run(debug=True, host='0.0.0.0', port=5000) 