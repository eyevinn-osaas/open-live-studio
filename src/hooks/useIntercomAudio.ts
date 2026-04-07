import { useEffect, useRef } from 'react'
import { useIntercomStore } from '@/store/intercom.store'
import { INTERCOM_AUDIO_CONSTRAINTS } from '@/lib/audio-constraints'

/**
 * Manages mic acquisition and audio device enumeration for intercom.
 * See docs/repo-patterns.md: "Echo cancellation must be explicitly requested"
 */
export function useIntercomAudio() {
  const { micActive, micDeviceId, setLocalStream, setAvailableDevices, setMicActive } = useIntercomStore()
  const streamRef = useRef<MediaStream | null>(null)

  // Enumerate audio devices
  useEffect(() => {
    void navigator.mediaDevices.enumerateDevices().then((devices) => {
      setAvailableDevices(devices.filter((d) => d.kind === 'audioinput'))
    })
  }, [setAvailableDevices])

  // Acquire or release mic stream
  useEffect(() => {
    if (!micActive) {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setLocalStream(null)
      return
    }

    const constraints: MediaStreamConstraints = {
      audio: micDeviceId
        ? { ...INTERCOM_AUDIO_CONSTRAINTS, deviceId: { exact: micDeviceId } }
        : INTERCOM_AUDIO_CONSTRAINTS,
    }

    void navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      streamRef.current = stream
      setLocalStream(stream)
    }).catch(() => {
      setMicActive(false)
    })

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setLocalStream(null)
    }
  }, [micActive, micDeviceId, setLocalStream, setMicActive])
}
