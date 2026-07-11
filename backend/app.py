import os
import time
import mysql.connector
from mysql.connector import Error
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
MYSQL_PORT = int(os.environ.get('MYSQL_PORT', 3306))
MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', 'password')
MYSQL_DB = os.environ.get('MYSQL_DB', 'appdb')

def get_db_connection():
    connection = None
    retries = 10
    while retries > 0:
        try:
            connection = mysql.connector.connect(
                host=MYSQL_HOST,
                port=MYSQL_PORT,
                user=MYSQL_USER,
                password=MYSQL_PASSWORD,
                database=MYSQL_DB
            )
            if connection.is_connected():
                return connection
        except Error as e:
            print(f"Error connecting to MySQL at {MYSQL_HOST}: {e}. Retrying in 2 seconds...")
            retries -= 1
            time.sleep(2)
    raise Exception("Could not connect to MySQL database after multiple retries")

def init_db():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        cursor.close()
        conn.close()
        print("Database initialized successfully.")
    except Exception as e:
        print(f"Database initialization failed: {e}")

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM tasks ORDER BY created_at DESC")
        tasks = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(tasks)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tasks', methods=['POST'])
def add_task():
    try:
        data = request.json
        if not data or 'title' not in data:
            return jsonify({"error": "Title is required"}), 400
        
        title = data['title']
        description = data.get('description', '')
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "INSERT INTO tasks (title, description, completed) VALUES (%s, %s, %s)",
            (title, description, False)
        )
        conn.commit()
        task_id = cursor.lastrowid
        cursor.close()
        conn.close()
        
        return jsonify({"id": task_id, "title": title, "description": description, "completed": False}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def toggle_task(task_id):
    try:
        data = request.json or {}
        completed = data.get('completed')
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        if completed is not None:
            cursor.execute("UPDATE tasks SET completed = %s WHERE id = %s", (completed, task_id))
        else:
            cursor.execute("UPDATE tasks SET completed = NOT completed WHERE id = %s", (task_id,))
            
        conn.commit()
        
        cursor.execute("SELECT * FROM tasks WHERE id = %s", (task_id,))
        task = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not task:
            return jsonify({"error": "Task not found"}), 404
            
        return jsonify(task)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
        conn.commit()
        affected = cursor.rowcount
        cursor.close()
        conn.close()
        
        if affected == 0:
            return jsonify({"error": "Task not found"}), 404
            
        return jsonify({"message": "Task deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
