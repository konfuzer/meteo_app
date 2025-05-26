import requests

def fetch_weather(lat, lon):
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        'latitude': lat,
        'longitude': lon,
        'current_weather': True,
        'hourly': 'temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode,uv_index',
        'daily': 'temperature_2m_max,temperature_2m_min,weathercode',
        'timezone': 'auto',
    }

    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()
