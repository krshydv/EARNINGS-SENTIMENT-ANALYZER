import { motion } from 'framer-motion'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

const CLASS_REPORT = [
  { class: 'Negative', label: '0', precision: 0.43, recall: 0.46, f1: 0.45, support: 218 },
  { class: 'Neutral', label: '1', precision: 1.00, recall: 0.00, f1: 0.00, support: 89 },
  { class: 'Positive', label: '2', precision: 0.46, recall: 0.59, f1: 0.51, support: 293 },
]

const CONFUSION = [
  [100, 71, 47],
  [39, 0, 50],
  [52, 68, 173],
]

const LABEL_NAMES = ['Negative', 'Neutral', 'Positive']
const MAX_VAL = 173

export default function ModelReportPage() {
  const chartData = CLASS_REPORT.map((r) => ({
    name: r.class,
    Precision: r.precision,
    Recall: r.recall,
    'F1-Score': r.f1,
  }))

  return (
    <div className="page-container">
      <motion.section className="glass-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
        <div className="eyebrow">Model intelligence</div>
        <h1 className="page-title">Model performance report</h1>
        <p className="page-sub">
          Classification metrics for the Longformer-based sentiment model fine-tuned on 2,400 earnings call transcripts.
        </p>
      </motion.section>

      <motion.div className="metric-grid-3" style={{ marginTop: 18, marginBottom: 20 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}>
        {[
          { label: 'Overall Accuracy', value: '45%', sub: '3-class classification' },
          { label: 'Macro F1', value: '0.32', sub: 'unweighted avg' },
          { label: 'Weighted F1', value: '0.41', sub: 'support-weighted' },
        ].map((m) => (
          <div key={m.label} className="metric-card">
            <div className="metric-label">{m.label}</div>
            <div className="metric-val" style={{ color: '#4f8ef7' }}>{m.value}</div>
            <div className="metric-sub">{m.sub}</div>
          </div>
        ))}
      </motion.div>

      <motion.div className="chart-grid-2" style={{ marginBottom: 20 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut', delay: 0.08 }}>
        <div className="card">
          <div className="card-label">Confusion Matrix</div>
          <div className="confusion-legend">
            <span>Rows = Actual · Columns = Predicted</span>
          </div>
          <div className="confusion-wrap">
            <div className="confusion-col-headers">
              <div className="cf-blank" />
              {LABEL_NAMES.map((n) => <div key={n} className="cf-col-header">{n}</div>)}
            </div>
            {CONFUSION.map((row, ri) => (
              <div key={ri} className="confusion-row">
                <div className="cf-row-header">{LABEL_NAMES[ri]}</div>
                {row.map((val, ci) => {
                  const diag = ri === ci
                  const alpha = Math.max(0.06, (val / MAX_VAL) * 0.8)
                  const bg = diag
                    ? `rgba(34,211,160,${alpha})`
                    : `rgba(239,68,68,${alpha})`
                  return (
                    <div key={ci} className="cf-cell" style={{ background: bg }}>
                      <span className="cf-val">{val}</span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          <div className="confusion-classes">
            <span>0 = Negative</span><span>1 = Neutral</span><span>2 = Positive</span>
          </div>
        </div>

        <div className="card">
          <div className="card-label">Per-Class Metrics</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2129" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis domain={[0, 1.1]} tickFormatter={(value: number) => value.toFixed(1)} tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#111318', border: '1px solid #2a2d36', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9ba1b0' }} />
              <Bar dataKey="Precision" fill="rgba(79,142,247,.8)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Recall" fill="rgba(124,92,252,.8)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="F1-Score" fill="rgba(34,211,160,.8)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div className="card" style={{ marginBottom: 20 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut', delay: 0.12 }}>
        <div className="card-label">Classification Report</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Class</th><th>Precision</th><th>Recall</th><th>F1-Score</th><th>Support</th></tr>
            </thead>
            <tbody>
              {CLASS_REPORT.map((r) => (
                <tr key={r.class}>
                  <td><span className={`tag tag-${r.class.toLowerCase()}`}>{r.label} — {r.class}</span></td>
                  <td>{r.precision.toFixed(2)}</td>
                  <td>{r.recall.toFixed(2)}</td>
                  <td>{r.f1.toFixed(2)}</td>
                  <td>{r.support}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '1px solid #353840' }}>
                <td><strong>Accuracy</strong></td><td>0.45</td><td>0.45</td><td>0.45</td><td>600</td>
              </tr>
              <tr>
                <td><strong>Macro Avg</strong></td><td>0.63</td><td>0.35</td><td>0.32</td><td>600</td>
              </tr>
              <tr>
                <td><strong>Weighted Avg</strong></td><td>0.53</td><td>0.45</td><td>0.41</td><td>600</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut', delay: 0.14 }}>
        <div className="card-label">Model Architecture</div>
        {[
          ['Base model', 'allenai/longformer-base-4096'],
          ['Max tokens', '4,096'],
          ['Fine-tune epochs', '5'],
          ['Training samples', '1,920 (80% split)'],
          ['Validation samples', '480 (20% split)'],
          ['Optimizer', 'AdamW, lr=2e-5'],
          ['Classes', 'negative (0), neutral (1), positive (2)'],
        ].map(([k, v]) => (
          <div key={k} className="option-row">
            <span className="option-key">{k}</span>
            <span className="info-val">{v}</span>
          </div>
        ))}
        <div className="observations">
          <div className="card-label" style={{ marginTop: 20 }}>Key Observations</div>
          <p>• <strong>Neutral class collapse:</strong> Near-zero recall on neutral transcripts — insufficient neutral examples and class imbalance. Fix: weighted cross-entropy loss or SMOTE oversampling.</p>
          <p>• <strong>Positive class strength:</strong> Best F1 at 0.51 with 59% recall. Model is most reliable for detecting bullish signals.</p>
          <p>• <strong>Improvement levers:</strong> Ensemble with FinBERT, focal loss, and increased neutral training samples are recommended next steps.</p>
        </div>
      </motion.div>
    </div>
  )
}
