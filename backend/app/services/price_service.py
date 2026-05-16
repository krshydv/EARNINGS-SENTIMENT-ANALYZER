import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional
from loguru import logger


class PriceService:
    def get_price_returns(
        self,
        ticker: str,
        earnings_date: str,
        windows: Optional[list[int]] = None,
    ) -> dict[str, Optional[float]]:
        try:
            windows = windows or [1, 3, 5]
            dt = datetime.strptime(earnings_date, "%Y-%m-%d")
            start = dt - timedelta(days=5)
            end = dt + timedelta(days=max(windows) + 5)
            df = yf.download(ticker, start=start.strftime("%Y-%m-%d"), end=end.strftime("%Y-%m-%d"), auto_adjust=True, progress=False)
            if df.empty:
                return {f"return_{w}d": None for w in windows}
            closes = df["Close"].dropna()
            closest_idx = closes.index.searchsorted(pd.Timestamp(dt))
            if closest_idx >= len(closes):
                return {f"return_{w}d": None for w in windows}
            base_price = float(closes.iloc[closest_idx])
            results = {}
            for w in windows:
                target_idx = closest_idx + w
                if target_idx < len(closes):
                    target_price = float(closes.iloc[target_idx])
                    results[f"return_{w}d"] = round((target_price / base_price - 1) * 100, 2)
                else:
                    results[f"return_{w}d"] = None
            return results
        except Exception as e:
            logger.warning(f"Price fetch failed for {ticker}: {e}")
            return {f"return_{w}d": None for w in windows}

    def get_current_price(self, ticker: str) -> Optional[float]:
        try:
            t = yf.Ticker(ticker)
            info = t.fast_info
            return round(float(info.last_price), 2)
        except Exception as e:
            logger.warning(f"Could not get current price for {ticker}: {e}")
            return None


price_service = PriceService()
