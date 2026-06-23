import os
import json

SETTINGS_FILE = "backend/app_settings.json"
if os.path.exists(SETTINGS_FILE):
    with open(SETTINGS_FILE, "r") as f:
        settings = json.load(f)
    print("Settings:", settings)
    path = settings.get("local_storage_path", "")
    print("Path:", path)
    if path:
        print("Exists:", os.path.exists(path))
        try:
            os.makedirs(path, exist_ok=True)
            test_file = os.path.join(path, ".test_write")
            with open(test_file, "w") as f:
                f.write("test")
            os.remove(test_file)
            print("Writable: Yes")
        except Exception as e:
            print("Writable: No, Error:", e)
else:
    print("Settings file not found at", SETTINGS_FILE)
