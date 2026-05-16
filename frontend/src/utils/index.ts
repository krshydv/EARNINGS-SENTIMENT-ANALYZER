import type { Sentiment, PriceSignal } from '@/types'

export const sentimentColor = (s: Sentiment) =>
  ({ positive: '#22d3a0', negative: '#ef4444', neutral: '#f59e0b' })[s]

export const sentimentBg = (s: Sentiment) =>
  ({ positive: 'rgba(34,211,160,.08)', negative: 'rgba(239,68,68,.08)', neutral: 'rgba(245,158,11,.08)' })[s]

export const sentimentBorder = (s: Sentiment) =>
  ({ positive: 'rgba(34,211,160,.25)', negative: 'rgba(239,68,68,.25)', neutral: 'rgba(245,158,11,.25)' })[s]

export const signalLabel: Record<PriceSignal, string> = {
  strong_buy: 'Strong Buy',
  buy: 'Buy',
  hold: 'Hold',
  sell: 'Sell',
  strong_sell: 'Strong Sell',
}

export const signalColor: Record<PriceSignal, string> = {
  strong_buy: '#22d3a0',
  buy: '#6ee7b7',
  hold: '#f59e0b',
  sell: '#fca5a5',
  strong_sell: '#ef4444',
}

export const formatPct = (v: number, decimals = 1) =>
  `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%`

export const genId = () => Math.random().toString(36).slice(2, 10)

export const SAMPLE_TRANSCRIPTS: Record<string, string> = {
  bullish: `We delivered exceptional results this quarter with revenue of $18.3 billion, surpassing consensus estimates by 12%. Operating margins expanded to 28.4%, a record high. Free cash flow generation was extraordinary at $4.2 billion. We are raising full-year guidance meaningfully above Street expectations. Customer acquisition reached an all-time high and retention metrics are outstanding. The pipeline is the strongest we have seen, and we remain highly confident in sustained double-digit growth for the foreseeable future.`,
  bearish: `This quarter's results reflect significant headwinds. Revenue came in at $9.1 billion, falling short of our guidance by $800 million. We are experiencing severe margin compression due to elevated input costs and pricing pressure. We are withdrawing full-year guidance given macroeconomic uncertainty. Customer churn accelerated meaningfully and new bookings declined 18% year over year. We are implementing a restructuring program including workforce reductions of approximately 8%. The board has suspended the dividend.`,
  neutral: `Revenue for the third quarter was $14.7 billion, in line with consensus estimates. Operating margins of 21.3% were consistent with the prior quarter. We are maintaining our full-year guidance range unchanged. Unit volumes were broadly stable across our major product categories. Operating expenses grew roughly in line with revenue. We continue to monitor macroeconomic conditions and will provide an update at the next earnings call.`,
  mixed: `We saw strong performance in our cloud segment with 34% growth, offsetting weakness in our legacy hardware division which declined 12%. Total revenue of $11.2 billion was slightly below consensus. Margins were mixed — gross margin expanded 200 basis points while operating margin contracted due to elevated R&D investment. We are cautiously optimistic about the second half but acknowledge near-term uncertainty in enterprise spending.`,
}

export const MOCK_BACKTEST_EVENTS = [
  { ticker: 'AAPL', earnings_date: '2024-01-25', transcript_sentiment: 'positive' as Sentiment, confidence: 82, signal: 'buy' as PriceSignal, return_1d: 2.4, return_3d: 3.1, return_5d: 4.8, correct: true },
  { ticker: 'MSFT', earnings_date: '2024-01-30', transcript_sentiment: 'positive' as Sentiment, confidence: 91, signal: 'strong_buy' as PriceSignal, return_1d: 4.1, return_3d: 5.8, return_5d: 7.2, correct: true },
  { ticker: 'NVDA', earnings_date: '2024-02-21', transcript_sentiment: 'positive' as Sentiment, confidence: 74, signal: 'buy' as PriceSignal, return_1d: 1.8, return_3d: 2.4, return_5d: 3.1, correct: true },
  { ticker: 'META', earnings_date: '2024-02-01', transcript_sentiment: 'positive' as Sentiment, confidence: 87, signal: 'strong_buy' as PriceSignal, return_1d: 3.3, return_3d: 4.7, return_5d: 6.1, correct: true },
  { ticker: 'INTC', earnings_date: '2024-01-25', transcript_sentiment: 'negative' as Sentiment, confidence: 79, signal: 'sell' as PriceSignal, return_1d: -2.1, return_3d: -3.4, return_5d: -3.8, correct: true },
  { ticker: 'SNAP', earnings_date: '2024-02-06', transcript_sentiment: 'negative' as Sentiment, confidence: 93, signal: 'strong_sell' as PriceSignal, return_1d: -4.7, return_3d: -6.1, return_5d: -8.2, correct: true },
  { ticker: 'LYFT', earnings_date: '2024-02-13', transcript_sentiment: 'negative' as Sentiment, confidence: 71, signal: 'sell' as PriceSignal, return_1d: -1.9, return_3d: -2.3, return_5d: -2.7, correct: true },
  { ticker: 'IBM', earnings_date: '2024-01-24', transcript_sentiment: 'neutral' as Sentiment, confidence: 55, signal: 'hold' as PriceSignal, return_1d: 0.3, return_3d: 0.6, return_5d: 0.5, correct: true },
  { ticker: 'AMZN', earnings_date: '2024-02-01', transcript_sentiment: 'positive' as Sentiment, confidence: 85, signal: 'buy' as PriceSignal, return_1d: 1.7, return_3d: 3.4, return_5d: 2.9, correct: true },
  { ticker: 'GOOGL', earnings_date: '2024-01-30', transcript_sentiment: 'positive' as Sentiment, confidence: 88, signal: 'strong_buy' as PriceSignal, return_1d: 5.2, return_3d: 7.1, return_5d: 9.4, correct: true },
  { ticker: 'NFLX', earnings_date: '2024-01-23', transcript_sentiment: 'negative' as Sentiment, confidence: 76, signal: 'sell' as PriceSignal, return_1d: -2.8, return_3d: -4.1, return_5d: -5.1, correct: true },
  { ticker: 'ORCL', earnings_date: '2024-03-11', transcript_sentiment: 'neutral' as Sentiment, confidence: 52, signal: 'hold' as PriceSignal, return_1d: 0.1, return_3d: 0.4, return_5d: 0.8, correct: true },
  { ticker: 'CRM', earnings_date: '2024-02-28', transcript_sentiment: 'positive' as Sentiment, confidence: 80, signal: 'buy' as PriceSignal, return_1d: 2.2, return_3d: 3.1, return_5d: 3.7, correct: true },
  { ticker: 'PYPL', earnings_date: '2024-02-07', transcript_sentiment: 'negative' as Sentiment, confidence: 90, signal: 'strong_sell' as PriceSignal, return_1d: -3.9, return_3d: -5.8, return_5d: -7.1, correct: true },
  { ticker: 'AVGO', earnings_date: '2024-03-07', transcript_sentiment: 'positive' as Sentiment, confidence: 92, signal: 'strong_buy' as PriceSignal, return_1d: 4.8, return_3d: 6.4, return_5d: 8.3, correct: true },
  { ticker: 'AMD', earnings_date: '2024-01-30', transcript_sentiment: 'positive' as Sentiment, confidence: 77, signal: 'buy' as PriceSignal, return_1d: 1.5, return_3d: 2.1, return_5d: 2.8, correct: true },
  { ticker: 'UBER', earnings_date: '2024-02-07', transcript_sentiment: 'negative' as Sentiment, confidence: 73, signal: 'sell' as PriceSignal, return_1d: -1.4, return_3d: -2.0, return_5d: -2.9, correct: true },
  { ticker: 'QCOM', earnings_date: '2024-01-31', transcript_sentiment: 'neutral' as Sentiment, confidence: 58, signal: 'hold' as PriceSignal, return_1d: 0.6, return_3d: 0.9, return_5d: 1.1, correct: true },
  { ticker: 'ADBE', earnings_date: '2024-03-14', transcript_sentiment: 'positive' as Sentiment, confidence: 84, signal: 'buy' as PriceSignal, return_1d: 3.1, return_3d: 4.2, return_5d: 5.4, correct: true },
  { ticker: 'TSLA', earnings_date: '2024-01-24', transcript_sentiment: 'negative' as Sentiment, confidence: 69, signal: 'sell' as PriceSignal, return_1d: -2.6, return_3d: -3.8, return_5d: -4.3, correct: true },
]
