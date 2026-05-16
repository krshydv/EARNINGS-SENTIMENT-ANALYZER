from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict
from functools import lru_cache
from pathlib import Path


class Settings(BaseSettings):
    APP_NAME: str = "Earnings Sentiment Analyzer"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = "sqlite+aiosqlite:///./earnings.db"

    MODEL_NAME: str = "allenai/longformer-base-4096"
    MODEL_PATH: str = str(Path(__file__).parent.parent.parent / "models" / "fine_tuned")
    MAX_SEQ_LENGTH: int = 4096
    INFERENCE_BATCH_SIZE: int = 1
    NUM_LABELS: int = 3
    LABEL_MAP: dict = {0: "negative", 1: "neutral", 2: "positive"}

    YFINANCE_LOOKBACK_DAYS: int = 10
    EVENT_WINDOW_DAYS: list = [1, 3, 5]

    RATE_LIMIT_PER_MINUTE: int = 30

    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache()
def get_settings() -> Settings:
    return Settings()
