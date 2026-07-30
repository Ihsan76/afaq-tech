from rest_framework import serializers
from .models import Service, ServiceCategory, ServiceAvailability, Order, Review


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = '__all__'


class ServiceAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceAvailability
        fields = '__all__'


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'order', 'service', 'reviewer', 'reviewer_name', 'rating', 'comment', 'is_approved', 'created_at']
        read_only_fields = ['reviewer', 'is_approved', 'created_at']

    def get_reviewer_name(self, obj):
        return obj.reviewer.name_ar or obj.reviewer.email


class ServiceListSerializer(serializers.ModelSerializer):
    provider_name = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = ['id', 'provider', 'provider_name', 'category', 'category_name', 'title', 'service_type',
                  'price', 'currency', 'duration_minutes', 'is_online', 'status',
                  'sales_count', 'rating_avg', 'rating_count', 'is_featured', 'created_at']

    def get_provider_name(self, obj):
        return obj.provider.name_ar or obj.provider.email

    def get_category_name(self, obj):
        if obj.category:
            return obj.category.name.get('ar', str(obj.category))
        return ''


class ServiceDetailSerializer(serializers.ModelSerializer):
    availability = ServiceAvailabilitySerializer(many=True, read_only=True)
    reviews = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = '__all__'
        read_only_fields = ['provider', 'sales_count', 'rating_avg', 'rating_count', 'created_at', 'updated_at']

    def get_reviews(self, obj):
        qs = obj.reviews.filter(is_approved=True)[:10]
        return ReviewSerializer(qs, many=True).data


class OrderSerializer(serializers.ModelSerializer):
    service_title = serializers.SerializerMethodField()
    provider_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'buyer', 'service', 'service_title', 'provider_name', 'status',
                  'price_paid', 'currency', 'notes', 'scheduled_at', 'completed_at', 'created_at']
        read_only_fields = ['buyer', 'status', 'price_paid', 'completed_at', 'created_at']

    def get_service_title(self, obj):
        return obj.service.title.get('ar', str(obj.service))

    def get_provider_name(self, obj):
        return obj.service.provider.name_ar or obj.service.provider.email


class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['service', 'notes', 'scheduled_at']

    def validate(self, data):
        service = data['service']
        if service.status != Service.Status.PUBLISHED:
            raise serializers.ValidationError('This service is not available')
        if service.provider == self.context['request'].user:
            raise serializers.ValidationError('You cannot purchase your own service')
        return data

    def create(self, validated_data):
        service = validated_data['service']
        validated_data['buyer'] = self.context['request'].user
        validated_data['price_paid'] = service.price
        validated_data['currency'] = service.currency
        return super().create(validated_data)
