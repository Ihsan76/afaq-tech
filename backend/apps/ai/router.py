import hashlib
import logging
import time
from abc import ABC, abstractmethod
from collections import defaultdict
from dataclasses import dataclass

from django.conf import settings
from django.core.cache import cache
from django.db import ProgrammingError
from django.db.utils import OperationalError
from google import genai
from openai import OpenAI

logger = logging.getLogger(__name__)


@dataclass
class AIResponse:
    content: str
    model: str
    provider: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    latency_ms: int = 0
    success: bool = True
    error: str | None = None


class BaseProvider(ABC):
    name: str
    model_name: str

    def __init__(self, api_key: str = "", base_url: str = ""):
        self.api_key = api_key
        self.base_url = base_url

    @abstractmethod
    def generate(self, prompt: str, **kwargs) -> AIResponse:
        ...

    @abstractmethod
    def health_check(self) -> bool:
        ...


class GeminiProvider(BaseProvider):
    name = "google"
    model_name = "gemini-3.6-flash"

    def _get_client(self):
        k = self.api_key or settings.GEMINI_API_KEY
        return genai.Client(api_key=k)

    def generate(self, prompt: str, **kwargs) -> AIResponse:
        start = time.time()
        try:
            client = self._get_client()
            system_instruction = kwargs.get("system_instruction", "")
            config = genai.types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
            ) if system_instruction else genai.types.GenerateContentConfig(response_mime_type="application/json")
            resp = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config,
            )
            raw = resp.text.strip() if resp.text else ""
            tokens = 0
            if hasattr(resp, "usage_metadata") and resp.usage_metadata:
                tokens = resp.usage_metadata.total_token_count
            elapsed = int((time.time() - start) * 1000)
            return AIResponse(
                content=raw, model=self.model_name, provider=self.name,
                total_tokens=tokens, latency_ms=elapsed,
            )
        except Exception as e:
            elapsed = int((time.time() - start) * 1000)
            return AIResponse(
                content="", model=self.model_name, provider=self.name,
                latency_ms=elapsed, success=False, error=str(e),
            )

    def health_check(self) -> bool:
        try:
            client = genai.Client(api_key=self.api_key or settings.GEMINI_API_KEY)
            client.models.generate_content(model=self.model_name, contents="test")
            return True
        except Exception:
            return False


class OpenAIProvider(BaseProvider):
    name = "openai"
    model_name = "gpt-4o"

    def _client(self):
        return OpenAI(api_key=self.api_key or "sk-placeholder", base_url=self.base_url or None)

    def generate(self, prompt: str, **kwargs) -> AIResponse:
        start = time.time()
        try:
            client = self._client()
            messages = []
            si = kwargs.get("system_instruction", "")
            if si:
                messages.append({"role": "system", "content": si})
            messages.append({"role": "user", "content": prompt})
            resp = client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                response_format={"type": "json_object"},
            )
            raw = resp.choices[0].message.content.strip()
            tokens = resp.usage.total_tokens if resp.usage else 0
            elapsed = int((time.time() - start) * 1000)
            return AIResponse(
                content=raw, model=self.model_name, provider=self.name,
                total_tokens=tokens, latency_ms=elapsed,
            )
        except Exception as e:
            elapsed = int((time.time() - start) * 1000)
            return AIResponse(
                content="", model=self.model_name, provider=self.name,
                latency_ms=elapsed, success=False, error=str(e),
            )

    def health_check(self) -> bool:
        try:
            self._client().chat.completions.create(
                model=self.model_name, messages=[{"role": "user", "content": "test"}], max_tokens=1,
            )
            return True
        except Exception:
            return False


class OpenAICompatibleProvider(OpenAIProvider):
    name = "openai_compatible"

    def _client(self):
        b_url = (self.base_url or "").rstrip("/")
        if b_url and not b_url.endswith("/v1"):
            b_url += "/v1"
        return OpenAI(api_key=self.api_key or "sk-placeholder", base_url=b_url or None)


class OllamaProvider(BaseProvider):
    name = "ollama"
    model_name = "llama3"

    def _client(self):
        base = (self.base_url or "http://localhost:11434").rstrip("/") + "/v1"
        return OpenAI(api_key=self.api_key or "ollama", base_url=base)

    def generate(self, prompt: str, **kwargs) -> AIResponse:
        start = time.time()
        try:
            client = self._client()
            messages = []
            si = kwargs.get("system_instruction", "")
            if si:
                messages.append({"role": "system", "content": si})
            messages.append({"role": "user", "content": prompt})
            resp = client.chat.completions.create(model=self.model_name, messages=messages)
            raw = resp.choices[0].message.content.strip()
            tokens = resp.usage.total_tokens if resp.usage else 0
            elapsed = int((time.time() - start) * 1000)
            return AIResponse(
                content=raw, model=self.model_name, provider=self.name,
                total_tokens=tokens, latency_ms=elapsed,
            )
        except Exception as e:
            elapsed = int((time.time() - start) * 1000)
            return AIResponse(
                content="", model=self.model_name, provider=self.name,
                latency_ms=elapsed, success=False, error=str(e),
            )

    def health_check(self) -> bool:
        try:
            self._client().chat.completions.create(
                model=self.model_name, messages=[{"role": "user", "content": "hi"}], max_tokens=1,
            )
            return True
        except Exception:
            return False


class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, reset_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self._failures: dict[str, list[float]] = defaultdict(list)

    def record_failure(self, provider_name: str):
        now = time.time()
        self._failures[provider_name].append(now)
        cutoff = now - self.reset_timeout
        self._failures[provider_name] = [t for t in self._failures[provider_name] if t > cutoff]

    def record_success(self, provider_name: str):
        self._failures[provider_name] = []

    def is_open(self, provider_name: str) -> bool:
        now = time.time()
        cutoff = now - self.reset_timeout
        recent = [t for t in self._failures[provider_name] if t > cutoff]
        return len(recent) >= self.failure_threshold

    def reset(self, provider_name: str):
        self._failures[provider_name] = []


class TokenBucket:
    def __init__(self, rate: int = 15, per_seconds: int = 60):
        self.rate = rate
        self.per_seconds = per_seconds
        self._tokens: dict[str, list[float]] = defaultdict(list)

    def allow(self, key: str) -> bool:
        now = time.time()
        cutoff = now - self.per_seconds
        self._tokens[key] = [t for t in self._tokens[key] if t > cutoff]
        if len(self._tokens[key]) >= self.rate:
            return False
        self._tokens[key].append(now)
        return True


FEATURE_PREFERENCES = {
    "lesson_plan": ["google", "openai", "openai_compatible", "ollama"],
    "refine": ["google", "openai", "openai_compatible", "ollama"],
    "worksheet": ["google", "openai", "openai_compatible", "ollama"],
    "homework": ["google", "openai", "openai_compatible", "ollama"],
    "quiz": ["openai", "openai_compatible", "google", "ollama"],
    "assistant": ["google", "openai", "openai_compatible", "ollama"],
    "summary": ["google", "ollama", "openai_compatible", "openai"],
    "translation": ["google", "openai", "openai_compatible", "ollama"],
}

ALL_PROVIDERS = ["google", "openai", "openai_compatible", "ollama"]

PROVIDER_RATES = {
    "google": (15, 60),
    "openai": (60, 60),
    "openai_compatible": (60, 60),
    "ollama": (100, 60),
}


class ProviderRouter:
    def __init__(self):
        self._providers: dict[str, BaseProvider] = {}
        self._circuit = CircuitBreaker(failure_threshold=3, reset_timeout=60)
        self._rate_limiters: dict[str, TokenBucket] = {}
        for pname, (rate, per) in PROVIDER_RATES.items():
            self._rate_limiters[pname] = TokenBucket(rate=rate, per_seconds=per)
        self._load_providers()

    def _load_providers(self):
        from .models import AIModel
        from .models import AIProvider as AIProviderModel

        try:
            models = list(AIModel.objects.filter(is_active=True))
        except (OperationalError, ProgrammingError):
            models = []
        for m in models:
            prov_inst = AIProviderModel.objects.filter(
                provider_type__code=m.provider, is_active=True
            ).first()
            api_key = ""
            base_url = ""
            if prov_inst:
                api_key = prov_inst.get_api_key()
                base_url = prov_inst.base_url
            if not api_key:
                if m.provider == "google":
                    api_key = settings.GEMINI_API_KEY
                elif m.provider == "openai":
                    api_key = settings.OPENAI_API_KEY

            provider_obj = self._build_provider(m.provider, api_key, base_url)
            if provider_obj:
                provider_obj.model_name = m.model_id
                self._providers[m.provider] = provider_obj

        if "google" not in self._providers:
            p = GeminiProvider(api_key=settings.GEMINI_API_KEY)
            p.model_name = "gemini-3.6-flash"
            self._providers["google"] = p

    def _build_provider(self, provider_code: str, api_key: str, base_url: str) -> BaseProvider | None:
        if provider_code == "google":
            return GeminiProvider(api_key=api_key, base_url=base_url)
        elif provider_code == "openai":
            return OpenAIProvider(api_key=api_key, base_url=base_url)
        elif provider_code == "openai_compatible":
            return OpenAICompatibleProvider(api_key=api_key, base_url=base_url)
        elif provider_code == "ollama":
            return OllamaProvider(api_key=api_key, base_url=base_url)
        return None

    def get_provider_order(self, feature: str) -> list[str]:
        preferred = FEATURE_PREFERENCES.get(feature, [])
        for p in ALL_PROVIDERS:
            if p not in preferred:
                preferred.append(p)
        return preferred

    def generate(self, prompt: str, feature: str = "general", system_instruction: str = "", use_cache: bool = True, cache_ttl: int = 86400, model_id: str = "") -> AIResponse:
        if use_cache:
            cache_key = self._make_cache_key(prompt, feature, system_instruction, model_id)
            cached = cache.get(cache_key)
            if cached:
                logger.info(f"Cache hit for feature={feature}, model={model_id}")
                return cached

        order = self.get_provider_order(feature)
        if model_id:
            from .models import AIModel
            aim = AIModel.objects.filter(model_id=model_id).first()
            if aim:
                prov_code = aim.provider
                if prov_code in self._providers:
                    self._providers[prov_code].model_name = model_id
                    if prov_code in order:
                        order.remove(prov_code)
                    order.insert(0, prov_code)

        last_error = ""

        for pname in order:
            provider = self._providers.get(pname)
            if not provider:
                continue

            if self._circuit.is_open(pname):
                logger.warning(f"Circuit breaker open for {pname}, skipping")
                continue

            if not self._rate_limiters.get(pname, TokenBucket()).allow(f"{pname}:{feature}"):
                logger.warning(f"Rate limit hit for {pname}, skipping")
                continue

            try:
                if not provider.health_check():
                    logger.warning(f"Health check failed for {pname}")
                    self._circuit.record_failure(pname)
                    continue
            except Exception as e:
                logger.warning(f"Health check error for {pname}: {e}")
                self._circuit.record_failure(pname)
                continue

            try:
                response = provider.generate(prompt, system_instruction=system_instruction)
                if response.success:
                    self._circuit.record_success(pname)
                    self._log_ai_run(feature, prompt, response)
                    if use_cache and response.success:
                        key = self._make_cache_key(prompt, feature, system_instruction, model_id)
                        cache.set(key, response, cache_ttl)
                    return response
                else:
                    logger.warning(f"Provider {pname} failed: {response.error}")
                    self._circuit.record_failure(pname)
                    last_error = response.error or ""
            except Exception as e:
                logger.error(f"Provider {pname} exception: {e}")
                self._circuit.record_failure(pname)
                last_error = str(e)

        logger.error("All providers failed")
        return AIResponse(
            content="", model="", provider="none",
            success=False, error=f"All providers failed. Last error: {last_error}",
        )

    def _make_cache_key(self, prompt: str, feature: str, system_instruction: str, model_id: str = "") -> str:
        data = f"{prompt}:{feature}:{system_instruction}:{model_id}"
        h = hashlib.sha256(data.encode("utf-8")).hexdigest()
        return f"ai_cache:{h}"

    def _log_ai_run(self, feature: str, prompt: str, response: AIResponse):
        try:
            from django.contrib.auth import get_user_model

            from .models import AIRun

            user = get_user_model().objects.filter(is_superuser=True).first()
            AIRun.objects.create(
                user=user,
                feature=feature,
                prompt=prompt[:5000],
                response=response.content[:5000],
                model_used=response.model,
                tokens_used=response.total_tokens,
                cost=0,
                duration_ms=response.latency_ms,
            )
        except Exception as e:
            logger.warning(f"Failed to log AIRun: {e}")
