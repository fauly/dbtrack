from flask import Blueprint, request, jsonify
from datetime import datetime, date
from app.models import db, DailyLog

bp = Blueprint("daily_report", __name__, url_prefix="/api")

@bp.route("/daily-report", methods=["GET"])
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
    data["temperatures"] = log.temperatures or {}
    data["stock_used"] = log.stock_used or {}
    return jsonify(data)

@bp.route("/update", methods=["POST"])
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
    log = DailyLog.query.filter_by(date=report_date).first()
    if not log:
        return jsonify({"success": False, "error": f"No log found for {report_date}."}), 404

    if field == "temperatures" and isinstance(value, dict):
        log.temperatures = {**(log.temperatures or {}), **value}
    elif field in ["opening_clean", "midday_clean", "end_of_day_clean", "grey_water", "bin_emptied"]:
        log.__setattr__(field, datetime.utcnow() if value else None)
    elif hasattr(log, field):
        setattr(log, field, value)
    else:
        return jsonify({"success": False, "error": f"Invalid field: {field}"}), 400

    log.last_edited = datetime.utcnow()
    db.session.commit()
    return jsonify({"success": True, "last_edited": log.last_edited.isoformat()})
