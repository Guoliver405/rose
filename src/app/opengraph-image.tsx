import { ImageResponse } from 'next/og'
import { formatCents } from '@/lib/money'
import { PRICE_PER_ROOM_CENTS } from '@/lib/pricing'
import { PROVIDER } from '@/lib/provider'

/**
 * Link-Vorschau (WhatsApp, Mail, LinkedIn): 1200×630, im Code erzeugt, damit
 * Claim und Preis Text bleiben und sich mit `pricing.ts` ändern, statt in
 * einem PNG einzufrieren. Rechts die Rezeptions-Miniatur in
 * satori-tauglichem Flexbox (kein Grid, keine Tailwind-Klassen) — sie wird
 * durch eine Illustration ersetzt, sobald der Stil steht (Konzept,
 * Abschnitt 3). Dunkler Grund, weil Vorschauen meist auf hellen Flächen
 * liegen.
 */

export const alt = 'RoSe — Reinigung, Wünsche und Services in einem Takt'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const SLATE_900 = '#0f172a'
const SLATE_800 = '#1e293b'
const SLATE_700 = '#334155'
const SLATE_300 = '#cbd5e1'
const SLATE_400 = '#94a3b8'
const ROSE = '#f43f5e'

const TILES: { nr: string; color: string; label: string }[] = [
  { nr: '201', color: '#3b82f6', label: 'belegt' },
  { nr: '202', color: '#10b981', label: 'bereit' },
  { nr: '203', color: '#f59e0b', label: 'Reinigung' },
  { nr: '204', color: '#f97316', label: 'ausgecheckt' },
  { nr: '205', color: '#7c3aed', label: 'priorisiert' },
  { nr: '206', color: ROSE, label: 'nicht stören' },
]

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', background: SLATE_900,
          color: 'white', fontFamily: 'sans-serif', padding: 64,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 640 }}>
          <div style={{ display: 'flex', fontSize: 56, fontWeight: 900, letterSpacing: -2 }}>
            <span>Ro</span><span style={{ color: ROSE }}>Se</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1 }}>
              Reinigung, Wünsche und Services — in einem Takt
            </div>
            <div style={{ fontSize: 26, color: SLATE_300, lineHeight: 1.35 }}>
              Drei Portale für Rezeption, Housekeeping und Gäste. Ohne Gast-App, ohne PMS-Projekt.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Satori verlangt bei mehreren Kindknoten explizites Flex — ein
                JSX-Ausdruck neben Text wären zwei Textknoten, daher ein String. */}
            <div style={{ fontSize: 28, fontWeight: 700 }}>
              {`${formatCents(PRICE_PER_ROOM_CENTS)} je Zimmer und Monat · erster Monat frei`}
            </div>
            <div style={{ fontSize: 22, color: SLATE_400 }}>{PROVIDER.domain}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
          <div
            style={{
              display: 'flex', flexDirection: 'column', width: 400, borderRadius: 24,
              background: SLATE_800, border: `2px solid ${SLATE_700}`, padding: 24, gap: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, color: SLATE_300 }}>
              <span style={{ fontWeight: 700, color: 'white' }}>Etage 2</span>
              <span>2 offen · 1 in Arbeit</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {TILES.map(t => (
                <div
                  key={t.nr}
                  style={{
                    display: 'flex', flexDirection: 'column', width: 108, borderRadius: 12,
                    background: SLATE_900, border: `2px solid ${SLATE_700}`, overflow: 'hidden',
                  }}
                >
                  <div style={{ height: 8, background: t.color }} />
                  <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 10px' }}>
                    <span style={{ fontSize: 22, fontWeight: 800 }}>{t.nr}</span>
                    <span style={{ fontSize: 14, color: SLATE_400 }}>{t.label}</span>
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12,
                background: '#1e3a8a', padding: '10px 14px', fontSize: 18,
              }}
            >
              <span style={{ fontWeight: 700, color: '#bfdbfe' }}>Check-in 207</span>
              <span style={{ fontWeight: 800, letterSpacing: 4, background: SLATE_900, padding: '4px 10px', borderRadius: 8 }}>PIN 4827</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
