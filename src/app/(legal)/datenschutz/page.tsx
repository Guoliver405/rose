import type { Metadata } from 'next'
import { PROVIDER, providerAddressLines } from '@/lib/provider'
import { Address, List, P, ProviderNotice, Section, Sub, Title } from '../ui'

export const metadata: Metadata = {
  title: 'Datenschutzerklärung — RoSe',
  description: 'Welche Daten RoSe verarbeitet, wofür, wie lange — und welche Rechte Sie haben.',
}

/**
 * Datenschutzerklärung für Website und Dienst.
 *
 * Die tragende Unterscheidung: Für **Besucher der Website und Kunden**
 * (Kontoinhaber, Manager, Rezeption) ist der Anbieter selbst Verantwortlicher.
 * Für die Daten, die ein Hotel IN RoSe verarbeitet — Gäste-Aufenthalte,
 * Personal, Tätigkeitsnachweise — ist das **Hotel** Verantwortlicher und der
 * Anbieter Auftragsverarbeiter (Art. 28 DSGVO). Beides steht hier, weil Gäste
 * und Reinigungskräfte diese Seite über die Fußzeile ihrer Portale erreichen
 * und dort erfahren sollen, was mit ihren Daten geschieht — auch wenn ihr
 * eigentlicher Ansprechpartner das Haus ist.
 *
 * Fakten aus dem Code, nicht aus einer Vorlage: keine Analyse-Werkzeuge, keine
 * Einwilligungs-Banner (nur technisch notwendige Cookies), Gäste anonym, die
 * Mail-Adresse eines Gastes wird nicht in RoSe gespeichert (wohl aber im
 * Zustellprotokoll des Mail-Dienstleisters), Fehlversuche der Gast-Anmeldung
 * nur als IP-Hash für 15 Minuten.
 */
export default function DatenschutzPage() {
  return (
    <>
      <Title sub="Wir gehen sparsam mit Daten um — und sagen hier genau, was wir wofür verarbeiten.">
        Datenschutzerklärung
      </Title>
      <ProviderNotice />

      <Section title="1. Verantwortlicher">
        <Address lines={providerAddressLines()} />
        <P>Vertreten durch den Geschäftsführer {PROVIDER.representative}.</P>
        <P>{PROVIDER.phone ? `Telefon: ${PROVIDER.phone} · ` : ''}E-Mail: {PROVIDER.email}</P>
        <P>Ein Datenschutzbeauftragter ist nicht benannt, da die gesetzlichen Voraussetzungen für eine Benennungspflicht nicht vorliegen.</P>
      </Section>

      <Section title="2. Zwei Rollen — wer wofür verantwortlich ist">
        <P>
          RoSe ist ein Dienst für Beherbergungsbetriebe. Daraus ergeben sich zwei
          Verantwortlichkeiten:
        </P>
        <List
          items={[
            <><span className="font-semibold text-ink">Für Besucher dieser Website und für unsere Kunden</span> (Kontoinhaber, Manager, Rezeptionszugänge) sind wir selbst Verantwortlicher im Sinne der DSGVO. Das betrifft die Abschnitte 3 bis 7.</>,
            <><span className="font-semibold text-ink">Für die Daten, die ein Hotel in RoSe verarbeitet</span> — Aufenthalte, Wünsche und Bestellungen der Gäste, Personal und Tätigkeitsnachweise — ist das jeweilige <span className="font-semibold text-ink">Hotel</span> Verantwortlicher und wir sein Auftragsverarbeiter nach Art. 28 DSGVO. Gäste und Mitarbeitende wenden sich mit ihren Rechten deshalb an das Haus, bei dem sie wohnen bzw. arbeiten. Was RoSe dabei technisch verarbeitet, steht in Abschnitt 8.</>,
          ]}
        />
      </Section>

      <Section title="3. Hosting und Server-Protokolle">
        <P>
          Die Anwendung wird bei <span className="font-semibold text-ink">Vercel Inc.</span>, 440 N Barranca Ave #4133,
          Covina, CA 91723, USA, betrieben; die Serverfunktionen laufen in der Region Dublin (Irland).
          Beim Aufruf einer Seite verarbeitet Vercel technisch notwendige Verbindungsdaten
          (IP-Adresse, Zeitpunkt, aufgerufene Adresse, Browser-Kennung, Statuscode) in
          Server-Protokollen. Wir nutzen diese Protokolle ausschließlich zur Fehlersuche und
          Sicherheit; sie werden nicht mit anderen Daten zusammengeführt.
        </P>
        <P>
          Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren und stabilen Betrieb
          (Art. 6 Abs. 1 lit. f DSGVO). Die Protokolle werden nach kurzer Zeit automatisch gelöscht.
        </P>
      </Section>

      <Section title="4. Datenbank, Anmeldung und Konto">
        <P>
          Konten, Häuser, Zimmer und alle Betriebsdaten liegen in einer Datenbank bei{' '}
          <span className="font-semibold text-ink">Supabase, Inc.</span>, 970 Toa Payoh North #07-04,
          Singapore 318992, in einem Rechenzentrum in der EU (Irland). Supabase stellt auch die
          Anmeldung bereit.
        </P>
        <Sub title="Kundenkonto">
          <P>
            Bei der Registrierung verarbeiten wir Name, E-Mail-Adresse, Passwort (nur als
            kryptografischer Hash) und den Namen des Hauses. Manager- und Rezeptionszugänge
            werden vom Kontoinhaber per Einladung an eine E-Mail-Adresse angelegt und
            verarbeiten dieselben Daten. Zweck ist die Bereitstellung des Dienstes und die
            Vertragsdurchführung (Art. 6 Abs. 1 lit. b DSGVO).
          </P>
          <P>
            Die Daten bleiben gespeichert, solange das Konto besteht. Der Kontoinhaber kann
            Häuser und das gesamte Konto selbst löschen (Bereich „Daten löschen“); dabei werden
            auch die Anmeldekonten der zugehörigen Personen entfernt, soweit sie nicht in
            einem anderen Konto weiter benötigt werden. Gesetzliche Aufbewahrungspflichten
            für Rechnungsdaten bleiben unberührt.
          </P>
        </Sub>
        <Sub title="Sitzungs-Cookies">
          <P>
            Nach der Anmeldung setzt RoSe ein Sitzungs-Cookie, damit Sie nicht auf jeder Seite
            neu anmelden müssen. Es handelt sich um technisch notwendige Cookies, für die keine
            Einwilligung erforderlich ist (§ 25 Abs. 2 Nr. 2 TDDDG): für das Verwaltungsportal
            (<code className="rounded bg-surface-muted px-1 text-xs text-ink">sb-…-auth-token</code>),
            für das Reinigungsboard (<code className="rounded bg-surface-muted px-1 text-xs text-ink">svc_sb-…</code>)
            und für das Gäste-Portal (<code className="rounded bg-surface-muted px-1 text-xs text-ink">rose_guest</code>).
            Die Cookies enthalten keine Klardaten und verfallen mit dem Abmelden bzw. dem Check-out.
            Weitere Cookies setzt RoSe nicht; das helle oder dunkle Design folgt der Einstellung
            Ihres Geräts, ohne dass etwas gespeichert wird.
          </P>
        </Sub>
        <Sub title="Keine Analyse, kein Tracking">
          <P>
            Wir setzen keine Analyse- oder Tracking-Werkzeuge ein, keine Werbe-Cookies und keine
            Inhalte von Drittanbietern, die Ihr Verhalten auswerten. Deshalb gibt es auch kein
            Cookie-Banner.
          </P>
        </Sub>
      </Section>

      <Section title="5. E-Mail-Versand">
        <P>
          E-Mails (Einladungen, Passwort zurücksetzen, Gast-Zugang auf Wunsch der Rezeption)
          werden über <span className="font-semibold text-ink">Resend Inc.</span>, 2261 Market Street
          #5039, San Francisco, CA 94114, USA, versendet. Resend verarbeitet dafür Empfängeradresse,
          Betreff und Inhalt der Mail und führt ein Zustellprotokoll (Adresse, Zeitpunkt,
          Zustellstatus), das nach Ablauf der bei Resend eingestellten Frist gelöscht wird.
        </P>
        <P>
          <span className="font-semibold text-ink">Gast-Zugang per Mail:</span> Gibt die Rezeption auf
          Wunsch eines Gastes dessen E-Mail-Adresse ein, verwendet RoSe sie ausschließlich für
          diesen einen Versand. Die Adresse wird <span className="font-semibold text-ink">nicht in RoSe gespeichert</span>;
          der Aufenthalt bleibt anonym. Verantwortlich für diese Verarbeitung ist das Hotel
          (siehe Abschnitt 2); Rechtsgrundlage ist die Erfüllung des Beherbergungsvertrags
          gegenüber dem Gast (Art. 6 Abs. 1 lit. b DSGVO).
        </P>
      </Section>

      <Section title="6. Zahlungsdaten">
        <P>
          Derzeit werden keine Zahlungsdaten erhoben. Sobald die Abrechnung über einen
          Zahlungsdienstleister läuft, wird diese Erklärung um den Dienstleister, die
          verarbeiteten Daten und die Rechtsgrundlage ergänzt; Kunden werden vorab informiert.
        </P>
      </Section>

      <Section title="7. Übermittlung in Drittländer">
        <P>
          Die genannten Dienstleister haben ihren Sitz außerhalb der EU; die Daten von RoSe
          werden in der EU gespeichert (Datenbank und Serverfunktionen in Irland). Soweit
          dennoch ein Zugriff aus einem Drittland möglich ist (etwa Support oder das weltweite
          Auslieferungsnetz des Hosters), stützt sich die Übermittlung auf die
          EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO) und — soweit der
          Dienstleister zertifiziert ist — auf den Angemessenheitsbeschluss zum EU-US Data
          Privacy Framework (Art. 45 DSGVO). Mit allen drei Dienstleistern bestehen
          Auftragsverarbeitungsverträge.
        </P>
      </Section>

      <Section title="8. Was RoSe im Auftrag der Hotels verarbeitet">
        <P>
          Für die folgenden Daten ist das jeweilige Hotel Verantwortlicher; wir verarbeiten sie
          ausschließlich nach dessen Weisung und auf Grundlage eines
          Auftragsverarbeitungsvertrags (Art. 28 DSGVO).
        </P>
        <Sub title="Gäste">
          <P>
            Ein Aufenthalt ist in RoSe <span className="font-semibold text-ink">anonym</span>: Zimmer,
            Zeitraum von Check-in bis Check-out, eine Zugangs-PIN oder ein Zugangs-Link, die
            vom Gast gesetzten Signale („Zimmer reinigen“, „Bitte nicht stören“) und seine
            Service-Bestellungen mit optionaler Notiz. Name, Kontaktdaten oder Ausweisdaten
            werden nicht erhoben. Mit dem Check-out erlöschen PIN und Link sofort. Freitext in
            der Bestellnotiz sollte keine personenbezogenen Daten enthalten — sie werden dem
            Hotel angezeigt und im Zimmer-Verlauf 30 Tage lang gezeigt.
          </P>
          <P>
            Zum Schutz vor dem Durchprobieren von PINs speichert RoSe bei Fehlversuchen der
            Gast-Anmeldung einen <span className="font-semibold text-ink">Hash der IP-Adresse</span> (SHA-256,
            nicht umkehrbar) zusammen mit dem Zeitpunkt für 15 Minuten; danach wird der Eintrag
            automatisch gelöscht. Erfolgreiche Anmeldungen hinterlassen keinen Eintrag.
          </P>
        </Sub>
        <Sub title="Mitarbeitende">
          <P>
            Für Reinigungskräfte verarbeitet RoSe Anzeigename, Benutzername, PIN (gehasht) sowie
            Tätigkeitsstiche mit Zeitpunkt (Schichtbeginn und -ende, Pausen, Beginn und Abschluss
            einer Zimmerreinigung) und die aktuell gewählte Etage. Aus den Stichen berechnet das
            Hotel Arbeits- und Reinigungszeiten (Auswertung). Für Rezeptions- und Managerzugänge
            werden Anzeigename und E-Mail-Adresse verarbeitet sowie, welche Person einen Check-in,
            Check-out oder eine erledigte Bestellung ausgelöst hat (Zimmer-Verlauf). Die
            Aufbewahrung richtet sich nach dem Hotel; beim Löschen eines Zugangs zeigt RoSe vorher
            an, welche Nachweise davon betroffen sind.
          </P>
        </Sub>
        <Sub title="Löschung">
          <P>
            Das Hotel kann Zimmer, Personal, Häuser und das gesamte Konto selbst löschen. Beim
            Löschen eines Hauses oder Kontos werden auch die Einträge entfernt, die aus
            Nachweisgründen sonst erhalten bleiben (Zimmer-Verlauf, Abrechnungsbelege) sowie
            die zugehörigen Anmeldekonten.
          </P>
        </Sub>
      </Section>

      <Section title="9. Ihre Rechte">
        <P>Sie haben gegenüber dem jeweils Verantwortlichen (siehe Abschnitt 2) das Recht auf</P>
        <List
          items={[
            'Auskunft über die zu Ihrer Person gespeicherten Daten (Art. 15 DSGVO),',
            'Berichtigung unrichtiger Daten (Art. 16 DSGVO),',
            'Löschung (Art. 17 DSGVO) und Einschränkung der Verarbeitung (Art. 18 DSGVO),',
            'Datenübertragbarkeit (Art. 20 DSGVO),',
            'Widerspruch gegen Verarbeitungen auf Grundlage eines berechtigten Interesses (Art. 21 DSGVO),',
            'Beschwerde bei einer Datenschutz-Aufsichtsbehörde (Art. 77 DSGVO), etwa der für den Verantwortlichen zuständigen Landesbehörde.',
          ]}
        />
        <P>
          Für Anfragen an uns genügt eine E-Mail an {PROVIDER.email}. Gäste und Mitarbeitende
          eines Hotels wenden sich bitte an das Haus; wir unterstützen es bei der Beantwortung.
        </P>
      </Section>

      <Section title="10. Datensicherheit">
        <P>
          Alle Verbindungen sind TLS-verschlüsselt. Zugriffe auf die Datenbank sind je Haus
          getrennt (Row Level Security); Passwörter und PINs von Mitarbeitenden werden nur als
          Hash gespeichert; Anmeldungen sind gegen Durchprobieren gedrosselt. Der Zugriff auf
          Produktionsdaten ist auf den Anbieter beschränkt und wird nur zur Fehlersuche und auf
          Weisung des Kunden genutzt.
        </P>
      </Section>

      <Section title="11. Änderungen">
        <P>
          Wir passen diese Erklärung an, wenn sich der Dienst oder die Rechtslage ändert. Es gilt
          die jeweils hier veröffentlichte Fassung; das Datum steht oben.
        </P>
      </Section>
    </>
  )
}
