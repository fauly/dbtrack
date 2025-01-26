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

# Database Model
class DailyLog(db.Model):
    __tablename__ = "daily_logs"

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, default=date.today, nullable=False)
    last_edited = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    fridge_temp_8 = db.Column(db.String(10))
    fridge_temp_9 = db.Column(db.String(10))
    fridge_temp_10 = db.Column(db.String(10))
    fridge_temp_11 = db.Column(db.String(10))
    fridge_temp_12 = db.Column(db.String(10))
    fridge_temp_1 = db.Column(db.String(10))
    fridge_temp_2 = db.Column(db.String(10))
    fridge_temp_3 = db.Column(db.String(10))
    fridge_temp_4 = db.Column(db.String(10))
    freezer_temp_8 = db.Column(db.String(10))
    freezer_temp_9 = db.Column(db.String(10))
    freezer_temp_10 = db.Column(db.String(10))
    freezer_temp_11 = db.Column(db.String(10))
    freezer_temp_12 = db.Column(db.String(10))
    freezer_temp_1 = db.Column(db.String(10))
    freezer_temp_2 = db.Column(db.String(10))
    freezer_temp_3 = db.Column(db.String(10))
    freezer_temp_4 = db.Column(db.String(10))
    opening_clean = db.Column(db.Boolean, default=False)
    midday_clean = db.Column(db.Boolean, default=False)
    end_of_day_clean = db.Column(db.Boolean, default=False)
    grey_water = db.Column(db.Boolean, default=False)
    bin_emptied = db.Column(db.Boolean, default=False)

# Routes
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/daily-report")
def daily_report():
    return render_template("daily-report.html")

@app.route("/archived-reports")
def archived_reports():
    return render_template("archived-reports.html")

@app.route("/api/daily-report", methods=["GET"])
def get_daily_report():
    today = date.today()
    log = DailyLog.query.filter_by(date=today).first()

    if not log:
        log = DailyLog(date=today)
        db.session.add(log)
        db.session.commit()

    return jsonify({col.name: getattr(log, col.name) for col in log.__table__.columns})

@app.route("/api/archived-report", methods=["GET"])
def get_archived_report():
    report_date = request.args.get("date")
    if not report_date:
        return jsonify({"error": "No date provided."}), 400

    log = DailyLog.query.filter_by(date=report_date).first()
    if not log:
        return jsonify({"error": f"No report found for {report_date}."}), 404

    return jsonify({col.name: getattr(log, col.name) for col in log.__table__.columns})

@app.route("/api/update", methods=["POST"])
def update_field():
    data = request.json
    if not data or "field" not in data or "value" not in data:
        return jsonify({"success": False, "error": "Missing required fields 'field' and 'value'."}), 400

    # Use the provided date or default to today
    report_date = data.get("date", date.today().isoformat())
    field, value = data["field"], data["value"]

    log = DailyLog.query.filter_by(date=report_date).first()
    if not log:
        return jsonify({"success": False, "error": f"No log found for {report_date}."}), 404

    if hasattr(log, field):
        # Dynamically set the field value
        setattr(log, field, value)
        log.last_edited = datetime.utcnow()  # Update the last edited timestamp
        db.session.commit()
        return jsonify({"success": True, "last_edited": log.last_edited.isoformat()})
    else:
        return jsonify({"success": False, "error": f"Invalid field: {field}"}), 400

# Initialize Database
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)
