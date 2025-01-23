from flask import Flask, render_template, request, redirect, url_for
import sqlite3

app = Flask(__name__)

def init_db():
    with sqlite3.connect('mobile_cafe.db') as conn:
        cursor = conn.cursor()
        cursor.execute('''CREATE TABLE IF NOT EXISTS logs (
                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                          date TEXT,
                          task TEXT,
                          value TEXT)''')

@app.route('/')
def index():
    with sqlite3.connect('mobile_cafe.db') as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM logs")
        logs = cursor.fetchall()
    return render_template('index.html', logs=logs)

@app.route('/add', methods=['GET', 'POST'])
def add():
    if request.method == 'POST':
        date = request.form['date']
        task = request.form['task']
        value = request.form['value']

        with sqlite3.connect('mobile_cafe.db') as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO logs (date, task, value) VALUES (?, ?, ?)", (date, task, value))
        return redirect(url_for('index'))
    return render_template('add.html')

@app.route('/delete/<int:log_id>')
def delete(log_id):
    with sqlite3.connect('mobile_cafe.db') as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM logs WHERE id = ?", (log_id,))
    return redirect(url_for('index'))

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
