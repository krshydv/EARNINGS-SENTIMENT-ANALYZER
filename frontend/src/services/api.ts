import axios from 'axios'
import type { AxiosResponse } from 'axios'
import type { AnalyzeRequest, AnalyzeResponse, BacktestEvent, BacktestResponse, ModelInfo } from '@/types'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

const api = axios.create({
  baseURL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (response: any) => response,
  (err: unknown) => {
    const error = err as { response?: { data?: { detail?: string } }; message?: string }
    const message = error.response?.data?.detail || error.message || 'Request failed'
    return Promise.reject(new Error(message))
  }
)

export const analyzeTranscript = async (request: AnalyzeRequest): Promise<AnalyzeResponse> => {
  const resp = await api.post('/analyze', request)
  return resp.data as AnalyzeResponse
}

export const runBacktest = async (events: BacktestEvent[]): Promise<BacktestResponse> => {
  const resp = await api.post('/backtest', { events })
  return resp.data as BacktestResponse
}

export const getModelInfo = async (): Promise<ModelInfo> => {
  const resp = await api.get('/model/info')
  return resp.data as ModelInfo
}

export const healthCheck = async (): Promise<boolean> => {
  try {
    await api.get('/health')
    return true
  } catch {
    return false
  }
}
