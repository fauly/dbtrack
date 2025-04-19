# app\data\presets.py


temperature_presets = {
    "van": {
        "columns": ["Ambient", "Fridge", "Freezer"],
        "rows": [
            {"time": "08:00", "values": [None, None, None]},
            {"time": "12:00", "values": [None, None, None]},
            {"time": "16:00", "values": [None, None, None]},
        ]
    },
    "kitchen": {
        "columns": ["Freezer #1", "Freezer #2"],
        "rows": [
            {"time": "09:00", "values": [None, None]},
            {"time": "13:00", "values": [None, None]},
        ]
    }
}
