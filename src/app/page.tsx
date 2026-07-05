import Link from "next/link";

/**
 * Platzhalter-Landing — verlinkt die drei Portale.
 * Wird in Phase 1 durch echte Einstiege ersetzt.
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-black text-ink">
          Ro<span className="text-blocked">Se</span>
        </h1>
        <p className="mt-1 text-sm text-ink-muted">RoomService — leichtgewichtig.</p>
      </div>

      <nav className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/admin"
          className="rounded-xl border border-edge bg-surface-elevated px-5 py-4 text-center font-bold text-ink shadow-sm hover:border-edge-strong"
        >
          Rezeption
        </Link>
        <Link
          href="/service"
          className="rounded-xl border border-edge bg-surface-elevated px-5 py-4 text-center font-bold text-ink shadow-sm hover:border-edge-strong"
        >
          Reinigung
        </Link>
        <Link
          href="/guest"
          className="rounded-xl border border-edge bg-surface-elevated px-5 py-4 text-center font-bold text-ink shadow-sm hover:border-edge-strong"
        >
          Gäste-Portal
        </Link>
      </nav>

      <p className="text-xs text-ink-muted">Phase 0 — Fundament steht.</p>
    </main>
  );
}
