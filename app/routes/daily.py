# app\routes\daily.py

from flask import Blueprint, render_template, request, url_for
from datetime import datetime, timedelta
from app.services.daily import DailyLogService
from app.data.presets import temperature_presets

daily_bp = Blueprint('daily', __name__, template_folder='templates', url_prefix='/daily')

@daily_bp.route('/', methods=['GET'])
def index():
    # 1) Determine which date to show
    selected_date_str = request.args.get('date')
    selected_date = (
        datetime.strptime(selected_date_str, "%Y-%m-%d").date()
        if selected_date_str
        else datetime.today().date()
    )

    # 2) Load or prepare a blank report
    existing = DailyLogService.find(filters={"date": selected_date})
    if existing:
        report = existing[0]
    else:
        # In‑memory placeholder until autosave creates it
        report = type("R", (), {})()
        report.date = selected_date
        report.notes = ""
        report.data = {
            "checklist": [],
            "temperature_log": {"columns": [], "rows": []},
        }

    # 3) Prev/Next for nav
    prev_date = selected_date - timedelta(days=1)
    next_date = selected_date + timedelta(days=1)

    # 4) History summaries
    reports = DailyLogService.get_all()
    summaries = [DailyLogService.summarize(r) for r in reports]

    return render_template(
        'daily/index.html',
        selected_date=selected_date,
        prev_date=prev_date,
        next_date=next_date,
        report=report,
        summaries=summaries,
        presets_json=temperature_presets
    )


@daily_bp.route('/save', methods=['POST'])
def autosave():
    payload = request.get_json()
    date_str = payload.get('date')
    date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
    notes = payload.get('notes', '')
    data = payload.get('data', {})

    existing = DailyLogService.find(filters={"date": date_obj})
    if existing:
        DailyLogService.update(existing[0].id, data=data, notes=notes)
    else:
        DailyLogService.create(data=data, notes=notes, date_created=date_obj)

    return {"status": "ok"}
