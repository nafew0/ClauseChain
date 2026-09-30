#!/usr/bin/env python3
"""Interactive setup for engine/.env — picks an LLM backend and writes the
env vars run.py needs, instead of hand-editing .env.example.

Usage:
    python setup.py

Safe to re-run: it never touches an existing .env without asking first.
"""
from __future__ import annotations

import getpass
import sys
from pathlib import Path

ENGINE_ROOT = Path(__file__).resolve().parent
ENV_PATH = ENGINE_ROOT / ".env"


def ask(prompt: str, default: str = "") -> str:
    suffix = f" [{default}]" if default else ""
    value = input(f"{prompt}{suffix}: ").strip()
    return value or default


def ask_secret(prompt: str) -> str:
    value = getpass.getpass(f"{prompt} (input hidden): ").strip()
    return value


def ask_choice(prompt: str, options: list[tuple[str, str]]) -> str:
    print(f"\n{prompt}")
    for i, (_, label) in enumerate(options, start=1):
        print(f"  {i}) {label}")
    while True:
        raw = input(f"Choose 1-{len(options)}: ").strip()
        if raw.isdigit() and 1 <= int(raw) <= len(options):
            return options[int(raw) - 1][0]
        print(f"Please enter a number from 1 to {len(options)}.")


def ask_yes_no(prompt: str, default: bool = False) -> bool:
    suffix = " [Y/n]" if default else " [y/N]"
    raw = input(f"{prompt}{suffix}: ").strip().lower()
    if not raw:
        return default
    return raw in {"y", "yes"}


def build_local_fallback_env() -> dict[str, str]:
    print(
        "\nLocal Ollama — key-free, no external server, but CPU/GPU-bound on this "
        "machine (a full pillar sweep can take from minutes to a few hours "
        "depending on hardware; verified slow on a 16GB Mac in practice)."
    )
    if not ask_yes_no("Is Ollama already installed and running on this machine?", True):
        print(
            "Install it first: https://ollama.com/download, then `ollama pull "
            "qwen2.5:7b` (or your chosen model) before running the engine."
        )
    model = ask("Ollama model to use", "qwen2.5:7b")
    env = {"CLAUSECHAIN_PROVIDER_PROFILE": "local_fallback"}
    if model != "qwen2.5:7b":
        env["OLLAMA_BULK_MODEL"] = model
        env["OLLAMA_REASONING_MODEL"] = model
    base_url = ask("Ollama base URL (blank = http://localhost:11434)")
    if base_url:
        env["OLLAMA_BASE_URL"] = base_url
    return env


def build_local_openweights_env() -> dict[str, str]:
    print(
        "\nRemote OpenAI-compatible server — any vLLM/similar deployment you "
        "control. Much faster than local inference if the server has a real "
        "GPU (verified: ~2s/call remote vs. minutes/call on a 16GB Mac)."
    )
    endpoint = ask("Server base URL, including /v1 (e.g. https://your-server/v1)")
    while not endpoint:
        print("This is required.")
        endpoint = ask("Server base URL, including /v1")
    api_key = ask_secret("API key/token for that server")
    print(
        "\nMost OpenAI-compatible servers list their served model id at "
        f"{endpoint.rstrip('/')}/models — check there if you're not sure."
    )
    served_model = ask("Model id the server expects (its --served-model-name, or similar)")
    while not served_model:
        print("This is required — the request will fail without it.")
        served_model = ask("Model id the server expects")
    real_label = ask(
        "Real model/weights name, for your own records (optional, e.g. "
        "unsloth/Qwen3.8-27B-NVFP4)"
    )
    env = {
        "CLAUSECHAIN_PROVIDER_PROFILE": "local_openweights",
        "LOCALAI_ENDPOINT": endpoint,
        "LOCALAI_API_KEY": api_key,
        "LOCALAI_MODEL": served_model,
    }
    if real_label:
        env["LOCALAI_MODEL_LABEL"] = real_label
    if ask_yes_no(
        "Is this a Qwen3-style \"thinking\" model? (if so, thinking is disabled "
        "by default — it otherwise burns most of the response on reasoning "
        "tokens instead of the actual answer; verified 10x+ slower and can "
        "return empty content when the token budget runs out mid-thought)",
        True,
    ):
        pass  # LOCALAI_ENABLE_THINKING already defaults to 0 (off) in code.
    else:
        env["LOCALAI_ENABLE_THINKING"] = "0"

    if ask_yes_no(
        "\nDo you have a SEPARATE server for embeddings too? (default without "
        "one: BAAI/bge-m3 runs locally on this machine — that was never the "
        "slow part, so it's fine to say no here)",
        False,
    ):
        embed_endpoint = ask("Embedding server base URL, including /v1")
        if embed_endpoint:
            env["LOCALAI_EMBED_PROVIDER"] = "openai_compatible"
            env["LOCALAI_EMBED_ENDPOINT"] = embed_endpoint
            embed_key = ask_secret(
                "API key for the embedding server (blank = reuse the LLM server's key)"
            )
            if embed_key:
                env["LOCALAI_EMBED_API_KEY"] = embed_key
            print(
                "Note: the served id can differ from the weights name (e.g. "
                "a server might serve BAAI/bge-m3 as just \"bge-m3\") — check "
                f"{embed_endpoint.rstrip('/')}/models if unsure."
            )
            embed_model = ask("Embedding model id the server expects", "BAAI/bge-m3")
            if embed_model:
                env["LOCALAI_EMBED_MODEL"] = embed_model
    return env


def ask_ocr_env() -> dict[str, str]:
    if not ask_yes_no(
        "\nDo you have an OCR server for scanned documents? (default without "
        "one: text-file passthrough, no actual OCR — fine unless your source "
        "documents are scanned images/PDFs)",
        False,
    ):
        return {}
    shape = ask_choice(
        "What does it speak?",
        [
            ("openai_compatible", "OpenAI-compatible vision chat (a vLLM-served "
                                  "vision-language model, image in / text out — "
                                  "cannot produce citation-anchored bounding boxes)"),
            ("remote_paddle", "PaddleOCR-style REST endpoint (POST an image, get back "
                              "{text, tokens/boxes, confidence} — citation-capable)"),
        ],
    )
    env: dict[str, str] = {"OCR_PROVIDER": shape}
    if shape == "openai_compatible":
        base_url = ask("OCR server base URL, including /v1")
        if base_url:
            env["OCR_BASE_URL"] = base_url
        api_key = ask_secret("API key for the OCR server (blank if none)")
        if api_key:
            env["OCR_API_KEY"] = api_key
        if base_url:
            print(f"Check {base_url.rstrip('/')}/models if you're not sure of the id.")
        model = ask("Model id the OCR server expects", "unlimited-ocr")
        if model:
            env["OCR_MODEL"] = model
    else:
        endpoint = ask("OCR server URL (base or full /ocr route)")
        if endpoint:
            env["OCR_ENDPOINT"] = endpoint
        api_key = ask_secret("API key for the OCR server (blank if none)")
        if api_key:
            env["OCR_API_KEY"] = api_key
    return env


def build_hybrid_accuracy_env() -> dict[str, str]:
    print(
        "\nCloud APIs (OpenAI/OpenRouter/Gemini) — highest accuracy, real "
        "per-run cost, needs at least one API key."
    )
    env = {"CLAUSECHAIN_PROVIDER_PROFILE": "hybrid_accuracy"}
    if ask_yes_no("Do you have an OpenAI API key?", True):
        env["OPENAI_API_KEY"] = ask_secret("OPENAI_API_KEY")
    if ask_yes_no("Do you have an OpenRouter API key? (used for bulk/reasoning tiers)", False):
        env["OPENROUTER_API_KEY"] = ask_secret("OPENROUTER_API_KEY")
    if ask_yes_no("Do you have a Gemini API key? (fallback tier)", False):
        env["GEMINI_API_KEY"] = ask_secret("GEMINI_API_KEY")
    if not any(k.endswith("_API_KEY") for k in env):
        print(
            "\nWarning: no API key entered — hybrid_accuracy will fail at "
            "call time until you add one to .env."
        )
    return env


def main() -> int:
    print("ClauseChain engine — .env setup\n" + "=" * 32)

    if ENV_PATH.exists():
        print(f"\n{ENV_PATH} already exists.")
        if not ask_yes_no("Overwrite it?", False):
            print("Leaving your existing .env untouched. Nothing written.")
            return 0

    backend = ask_choice(
        "Which LLM backend should the engine use?",
        [
            ("local_fallback", "Local Ollama on this machine (key-free, slower)"),
            ("local_openweights", "A remote server you control (vLLM or any "
                                  "OpenAI-compatible endpoint — faster, needs a URL + key)"),
            ("hybrid_accuracy", "Cloud APIs — OpenAI/OpenRouter/Gemini (highest "
                                "accuracy, real cost, needs API key(s))"),
        ],
    )
    if backend == "local_fallback":
        env = build_local_fallback_env()
    elif backend == "local_openweights":
        env = build_local_openweights_env()
    else:
        env = build_hybrid_accuracy_env()

    env.update(ask_ocr_env())

    lines = [
        "# Written by setup.py — see .env.example for every available option.",
        "",
    ]
    for key, value in env.items():
        lines.append(f"{key}={value}")
    ENV_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\nWrote {ENV_PATH} ({len(env)} vars). Try it now:")
    print("  python run.py --economy SG --pillar 6 --out outputs/demo")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (KeyboardInterrupt, EOFError):
        print("\nAborted — nothing written.")
        raise SystemExit(1)
