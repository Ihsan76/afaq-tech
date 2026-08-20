from rest_framework import serializers

from .directorate_models import Directorate, DirectorateStats


class DirectorateSerializer(serializers.ModelSerializer):
    schools_count = serializers.SerializerMethodField()

    class Meta:
        model = Directorate
        fields = ['id', 'name', 'name_ar', 'name_en', 'region', 'schools_count', 'is_active']

    def get_schools_count(self, obj):
        return obj.schools.count()


class DirectorateStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DirectorateStats
        fields = '__all__'
