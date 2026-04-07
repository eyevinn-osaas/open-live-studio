export type ButtonAction =
  | { type: 'pvw'; sourceId: string }
  | { type: 'cut' }
  | { type: 'take' }
  | { type: 'go-live' }
  | { type: 'graphic-toggle'; graphicId: string }
  | { type: 'transition'; mode: 'cut' | 'mix' | 'wipe' }
  | { type: 'none' }

export interface StreamDeckButton {
  index: number
  label: string
  sublabel?: string
  action: ButtonAction
  color: string
}

// 5×3 = 15 button layout for Stream Deck Original / MK.2
export const MOCK_STREAM_DECK_LAYOUT: StreamDeckButton[] = [
  { index: 0,  label: 'CAM 1',    sublabel: 'Field',   action: { type: 'pvw', sourceId: 'src-1' }, color: '#1e3a5f' },
  { index: 1,  label: 'CAM 2',    sublabel: 'Studio',  action: { type: 'pvw', sourceId: 'src-2' }, color: '#3b1f5e' },
  { index: 2,  label: 'CAM 3',    sublabel: 'Wide',    action: { type: 'pvw', sourceId: 'src-3' }, color: '#1f4e3a' },
  { index: 3,  label: 'SRT A',    sublabel: 'Ingest',  action: { type: 'pvw', sourceId: 'src-4' }, color: '#4e3a1f' },
  { index: 4,  label: 'NDI',      sublabel: 'Gfx',     action: { type: 'pvw', sourceId: 'src-6' }, color: '#1f4a4e' },
  { index: 5,  label: 'CUT',      action: { type: 'cut' },                                         color: '#7f1d1d' },
  { index: 6,  label: 'MIX',      action: { type: 'transition', mode: 'mix' },                     color: '#1e3a5f' },
  { index: 7,  label: 'WIPE',     action: { type: 'transition', mode: 'wipe' },                    color: '#1a2e1a' },
  { index: 8,  label: 'TAKE',     action: { type: 'take' },                                        color: '#14532d' },
  { index: 9,  label: 'GO LIVE',  action: { type: 'go-live' },                                     color: '#7f1d1d' },
  { index: 10, label: 'LT A',     sublabel: 'Lower 3rd', action: { type: 'graphic-toggle', graphicId: 'gfx-1' }, color: '#27272a' },
  { index: 11, label: 'LT B',     sublabel: 'Lower 3rd', action: { type: 'graphic-toggle', graphicId: 'gfx-2' }, color: '#27272a' },
  { index: 12, label: 'SCORE',    sublabel: 'Bug',       action: { type: 'graphic-toggle', graphicId: 'gfx-3' }, color: '#27272a' },
  { index: 13, label: 'BREAK',    sublabel: 'Slate',     action: { type: 'graphic-toggle', graphicId: 'gfx-4' }, color: '#27272a' },
  { index: 14, label: 'BUG',      sublabel: 'Station',   action: { type: 'graphic-toggle', graphicId: 'gfx-5' }, color: '#27272a' },
]
