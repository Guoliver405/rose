/**
 * Web Worker des Simulators: rechnet einen Lauf über viele Tage abseits des
 * Haupt-Threads. Die ganze Logik steckt in `runBatch` (sim-batch.ts, getestet),
 * hier werden nur die Nachrichten durchgereicht. Abbruch = `terminate()`.
 */
import { runBatch, type SimRequest } from '@/lib/sim-batch'

self.onmessage = (e: MessageEvent<SimRequest>) => {
  for (const msg of runBatch(e.data)) self.postMessage(msg)
}
