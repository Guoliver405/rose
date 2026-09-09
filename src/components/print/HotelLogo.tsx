/**
 * Hotel-Logo auf den gedruckten Blättern — mit Rückfall auf den Hausnamen.
 *
 * Zwei Dinge sind Absicht:
 *
 * - **Ohne Logo steht der Hausname da**, gesetzt wie eine Wortmarke. Ein Haus
 *   ohne Logo soll kein Loch im Kopf des Blattes haben.
 * - **`object-contain` mit Höhen- UND Breitengrenze**, weil wir die
 *   Seitenverhältnisse der Kunden nicht kennen: Ein breites Schriftlogo darf
 *   nicht über den Kopf hinauslaufen, ein quadratisches Wappen den Kopf nicht
 *   in die Höhe treiben.
 *
 * **Zwei Maßangaben, nicht eine:** In mm angegebene Grenzen rechnet der
 * Browser mit 96 dpi um (1 mm ≈ 3,78 px) — die Vorschau ist aber breiter
 * skaliert als das Blatt im Druck (756 px Inhalt ↔ 186 mm, also 1 mm ≈
 * 4,07 px). Nur mm hieße: Auf dem Bildschirm sieht das Logo kleiner aus, als
 * es gedruckt wird. Deshalb Bildschirm-Pixel für die Vorschau und `print:`-mm
 * fürs Papier, beide auf dasselbe Verhältnis gerechnet.
 *
 * `next/image` lohnt hier nicht: die Datei liegt im öffentlichen
 * Storage-Bucket, wird gedruckt (keine Größenvarianten nötig) und müsste sonst
 * als Remote-Pattern konfiguriert werden.
 */
export default function HotelLogo({
  url,
  hotelName,
  variant,
}: {
  url: string | null
  hotelName: string
  variant: 'a4' | 'compact'
}) {
  if (!url) {
    return (
      <p className={variant === 'a4' ? 'text-lg font-black leading-tight text-ink' : 'text-[11px] font-black leading-tight text-ink'}>
        {hotelName}
      </p>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={hotelName}
      className={
        variant === 'a4'
          ? 'max-h-[65px] max-w-[224px] object-contain object-left print:max-h-[16mm] print:max-w-[55mm]'
          : 'max-h-[35px] max-w-[117px] object-contain object-left print:max-h-[10mm] print:max-w-[34mm]'
      }
    />
  )
}
