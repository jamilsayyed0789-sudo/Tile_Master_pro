import requests
import json
import base64
import os

# Try reaching the railway backend
url = "https://web-production-6a68.up.railway.app/api/local/save-tile"
# Generate a 5MB payload
fake_image_data = "data:image/jpeg;base64," + "A" * (5 * 1024 * 1024)

payload = {
    "tile_name": "Test Large Tile",
    "tile_number": "9999",
    "image_data_url": fake_image_data
}

print("Sending 5MB POST request to Railway backend...")
try:
    response = requests.post(url, json=payload, headers={"Origin": "https://www.tilemasterpro.in"})
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text[:200]}")
except Exception as e:
    print(f"Error: {e}")

