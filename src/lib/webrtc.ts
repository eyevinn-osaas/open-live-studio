/**
 * WebRTC utilities for the viewer.
 * No signaling server in mock mode — uses getUserMedia or canvas color bars.
 * See docs/repo-patterns.md: "WebRTC viewer fails on mobile without TURN"
 */

/**
 * Attempt to get a real camera stream.
 * Falls back to canvas color bars if permission is denied or unavailable.
 */
export async function getViewerStream(): Promise<{ stream: MediaStream; isMock: boolean }> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
      audio: false,
    })
    return { stream, isMock: false }
  } catch {
    return { stream: createColorBarStream(), isMock: true }
  }
}

/**
 * SMPTE-style color bar test signal via Canvas API.
 * Used as fallback when camera is unavailable.
 */
export function createColorBarStream(): MediaStream {
  const canvas = document.createElement('canvas')
  canvas.width = 1280
  canvas.height = 720
  const ctx = canvas.getContext('2d')!

  const bars = [
    '#c0c0c0', // White
    '#c0c000', // Yellow
    '#00c0c0', // Cyan
    '#00c000', // Green
    '#c000c0', // Magenta
    '#c00000', // Red
    '#0000c0', // Blue
    '#000000', // Black
  ]

  let frame = 0

  function draw() {
    const barWidth = canvas.width / bars.length
    bars.forEach((color, i) => {
      ctx.fillStyle = color
      ctx.fillRect(i * barWidth, 0, barWidth, canvas.height * 0.75)
    })

    // Bottom sub-bars
    ctx.fillStyle = '#00008B'
    ctx.fillRect(0, canvas.height * 0.75, canvas.width * 0.125, canvas.height * 0.25)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(canvas.width * 0.125, canvas.height * 0.75, canvas.width * 0.125, canvas.height * 0.25)
    ctx.fillStyle = '#1a1a6e'
    ctx.fillRect(canvas.width * 0.25, canvas.height * 0.75, canvas.width * 0.5, canvas.height * 0.25)
    ctx.fillStyle = '#000000'
    ctx.fillRect(canvas.width * 0.75, canvas.height * 0.75, canvas.width * 0.25, canvas.height * 0.25)

    // Frame counter overlay
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(8, 8, 220, 28)
    ctx.fillStyle = '#00ff00'
    ctx.font = 'bold 14px monospace'
    ctx.fillText(`OPEN LIVE — TEST SIGNAL  ${String(frame).padStart(6, '0')}`, 12, 26)
    frame++
  }

  draw()
  const interval = setInterval(draw, 1000 / 30)

  const stream = canvas.captureStream(30)

  // Clean up interval when stream ends
  stream.getTracks().forEach((t) => {
    t.addEventListener('ended', () => clearInterval(interval))
  })

  return stream
}

/**
 * Acquires a stream for a source: real camera for liveCamera sources, canvas mock otherwise.
 */
export async function getSourceStream(source: { color: string; name: string; liveCamera?: boolean }): Promise<MediaStream> {
  if (source.liveCamera) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: false,
      })
    } catch {
      // Camera denied or unavailable — fall through to canvas mock
    }
  }
  return createSourceStream(source.color, source.name)
}

/**
 * Creates a colored canvas stream for a multiview cell (simulates a source feed).
 */
export function createSourceStream(color: string, label: string): MediaStream {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 360
  const ctx = canvas.getContext('2d')!

  function draw() {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 1
    for (let x = 0; x < canvas.width; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += 36) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
    }

    // Label
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, canvas.height / 2 - 20, canvas.width, 40)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 18px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 6)
    ctx.textAlign = 'left'

    // Timecode
    const now = new Date()
    const tc = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}:00`
    ctx.font = '12px monospace'
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.fillText(tc, 8, canvas.height - 8)
  }

  draw()
  const interval = setInterval(draw, 1000)
  const stream = canvas.captureStream(10)
  stream.getTracks().forEach((t) => {
    t.addEventListener('ended', () => clearInterval(interval))
  })
  return stream
}
