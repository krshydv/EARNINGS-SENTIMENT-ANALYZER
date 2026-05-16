from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class APIModel(BaseModel):
    model_config = ConfigDict(protected_namespaces=())


class AnalyzeRequest(APIModel):
    transcript: str = Field(..., min_length=50, max_length=50000, description="Earnings call transcript text")
    ticker: Optional[str] = Field(None, max_length=10, description="Stock ticker symbol")
    sector: Optional[str] = Field(None, description="Company sector")
    earnings_date: Optional[str] = Field(None, description="Earnings date YYYY-MM-DD for backtest correlation")

    model_config = ConfigDict(
        protected_namespaces=(),
        json_schema_extra={
            "example": {
                "transcript": "We delivered record revenue of $18.3 billion this quarter...",
                "ticker": "AAPL",
                "sector": "Technology",
                "earnings_date": "2024-01-25",
            }
        },
    )


class SentimentScores(APIModel):
    positive: float
    neutral: float
    negative: float


class KeyPhrases(APIModel):
    positive: list[str]
    negative: list[str]
    neutral: list[str]


class AnalyzeResponse(APIModel):
    sentiment: str
    confidence: float
    scores: SentimentScores
    price_signal: str
    expected_move: str
    key_phrases: KeyPhrases
    guidance: str
    margin_trend: str
    revenue_vs_consensus: str
    summary: str
    model_version: str
    processed_at: datetime


class BacktestEvent(APIModel):
    ticker: str
    earnings_date: str
    transcript_sentiment: str
    confidence: float
    signal: str
    return_1d: Optional[float]
    return_3d: Optional[float]
    return_5d: Optional[float]
    correct: Optional[bool]


class BacktestRequest(APIModel):
    events: list[BacktestEvent]


class BacktestMetrics(APIModel):
    total_events: int
    win_rate: float
    avg_return_1d: float
    avg_return_5d: float
    sharpe_ratio: float
    max_drawdown: float
    positive_avg_return: float
    negative_avg_return: float
    neutral_avg_return: float


class BacktestResponse(APIModel):
    metrics: BacktestMetrics
    events: list[BacktestEvent]
    cumulative_pnl: list[float]


class ModelInfoResponse(APIModel):
    model_name: str
    model_version: str
    num_labels: int
    label_map: dict
    max_seq_length: int
    accuracy: float
    weighted_f1: float
    loaded: bool


class HealthResponse(APIModel):
    status: str
    model_loaded: bool
    version: str
