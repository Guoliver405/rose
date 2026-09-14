'use client'

import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { oeffneLeiste } from './leiste'

/**
 * „Erklärung" auf einer Hub-Karte: führt auf die Seite, um die es geht, und
 * öffnet dabei die Hilfe-Leiste — Seite und Erklärung nebeneinander, so wie
 * das „?" es auch täte. Der Store ist browserweit, deshalb funktioniert das
 * auch über die Grenze zum Konto-Rahmen (`/admin/abrechnung`).
 */
export default function ErklaerungLink({ href }: { href: string }) {
  return (
    <Link href={href} onClick={oeffneLeiste} className="flex items-center gap-1 text-action hover:underline">
      <BookOpen className="h-3.5 w-3.5" /> Erklärung
    </Link>
  )
}
