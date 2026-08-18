from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .gdpr_models import DataConsent, DataDeletionRequest, DataProcessingLog


class ConsentCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        consent_type = request.data.get('consent_type')
        is_granted = request.data.get('is_granted', True)

        if not consent_type:
            return Response({'error': 'consent_type is required'}, status=status.HTTP_400_BAD_REQUEST)

        consent, created = DataConsent.objects.update_or_create(
            user=request.user,
            consent_type=consent_type,
            defaults={
                'is_granted': is_granted,
                'ip_address': request.META.get('REMOTE_ADDR'),
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'granted_at': timezone.now() if is_granted else None,
                'revoked_at': None if is_granted else timezone.now(),
            }
        )

        DataProcessingLog.objects.create(
            user=request.user,
            purpose='legal',
            data_type='consent',
            action='create' if created else 'update',
            ip_address=request.META.get('REMOTE_ADDR'),
            details={'consent_type': consent_type, 'is_granted': is_granted}
        )

        return Response({'status': 'success', 'consent_id': str(consent.id)})


class ConsentListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        consents = DataConsent.objects.filter(user=request.user)
        data = [{
            'id': str(c.id),
            'consent_type': c.consent_type,
            'is_granted': c.is_granted,
            'granted_at': c.granted_at,
            'revoked_at': c.revoked_at,
            'version': c.version,
        } for c in consents]
        return Response(data)


class DeletionRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        reason = request.data.get('reason', '')
        deletion = DataDeletionRequest.objects.create(
            user=request.user,
            reason=reason,
        )
        DataProcessingLog.objects.create(
            user=request.user,
            purpose='legal',
            data_type='user_data',
            action='delete',
            ip_address=request.META.get('REMOTE_ADDR'),
            details={'deletion_request_id': str(deletion.id)}
        )
        return Response({'status': 'pending', 'request_id': str(deletion.id)})


class DeletionRequestStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        deletion = DataDeletionRequest.objects.filter(user=request.user).first()
        if not deletion:
            return Response({'status': 'none'})
        return Response({
            'status': deletion.status,
            'request_id': str(deletion.id),
            'created_at': deletion.created_at,
            'processed_at': deletion.processed_at,
        })


class DataExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        export_data = {
            'profile': {
                'email': user.email,
                'role': user.role,
                'date_joined': str(user.date_joined),
            },
            'consents': list(DataConsent.objects.filter(user=user).values('consent_type', 'is_granted', 'granted_at')),
            'processing_logs': list(DataProcessingLog.objects.filter(user=user).values('purpose', 'data_type', 'action', 'created_at')),
        }

        DataProcessingLog.objects.create(
            user=user,
            purpose='legal',
            data_type='user_data',
            action='export',
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response(export_data)
