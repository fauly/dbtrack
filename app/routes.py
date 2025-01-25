from flask import Blueprint, render_template, jsonify, request
from .models import db, DailyLog
from datetime import date

app = Blueprint('app', __name__)

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/daily-report')
def daily_report():
    return render_template('daily_report.html')

@app.route('/api/daily-report', methods=['GET'])
def get_daily_report():
    """Fetch or initialize today's daily report."""
    today = date.today()
    log = DailyLog.query.filter_by(date=today).first()

    # If no record exists for today, create it
    if not log:
        log = DailyLog(date=today)
        db.session.add(log)
        db.session.commit()

    # Serialize the log into a dictionary for JSON response
    log_data = {
        "id": log.id,
        "date": log.date.isoformat(),
        "fridge_temp_8": log.fridge_temp_8,
        "fridge_temp_9": log.fridge_temp_9,
        "fridge_temp_10": log.fridge_temp_10,
        "fridge_temp_11": log.fridge_temp_11,
        "fridge_temp_12": log.fridge_temp_12,
        "fridge_temp_1": log.fridge_temp_1,
        "fridge_temp_2": log.fridge_temp_2,
        "fridge_temp_3": log.fridge_temp_3,
        "fridge_temp_4": log.fridge_temp_4,
        "freezer_temp_8": log.freezer_temp_8,
        "freezer_temp_9": log.freezer_temp_9,
        "freezer_temp_10": log.freezer_temp_10,
        "freezer_temp_11": log.freezer_temp_11,
        "freezer_temp_12": log.freezer_temp_12,
        "freezer_temp_1": log.freezer_temp_1,
        "freezer_temp_2": log.freezer_temp_2,
        "freezer_temp_3": log.freezer_temp_3,
        "freezer_temp_4": log.freezer_temp_4,
        "opening_clean": log.opening_clean,
        "midday_clean": log.midday_clean,
        "end_of_day_clean": log.end_of_day_clean,
        "grey_water": log.grey_water,
        "bin_emptied": log.bin_emptied,
    }

    return jsonify(log_data)

@app.route('/api/update', methods=['POST'])
def update_field():
    """Update a specific field in today's daily report."""
    data = request.json
    field = data['field']
    value = data['value']
    today = date.today()

    # Fetch today's log
    log = DailyLog.query.filter_by(date=today).first()

    if not log:
        return jsonify({"success": False, "error": "No daily log found for today"}), 404

    # Update the specified field
    if hasattr(log, field):
        setattr(log, field, value)
        db.session.commit()
        return jsonify({"success": True})
    else:
        return jsonify({"success": False, "error": f"Invalid field: {field}"}), 400
