import { useStreamDeckStore } from '@/store/stream-deck.store'
import { requestStreamDeck } from '@/lib/webhid'
import { StreamDeckGrid } from '@/components/stream-deck/StreamDeckGrid'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export function StreamDeckSurface() {
  const { isSupported, isConnected, device, disconnect, setDevice } = useStreamDeckStore()

  async function handleConnect() {
    const dev = await requestStreamDeck()
    if (dev) {
      setDevice(dev)
    }
  }

  if (!isSupported) {
    return (
      <div className="p-3 rounded border border-[--color-border] bg-[--color-surface-2]">
        <p className="text-xs text-[--color-text-muted] font-mono">
          WebHID not supported in this browser. Use Chrome or Edge for Stream Deck support.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-[--color-surface-2] rounded border border-[--color-border]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[--color-text-muted]">Stream Deck</span>
          {isConnected && device && (
            <Badge variant="connected" label={device.productName.replace('Elgato Stream Deck', 'SD')} />
          )}
          {!isConnected && <Badge variant="disconnected" label="NOT CONNECTED" />}
        </div>
        {isConnected ? (
          <Button size="sm" variant="ghost" onClick={disconnect}>Disconnect</Button>
        ) : (
          <Button size="sm" variant="active" onClick={() => void handleConnect()}>Connect Stream Deck</Button>
        )}
      </div>

      <p className="text-[10px] text-[--color-text-muted]">
        {isConnected ? 'Physical buttons mapped below. Click to simulate.' : 'Virtual layout — click buttons to control the production.'}
      </p>

      <StreamDeckGrid />
    </div>
  )
}
