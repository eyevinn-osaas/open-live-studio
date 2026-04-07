export interface Production {
  id: string
  name: string
  sourceIds: string[]
  createdAt: string
  isActive: boolean
}

export const MOCK_PRODUCTIONS: Production[] = [
  {
    id: 'prod-1',
    name: 'Sports Event — Night 1',
    sourceIds: ['src-1', 'src-2', 'src-3', 'src-7'],
    createdAt: '2026-03-28T10:00:00Z',
    isActive: true,
  },
  {
    id: 'prod-2',
    name: 'Press Conference',
    sourceIds: ['src-4', 'src-6'],
    createdAt: '2026-03-29T14:00:00Z',
    isActive: false,
  },
  {
    id: 'prod-3',
    name: 'Studio Morning Show',
    sourceIds: ['src-2', 'src-6', 'src-7'],
    createdAt: '2026-03-30T06:00:00Z',
    isActive: false,
  },
]
