from django.db import models

class SearchHistory(models.Model):
    city_name = models.CharField(max_length=255)
    full_name = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    search_count = models.PositiveIntegerField(default=1)
    last_searched = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} ({self.search_count} раз)"
