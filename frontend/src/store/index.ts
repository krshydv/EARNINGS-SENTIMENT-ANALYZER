import { create } from 'zustand'
import type { AnalysisHistoryItem, BacktestResponse, ModelInfo } from '@/types'

interface AppState {
  activePage: 'analyze' | 'backtest' | 'model' | 'history'
  setActivePage: (page: AppState['activePage']) => void

  analysisHistory: AnalysisHistoryItem[]
  addAnalysis: (item: AnalysisHistoryItem) => void
  clearHistory: () => void

  backtestResult: BacktestResponse | null
  setBacktestResult: (result: BacktestResponse | null) => void

  modelInfo: ModelInfo | null
  setModelInfo: (info: ModelInfo | null) => void

  isModelLoaded: boolean
  setModelLoaded: (loaded: boolean) => void

  isBackendHealthy: boolean
  setBackendHealthy: (healthy: boolean) => void
}

const typedCreate = (create as unknown) as <T>(fn: (set: any) => T) => () => T

export const useStore = typedCreate<AppState>((set: (updater: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void) => ({
  activePage: 'analyze',
  setActivePage: (activePage: AppState['activePage']) => set({ activePage }),

  analysisHistory: [],
  addAnalysis: (item: AnalysisHistoryItem) =>
    set((state) => ({ analysisHistory: [item, ...state.analysisHistory].slice(0, 50) })),
  clearHistory: () => set({ analysisHistory: [] }),

  backtestResult: null,
  setBacktestResult: (backtestResult: BacktestResponse | null) => set({ backtestResult }),

  modelInfo: null,
  setModelInfo: (modelInfo: ModelInfo | null) => set({ modelInfo }),

  isModelLoaded: false,
  setModelLoaded: (isModelLoaded: boolean) => set({ isModelLoaded }),

  isBackendHealthy: true,
  setBackendHealthy: (isBackendHealthy: boolean) => set({ isBackendHealthy }),
}))
