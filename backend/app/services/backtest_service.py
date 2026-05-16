import numpy as np
from loguru import logger

from app.models.schemas import BacktestEvent, BacktestMetrics, BacktestResponse
from app.services.price_service import price_service


class BacktestService:
    def _is_correct(self, sentiment: str, return_1d: float) -> bool:
        if sentiment == "positive" and return_1d > 0:
            return True
        if sentiment == "negative" and return_1d < 0:
            return True
        if sentiment == "neutral" and abs(return_1d) < 1.5:
            return True
        return False

    def _sharpe_ratio(self, returns: list[float]) -> float:
        arr = np.array(returns)
        if arr.std() == 0:
            return 0.0
        return round(float((arr.mean() / arr.std()) * np.sqrt(252 / 20)), 2)

    def _max_drawdown(self, cumulative: list[float]) -> float:
        peak = cumulative[0]
        max_dd = 0.0
        for val in cumulative:
            if val > peak:
                peak = val
            dd = (peak - val) / max(abs(peak), 1e-6) * 100
            if dd > max_dd:
                max_dd = dd
        return round(-max_dd, 2)

    def enrich_with_prices(self, events: list[BacktestEvent]) -> list[BacktestEvent]:
        enriched = []
        for event in events:
            if event.earnings_date and event.ticker and (event.return_1d is None):
                returns = price_service.get_price_returns(event.ticker, event.earnings_date)
                event.return_1d = returns.get("return_1d")
                event.return_3d = returns.get("return_3d")
                event.return_5d = returns.get("return_5d")
            if event.return_1d is not None:
                event.correct = self._is_correct(event.transcript_sentiment, event.return_1d)
            enriched.append(event)
        return enriched

    def compute_metrics(self, events: list[BacktestEvent]) -> BacktestResponse:
        valid = [e for e in events if e.return_1d is not None]
        if not valid:
            return BacktestResponse(
                metrics=BacktestMetrics(
                    total_events=len(events),
                    win_rate=0, avg_return_1d=0, avg_return_5d=0,
                    sharpe_ratio=0, max_drawdown=0,
                    positive_avg_return=0, negative_avg_return=0, neutral_avg_return=0,
                ),
                events=events,
                cumulative_pnl=[0],
            )
        returns_1d = [e.return_1d for e in valid]
        returns_5d = [e.return_5d for e in valid if e.return_5d is not None]
        correct = [e for e in valid if e.correct]
        cum_pnl = []
        running = 0.0
        for r in returns_1d:
            running += r
            cum_pnl.append(round(running, 2))
        def avg_return_for(sentiment):
            r = [e.return_1d for e in valid if e.transcript_sentiment == sentiment]
            return round(float(np.mean(r)), 2) if r else 0.0
        metrics = BacktestMetrics(
            total_events=len(events),
            win_rate=round(len(correct) / len(valid) * 100, 1),
            avg_return_1d=round(float(np.mean(returns_1d)), 2),
            avg_return_5d=round(float(np.mean(returns_5d)), 2) if returns_5d else 0,
            sharpe_ratio=self._sharpe_ratio(returns_1d),
            max_drawdown=self._max_drawdown(cum_pnl),
            positive_avg_return=avg_return_for("positive"),
            negative_avg_return=avg_return_for("negative"),
            neutral_avg_return=avg_return_for("neutral"),
        )
        return BacktestResponse(metrics=metrics, events=events, cumulative_pnl=cum_pnl)

    def run(self, events: list[BacktestEvent]) -> BacktestResponse:
        enriched = self.enrich_with_prices(events)
        return self.compute_metrics(enriched)


backtest_service = BacktestService()
