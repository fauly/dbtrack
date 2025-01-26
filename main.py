from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date
import os

app = Flask(__name__)

# Configure SQLite database
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(BASE_DIR, 'database', 'mobile_cafe.db')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

# Database Models
class DailyLog(db.Model):
    __tablename__ = "daily_logs"

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, default=date.today, nullable=False)
    last_edited = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    temperatures = db.Column(db.JSON, default={})  # JSON column for temperatures
    opening_clean = db.Column(db.Boolean, default=False)
    midday_clean = db.Column(db.Boolean, default=False)
    end_of_day_clean = db.Column(db.Boolean, default=False)
    grey_water = db.Column(db.Boolean, default=False)
    bin_emptied = db.Column(db.Boolean, default=False)

# Routes
@app.route("/")
def index():
    return render_template("daily-report.html")

@app.route("/api/daily-report", methods=["GET"])
def get_daily_report():
    report_date_str = request.args.get("date", date.today().isoformat())
    
    try:
        report_date = datetime.strptime(report_date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Please use YYYY-MM-DD."}), 400

    log = DailyLog.query.filter_by(date=report_date).first()

    if not log:
        log = DailyLog(date=report_date, temperatures={})
        db.session.add(log)
        db.session.commit()

    data = {col.name: getattr(log, col.name) for col in log.__table__.columns}
    # Ensure temperatures is always a dictionary
    data["temperatures"] = data["temperatures"] or {}
    return jsonify(data)

@app.route("/api/update", methods=["POST"])
def update_field():
    data = request.json
    if not data or "field" not in data or "value" not in data:
        return jsonify({"success": False, "error": "Missing required fields 'field' and 'value'."}), 400

    report_date_str = data.get("date", date.today().isoformat())
    try:
        report_date = datetime.strptime(report_date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"success": False, "error": "Invalid date format. Please use YYYY-MM-DD."}), 400

    field, value = data["field"], data["value"]

    if field == "date":
        return jsonify({"success": False, "error": "Cannot update the date field."}), 400

    log = DailyLog.query.filter_by(date=report_date).first()
    if not log:
        return jsonify({"success": False, "error": f"No log found for {report_date}."}), 404

    if field == "temperatures" and isinstance(value, dict):
        existing_temperatures = log.temperatures or {}
        existing_temperatures.update(value)
        log.temperatures = existing_temperatures
    elif hasattr(log, field):
        setattr(log, field, value)
    else:
        return jsonify({"success": False, "error": f"Invalid field: {field}"}), 400

    log.last_edited = datetime.utcnow()
    db.session.commit()
    return jsonify({"success": True, "last_edited": log.last_edited.isoformat()})

# Initialize Database
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)
