from rest_framework import serializers

from .models import SearchHistory


class SearchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchHistory
        fields = ['city_name', 'full_name', 'last_searched', 'latitude', 'longitude', 'search_count']
