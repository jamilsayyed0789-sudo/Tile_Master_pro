import requests

url = "https://tilemasterpro-production.up.railway.app/api/local/save-tile"
fake_image_data = "data:image/jpeg;base64," + "A" * (500 * 1024)

payload = {
    "tile_name": "Test Medium Tile",
    "tile_number": "1234",
    "image_data_url": fake_image_data
}

print("Sending 500KB POST request to actual Railway backend...")
try:
    response = requests.post(url, json=payload, headers={"Origin": "https://www.tilemasterpro.in"})
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {response.headers}")
    print(f"Response: {response.text[:200]}")
except Exception as e:
    print(f"Error: {e}")
