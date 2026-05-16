import { lazy, Suspense, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '@/store'
import { getModelInfo, healthCheck } from '@/services/api'
import Header from '@/components/ui/Header'

const AnalyzePage = lazy(() => import('@/components/pages/AnalyzePage'))
const BacktestPage = lazy(() => import('@/components/pages/BacktestPage'))
const ModelReportPage = lazy(() => import('@/components/pages/ModelReportPage'))
const HistoryPage = lazy(() => import('@/components/pages/HistoryPage'))

export default function App() {
  const { activePage, setModelInfo, setModelLoaded, setBackendHealthy } = useStore()

  useEffect(() => {
    let isMounted = true
    healthCheck()
      .then((isHealthy) => {
        if (!isMounted) return
        setBackendHealthy(isHealthy)
      })
      .catch(() => {
        if (!isMounted) return
        setBackendHealthy(false)
      })

    getModelInfo()
      .then((info) => {
        if (!isMounted) return
        setModelInfo(info)
        setModelLoaded(info.loaded)
      })
      .catch(() => {
        if (!isMounted) return
        setModelLoaded(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="app-shell">
      <Header />
      <main className="main-content">
        <Suspense
          fallback={
            <div className="page-container">
              <div className="glass-panel" style={{ minHeight: '42vh', display: 'grid', placeItems: 'center' }}>
                <div className="empty-state">
                  <div className="spinner" style={{ margin: '0 auto 14px' }} />
                  <h3 style={{ marginBottom: 6 }}>Preparing premium workspace</h3>
                  <p>Loading the selected analysis surface…</p>
                </div>
              </div>
            </div>
          }
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              className="page-motion"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {activePage === 'analyze' && <AnalyzePage />}
              {activePage === 'backtest' && <BacktestPage />}
              {activePage === 'model' && <ModelReportPage />}
              {activePage === 'history' && <HistoryPage />}
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>
    </div>
  )
}
