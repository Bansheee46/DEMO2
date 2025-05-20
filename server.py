from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
import requests
from werkzeug.utils import secure_filename
import json
import time
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Разрешаем кросс-доменные запросы

# Настройка для загрузки файлов
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Инициализация базы данных
def init_db():
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        image_url TEXT,
        category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    conn.commit()
    conn.close()

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

# API для добавления товара (для админа другого сайта)
@app.route('/api/products', methods=['POST'])
def add_product():
    try:
        data = request.json
        
        # Проверка обязательных полей
        required_fields = ['title', 'price']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Поле {field} обязательно'}), 400
        
        # Обработка изображения, если указан URL
        image_url = data.get('image_url', '')
        if image_url:
            # Сохранение изображения локально
            local_image_path = save_image_from_url(image_url)
            data['image_url'] = local_image_path
        
        # Сохранение товара в базу данных
        conn = sqlite3.connect('products.db')
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO products (title, description, price, image_url, category) VALUES (?, ?, ?, ?, ?)',
            (data.get('title'), data.get('description', ''), data.get('price'), data.get('image_url', ''), data.get('category', ''))
        )
        product_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'product_id': product_id,
            'message': 'Товар успешно добавлен'
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API для получения всех товаров
@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        category = request.args.get('category', '')
        
        conn = sqlite3.connect('products.db')
        conn.row_factory = sqlite3.Row  # Возвращать словари вместо кортежей
        cursor = conn.cursor()
        
        if category:
            cursor.execute('SELECT * FROM products WHERE category = ? ORDER BY created_at DESC', (category,))
        else:
            cursor.execute('SELECT * FROM products ORDER BY created_at DESC')
            
        products = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({
            'success': True,
            'products': products
        }), 200
        
    except Exception as e:
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
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# API для удаления товара
@app.route('/api/products/<int:product_id>', methods=['DELETE'])
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
                   category = COALESCE(?, category)
               WHERE id = ?''',
            (
                data.get('title'), 
                data.get('description'),
                data.get('price'),
                data.get('image_url'),
                data.get('category'),
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
    return jsonify({
        'status': 'running',
        'message': 'API сервер для интеграции товаров работает',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    # Запуск сервера с поддержкой обновления при изменении кода
    app.run(debug=True, host='0.0.0.0', port=5000) 