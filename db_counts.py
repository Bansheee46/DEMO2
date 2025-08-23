import sqlite3

def count(table):
    conn = sqlite3.connect('products.db')
    cur = conn.cursor()
    try:
        cur.execute(f'SELECT COUNT(*) FROM {table}')
        return cur.fetchone()[0]
    except Exception as e:
        return f'error: {e}'
    finally:
        conn.close()

if __name__ == '__main__':
    print('categories:', count('categories'))
    print('subcategories:', count('subcategories'))
    print('products:', count('products')) 