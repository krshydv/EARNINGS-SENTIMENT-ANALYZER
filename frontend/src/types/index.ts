export type Sentiment = 'positive' | 'negative' | 'neutral'
export type PriceSignal = 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'
export type Guidance = 'raised' | 'maintained' | 'withdrawn' | 'none'
export type MarginTrend = 'expanding' | 'stable' | 'contracting' | 'unknown'
export type RevenueVsConsensus = 'beat' | 'inline' | 'miss' | 'unspecified'

export interface SentimentScores {
  positive: number
  neutral: number
  negative: number
}

export interface KeyPhrases {
  positive: string[]
  negative: string[]
  neutral: string[]
}

export interface AnalyzeRequest {
  transcript: string
  ticker?: string
  sector?: string
  earnings_date?: string
}

export interface AnalyzeResponse {
  sentiment: Sentiment
  confidence: number
  scores: SentimentScores
  price_signal: PriceSignal
  expected_move: string
  key_phrases: KeyPhrases
  guidance: Guidance
  margin_trend: MarginTrend
  revenue_vs_consensus: RevenueVsConsensus
  summary: string
  model_version: string
  processed_at: string
}

export interface BacktestEvent {
  ticker: string
  earnings_date: string
  transcript_sentiment: Sentiment
  confidence: number
  signal: PriceSignal
  return_1d: number | null
  return_3d: number | null
  return_5d: number | null
  correct: boolean | null
}

export interface BacktestMetrics {
  total_events: number
  win_rate: number
  avg_return_1d: number
  avg_return_5d: number
  sharpe_ratio: number
  max_drawdown: number
  positive_avg_return: number
  negative_avg_return: number
  neutral_avg_return: number
}

export interface BacktestResponse {
  metrics: BacktestMetrics
  events: BacktestEvent[]
  cumulative_pnl: number[]
}

export interface AnalysisHistoryItem extends AnalyzeResponse {
  id: string
  ticker: string
  sector: string
  transcript_preview: string
  analyzed_at: Date
}

export interface ModelInfo {
  model_name: string
  model_version: string
  num_labels: number
  label_map: Record<number, string>
  max_seq_length: number
  accuracy: number
  weighted_f1: number
  loaded: boolean
}
