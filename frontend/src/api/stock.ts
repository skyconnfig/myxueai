import { request } from './http'

export interface StockVideoItem {
  id: number
  url: string
  previewUrl: string
  duration: number
  width: number
  height: number
  photographer: string
  provider: 'pexels'
}

export function searchStockVideos(query: string, orientation: 'landscape' | 'portrait' = 'landscape') {
  return request<{ configured: boolean; query?: string; results: StockVideoItem[] }>({
    url: '/stock/search',
    method: 'GET',
    params: { q: query, orientation },
  })
}

export function suggestStockQueries(payload: {
  topic?: string
  storyBeat?: string
  action?: string
  visualPrompt?: string
}) {
  return request<{ queries: string[] }>({
    url: '/stock/suggest',
    method: 'POST',
    data: payload,
  })
}
