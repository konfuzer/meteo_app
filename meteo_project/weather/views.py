from django.shortcuts import render

# Create your views here.
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import SearchHistory
from .serializers import SearchHistorySerializer
from .utils.geo import geocode_city
from .utils.weather_api import fetch_weather

class WeatherAPIView(APIView):
    def get(self, request):
        city = request.GET.get('city')

        if not city:
            return Response({'error': 'Не указан город'}, status=400)

        results = geocode_city(city)
        if not results:
            return Response({'error': 'Город не найден'}, status=404)

        geo = results[0]
        lat = float(geo['lat'])
        lon = float(geo['lon'])
        full_name = geo.get('display_name', city)

        # Сохраняем историю
        history, created = SearchHistory.objects.get_or_create(
            full_name=full_name,
            defaults={'city_name': city, 'latitude': lat, 'longitude': lon}
        )
        if not created:
            history.search_count += 1
            history.save()

        data = fetch_weather(lat, lon)

        return Response({
            'city': full_name,
            'coordinates': {'lat': lat, 'lon': lon},
            'weather': data
        })

class WeatherStatisticsAPIView(APIView):
    def get(self, request):
        queryset = SearchHistory.objects.all().order_by('-search_count')
        serializer = SearchHistorySerializer(queryset, many=True)
        return Response(serializer.data)

class CityAutocompleteView(APIView):
    def get(self, request):
        q = request.GET.get('q', '')
        if not q:
            return Response([])

        results = geocode_city(q)
        suggestions = [{
            'label': r.get('display_name'),
            'lat': r.get('lat'),
            'lon': r.get('lon')
        } for r in results]

        return Response(suggestions)

def index(request):
    return render(request, 'index.html')
