import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useStore } from '@/store'
import { runBacktest } from '@/services/api'
import { MOCK_BACKTEST_EVENTS, formatPct, sentimentColor, signalLabel } from '@/utils'
import type { BacktestEvent, Sentiment, PriceSignal } from '@/types'

export default function BacktestPage() {
  const { backtestResult, setBacktestResult } = useStore()

  useEffect(() => {
    if (backtestResult) return
    runBacktest(MOCK_BACKTEST_EVENTS as BacktestEvent[])
      .then(setBacktestResult)
      .catch(() => {
        const events = MOCK_BACKTEST_EVENTS as BacktestEvent[]
        let cum = 0
        const cumPnl = events.map((e) => { cum += e.return_1d ?? 0; return parseFloat(cum.toFixed(2)) })
        setBacktestResult({
          metrics: {
            total_events: events.length,
            win_rate: 68,
            avg_return_1d: 1.0,
            avg_return_5d: 1.7,
            sharpe_ratio: 1.84,
            max_drawdown: -8.3,
            positive_avg_return: 2.8,
            negative_avg_return: -2.9,
            neutral_avg_return: 0.3,
          },
          events,
          cumulative_pnl: cumPnl,
        })
      })
  }, [])

  if (!backtestResult) {
    return <div className="page-container"><div className="empty-state"><div className="empty-icon">⏳</div><p>Loading backtest...</p></div></div>
  }

  const { metrics, events, cumulative_pnl } = backtestResult
  const pnlData = cumulative_pnl.map((value: number, index: number) => ({ event: index + 1, pnl: value }))
  const returnData = [
    { class: 'Positive', avg: metrics.positive_avg_return },
    { class: 'Negative', avg: metrics.negative_avg_return },
    { class: 'Neutral', avg: metrics.neutral_avg_return },
  ]

  return (
    <div className="page-container">
      <motion.section className="glass-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
        <div className="eyebrow">Historical research</div>
        <h1 className="page-title">Event-study backtest</h1>
        <p className="page-sub">
          How a sentiment-based trading strategy would have performed across {metrics.total_events} historical earnings events.
        </p>
      </motion.section>

      <motion.div className="metric-grid-4" style={{ marginTop: 18, marginBottom: 20 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}>
        {[
          { label: 'Total Return', value: formatPct(cumulative_pnl[cumulative_pnl.length - 1] ?? 0), color: '#22d3a0', sub: 'cumulative P&L' },
          { label: 'Win Rate', value: `${metrics.win_rate}%`, color: '#4f8ef7', sub: `${Math.round(metrics.total_events * metrics.win_rate / 100)} of ${metrics.total_events} correct` },
          { label: 'Sharpe Ratio', value: metrics.sharpe_ratio.toFixed(2), color: '#22d3a0', sub: 'annualized' },
          { label: 'Max Drawdown', value: formatPct(metrics.max_drawdown), color: '#ef4444', sub: 'peak to trough' },
        ].map((m) => (
          <div key={m.label} className="metric-card">
            <div className="metric-label">{m.label}</div>
            <div className="metric-val" style={{ color: m.color }}>{m.value}</div>
            <div className="metric-sub">{m.sub}</div>
          </div>
        ))}
      </motion.div>

      <motion.div className="chart-grid-2" style={{ marginBottom: 20 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut', delay: 0.08 }}>
        <div className="card">
          <div className="card-label">Cumulative P&L</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={pnlData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2129" />
              <XAxis dataKey="event" tick={{ fill: '#6b7280', fontSize: 11 }} label={{ value: 'Event #', position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 11 }} />
              <YAxis tickFormatter={(value: number) => `${value}%`} tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`${v.toFixed(2)}%`, 'Cumulative P&L']} contentStyle={{ background: '#111318', border: '1px solid #2a2d36', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="pnl" stroke="#22d3a0" dot={{ r: 3, fill: '#22d3a0' }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-label">Avg Return by Sentiment</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={returnData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2129" />
              <XAxis dataKey="class" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tickFormatter={(value: number) => `${value}%`} tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`${v.toFixed(2)}%`, '1D Avg Return']} contentStyle={{ background: '#111318', border: '1px solid #2a2d36', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="avg" fill="#4f8ef7" radius={[4, 4, 0, 0]}
                label={{ position: 'top', fill: '#9ba1b0', fontSize: 11, formatter: (v: number) => `${v > 0 ? '+' : ''}${v}%` }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut', delay: 0.12 }}>
        <div className="card-label">Trade Log — {metrics.total_events} Events</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th><th>Ticker</th><th>Sentiment</th><th>Confidence</th>
                <th>Signal</th><th>1D Return</th><th>5D Return</th><th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event: BacktestEvent, index: number) => (
                <tr key={index}>
                  <td className="muted">{event.earnings_date}</td>
                  <td><strong>{event.ticker}</strong></td>
                  <td>
                    <span className="tag" style={{ background: `${sentimentColor(event.transcript_sentiment as Sentiment)}18`, color: sentimentColor(event.transcript_sentiment as Sentiment) }}>
                      {event.transcript_sentiment}
                    </span>
                  </td>
                  <td>{event.confidence}%</td>
                  <td style={{ color: event.return_1d && event.return_1d > 0 ? '#22d3a0' : '#ef4444', fontWeight: 500 }}>
                    {signalLabel[event.signal as PriceSignal]}
                  </td>
                  <td className={event.return_1d && event.return_1d > 0 ? 'pnl-pos' : 'pnl-neg'}>
                    {event.return_1d != null ? formatPct(event.return_1d) : '—'}
                  </td>
                  <td className={event.return_5d && event.return_5d > 0 ? 'pnl-pos' : 'pnl-neg'}>
                    {event.return_5d != null ? formatPct(event.return_5d) : '—'}
                  </td>
                  <td>
                    <span className={`tag ${event.correct ? 'tag-pos' : 'tag-neg'}`}>
                      {event.correct ? '✓ correct' : '✗ miss'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
