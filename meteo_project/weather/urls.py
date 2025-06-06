from django.urls import path

from . import views


urlpatterns = [
    path('', views.index, name='home'),
    path('statistics/', views.statistics_page, name='weather_statistics_page'),
    path('api/weather/', views.WeatherAPIView.as_view(), name='weather_api'),
    path('api/statistics/', views.WeatherStatisticsAPIView.as_view(), name='weather_statistics'),
    path('api/autocomplete/', views.CityAutocompleteView.as_view(), name='autocomplete'),
]
