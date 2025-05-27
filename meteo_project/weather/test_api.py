import pytest
import time

from django.urls import reverse
from rest_framework.test import APIClient

from weather.models import SearchHistory


@pytest.mark.django_db
def test_search_history_created_and_updated():
    """Проверка создания и обновления SearchHistory"""
    client = APIClient()
    assert SearchHistory.objects.filter(full_name__icontains='Москва').count() == 0
    response = client.get('/api/weather/?city=Москва')
    assert response.status_code == 200
    history = SearchHistory.objects.get(full_name__icontains='Москва')
    assert history.search_count == 1
    old_timestamp = history.last_searched
    time.sleep(1)
    response = client.get('/api/weather/?city=Москва')
    history.refresh_from_db()
    assert history.search_count == 2
    assert history.last_searched > old_timestamp

@pytest.mark.django_db
def test_index_page(client):
    """Главная страница успешно загружается"""
    response = client.get(reverse('home'))
    assert response.status_code == 200
    assert b'Meteo App' in response.content


@pytest.mark.django_db
def test_weather_api_valid_city():
    """API погоды возвращает данные при корректном городе"""
    client = APIClient()
    response = client.get('/api/weather/?city=Москва')
    assert response.status_code == 200
    data = response.json()
    assert 'location' in data
    assert 'current' in data
    assert 'hourly' in data
    assert 'daily' in data


@pytest.mark.django_db
def test_weather_api_invalid_city():
    """API погоды возвращает 404 при некорректном городе"""
    client = APIClient()
    response = client.get('/api/weather/?city=NonexistentCity123456')
    assert response.status_code == 404
    assert 'error' in response.json()


@pytest.mark.django_db
def test_autocomplete_api():
    """API автодополнения возвращает результаты"""
    client = APIClient()
    response = client.get('/api/autocomplete/?q=Москва')
    assert response.status_code == 200
    results = response.json()
    assert isinstance(results, list)
    assert len(results) > 0
    assert 'label' in results[0]


@pytest.mark.django_db
def test_statistics_page(client):
    """Страница статистики загружается"""
    response = client.get(reverse('weather_statistics_page'))
    assert response.status_code == 200
    assert 'Статистика' in response.content.decode('utf-8')

@pytest.mark.django_db
def test_statistics_api():
    """API статистики работает и возвращает список"""
    client = APIClient()
    response = client.get('/api/statistics/')
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
