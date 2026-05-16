import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AnalyzeResponse, PriceSignal, Sentiment } from '@/types'
import { formatPct, sentimentColor, signalColor, signalLabel } from '@/utils'

const fallbackSeries = [
  { label: 'T-4', value: 24 },
  { label: 'T-3', value: 36 },
  { label: 'T-2', value: 52 },
  { label: 'T-1', value: 61 },
  { label: 'Now', value: 75 },
]

const fallbackSignals: Array<{ label: string; value: number; tone: string }> = [
  { label: 'Guidance', value: 72, tone: 'raised' },
  { label: 'Margins', value: 64, tone: 'expanding' },
  { label: 'Revenue', value: 58, tone: 'beat' },
  { label: 'Risk', value: 28, tone: 'contained' },
]

function getSeries(result?: AnalyzeResponse) {
  if (!result) return fallbackSeries

  return [
    { label: 'Neg', value: result.scores.negative },
    { label: 'Neu', value: result.scores.neutral },
    { label: 'Pos', value: result.scores.positive },
    { label: 'Signal', value: result.confidence },
  ]
}

function getPrimaryTone(result?: AnalyzeResponse): Sentiment {
  return result?.sentiment ?? 'neutral'
}

function getPriceSignal(result?: AnalyzeResponse): PriceSignal {
  return result?.price_signal ?? 'hold'
}

export default function PremiumAnalyticsPreview({ result, isBackendHealthy }: { result?: AnalyzeResponse | null; isBackendHealthy: boolean }) {
  const sentiment = getPrimaryTone(result ?? undefined)
  const priceSignal = getPriceSignal(result ?? undefined)
  const chartData = getSeries(result ?? undefined)
  const fallbackTone = result
    ? result.guidance
    : 'maintained'

  const confidence = result?.confidence ?? 68
  const signalValue = result?.confidence ?? 61
  const riskValue = result ? Math.max(14, 100 - result.confidence) : 34

  return (
    <motion.section
      className="premium-preview"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <div className="preview-sheen" />
      <div className="preview-topline">
        <div>
          <p className="eyebrow">AI market intelligence</p>
          <h2 className="preview-title">Institutional signal board</h2>
          <p className="preview-subtitle">
            {result
              ? 'Live analysis rendered with sentiment confidence, price bias, and narrative signal extraction.'
              : 'Premium preview of the execution stack. Analysis results populate here instantly once a transcript is processed.'}
          </p>
        </div>
        <div className={`status-badge ${isBackendHealthy ? 'status-online' : 'status-offline'}`}>
          {isBackendHealthy ? 'Live API connected' : 'API offline'}
        </div>
      </div>

      <div className="preview-hero-grid">
        <motion.div
          className="preview-hero-card"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="preview-card-label">Sentiment bias</div>
          <div className="sentiment-ring-wrap">
            <div className={`sentiment-ring sentiment-${sentiment}`}>
              <div className="sentiment-ring-core">
                <span>{sentiment.toUpperCase()}</span>
                <strong>{confidence.toFixed(0)}%</strong>
              </div>
            </div>
          </div>
          <div className="preview-inline-metrics">
            <span>{result ? result.model_version : 'heuristic-v1'}</span>
            <span>{result ? result.expected_move : '-1.5% to +1.5%'}</span>
          </div>
        </motion.div>

        <motion.div
          className="preview-hero-card preview-chart-card"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="preview-card-label">Signal profile</div>
          <div className="mini-chart-shell">
            <ResponsiveContainer width="100%" height={186}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="signalGlow" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#7c8fff" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#7c8fff" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" />
                <XAxis dataKey="label" tick={{ fill: '#768099', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#768099', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#11151d', border: '1px solid #2b3140', borderRadius: 12, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="value" stroke="#7c8fff" fill="url(#signalGlow)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="preview-metric-grid">
        <motion.div className="preview-mini-stat" whileHover={{ y: -2 }}>
          <span className="preview-mini-label">Price signal</span>
          <strong style={{ color: signalColor[priceSignal] }}>{signalLabel[priceSignal]}</strong>
          <small>Bias score {signalValue.toFixed(0)}%</small>
        </motion.div>
        <motion.div className="preview-mini-stat" whileHover={{ y: -2 }}>
          <span className="preview-mini-label">Risk meter</span>
          <strong>{riskValue.toFixed(0)}%</strong>
          <small>Interpretation risk</small>
        </motion.div>
        <motion.div className="preview-mini-stat" whileHover={{ y: -2 }}>
          <span className="preview-mini-label">Market stance</span>
          <strong style={{ color: sentimentColor(sentiment) }}>{sentiment.toUpperCase()}</strong>
          <small>{fallbackTone}</small>
        </motion.div>
      </div>

      <div className="preview-signal-grid">
        {fallbackSignals.map((item) => (
          <motion.div key={item.label} className="preview-signal-card" whileHover={{ y: -2 }}>
            <div className="preview-signal-label">{item.label}</div>
            <div className="preview-signal-bar">
              <span style={{ width: `${item.value}%` }} />
            </div>
            <div className="preview-signal-meta">
              <span>{item.tone}</span>
              <strong>{item.value}%</strong>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="preview-insight-grid">
        <div className="preview-insight-card">
          <div className="preview-card-label">AI insight</div>
          <p>
            {result
              ? result.summary
              : 'Institutional preview panel prepared for transcript-level sentiment, price action bias, and narrative extraction.'}
          </p>
        </div>
        <div className="preview-insight-card">
          <div className="preview-card-label">Confidence distribution</div>
          <div className="confidence-points">
            <span><strong>{formatPct(result?.scores.positive ?? 30.9, 1)}</strong> positive</span>
            <span><strong>{formatPct(result?.scores.neutral ?? 40.8, 1)}</strong> neutral</span>
            <span><strong>{formatPct(result?.scores.negative ?? 28.2, 1)}</strong> negative</span>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
