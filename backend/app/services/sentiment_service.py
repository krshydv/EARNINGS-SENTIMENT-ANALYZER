import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import numpy as np
# Import heavy ML libs lazily inside load_model/_transformer_analyze to avoid hard dependency at import time
from loguru import logger

from app.core.config import get_settings
from app.models.schemas import AnalyzeRequest, AnalyzeResponse, SentimentScores, KeyPhrases

settings = get_settings()

BULLISH_SIGNALS = [
    "record revenue", "exceeded expectations", "raised guidance", "above consensus",
    "strong growth", "margin expansion", "record earnings", "beat estimates",
    "all-time high", "accelerating", "outperformed", "raised full-year",
    "strong pipeline", "robust demand", "significant momentum", "double-digit growth",
]

BEARISH_SIGNALS = [
    "missed estimates", "below expectations", "lowered guidance", "withdrew guidance",
    "margin compression", "restructuring", "workforce reduction", "headwinds",
    "challenged", "declined", "uncertainty", "suspended dividend", "under pressure",
    "deteriorating", "falling short", "significant challenges",
]

PRICE_SIGNAL_MAP = {
    ("positive", 80): "strong_buy",
    ("positive", 60): "buy",
    ("positive", 0): "hold",
    ("negative", 80): "strong_sell",
    ("negative", 60): "sell",
    ("negative", 0): "hold",
    ("neutral", 0): "hold",
}

EXPECTED_MOVE_MAP = {
    "strong_buy": "+4.0% to +7.0%",
    "buy": "+1.5% to +4.0%",
    "hold": "-1.5% to +1.5%",
    "sell": "-4.0% to -1.5%",
    "strong_sell": "-7.0% to -4.0%",
}


class SentimentService:
    _instance: Optional["SentimentService"] = None
    _model: Optional[Any] = None
    _tokenizer: Optional[Any] = None
    _loaded: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load_model(self):
        model_path = Path(settings.MODEL_PATH)
        source = str(model_path) if model_path.exists() else settings.MODEL_NAME
        logger.info(f"Loading model from: {source}")
        try:
            # Lazy import to prevent import-time failures when packages are not installed
            import torch
            from transformers import LongformerTokenizer, LongformerForSequenceClassification

            self._tokenizer = LongformerTokenizer.from_pretrained(source)
            self._model = LongformerForSequenceClassification.from_pretrained(
                source,
                num_labels=settings.NUM_LABELS,
                ignore_mismatched_sizes=True,
            )
            self._model.eval()
            self._loaded = True
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.warning(f"Model load failed ({e}), falling back to heuristic mode")
            self._loaded = False

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def _heuristic_analyze(self, text: str) -> dict:
        text_lower = text.lower()
        pos_hits = sum(1 for s in BULLISH_SIGNALS if s in text_lower)
        neg_hits = sum(1 for s in BEARISH_SIGNALS if s in text_lower)
        total = max(pos_hits + neg_hits, 1)
        pos_score = round((pos_hits / total) * 85 + np.random.uniform(-5, 5), 1)
        neg_score = round((neg_hits / total) * 85 + np.random.uniform(-5, 5), 1)
        pos_score = max(5.0, min(95.0, pos_score))
        neg_score = max(5.0, min(95.0, neg_score))
        neu_score = round(max(0, 100 - pos_score - neg_score), 1)
        if pos_score > neg_score and pos_score > neu_score:
            sentiment = "positive"
            confidence = round(pos_score, 1)
        elif neg_score > pos_score and neg_score > neu_score:
            sentiment = "negative"
            confidence = round(neg_score, 1)
        else:
            sentiment = "neutral"
            confidence = round(neu_score, 1)
        return {
            "sentiment": sentiment,
            "confidence": confidence,
            "scores": {"positive": pos_score, "negative": neg_score, "neutral": neu_score},
        }

    def _transformer_analyze(self, text: str) -> dict:
        if self._tokenizer is None or self._model is None:
            raise RuntimeError("Sentiment model is not loaded")

        # Lazy import torch for environments without it
        try:
            import torch
        except Exception as e:
            raise RuntimeError(f"Torch not available: {e}")

        inputs = self._tokenizer(
            text,
            return_tensors="pt",
            max_length=settings.MAX_SEQ_LENGTH,
            truncation=True,
            padding=True,
        )
        with torch.no_grad():
            outputs = self._model(**inputs)
            probs = torch.softmax(outputs.logits, dim=-1).squeeze().detach().cpu().tolist()

        if isinstance(probs, float) or len(probs) != 3:
            raise RuntimeError("Unexpected model output shape")

        label_id = int(np.argmax(probs))
        sentiment = settings.LABEL_MAP[label_id]
        confidence = round(float(probs[label_id]) * 100, 1)
        return {
            "sentiment": sentiment,
            "confidence": confidence,
            "scores": {
                "negative": round(float(probs[0]) * 100, 1),
                "neutral": round(float(probs[1]) * 100, 1),
                "positive": round(float(probs[2]) * 100, 1),
            },
        }

    def _extract_key_phrases(self, text: str) -> KeyPhrases:
        text_lower = text.lower()
        sentences = re.split(r"[.!?]", text)
        pos_phrases, neg_phrases, neu_phrases = [], [], []
        for sentence in sentences:
            s = sentence.strip()
            if len(s) < 15:
                continue
            sl = s.lower()
            if any(sig in sl for sig in BULLISH_SIGNALS) and len(pos_phrases) < 4:
                pos_phrases.append(s[:80].strip())
            elif any(sig in sl for sig in BEARISH_SIGNALS) and len(neg_phrases) < 4:
                neg_phrases.append(s[:80].strip())
            elif len(neu_phrases) < 3 and len(s) > 20:
                neu_phrases.append(s[:80].strip())
        return KeyPhrases(positive=pos_phrases[:4], negative=neg_phrases[:4], neutral=neu_phrases[:3])

    def _infer_guidance(self, text: str) -> str:
        t = text.lower()
        if any(w in t for w in ["raising guidance", "raised guidance", "raising full-year guidance", "raise full-year", "above our previous"]):
            return "raised"
        if any(w in t for w in ["withdrew guidance", "withdrawing guidance", "suspending guidance"]):
            return "withdrawn"
        if any(w in t for w in ["maintaining guidance", "unchanged", "in line with"]):
            return "maintained"
        return "none"

    def _infer_margin_trend(self, text: str) -> str:
        t = text.lower()
        if any(w in t for w in ["margin expansion", "expanded", "improving margins"]):
            return "expanding"
        if any(w in t for w in ["margin compression", "compressed", "margin pressure", "contracting"]):
            return "contracting"
        if "stable" in t or "maintained" in t:
            return "stable"
        return "unknown"

    def _infer_revenue_vs_consensus(self, text: str) -> str:
        t = text.lower()
        if any(w in t for w in ["exceeded", "beat", "surpassed", "above consensus", "above estimates"]):
            return "beat"
        if any(w in t for w in ["missed", "below", "fell short", "came in below"]):
            return "miss"
        if any(w in t for w in ["in line", "as expected", "consistent with"]):
            return "inline"
        return "unspecified"

    def _derive_price_signal(self, sentiment: str, confidence: float) -> str:
        if sentiment == "neutral":
            return "hold"
        for (s, threshold), signal in PRICE_SIGNAL_MAP.items():
            if s == sentiment and confidence >= threshold:
                return signal
        return "hold"

    def analyze(self, request: AnalyzeRequest) -> AnalyzeResponse:
        text = request.transcript
        try:
            base = self._transformer_analyze(text) if self._loaded else self._heuristic_analyze(text)
        except Exception as exc:
            logger.warning(f"Transformer inference failed, falling back to heuristic mode: {exc}")
            self._loaded = False
            base = self._heuristic_analyze(text)
        sentiment = base["sentiment"]
        confidence = base["confidence"]
        scores = base["scores"]
        key_phrases = self._extract_key_phrases(text)
        guidance = self._infer_guidance(text)
        margin_trend = self._infer_margin_trend(text)
        revenue_vs_consensus = self._infer_revenue_vs_consensus(text)
        price_signal = self._derive_price_signal(sentiment, confidence)
        expected_move = EXPECTED_MOVE_MAP[price_signal]
        signal_words = {
            "strong_buy": "Strongly bullish tone",
            "buy": "Moderately bullish tone",
            "hold": "Mixed or neutral tone",
            "sell": "Moderately bearish tone",
            "strong_sell": "Strongly bearish tone",
        }
        summary = f"{signal_words[price_signal]} detected with {confidence:.0f}% confidence. Guidance: {guidance}. Revenue vs consensus: {revenue_vs_consensus}."
        return AnalyzeResponse(
            sentiment=sentiment,
            confidence=confidence,
            scores=SentimentScores(**scores),
            price_signal=price_signal,
            expected_move=expected_move,
            key_phrases=key_phrases,
            guidance=guidance,
            margin_trend=margin_trend,
            revenue_vs_consensus=revenue_vs_consensus,
            summary=summary,
            model_version="longformer-earnings-v1" if self._loaded else "heuristic-v1",
            processed_at=datetime.now(timezone.utc),
        )


sentiment_service = SentimentService()
