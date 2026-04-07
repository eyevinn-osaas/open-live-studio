/**
 * Mock Strom pipeline JSON topology.
 * In production this would be the output of the Strom visual editor.
 * Note: Strom's interchange format is gst-launch syntax; this JSON represents
 * the internal storage format used by Strom.
 */
export const MOCK_STROM_PIPELINE = {
  version: '0.4',
  name: 'Sports Event Mix',
  nodes: [
    {
      id: 'video-mixer',
      type: 'videomixer',
      label: 'Video Mixer',
      inputs: ['src-1', 'src-2', 'src-3', 'src-4'],
      properties: {
        background: 'black',
        latency: 200,
      },
    },
    {
      id: 'audio-mixer',
      type: 'audiomixer',
      label: 'Audio Mixer',
      inputs: ['src-1', 'src-4'],
      properties: {
        channels: 2,
        sampleRate: 48000,
      },
    },
    {
      id: 'graphics-overlay',
      type: 'compositor',
      label: 'Graphics',
      inputs: ['video-mixer', 'graphics-src'],
      properties: {
        mode: 'alpha-composite',
      },
    },
    {
      id: 'encoder',
      type: 'nvh264enc',
      label: 'H.264 Encoder (GPU)',
      input: 'graphics-overlay',
      properties: {
        bitrate: 8000000,
        preset: 'low-latency-hq',
        bframes: 0,
      },
    },
    {
      id: 'audio-encoder',
      type: 'avenc_aac',
      label: 'AAC Encoder',
      input: 'audio-mixer',
      properties: {
        bitrate: 192000,
      },
    },
    {
      id: 'srt-output',
      type: 'srtsink',
      label: 'SRT Output',
      inputs: ['encoder', 'audio-encoder'],
      properties: {
        port: '{{allocated}}',
        latency: 200,
        passphrase: '{{env:SRT_PASSPHRASE}}',
        pbkeylen: 16,
      },
    },
  ],
  watchdog: {
    enabled: true,
    intervalMs: 5000,
    action: 'restart-pipeline',
  },
}

export const MOCK_STROM_PIPELINE_JSON = JSON.stringify(MOCK_STROM_PIPELINE, null, 2)
