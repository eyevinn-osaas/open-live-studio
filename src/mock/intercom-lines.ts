export interface IntercomLine {
  id: string
  name: string
  color: string
  description: string
}

export const MOCK_INTERCOM_LINES: IntercomLine[] = [
  { id: 'line-1', name: 'Main Comms', color: '#3b82f6', description: 'Primary production channel' },
  { id: 'line-2', name: 'Director', color: '#8b5cf6', description: 'Director & producer only' },
  { id: 'line-3', name: 'Camera Ops', color: '#10b981', description: 'Camera operators' },
  { id: 'line-4', name: 'Engineering', color: '#f59e0b', description: 'Technical operations' },
]
