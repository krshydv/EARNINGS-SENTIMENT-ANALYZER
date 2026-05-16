from fastapi import APIRouter, HTTPException, Request
from loguru import logger

from app.core.config import get_settings
from app.models.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    BacktestRequest,
    BacktestResponse,
    ModelInfoResponse,
    HealthResponse,
)
from app.services.sentiment_service import sentiment_service
from app.services.backtest_service import backtest_service

router = APIRouter()
settings = get_settings()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        model_loaded=sentiment_service.is_loaded,
        version=settings.APP_VERSION,
    )


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_transcript(request: AnalyzeRequest):
    try:
        result = sentiment_service.analyze(request)
        logger.info(f"Analyzed transcript | sentiment={result.sentiment} | confidence={result.confidence}")
        return result
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/backtest", response_model=BacktestResponse)
async def run_backtest(request: BacktestRequest):
    try:
        result = backtest_service.run(request.events)
        logger.info(f"Backtest complete | events={result.metrics.total_events} | win_rate={result.metrics.win_rate}%")
        return result
    except Exception as e:
        logger.error(f"Backtest failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/model/info", response_model=ModelInfoResponse)
async def model_info():
    return ModelInfoResponse(
        model_name=settings.MODEL_NAME,
        model_version="longformer-earnings-v1",
        num_labels=settings.NUM_LABELS,
        label_map=settings.LABEL_MAP,
        max_seq_length=settings.MAX_SEQ_LENGTH,
        accuracy=0.45,
        weighted_f1=0.41,
        loaded=sentiment_service.is_loaded,
    )
