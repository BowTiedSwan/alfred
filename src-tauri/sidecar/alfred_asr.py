#!/usr/bin/env python3

import json
import logging
import sys
import time
from typing import Any


logging.basicConfig(stream=sys.stderr, level=logging.INFO)
logger = logging.getLogger("alfred_asr")


class ASREngine:
    def __init__(self) -> None:
        self.model: Any = None
        self.processor: Any = None
        self.model_id: str | None = None
        self.device: str = "cpu"
        self.engine_type: str | None = None
        self.whisper_backend: str | None = None
        self.torch: Any = None
        self.np: Any = None
        self.whisper: Any = None

    def _import_numpy(self) -> Any:
        if self.np is None:
            try:
                import numpy as np  # type: ignore
            except Exception as exc:
                raise RuntimeError(f"Failed to import numpy: {exc}") from exc
            self.np = np
        return self.np

    def _import_torch(self) -> Any:
        if self.torch is None:
            try:
                import torch  # type: ignore
            except Exception as exc:
                raise RuntimeError(f"Failed to import torch: {exc}") from exc
            self.torch = torch
        return self.torch

    def _import_whisper(self) -> Any:
        if self.whisper is None:
            try:
                import whisper  # type: ignore
            except Exception as exc:
                raise RuntimeError(
                    f"Failed to import whisper. Install openai-whisper package: {exc}"
                ) from exc
            self.whisper = whisper
        return self.whisper

    def _resolve_engine_type(self, model_id: str, requested_engine: str | None) -> str:
        if requested_engine in {"whisper", "qwen"}:
            return requested_engine
        lowered = model_id.lower()
        if "qwen" in lowered:
            return "qwen"
        return "whisper"

    def _resolve_device(self, requested_device: str) -> str:
        torch = self._import_torch()
        device = (requested_device or "cpu").lower()
        if device == "mps":
            mps_ok = hasattr(torch.backends, "mps") and torch.backends.mps.is_available()
            if not mps_ok:
                logger.warning("Requested MPS, but unavailable. Falling back to CPU.")
                return "cpu"
            return "mps"
        if device.startswith("cuda"):
            if not torch.cuda.is_available():
                logger.warning("Requested CUDA, but unavailable. Falling back to CPU.")
                return "cpu"
            return device
        return "cpu"

    def _normalize_whisper_model_id(self, model_id: str) -> str:
        model_id = (model_id or "").strip()
        if not model_id:
            return "base.en"
        mapping = {
            "openai/whisper-base.en": "base.en",
            "openai/whisper-base": "base",
            "openai/whisper-small": "small",
            "openai/whisper-small.en": "small.en",
            "openai/whisper-tiny.en": "tiny.en",
            "openai/whisper-medium.en": "medium.en",
        }
        if model_id in mapping:
            return mapping[model_id]
        return model_id

    def _whisper_hf_model_id(self, whisper_model_id: str) -> str:
        mapping = {
            "tiny": "openai/whisper-tiny",
            "tiny.en": "openai/whisper-tiny.en",
            "base": "openai/whisper-base",
            "base.en": "openai/whisper-base.en",
            "small": "openai/whisper-small",
            "small.en": "openai/whisper-small.en",
            "medium": "openai/whisper-medium",
            "medium.en": "openai/whisper-medium.en",
        }
        return mapping.get(whisper_model_id, whisper_model_id)

    def _resample_audio(self, audio: Any, source_rate: int, target_rate: int) -> Any:
        np = self._import_numpy()
        if source_rate == target_rate:
            return audio
        if source_rate <= 0 or target_rate <= 0:
            raise ValueError("Sample rates must be positive integers")
        if audio.size == 0:
            return audio
        duration = float(audio.shape[0]) / float(source_rate)
        target_length = max(1, int(round(duration * target_rate)))
        src_positions = np.linspace(0.0, duration, num=audio.shape[0], endpoint=False)
        tgt_positions = np.linspace(0.0, duration, num=target_length, endpoint=False)
        return np.interp(tgt_positions, src_positions, audio).astype(np.float32)

    def _load_qwen(self, model_id: str, device: str) -> None:
        try:
            from transformers import AutoModelForCausalLM, AutoProcessor  # type: ignore
        except Exception as exc:
            raise RuntimeError(f"Failed to import transformers components: {exc}") from exc

        torch = self._import_torch()
        torch_dtype = torch.float16 if device in {"mps", "cuda"} else torch.float32

        try:
            model = AutoModelForCausalLM.from_pretrained(
                model_id,
                torch_dtype=torch_dtype,
                low_cpu_mem_usage=True,
            )
        except TypeError:
            model = AutoModelForCausalLM.from_pretrained(model_id, torch_dtype=torch_dtype)

        model.to(device)
        model.eval()
        processor = AutoProcessor.from_pretrained(model_id)

        self.model = model
        self.processor = processor

    def _load_whisper(self, model_id: str, device: str) -> None:
        whisper_model_id = self._normalize_whisper_model_id(model_id)

        try:
            whisper = self._import_whisper()
            self.model = whisper.load_model(whisper_model_id, device=device)
            self.processor = None
            self.whisper_backend = "openai_whisper"
            return
        except Exception as exc:
            logger.warning(
                "openai-whisper unavailable (%s). Falling back to transformers pipeline.",
                exc,
            )

        try:
            from transformers import pipeline  # type: ignore
        except Exception as exc:
            raise RuntimeError(
                "Whisper backend unavailable. Install openai-whisper or transformers."
            ) from exc

        torch = self._import_torch()
        torch_dtype = torch.float16 if device in {"mps", "cuda"} else torch.float32
        hf_model_id = self._whisper_hf_model_id(whisper_model_id)

        self.model = pipeline(
            task="automatic-speech-recognition",
            model=hf_model_id,
            device=device,
            model_kwargs={"torch_dtype": torch_dtype},
        )
        self.processor = None
        self.whisper_backend = "transformers_pipeline"

    def load_model(
        self,
        model_id: str = "openai/whisper-base.en",
        device: str = "cpu",
        engine_type: str | None = None,
    ) -> dict[str, Any]:
        start = time.perf_counter()
        requested_model_id = model_id or "openai/whisper-base.en"
        selected_engine = self._resolve_engine_type(requested_model_id, engine_type)
        resolved_device = self._resolve_device(device)

        if selected_engine == "qwen":
            self._load_qwen(requested_model_id, resolved_device)
            self.whisper_backend = None
        else:
            self._load_whisper(requested_model_id, resolved_device)

        self.model_id = requested_model_id
        self.device = resolved_device
        self.engine_type = selected_engine

        load_time_ms = int((time.perf_counter() - start) * 1000)
        logger.info(
            "Model loaded: engine=%s model_id=%s device=%s in %dms",
            self.engine_type,
            self.model_id,
            self.device,
            load_time_ms,
        )
        return {
            "type": "model_loaded",
            "model_id": self.model_id,
            "device": self.device,
            "engine_type": self.engine_type,
            "load_time_ms": load_time_ms,
        }

    def _ensure_loaded(self) -> None:
        if self.model is None:
            raise RuntimeError("Model is not loaded. Send load_model first.")

    def _transcribe_with_whisper(self, audio_np: Any, sample_rate: int) -> str:
        prepared = self._resample_audio(audio_np, sample_rate, 16000)
        if self.whisper_backend == "transformers_pipeline":
            result = self.model(
                {"array": prepared, "sampling_rate": 16000},
                generate_kwargs={"task": "transcribe", "language": "en"},
            )
            return (result.get("text") or "").strip()

        result = self.model.transcribe(
            prepared,
            language="en",
            fp16=False,
            condition_on_previous_text=False,
        )
        return (result.get("text") or "").strip()

    def _read_audio_file(self, file_path: str) -> tuple[Any, int]:
        try:
            import soundfile as sf  # type: ignore
        except Exception as exc:
            raise RuntimeError(f"Failed to import soundfile: {exc}") from exc

        np = self._import_numpy()
        audio, sample_rate = sf.read(file_path, dtype="float32", always_2d=False)
        if getattr(audio, "ndim", 1) > 1:
            audio = np.mean(audio, axis=1)
        return audio, int(sample_rate)

    def _transcribe_with_qwen(self, audio_np: Any, sample_rate: int) -> str:
        torch = self._import_torch()
        prepared = self._resample_audio(audio_np, sample_rate, 16000)

        conversation = [
            {
                "role": "user",
                "content": [
                    {"type": "audio", "audio": prepared},
                    {"type": "text", "text": "Transcribe the speech in this audio."},
                ],
            }
        ]

        prompt = self.processor.apply_chat_template(
            conversation,
            add_generation_prompt=True,
            tokenize=False,
        )
        inputs = self.processor(
            text=prompt,
            audios=[prepared],
            sampling_rate=16000,
            return_tensors="pt",
        )

        for key, value in list(inputs.items()):
            if hasattr(value, "to"):
                inputs[key] = value.to(self.device)

        with torch.no_grad():
            generated = self.model.generate(**inputs, max_new_tokens=256)

        if "input_ids" in inputs and hasattr(inputs["input_ids"], "shape"):
            prompt_len = int(inputs["input_ids"].shape[-1])
            generated = generated[:, prompt_len:]

        text = self.processor.batch_decode(generated, skip_special_tokens=True)[0]
        return text.strip()

    def transcribe(self, audio_samples: list[float], sample_rate: int) -> dict[str, Any]:
        self._ensure_loaded()
        if sample_rate <= 0:
            raise ValueError("sample_rate must be a positive integer")

        np = self._import_numpy()
        audio_np = np.asarray(audio_samples, dtype=np.float32)
        if audio_np.ndim != 1:
            audio_np = audio_np.reshape(-1)
        if audio_np.size == 0:
            raise ValueError("audio_samples cannot be empty")

        start = time.perf_counter()
        if self.engine_type == "qwen":
            text = self._transcribe_with_qwen(audio_np, sample_rate)
        else:
            text = self._transcribe_with_whisper(audio_np, sample_rate)
        latency_ms = int((time.perf_counter() - start) * 1000)

        return {
            "type": "transcript",
            "text": text,
            "is_final": True,
            "latency_ms": latency_ms,
        }

    def transcribe_file(self, file_path: str) -> dict[str, Any]:
        self._ensure_loaded()
        if not file_path:
            raise ValueError("file_path is required")

        start = time.perf_counter()
        if self.engine_type == "qwen":
            audio, sample_rate = self._read_audio_file(file_path)
            text = self._transcribe_with_qwen(audio, int(sample_rate))
        else:
            if self.whisper_backend == "transformers_pipeline":
                audio, sample_rate = self._read_audio_file(file_path)
                text = self._transcribe_with_whisper(audio, int(sample_rate))
            else:
                result = self.model.transcribe(
                    file_path,
                    language="en",
                    fp16=False,
                    condition_on_previous_text=False,
                )
                text = (result.get("text") or "").strip()

        latency_ms = int((time.perf_counter() - start) * 1000)
        return {
            "type": "transcript",
            "text": text,
            "is_final": True,
            "latency_ms": latency_ms,
        }

    def status(self) -> dict[str, Any]:
        return {
            "type": "status",
            "model_loaded": self.model is not None,
            "model_id": self.model_id,
            "device": self.device,
            "engine_type": self.engine_type,
        }


def handle_request(engine: ASREngine, request: dict[str, Any]) -> tuple[dict[str, Any], bool]:
    req_type = request.get("type")

    if req_type == "load_model":
        model_id = request.get("model_id") or "openai/whisper-base.en"
        device = request.get("device") or "cpu"
        engine_type = request.get("engine")
        response = engine.load_model(model_id=model_id, device=device, engine_type=engine_type)
        return response, False

    if req_type == "status":
        return engine.status(), False

    if req_type == "transcribe":
        if "audio_samples" not in request:
            raise ValueError("transcribe request requires 'audio_samples'")
        audio_samples = request.get("audio_samples")
        sample_rate = int(request.get("sample_rate", 16000))
        if not isinstance(audio_samples, list):
            raise ValueError("audio_samples must be a list of floats")
        response = engine.transcribe(audio_samples=audio_samples, sample_rate=sample_rate)
        return response, False

    if req_type == "transcribe_file":
        file_path = request.get("file_path")
        if not isinstance(file_path, str) or not file_path:
            raise ValueError("transcribe_file request requires non-empty 'file_path'")
        response = engine.transcribe_file(file_path=file_path)
        return response, False

    if req_type == "shutdown":
        return {"type": "shutdown_ack"}, True

    raise ValueError(f"Unknown request type: {req_type}")


def main() -> None:
    engine = ASREngine()
    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            response = {"type": "error", "message": "Empty input line"}
            sys.stdout.write(json.dumps(response) + "\n")
            sys.stdout.flush()
            continue

        try:
            request = json.loads(line)
            if not isinstance(request, dict):
                raise ValueError("Request must be a JSON object")
            response, should_shutdown = handle_request(engine, request)
        except Exception as exc:
            logger.exception("Failed processing request")
            response = {"type": "error", "message": str(exc)}
            should_shutdown = False

        sys.stdout.write(json.dumps(response) + "\n")
        sys.stdout.flush()

        if should_shutdown:
            logger.info("Shutdown requested. Exiting ASR sidecar.")
            break


if __name__ == "__main__":
    main()
