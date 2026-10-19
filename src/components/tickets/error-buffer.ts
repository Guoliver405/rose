'use client'

/**
 * Die letzten Fehlermeldungen im Browser – reisen mit einer Meldung mit
 * („Problem melden“), damit niemand sie abtippen muss. Nur Meldungen, keine
 * Eingaben oder Seiteninhalte; gekürzt wird zusätzlich auf dem Server.
 *
 * Wird beim ersten Import im Browser angemeldet (Hilfe-Knopf in jedem Rahmen)
 * und hält höchstens zehn Einträge.
 */
const MAX = 10
const errors: string[] = []
let installed = false

function push(text: string) {
  errors.push(`${new Date().toISOString().slice(11, 19)} ${text}`.slice(0, 300))
  if (errors.length > MAX) errors.shift()
}

export function installErrorBuffer(): void {
  if (installed || typeof window === 'undefined') return
  installed = true
  window.addEventListener('error', e => push(e.message || String(e.error ?? 'error')))
  window.addEventListener('unhandledrejection', e => {
    const r = e.reason as { message?: string } | string | undefined
    push(typeof r === 'string' ? r : r?.message ?? 'unhandled rejection')
  })
  const orig = console.error
  console.error = (...args: unknown[]) => {
    push(args.map(a => (a instanceof Error ? a.message : typeof a === 'string' ? a : '')).filter(Boolean).join(' ') || 'console.error')
    orig.apply(console, args)
  }
}

export function recentErrors(): string[] {
  return [...errors]
}
