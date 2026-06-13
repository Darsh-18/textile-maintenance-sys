import requests

r = requests.post("http://127.0.0.1:8000/auth/login", data={"username": "admin", "password": "admin123"})
if r.status_code != 200:
    print("Login failed:", r.text)
else:
    token = r.json()["access_token"]
    res = requests.put("http://127.0.0.1:8000/repairs/1/status?status=Closed", headers={"Authorization": f"Bearer {token}"})
    print("Update status:", res.status_code, res.text)
