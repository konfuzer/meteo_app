import requests

from datetime import datetime
from django.utils import timezone
from django.shortcuts import render

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SearchHistory
from .serializers import SearchHistorySerializer
from .utils.geo import geocode_city


class WeatherAPIView(APIView):
    def get(self, request):
        city = request.GET.get('city')
        if not city:
            return Response({'error': 'Город не указан'}, status=status.HTTP_400_BAD_REQUEST)

        # Геокодинг города
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=ru&format=json"
        geo_data = requests.get(geo_url).json()

        if not geo_data.get('results'):
            return Response({'error': 'Город не найден'}, status=status.HTTP_404_NOT_FOUND)

        location = geo_data['results'][0]
        lat, lon = location['latitude'], location['longitude']
        city_name = location['name']
        country = location.get('country', '')

        # Получаем погодные данные
        forecast_url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}&hourly=temperature_2m,precipitation,weathercode,"
            f"relative_humidity_2m,windspeed_10m,uv_index&"
            f"daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto"
        )
        forecast_data = requests.get(forecast_url).json()

        # Получаем список часовых меток из прогноза
        hourly_times = forecast_data['hourly']['time']

        # Текущее локальное время города (в формате ISO от open-meteo уже корректно)
        now_utc = timezone.now()
        current_hour = now_utc.replace(minute=0, second=0, microsecond=0)

        # Ищем ближайший индекс в прогнозе
        try:
            index_now = hourly_times.index(current_hour.strftime("%Y-%m-%dT%H:00"))
        except ValueError:
            index_now = min(
                range(len(hourly_times)),
                key=lambda i: abs(datetime.fromisoformat(hourly_times[i]) - current_hour)
            )

        # Сохраняем статистику
        full_name = f"{city_name}, {country}"
        history, _ = SearchHistory.objects.get_or_create(
            full_name=full_name,
            defaults={
                'city_name': city,
                'latitude': lat,
                'longitude': lon,
                'search_count': 0
            }
        )
        history.search_count += 1
        history.last_searched = timezone.now()
        history.save()

        response_data = {
            'timestamp': timezone.now(),
            'location': {
                'name': city_name,
                'country': country,
                'latitude': lat,
                'longitude': lon
            },
            'current': {
                'temperature': forecast_data['hourly']['temperature_2m'][index_now],
                'precipitation': forecast_data['hourly']['precipitation'][index_now],
                'humidity': forecast_data['hourly']['relative_humidity_2m'][index_now],
                'wind': forecast_data['hourly']['windspeed_10m'][index_now],
                'uv_index': forecast_data['hourly']['uv_index'][index_now],
                'weathercode': forecast_data['hourly']['weathercode'][index_now]
            },
            'hourly': {
                'time': forecast_data['hourly']['time'][:24],
                'temperature': forecast_data['hourly']['temperature_2m'][:24],
                'precipitation': forecast_data['hourly']['precipitation'][:24],
                'weathercode': forecast_data['hourly']['weathercode'][:24],
            },
            'daily': forecast_data['daily'],
            'index_now': index_now  # 👈 передаём индекс текущего часа
        }

        return Response(response_data)


class CityAutocompleteView(APIView):
    def get(self, request):
        q = request.GET.get('q', '')
        if not q:
            return Response([])

        results = geocode_city(q)
        return Response([
            {'label': r.get('display_name'), 'lat': r.get('lat'), 'lon': r.get('lon')}
            for r in results
        ])


class WeatherStatisticsAPIView(APIView):
    def get(self, request):
        queryset = SearchHistory.objects.all().order_by('-search_count')
        serializer = SearchHistorySerializer(queryset, many=True)
        return Response(serializer.data)


def statistics_page(request):
    queryset = SearchHistory.objects.all().order_by('-search_count')
    return render(request, 'statistics.html', {'history': queryset})


def index(request):
    return render(request, 'index.html')
