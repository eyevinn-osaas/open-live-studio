import { useEffect, useRef } from 'react'

interface AudioMeterProps {
  stream: MediaStream | null
  width?: number
  height?: number
}

/**
 * Real-time VU meter using Web Audio API AnalyserNode.
 */
export function AudioMeter({ stream, width = 200, height = 24 }: AudioMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx2d = canvas.getContext('2d')!

    if (!stream) {
      ctx2d.fillStyle = '#18181b'
      ctx2d.fillRect(0, 0, width, height)
      return
    }

    // Set up audio graph
    const audioCtx = new AudioContext()
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.6
    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    ctxRef.current = audioCtx
    analyserRef.current = analyser
    sourceRef.current = source

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    function draw() {
      analyser.getByteFrequencyData(dataArray)
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      const level = avg / 255

      ctx2d.fillStyle = '#18181b'
      ctx2d.fillRect(0, 0, width, height)

      // Segmented bar
      const segments = Math.floor(width / 6)
      const activeSegments = Math.round(level * segments)

      for (let i = 0; i < segments; i++) {
        const x = i * 6
        const isActive = i < activeSegments
        if (!isActive) {
          ctx2d.fillStyle = '#27272a'
        } else if (i / segments > 0.85) {
          ctx2d.fillStyle = '#ef4444' // Red: clipping zone
        } else if (i / segments > 0.65) {
          ctx2d.fillStyle = '#f59e0b' // Amber: caution
        } else {
          ctx2d.fillStyle = '#10b981' // Green: nominal
        }
        ctx2d.fillRect(x, 2, 4, height - 4)
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      void audioCtx.close()
    }
  }, [stream, width, height])

  return <canvas ref={canvasRef} width={width} height={height} className="rounded" />
}
