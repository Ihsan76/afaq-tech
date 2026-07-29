import time
import google.generativeai as genai
from django.conf import settings
from .models import AIModel

genai.configure(api_key=settings.GEMINI_API_KEY)

SYSTEM_PROMPT = (
    "أنت مساعد ذكي متخصص في التعليم والتكنولوجيا، تعمل في منصة 'آفاق تكنولوجي' (Afaq Tech). "
    "تستطيع الإجابة بالعربية والإنجليزية والفرنسية والتركية والإسبانية والألمانية والإندونيسية والبengالية والأردية. "
    "استخدم لغة المستخدم في الرد. كن مفيداً ودقيقاً وواضحاً. "
    "إذا سئلت عن مواضيع خارج نطاق التعليم والتكنولوجيا، حاول ربطها بالمجال بلطف. "
    "قدم إجابات منظمة وواضحة، واستخدم تنسيق Markdown للعناوين والقوائم والنقاط المهمة."
)

DEFAULT_MODEL = "gemini-3.6-flash"


def _get_model_id(requested_model_id=None):
    if requested_model_id:
        model_obj = AIModel.objects.filter(model_id=requested_model_id, is_active=True).first()
        if model_obj:
            return model_obj.model_id
    default = AIModel.objects.filter(is_default=True, is_active=True).first()
    if default:
        return default.model_id
    return DEFAULT_MODEL


def _build_history(messages_qs):
    history = []
    for msg in messages_qs:
        role = "model" if msg.role == "assistant" else "user"
        history.append({"role": role, "parts": [msg.content]})
    return history


def chat_stream(messages, new_message, model_id=None):
    conversation_history = _build_history(messages)
    model_name = _get_model_id(model_id)
    model = genai.GenerativeModel(
        model_name,
        system_instruction=SYSTEM_PROMPT,
    )
    chat = model.start_chat(history=conversation_history)
    response = chat.send_message(new_message, stream=True)

    total_tokens = 0
    full_text = ""
    start_time = time.time()

    for chunk in response:
        if chunk.text:
            full_text += chunk.text
            if hasattr(chunk, 'usage_metadata') and chunk.usage_metadata:
                total_tokens = chunk.usage_metadata.total_token_count
            yield chunk.text, None, None, None, model_name

    elapsed = int((time.time() - start_time) * 1000)
    if hasattr(response, 'usage_metadata') and response.usage_metadata:
        total_tokens = response.usage_metadata.total_token_count

    yield None, full_text, total_tokens, elapsed, model_name
