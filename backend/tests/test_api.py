import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.sentiment_service import SentimentService
from app.services.backtest_service import BacktestService
from app.models.schemas import AnalyzeRequest, BacktestEvent


@pytest.fixture
def analyze_request():
    return {
        "transcript": "We delivered record revenue of $18 billion this quarter, surpassing consensus estimates by 12%. Operating margins expanded to 28%, a record high. We are raising full-year guidance meaningfully above Street expectations.",
        "ticker": "AAPL",
        "sector": "Technology",
    }


@pytest.fixture
def bearish_request():
    return {
        "transcript": "Revenue came in at $9.1 billion, falling short of guidance by $800 million. We are experiencing severe margin compression and withdrawing full-year guidance. Workforce reductions of 8% are planned.",
        "ticker": "INTC",
        "sector": "Technology",
    }


@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "model_loaded" in data
    assert "version" in data


@pytest.mark.asyncio
async def test_analyze_returns_valid_structure(analyze_request):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/analyze", json=analyze_request)
    assert response.status_code == 200
    data = response.json()
    assert data["sentiment"] in ("positive", "negative", "neutral")
    assert 0 <= data["confidence"] <= 100
    assert "scores" in data
    assert "positive" in data["scores"]
    assert "negative" in data["scores"]
    assert "neutral" in data["scores"]
    assert data["price_signal"] in ("strong_buy", "buy", "hold", "sell", "strong_sell")
    assert "key_phrases" in data
    assert "summary" in data
    assert "model_version" in data


@pytest.mark.asyncio
async def test_analyze_bullish_transcript_leans_positive(analyze_request):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/analyze", json=analyze_request)
    data = response.json()
    assert data["scores"]["positive"] > data["scores"]["negative"]


@pytest.mark.asyncio
async def test_analyze_bearish_transcript_leans_negative(bearish_request):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/analyze", json=bearish_request)
    data = response.json()
    assert data["scores"]["negative"] > data["scores"]["positive"]


@pytest.mark.asyncio
async def test_analyze_guidance_detection(analyze_request):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/analyze", json=analyze_request)
    data = response.json()
    assert data["guidance"] == "raised"


@pytest.mark.asyncio
async def test_analyze_requires_min_length():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/analyze", json={"transcript": "too short"})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_model_info_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/model/info")
    assert response.status_code == 200
    data = response.json()
    assert "model_name" in data
    assert "num_labels" in data
    assert data["num_labels"] == 3
    assert "label_map" in data


@pytest.mark.asyncio
async def test_backtest_endpoint():
    events = [
        {
            "ticker": "AAPL",
            "earnings_date": "2024-01-25",
            "transcript_sentiment": "positive",
            "confidence": 85,
            "signal": "buy",
            "return_1d": 2.4,
            "return_3d": 3.1,
            "return_5d": 4.8,
            "correct": True,
        },
        {
            "ticker": "INTC",
            "earnings_date": "2024-01-25",
            "transcript_sentiment": "negative",
            "confidence": 79,
            "signal": "sell",
            "return_1d": -2.1,
            "return_3d": -3.0,
            "return_5d": -3.8,
            "correct": True,
        },
    ]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/backtest", json={"events": events})
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "events" in data
    assert "cumulative_pnl" in data
    assert data["metrics"]["total_events"] == 2
    assert 0 <= data["metrics"]["win_rate"] <= 100


def test_sentiment_service_heuristic_bullish():
    svc = SentimentService()
    req = AnalyzeRequest(
        transcript="We delivered record revenue and exceeded expectations. Operating margins expanded significantly and we are raising full-year guidance above consensus. Strong growth across all segments."
    )
    result = svc.analyze(req)
    assert result.sentiment in ("positive", "neutral", "negative")
    assert 0 <= result.confidence <= 100
    assert result.price_signal in ("strong_buy", "buy", "hold", "sell", "strong_sell")


def test_sentiment_service_heuristic_bearish():
    svc = SentimentService()
    req = AnalyzeRequest(
        transcript="Revenue missed estimates significantly. Margin compression is severe. We are withdrawing guidance and implementing workforce reductions. Dividend suspended due to cash concerns."
    )
    result = svc.analyze(req)
    assert result.sentiment in ("positive", "neutral", "negative")
    assert result.guidance in ("raised", "maintained", "withdrawn", "none")


def test_backtest_service_metrics():
    svc = BacktestService()
    events = [
        BacktestEvent(ticker="AAPL", earnings_date="2024-01-25", transcript_sentiment="positive", confidence=85, signal="buy", return_1d=3.0, return_3d=4.0, return_5d=5.0, correct=True),
        BacktestEvent(ticker="MSFT", earnings_date="2024-01-30", transcript_sentiment="negative", confidence=80, signal="sell", return_1d=-2.0, return_3d=-3.0, return_5d=-4.0, correct=True),
        BacktestEvent(ticker="IBM", earnings_date="2024-02-01", transcript_sentiment="neutral", confidence=55, signal="hold", return_1d=0.2, return_3d=0.3, return_5d=0.5, correct=True),
    ]
    result = svc.compute_metrics(events)
    assert result.metrics.total_events == 3
    assert result.metrics.win_rate == 100.0
    assert len(result.cumulative_pnl) == 3
    assert result.cumulative_pnl[-1] == pytest.approx(1.2, abs=0.1)


def test_backtest_sharpe_ratio():
    svc = BacktestService()
    returns = [2.0, -1.0, 3.0, -0.5, 1.5]
    ratio = svc._sharpe_ratio(returns)
    assert isinstance(ratio, float)


def test_backtest_max_drawdown():
    svc = BacktestService()
    pnl = [0, 2, 5, 3, 1, 4, 6]
    dd = svc._max_drawdown(pnl)
    assert dd < 0
