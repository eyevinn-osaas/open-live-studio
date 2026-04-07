export type SourceType = 'Camera' | 'SRT' | 'NDI' | 'Test'
export type SourceStatus = 'connected' | 'connecting' | 'disconnected'
export type Resolution = '3840x2160' | '1920x1080' | '1280x720'

export interface Source {
  id: string
  name: string
  type: SourceType
  status: SourceStatus
  resolution: Resolution
  lastSeenAt: number
  color: string // canvas stream background color
  liveCamera?: boolean // use real getUserMedia instead of canvas mock
}

export const MOCK_SOURCES: Source[] = [
  { id: 'src-1', name: 'Camera 1 — Field', type: 'Camera', status: 'connected', resolution: '1920x1080', lastSeenAt: Date.now(), color: '#1e3a5f', liveCamera: true },
  { id: 'src-2', name: 'Camera 2 — Studio', type: 'Camera', status: 'connected', resolution: '1920x1080', lastSeenAt: Date.now(), color: '#3b1f5e' },
  { id: 'src-3', name: 'Camera 3 — Wide', type: 'Camera', status: 'connecting', resolution: '1280x720', lastSeenAt: Date.now() - 3000, color: '#1f4e3a' },
  { id: 'src-4', name: 'SRT Ingest A', type: 'SRT', status: 'connected', resolution: '1920x1080', lastSeenAt: Date.now(), color: '#4e3a1f' },
  { id: 'src-5', name: 'SRT Ingest B', type: 'SRT', status: 'disconnected', resolution: '1920x1080', lastSeenAt: Date.now() - 45000, color: '#4e1f1f' },
  { id: 'src-6', name: 'NDI Graphics', type: 'NDI', status: 'connected', resolution: '1920x1080', lastSeenAt: Date.now(), color: '#1f4a4e' },
  { id: 'src-7', name: 'Test Bars', type: 'Test', status: 'connected', resolution: '1920x1080', lastSeenAt: Date.now(), color: '#2a2a2a' },
]
