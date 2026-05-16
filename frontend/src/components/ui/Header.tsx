import { motion } from 'framer-motion'
import { useStore } from '@/store'

const PAGES = [
  { id: 'analyze', label: 'Analyze' },
  { id: 'backtest', label: 'Backtest' },
  { id: 'model', label: 'Model Report' },
  { id: 'history', label: 'History' },
] as const

export default function Header() {
  const { activePage, setActivePage, isModelLoaded, isBackendHealthy } = useStore()

  return (
    <motion.header
      className="glass-nav"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <div className="brand-lockup">
        <span className="brand-wordmark">EarningsLens</span>
        <span className="brand-caption">Institutional earnings intelligence</span>
      </div>

      <nav className="nav-pills">
        {PAGES.map((p) => (
          <button
            key={p.id}
            className={`nav-pill${activePage === p.id ? ' active' : ''}`}
            onClick={() => setActivePage(p.id)}
          >
            {p.label}
          </button>
        ))}
      </nav>

      <div className="header-status-group">
        <span className={`status-badge ${isBackendHealthy ? 'status-online' : 'status-offline'}`}>
          {isBackendHealthy ? 'Live API' : 'API Offline'}
        </span>
        <span className={`status-badge ${isModelLoaded ? 'status-online' : 'status-warning'}`}>
          {isModelLoaded ? 'Longformer active' : 'Heuristic fallback'}
        </span>
      </div>
    </motion.header>
  )
}
