import { useIntercomStore } from '@/store/intercom.store'
import { Button } from '@/components/ui/Button'
import { AudioMeter } from './AudioMeter'
import { useIntercomAudio } from '@/hooks/useIntercomAudio'

export function MicControl() {
  useIntercomAudio()

  const {
    micActive, micMuted, localStream,
    availableDevices, micDeviceId,
    setMicActive, setMicMuted, setMicDeviceId,
  } = useIntercomStore()

  return (
    <div className="flex flex-col gap-3 p-4 rounded border border-[--color-border] bg-[--color-surface-2]">
      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[--color-text-muted]">Microphone</span>

      {/* Mic device picker */}
      {availableDevices.length > 0 && (
        <select
          value={micDeviceId ?? ''}
          onChange={(e) => setMicDeviceId(e.target.value || null)}
          className="w-full px-3 py-2 rounded bg-[--color-surface-1] border border-[--color-border] text-sm text-[--color-text-primary] focus:outline-none"
          disabled={micActive}
        >
          <option value="">Default microphone</option>
          {availableDevices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0, 8)}`}</option>
          ))}
        </select>
      )}

      {/* VU meter */}
      <AudioMeter stream={localStream} width={300} height={28} />

      {/* Controls */}
      <div className="flex gap-2">
        <Button
          variant={micActive ? 'pgm' : 'default'}
          size="md"
          className="flex-1"
          onClick={() => setMicActive(!micActive)}
        >
          {micActive ? '● CONNECTED' : '○ Connect Mic'}
        </Button>
        {micActive && (
          <Button
            variant={micMuted ? 'danger' : 'ghost'}
            size="md"
            onClick={() => setMicMuted(!micMuted)}
          >
            {micMuted ? '🔇 Muted' : '🎙 Live'}
          </Button>
        )}
      </div>

      <p className="text-[10px] text-[--color-text-muted]">
        Echo cancellation, noise suppression, and auto gain control are enabled.
      </p>
    </div>
  )
}
