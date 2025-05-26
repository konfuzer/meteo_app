from rest_framework import serializers
from .models import SearchHistory

class SearchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchHistory
        fields = ['city_name', 'full_name', 'latitude', 'longitude', 'search_count', 'last_searched']
