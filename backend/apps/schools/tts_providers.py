from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView


class VoiceSynthesizeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    PROVIDER_MAP = {
        'gemini': '_synthesize_gemini',
        'elevenlabs': '_synthesize_elevenlabs',
        'edge': '_synthesize_edge',
    }

    def post(self, request):
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'error': 'Text is required'}, status=status.HTTP_400_BAD_REQUEST)
        if len(text) > 5000:
            return Response({'error': 'Text exceeds 5000 character limit'}, status=status.HTTP_400_BAD_REQUEST)

        provider = request.data.get('provider', 'gemini')
        speed = float(request.data.get('speed', 1.0))
        locale = request.data.get('locale', 'ar')

        method_name = self.PROVIDER_MAP.get(provider)
        if not method_name:
            return Response({'error': f'Unknown provider: {provider}'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            audio_bytes = getattr(self, method_name)(text, locale, speed)
            if audio_bytes:
                from django.http import HttpResponse
                response = HttpResponse(audio_bytes, content_type='audio/mpeg')
                response['Content-Disposition'] = 'inline; filename="speech.mp3"'
                response['Cache-Control'] = 'public, max-age=86400'
                return response
        except Exception as e:
            return Response({'error': f'TTS synthesis failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'error': 'TTS provider unavailable'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    def _synthesize_gemini(self, text, locale, speed):
        api_key = getattr(settings, 'GEMINI_API_KEY', '')
        if not api_key:
            return None
        from google import genai
        client = genai.Client(api_api=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[f"Read the following text aloud in a natural voice (locale: {locale}, speed: {speed}x): {text}"],
        )
        if hasattr(response, 'audio') and response.audio:
            return response.audio.data
        return None

    def _synthesize_elevenlabs(self, text, locale, speed):
        api_key = getattr(settings, 'ELEVENLABS_API_KEY', '')
        if not api_key:
            return None
        import requests
        voice_id = "21m00Tcm4TlvDq8ikWAM"
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {"xi-api-key": api_key, "Content-Type": "application/json"}
        data = {"text": text, "model_id": "eleven_multilingual_v2", "voice_settings": {"speed": speed}}
        resp = requests.post(url, json=data, headers=headers, timeout=30)
        if resp.status_code == 200:
            return resp.content
        return None

    def _synthesize_edge(self, text, locale, speed):
        try:
            import asyncio
            import os
            import tempfile

            import edge_tts

            rate = f"+{int((speed - 1) * 100)}%" if speed >= 1 else f"-{int((1 - speed) * 100)}%"
            voice_map = {
                'ar': 'ar-SA-ZariyahNeural',
                'en': 'en-US-JennyNeural',
                'fr': 'fr-FR-DeniseNeural',
                'tr': 'tr-TR-EmelNeural',
                'ur': 'ur-PK-AsmaNeural',
                'es': 'es-ES-ElviraNeural',
                'de': 'de-DE-KatjaNeural',
                'id': 'id-ID-GadisNeural',
                'bn': 'bn-BD-NabanitaNeural',
                'fa': 'fa-IR-DilaraNeural',
            }
            voice = voice_map.get(locale, 'ar-SA-ZariyahNeural')

            async def _gen():
                fd, tmp_name = tempfile.mkstemp(suffix='.mp3')
                os.close(fd)
                try:
                    communicate = edge_tts.Communicate(text, voice, rate=rate)
                    await communicate.save(tmp_name)
                    with open(tmp_name, 'rb') as f:
                        data = f.read()
                    return data
                finally:
                    os.unlink(tmp_name)

            return asyncio.run(_gen())
        except ImportError:
            return None
