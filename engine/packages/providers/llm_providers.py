"""LLM provider implementations behind the `LLMProvider` protocol.

Plain REST via httpx (no vendor SDKs): keeps the dependency surface small and
makes the modular-swap story literal. All providers are constructed cheaply;
API keys are only required at call time.
"""
from __future__ import annotations

import json
import os
import sys

import httpx
from pydantic import BaseModel, ValidationError


def _schema_instruction(schema: type[BaseModel]) -> str:
    return (
        "\n\nReturn ONLY a JSON object (no markdown, no prose) matching this JSON schema:\n"
        + json.dumps(schema.model_json_schema(), ensure_ascii=False)
    )


class OpenAIChatProvider:
    def __init__(self, model: str, api_key_env: str = "OPENAI_API_KEY", timeout: float = 90.0) -> None:
        self.model = model
        self.api_key_env = api_key_env
        self.timeout = timeout
        self.last_usage: dict | None = None

    RETRY_BACKOFFS_S = (5.0, 20.0)   # transient 429/5xx/network retries before giving up

    def _call(self, prompt: str) -> str:
        import time as _time

        api_key = os.getenv(self.api_key_env)
        if not api_key:
            raise RuntimeError(f"{self.api_key_env} is not set")
        last_error: Exception | None = None
        for attempt in range(1 + len(self.RETRY_BACKOFFS_S)):
            try:
                response = httpx.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "response_format": {"type": "json_object"},
                        "temperature": 0,
                    },
                    timeout=self.timeout,
                )
                if response.status_code == 429 or response.status_code >= 500:
                    raise httpx.HTTPStatusError(
                        f"retryable {response.status_code}", request=response.request,
                        response=response,
                    )
                response.raise_for_status()
                payload = response.json()
                self.last_usage = payload.get("usage")
                if self.last_usage:
                    from packages.providers import cost

                    cost.record(self.model, self.last_usage.get("prompt_tokens", 0),
                                self.last_usage.get("completion_tokens", 0))
                return payload["choices"][0]["message"]["content"]
            except (httpx.HTTPStatusError, httpx.TransportError) as error:
                last_error = error
                if attempt < len(self.RETRY_BACKOFFS_S):
                    _time.sleep(self.RETRY_BACKOFFS_S[attempt])
        raise last_error  # type: ignore[misc]

    def complete(self, prompt: str, schema: type[BaseModel]) -> BaseModel:
        full_prompt = prompt + _schema_instruction(schema)
        text = self._call(full_prompt)
        try:
            return schema.model_validate_json(text)
        except ValidationError as error:
            retry_prompt = (
                f"{full_prompt}\n\nYour previous answer was invalid: {error}\n"
                f"Previous answer: {text}\nFix it and return only valid JSON."
            )
            return schema.model_validate_json(self._call(retry_prompt))


class GeminiChatProvider:
    def __init__(self, model: str, api_key_env: str = "GEMINI_API_KEY", timeout: float = 90.0) -> None:
        self.model = model
        self.api_key_env = api_key_env
        self.timeout = timeout
        self.last_usage: dict | None = None

    def _call(self, prompt: str) -> str:
        api_key = os.getenv(self.api_key_env)
        if not api_key:
            raise RuntimeError(f"{self.api_key_env} is not set")
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent?key={api_key}"
        )
        response = httpx.post(
            url,
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"responseMimeType": "application/json"},
            },
            timeout=self.timeout,
        )
        response.raise_for_status()
        payload = response.json()
        self.last_usage = payload.get("usageMetadata")
        return payload["candidates"][0]["content"]["parts"][0]["text"]

    def complete(self, prompt: str, schema: type[BaseModel]) -> BaseModel:
        full_prompt = prompt + _schema_instruction(schema)
        text = self._call(full_prompt)
        try:
            return schema.model_validate_json(text)
        except ValidationError as error:
            retry_prompt = (
                f"{full_prompt}\n\nYour previous answer was invalid: {error}\n"
                f"Previous answer: {text}\nFix it and return only valid JSON."
            )
            return schema.model_validate_json(self._call(retry_prompt))


class FallbackLLM:
    """Try the primary provider; on any error, use the fallback and log it."""

    def __init__(self, primary, fallback=None) -> None:
        self.primary = primary
        self.fallback = fallback

    def complete(self, prompt: str, schema: type[BaseModel]) -> BaseModel:
        try:
            return self.primary.complete(prompt, schema)
        except Exception as error:  # noqa: BLE001 — any primary failure triggers fallback
            if self.fallback is None:
                raise
            print(f"[model-router] primary failed ({error!r}); using fallback", file=sys.stderr)
            try:
                return self.fallback.complete(prompt, schema)
            except Exception as fallback_error:  # noqa: BLE001
                # an unusable fallback (e.g. no API key) must not mask the real failure
                raise error from fallback_error


class OllamaProvider:
    """Local LLM via Ollama's REST API — key-free (Path A). No network in __init__."""

    def __init__(self, model: str, base_url: str | None = None, timeout: float = 180.0) -> None:
        self.model = model
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.timeout = timeout
        self.last_usage: dict | None = None

    def _call(self, prompt: str) -> str:
        response = httpx.post(
            f"{self.base_url}/api/generate",
            json={"model": self.model, "prompt": prompt, "stream": False, "format": "json"},
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response.json()["response"]

    def complete(self, prompt: str, schema: type[BaseModel]) -> BaseModel:
        full_prompt = prompt + _schema_instruction(schema)
        text = self._call(full_prompt)
        try:
            return schema.model_validate_json(text)
        except ValidationError as error:
            retry_prompt = (
                f"{full_prompt}\n\nYour previous answer was invalid: {error}\n"
                f"Previous answer: {text}\nFix it and return only valid JSON."
            )
            return schema.model_validate_json(self._call(retry_prompt))


def build_llm(spec: str):
    """Build a provider from a 'provider:model' spec, e.g. 'openai:gpt-5.4-nano'."""
    provider, _, model = spec.partition(":")
    provider = provider.strip().lower()
    model = model.strip()
    if not model:
        raise ValueError(f"Model spec {spec!r} must look like 'provider:model'")
    if provider == "openai":
        return OpenAIChatProvider(model)
    if provider in {"google", "gemini"}:
        return GeminiChatProvider(model)
    if provider == "ollama":
        return OllamaProvider(model)
    raise ValueError(f"Unknown LLM provider in spec {spec!r}")
