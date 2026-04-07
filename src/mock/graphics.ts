export type OverlayType = 'lower-third' | 'full-screen' | 'bug'

export interface GraphicOverlay {
  id: string
  name: string
  type: OverlayType
  fields: Record<string, string>
}

export const MOCK_GRAPHIC_OVERLAYS: GraphicOverlay[] = [
  {
    id: 'gfx-1',
    name: 'Lower Third A',
    type: 'lower-third',
    fields: { name: 'Jane Smith', title: 'Reporter, Field' },
  },
  {
    id: 'gfx-2',
    name: 'Lower Third B',
    type: 'lower-third',
    fields: { name: 'Marcus Chen', title: 'Sports Correspondent' },
  },
  {
    id: 'gfx-3',
    name: 'Score Bug',
    type: 'bug',
    fields: { homeTeam: 'HOME', awayTeam: 'AWAY', homeScore: '0', awayScore: '0', clock: '00:00', period: '1st' },
  },
  {
    id: 'gfx-4',
    name: 'Break Slate',
    type: 'full-screen',
    fields: { message: 'Back in 2 minutes', subtext: 'Open Live Production' },
  },
  {
    id: 'gfx-5',
    name: 'Station Bug',
    type: 'bug',
    fields: { channel: 'OL1', tag: 'LIVE' },
  },
]
