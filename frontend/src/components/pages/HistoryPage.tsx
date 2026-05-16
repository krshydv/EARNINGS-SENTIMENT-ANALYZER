import { motion } from 'framer-motion'
import { useStore } from '@/store'
import { sentimentColor, signalLabel, formatPct } from '@/utils'
import type { Sentiment, PriceSignal, AnalysisHistoryItem } from '@/types'

export default function HistoryPage() {
  const { analysisHistory, clearHistory } = useStore()

  if (!analysisHistory.length) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Analysis History</h1>
          <p className="page-sub">All transcripts analyzed in this session.</p>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>No analyses yet. Go to the Analyze tab to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <motion.section className="glass-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="eyebrow">Session archive</div>
            <h1 className="page-title">Analysis history</h1>
            <p className="page-sub">{analysisHistory.length} transcript{analysisHistory.length !== 1 ? 's' : ''} analyzed this session.</p>
          </div>
          <button className="btn btn-ghost premium-btn" onClick={clearHistory} style={{ marginTop: 4 }}>
            Clear All
          </button>
        </div>
      </motion.section>

      <motion.div className="history-list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}>
        {analysisHistory.map((item: AnalysisHistoryItem) => {
          const s = item.sentiment as Sentiment
          const color = sentimentColor(s)
          const icon = { positive: '📈', negative: '📉', neutral: '➖' }[s]

          return (
            <div key={item.id} className="history-card">
              <div className="history-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="history-dot" style={{ background: color }} />
                  <span className="tag" style={{ background: `${color}18`, color }}>{s}</span>
                  {item.ticker !== 'N/A' && <span className="tag tag-blue">{item.ticker}</span>}
                  <span className="tag" style={{ background: '#1e2129', color: '#9ba1b0' }}>{item.sector}</span>
                </div>
                <div className="history-meta">
                  <span>{item.analyzed_at.toLocaleTimeString()}</span>
                  <span>·</span>
                  <span>{item.confidence.toFixed(0)}% confidence</span>
                </div>
              </div>

              <p className="history-preview">{item.transcript_preview}</p>

              <div className="history-metrics">
                <div className="history-metric">
                  <span className="history-metric-label">Signal</span>
                  <span className="history-metric-val" style={{ color: '#4f8ef7' }}>
                    {signalLabel[item.price_signal as PriceSignal]}
                  </span>
                </div>
                <div className="history-metric">
                  <span className="history-metric-label">Expected Move</span>
                  <span className="history-metric-val">{item.expected_move}</span>
                </div>
                <div className="history-metric">
                  <span className="history-metric-label">Guidance</span>
                  <span className="history-metric-val" style={{
                    color: item.guidance === 'raised' ? '#22d3a0' : item.guidance === 'withdrawn' ? '#ef4444' : '#f59e0b'
                  }}>
                    {item.guidance}
                  </span>
                </div>
                <div className="history-metric">
                  <span className="history-metric-label">Revenue</span>
                  <span className="history-metric-val">{item.revenue_vs_consensus}</span>
                </div>
                <div className="history-metric">
                  <span className="history-metric-label">Margin Trend</span>
                  <span className="history-metric-val">{item.margin_trend}</span>
                </div>
                <div className="history-metric">
                  <span className="history-metric-label">Model</span>
                  <span className="history-metric-val" style={{ color: '#7c5cfc' }}>{item.model_version}</span>
                </div>
              </div>

              <div className="history-scores">
                {(['positive', 'negative', 'neutral'] as Sentiment[]).map((k) => (
                  <div key={k} className="score-bar-row" style={{ marginBottom: 6 }}>
                    <div className="score-bar-header">
                      <span style={{ color: sentimentColor(k), fontSize: 11 }}>{k}</span>
                      <span className="score-val" style={{ fontSize: 11 }}>{item.scores[k].toFixed(1)}%</span>
                    </div>
                    <div className="score-track" style={{ height: 4 }}>
                      <div
                        className="score-fill"
                        style={{ width: `${item.scores[k]}%`, background: sentimentColor(k) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}
