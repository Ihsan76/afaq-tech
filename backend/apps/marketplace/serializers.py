from rest_framework import serializers

from apps.core.translations import get_translation

from .models import Order, Review, Service, ServiceAvailability, ServiceCategory


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
    service_title = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'order', 'service', 'service_title', 'reviewer', 'reviewer_name', 'rating', 'comment', 'is_approved', 'created_at']
        read_only_fields = ['reviewer', 'is_approved', 'created_at']

    def get_reviewer_name(self, obj):
        return get_translation(obj.reviewer.translations, 'ar', 'name', obj.reviewer.email)

    def get_service_title(self, obj):
        return obj.service.title.get('ar') or obj.service.title.get('en') or str(obj.service)


class ServiceListSerializer(serializers.ModelSerializer):
    provider_name = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = ['id', 'provider', 'provider_name', 'category', 'category_name', 'title', 'service_type',
                  'price', 'currency', 'duration_minutes', 'is_online', 'status',
                  'sales_count', 'rating_avg', 'rating_count', 'is_featured', 'created_at']

    def get_provider_name(self, obj):
        return get_translation(obj.provider.translations, 'ar', 'name', obj.provider.email)

    def get_category_name(self, obj):
        if obj.category:
            return obj.category.name.get('ar') or obj.category.name.get('en') or str(obj.category)
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
                  'payment_status', 'payment_provider', 'paid_at', 'price_paid', 'currency', 'notes',
                  'scheduled_at', 'completed_at', 'created_at']
        read_only_fields = ['buyer', 'status', 'payment_status', 'payment_provider', 'paid_at', 'price_paid', 'completed_at', 'created_at']

    def get_service_title(self, obj):
        return obj.service.title.get('ar') or obj.service.title.get('en') or str(obj.service)

    def get_provider_name(self, obj):
        return get_translation(obj.service.provider.translations, 'ar', 'name', obj.service.provider.email)


class AdminServiceSerializer(ServiceDetailSerializer):
    provider = serializers.PrimaryKeyRelatedField(
        queryset=Service._meta.get_field('provider').related_model.objects.all(),
        required=False,
    )

    class Meta(ServiceDetailSerializer.Meta):
        fields = '__all__'
        read_only_fields = ['sales_count', 'rating_avg', 'rating_count', 'created_at', 'updated_at']


class AdminOrderSerializer(OrderSerializer):
    buyer_name = serializers.SerializerMethodField()
    buyer_email = serializers.SerializerMethodField()

    class Meta(OrderSerializer.Meta):
        fields = OrderSerializer.Meta.fields + ['buyer_name', 'buyer_email']
        read_only_fields = ['buyer', 'buyer_name', 'buyer_email', 'price_paid', 'currency', 'completed_at', 'created_at']

    def get_buyer_name(self, obj):
        return get_translation(obj.buyer.translations, 'ar', 'name', obj.buyer.email)

    def get_buyer_email(self, obj):
        return obj.buyer.email


class AdminReviewSerializer(ReviewSerializer):
    class Meta(ReviewSerializer.Meta):
        read_only_fields = ['order', 'service', 'reviewer', 'created_at', 'updated_at']


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
