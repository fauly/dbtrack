from flask import Flask, render_template, request, jsonify
import sqlite3
import datetime

app = Flask(__name__)

def init_db():
    with sqlite3.connect('mobile_cafe.db') as conn:
        cursor = conn.cursor()
        cursor.execute('''CREATE TABLE IF NOT EXISTS daily_logs (
                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                          date TEXT,
                          fridge_temp_8 TEXT,
                          fridge_temp_9 TEXT,
                          fridge_temp_10 TEXT,
                          fridge_temp_11 TEXT,
                          fridge_temp_12 TEXT,
                          fridge_temp_1 TEXT,
                          fridge_temp_2 TEXT,
                          fridge_temp_3 TEXT,
                          fridge_temp_4 TEXT,
                          freezer_temp_8 TEXT,
                          freezer_temp_9 TEXT,
                          freezer_temp_10 TEXT,
                          freezer_temp_11 TEXT,
                          freezer_temp_12 TEXT,
                          freezer_temp_1 TEXT,
                          freezer_temp_2 TEXT,
                          freezer_temp_3 TEXT,
                          freezer_temp_4 TEXT,
                          opening_clean TEXT,
                          midday_clean TEXT,
                          end_of_day_clean TEXT,
                          grey_water TEXT,
                          bin_emptied TEXT)''')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/daily-report', methods=['GET'])
def get_daily_report():
    today = datetime.date.today().isoformat()
    with sqlite3.connect('mobile_cafe.db') as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM daily_logs WHERE date = ?", (today,))
        data = cursor.fetchone()
        if not data:
            cursor.execute("INSERT INTO daily_logs (date) VALUES (?)", (today,))
            conn.commit()
            cursor.execute("SELECT * FROM daily_logs WHERE date = ?", (today,))
            data = cursor.fetchone()
        columns = [column[0] for column in cursor.description]
        return jsonify(dict(zip(columns, data)))

@app.route('/api/update', methods=['POST'])
def update_field():
    data = request.json
    field, value = data['field'], data['value']
    today = datetime.date.today().isoformat()
    with sqlite3.connect('mobile_cafe.db') as conn:
        cursor = conn.cursor()
        cursor.execute(f"UPDATE daily_logs SET {field} = ? WHERE date = ?", (value, today))
        conn.commit()
    return jsonify({"success": True})

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
