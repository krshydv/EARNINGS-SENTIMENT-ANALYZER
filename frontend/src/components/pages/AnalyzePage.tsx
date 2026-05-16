import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/store'
import { analyzeTranscript } from '@/services/api'
import {
  genId,
  SAMPLE_TRANSCRIPTS,
  sentimentColor,
  sentimentBg,
  sentimentBorder,
  signalLabel,
  signalColor,
} from '@/utils'
import type { AnalyzeResponse, Sentiment } from '@/types'
import PremiumAnalyticsPreview from '@/components/ui/PremiumAnalyticsPreview'

const SECTORS = ['Technology', 'Financial', 'Healthcare', 'Consumer', 'Industrial', 'Energy']

const SAMPLE_CHIPS = [
  { key: 'bullish', label: 'Bullish scenario' },
  { key: 'bearish', label: 'Bearish scenario' },
  { key: 'neutral', label: 'Neutral scenario' },
  { key: 'mixed', label: 'Mixed narrative' },
]

function formatConfidence(value: number) {
  return `${value.toFixed(0)}%`
}

export default function AnalyzePage() {
  const { addAnalysis, isBackendHealthy, isModelLoaded } = useStore()
  const [transcript, setTranscript] = useState('')
  const [ticker, setTicker] = useState('')
  const [sector, setSector] = useState('Technology')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AnalyzeResponse | null>(null)

  const handleAnalyze = async () => {
    if (!transcript.trim() || loading) return
    setLoading(true)
    setError('')
    try {
      if (!isBackendHealthy) {
        throw new Error('Backend is offline. Start the API server and try again.')
      }
      const res = await analyzeTranscript({ transcript, ticker: ticker || undefined, sector })
      setResult(res)
      addAnalysis({
        ...res,
        id: genId(),
        ticker: ticker || 'N/A',
        sector,
        transcript_preview: transcript.slice(0, 120) + '...',
        analyzed_at: new Date(),
      })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const heroMetrics = [
    { label: 'Input length', value: `${transcript.length.toLocaleString()} chars` },
    { label: 'Mode', value: isModelLoaded ? 'Longformer' : 'Heuristic fallback' },
    { label: 'Status', value: isBackendHealthy ? 'Live API' : 'Offline' },
  ]

  return (
    <div className="page-container analyze-page">
      <motion.section
        className="hero-stack"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="hero-glow hero-glow-left" />
        <div className="hero-glow hero-glow-right" />
        <div className="hero-copy">
          <div className="eyebrow">Financial AI workstation</div>
          <h1 className="hero-title">Institutional earnings intelligence, reimagined.</h1>
          <p className="page-sub hero-subtitle">
            Paste a transcript and receive a premium analyst-grade readout with sentiment, guidance,
            narrative signals, market bias, and historical context — all in one refined workspace.
          </p>
        </div>

        <div className="hero-metrics">
          {heroMetrics.map((metric) => (
            <div key={metric.label} className="hero-metric-card">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      </motion.section>

      <div className="analyze-grid">
        <div className="analyze-left">
          <motion.section
            className="glass-panel workstation-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
          >
            <div className="panel-header">
              <div>
                <div className="card-label">Transcript workstation</div>
                <h2 className="panel-title">Run transcript intelligence</h2>
              </div>
              <div className={`status-badge ${isBackendHealthy ? 'status-online' : 'status-offline'}`}>
                {isBackendHealthy ? 'Connected' : 'Disconnected'}
              </div>
            </div>

            <textarea
              className="transcript-input premium-input"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste earnings call transcript here...\n\nExample: We delivered record revenue, expanded margins, and raised full-year guidance above Street expectations."
            />

            <div className="sample-chips premium-sample-chips">
              {SAMPLE_CHIPS.map((sample) => (
                <button
                  key={sample.key}
                  type="button"
                  className="chip premium-chip"
                  onClick={() => setTranscript(SAMPLE_TRANSCRIPTS[sample.key])}
                >
                  {sample.label}
                </button>
              ))}
            </div>

            <div className="workstation-footer">
              <span className="char-count">{transcript.length.toLocaleString()} chars</span>
              <div className="action-row">
                <button
                  type="button"
                  className="btn btn-ghost premium-btn"
                  onClick={() => {
                    setTranscript('')
                    setResult(null)
                    setError('')
                  }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="btn btn-primary premium-btn premium-btn-primary"
                  onClick={handleAnalyze}
                  disabled={loading || transcript.length < 50 || !isBackendHealthy}
                >
                  {loading ? <><span className="spinner" /> Analyzing...</> : 'Analyze Transcript'}
                </button>
              </div>
            </div>

            {!isBackendHealthy && (
              <div className="error-box premium-alert">
                Backend API is offline. Start `docker compose up` or the FastAPI server, then retry.
              </div>
            )}
          </motion.section>

          <motion.section
            className="glass-panel premium-controls"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.12 }}
          >
            <div className="panel-header compact-header">
              <div>
                <div className="card-label">Analysis context</div>
                <h3 className="panel-title">Fine-tune the signal frame</h3>
              </div>
            </div>

            <div className="context-grid">
              <label className="context-field">
                <span>Ticker</span>
                <input
                  className="option-input premium-field"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="e.g. AAPL"
                  maxLength={10}
                />
              </label>
              <label className="context-field">
                <span>Sector</span>
                <select className="option-select premium-select" value={sector} onChange={(e) => setSector(e.target.value)}>
                  {SECTORS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>
          </motion.section>
        </div>

        <div className="analyze-right">
          <PremiumAnalyticsPreview result={result} isBackendHealthy={isBackendHealthy} />

          {error && <div className="error-box premium-error">{error}</div>}

          <motion.section
            className="glass-panel results-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
          >
            {!result && !error && (
              <div className="empty-state premium-empty">
                <div className="empty-icon">◌</div>
                <h3>Awaiting transcript</h3>
                <p>
                  The result surface will populate with sentiment, guidance, price bias,
                  and key phrase intelligence the moment analysis completes.
                </p>
              </div>
            )}

            {result && <AnalysisResult result={result} />}
          </motion.section>
        </div>
      </div>
    </div>
  )
}

function AnalysisResult({ result }: { result: AnalyzeResponse }) {
  const s = result.sentiment as Sentiment
  const icon = { positive: '↗', negative: '↘', neutral: '→' }[s]

  return (
    <div className="analysis-result-shell">
      <div
        className="verdict-box premium-verdict"
        style={{ background: sentimentBg(s), border: `1px solid ${sentimentBorder(s)}` }}
      >
        <span className="verdict-icon premium-verdict-icon">{icon}</span>
        <div>
          <div className="verdict-label premium-verdict-label" style={{ color: sentimentColor(s) }}>
            {s.toUpperCase()}
          </div>
          <div className="verdict-sub">
            {formatConfidence(result.confidence)} confidence · {result.summary}
          </div>
        </div>
      </div>

      <div className="metric-grid-2 premium-result-grid">
        <div className="metric-card premium-metric-card">
          <div className="metric-label">Price Signal</div>
          <div className="metric-val" style={{ color: signalColor[result.price_signal], fontSize: 18 }}>
            {signalLabel[result.price_signal]}
          </div>
          <div className="metric-sub">Expected: {result.expected_move}</div>
        </div>
        <div className="metric-card premium-metric-card">
          <div className="metric-label">Guidance</div>
          <div
            className="metric-val"
            style={{
              fontSize: 18,
              color: result.guidance === 'raised' ? '#61f0c0' : result.guidance === 'withdrawn' ? '#ff7f7f' : '#f6c76f',
            }}
          >
            {result.guidance.toUpperCase()}
          </div>
          <div className="metric-sub">Revenue: {result.revenue_vs_consensus}</div>
        </div>
      </div>

      <div className="result-section-card">
        <div className="card-label">Sentiment breakdown</div>
        {(['positive', 'negative', 'neutral'] as Sentiment[]).map((k) => (
          <div key={k} className="score-bar-row">
            <div className="score-bar-header">
              <span style={{ color: sentimentColor(k) }}>{k.charAt(0).toUpperCase() + k.slice(1)}</span>
              <span className="score-val">{result.scores[k].toFixed(1)}%</span>
            </div>
            <div className="score-track">
              <div
                className="score-fill"
                style={{ width: `${result.scores[k]}%`, background: sentimentColor(k) }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="result-section-card">
        <div className="card-label">Key signal phrases</div>
        {result.key_phrases.positive.length > 0 && (
          <div className="phrase-group">
            <div className="phrase-group-label" style={{ color: '#61f0c0' }}>Bullish Signals</div>
            <div className="phrase-tags">
              {result.key_phrases.positive.map((p, i) => (
                <span key={i} className="phrase-tag pos">{p}</span>
              ))}
            </div>
          </div>
        )}
        {result.key_phrases.negative.length > 0 && (
          <div className="phrase-group">
            <div className="phrase-group-label" style={{ color: '#ff7f7f' }}>Bearish Signals</div>
            <div className="phrase-tags">
              {result.key_phrases.negative.map((p, i) => (
                <span key={i} className="phrase-tag neg">{p}</span>
              ))}
            </div>
          </div>
        )}
        {result.key_phrases.neutral.length > 0 && (
          <div className="phrase-group">
            <div className="phrase-group-label" style={{ color: '#f6c76f' }}>Context</div>
            <div className="phrase-tags">
              {result.key_phrases.neutral.map((p, i) => (
                <span key={i} className="phrase-tag neu">{p}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <span className="detail-label">Margin trend</span>
          <strong>{result.margin_trend}</strong>
        </div>
        <div className="detail-card">
          <span className="detail-label">Model version</span>
          <strong>{result.model_version}</strong>
        </div>
      </div>
    </div>
  )
}
