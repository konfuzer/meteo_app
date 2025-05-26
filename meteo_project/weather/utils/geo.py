import requests

def geocode_city(city_name):
    """
    Геокодинг через Nominatim (OpenStreetMap)
    """
    url = 'https://nominatim.openstreetmap.org/search'
    params = {
        'q': city_name,
        'format': 'json',
        'limit': 5,
        'addressdetails': 1,
    }
    headers = {'User-Agent': 'meteo_app'}

    response = requests.get(url, params=params, headers=headers)
    response.raise_for_status()
    return response.json()
