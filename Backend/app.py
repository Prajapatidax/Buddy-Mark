import os
import cv2
import json
import sqlite3
import numpy as np
from flask import Flask, render_template, request, jsonify
from deepface import DeepFace
from datetime import datetime

app = Flask(__name__)


UPLOAD_FOLDER = 'static/uploads'
DB_FILE = 'faces.db'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  embedding TEXT NOT NULL,
                  created_at TEXT)''')
    conn.commit()
    conn.close()

init_db()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register_user():
    if 'photo' not in request.files or 'name' not in request.form:
        return jsonify({'success': False, 'error': 'Missing name or photo'})
    
    file = request.files['photo']
    name = request.form['name']
    
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No selected file'})

    if file and allowed_file(file.filename):
       
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'temp_register.jpg')
        file.save(filepath)

        try:
           
            embedding_objs = DeepFace.represent(
                img_path=filepath, 
                model_name="Facenet512", 
                detector_backend="opencv",
                enforce_detection=True
            )
            
            
            embedding = embedding_objs[0]["embedding"]

           
            conn = get_db_connection()
            conn.execute('INSERT INTO users (name, embedding, created_at) VALUES (?, ?, ?)',
                         (name, json.dumps(embedding), datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
            conn.commit()
            conn.close()

            return jsonify({'success': True, 'message': f'User {name} registered successfully!'})

        except ValueError:
            return jsonify({'success': False, 'error': 'No face detected in the image. Please upload a clear photo.'})
        except Exception as e:
            print(e)
            return jsonify({'success': False, 'error': str(e)})

@app.route('/recognize', methods=['POST'])
def recognize_users():
    if 'photo' not in request.files:
        return jsonify({'success': False, 'error': 'No photo uploaded'})
    
    file = request.files['photo']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No selected file'})

    if file and allowed_file(file.filename):
       
        filename = f"query_{datetime.now().timestamp()}.jpg"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        try:
           
            target_embeddings = DeepFace.represent(
                img_path=filepath,
                model_name="Facenet512",
                detector_backend="opencv",
                enforce_detection=False
            )
        except:
            return jsonify({'success': False, 'error': 'Could not process image or no faces found.'})

        
        conn = get_db_connection()
        users = conn.execute('SELECT name, embedding FROM users').fetchall()
        conn.close()

        results = []
        
       
        THRESHOLD = 0.30 

       
        for face_obj in target_embeddings:
            target_emb = face_obj["embedding"]
            facial_area = face_obj["facial_area"] 
            
            best_match_name = "Unknown"
            lowest_distance = 100 

            for user in users:
                db_emb = json.loads(user['embedding'])
                
               
                a = np.array(target_emb)
                b = np.array(db_emb)
                
               
                cos_sim = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
                distance = 1 - cos_sim

                if distance < THRESHOLD and distance < lowest_distance:
                    lowest_distance = distance
                    best_match_name = user['name']

            results.append({
                "name": best_match_name,
                "confidence": round((1 - lowest_distance) * 100, 2) if best_match_name != "Unknown" else 0,
                "box": facial_area 
            })

        return jsonify({
            'success': True, 
            'matches': results, 
            'image_url': filepath
        })

if __name__ == '__main__':
    app.run(debug=True, port=5000)