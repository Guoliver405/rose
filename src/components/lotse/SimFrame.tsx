'use client'

/**
 * Gehäuse für die nachgebauten Portale.
 *
 * Zwei Aufgaben: Es sagt unmissverständlich „das ist ein Nachbau, kein echtes
 * Portal", und es gibt dem Inhalt die Breite eines Handys — beide simulierten
 * Portale werden im Betrieb am Telefon bedient, und in voller Seitenbreite
 * sähe die Erklärung anders aus als die Wirklichkeit.
 */
export default function SimFrame({
  titel,
  geraet = 'handy',
  children,
}: {
  titel: string
  /** `handy` begrenzt auf Telefonbreite, `breit` lässt den Inhalt laufen. */
  geraet?: 'handy' | 'breit'
  children: React.ReactNode
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-edge bg-surface ${geraet === 'handy' ? 'w-full max-w-[380px]' : 'w-full'}`}>
      <div className="flex items-center gap-1.5 border-b border-edge bg-surface-sunken px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-edge-strong" />
        <span className="h-2 w-2 rounded-full bg-edge-strong" />
        <span className="h-2 w-2 rounded-full bg-edge-strong" />
        <span className="ml-2 truncate text-[11px] font-semibold text-ink-muted">{titel}</span>
        <span className="ml-auto shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
          Nachbau
        </span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}
