/**
 * Mail-Versand — deutsche Texte (ausgelagert 10.10.2026): Vorlagen für
 * Einladung, Passwort-Link und Simulator-Konto, Statuszeile unter den
 * Sende-Knöpfen und Meldungen des Versands. Die Zugangs-Mail an den Gast
 * steht nicht hier, sondern bei den Blättern (`sheet.ts`), weil sie in der
 * Sprache des Hauses geht.
 *
 * Wer liest: Personal und Kontoinhaber (Sie). Begriffe nach
 * `Sessions/Begriffe-Entscheidungen.md`, u. a. „E-Mail“ statt „Mail“ und
 * „ – “ als Gedankenstrich.
 */
export const mail = {
  templates: {
    greeting: 'Guten Tag,',
    fallback: 'Falls sich der Knopf nicht öffnen lässt:',
    invite: {
      subject: 'Einladung: {role} für {hotel} in RoSe',
      greeting: 'Guten Tag {name},',
      invited: 'Sie sind als <b>{role}</b> für <b>{hotel}</b> in RoSe eingeladen worden.',
      invitedBy: 'Sie sind von {by} als <b>{role}</b> für <b>{hotel}</b> in RoSe eingeladen worden.',
      body: 'Über den folgenden Knopf vergeben Sie Ihr Passwort und melden sich danach mit dieser E-Mail-Adresse an.',
      bodyText: 'Über den folgenden Link vergeben Sie Ihr Passwort und melden sich danach mit dieser E-Mail-Adresse an.',
      button: 'Passwort vergeben',
      note: 'Der Link ist begrenzt gültig. Falls Sie diese Einladung nicht erwarten, können Sie die E-Mail ignorieren.',
    },
    recovery: {
      subject: 'Neues Passwort für RoSe',
      subjectInvite: 'Ihr Link zum Passwort für RoSe',
      intro: 'für Ihren RoSe-Zugang wurde ein neues Passwort angefordert.',
      introInvite: 'hier ist Ihr neuer Link, um das Passwort für Ihren RoSe-Zugang zu vergeben.',
      button: 'Neues Passwort setzen',
      buttonInvite: 'Passwort vergeben',
      note: 'Der Link ist begrenzt gültig und lässt sich auf jedem Gerät öffnen. Haben Sie kein neues Passwort angefordert, können Sie die E-Mail ignorieren – Ihr Passwort bleibt unverändert.',
    },
    simConfirm: {
      subject: 'Bitte bestätigen: Ihr Konto für den {tool}',
      purpose: 'Bitte bestätigen Sie Ihre E-Mail-Adresse, damit Sie den {tool} von RoSe nutzen können.',
      marketing:
        'Sie haben außerdem zugestimmt, dass RoSe Sie gelegentlich per E-Mail über neue Funktionen und besondere Angebote informiert – ausschließlich zu RoSe. Mit dem Klick bestätigen Sie auch diese Einwilligung; widerrufen können Sie sie jederzeit im Konto.',
      button: 'E-Mail-Adresse bestätigen',
      note: 'Der Link ist begrenzt gültig. Haben Sie sich nicht registriert, ignorieren Sie die E-Mail einfach – ohne Bestätigung wird das Konto nach sieben Tagen gelöscht.',
    },
    simExists: {
      subject: 'Sie haben bereits einen Zugang zu RoSe',
      text: 'Für diese E-Mail-Adresse gibt es bereits einen Zugang zu RoSe. Ein zweites Konto lässt sich mit derselben Adresse nicht anlegen. Melden Sie sich mit Ihrem bestehenden Zugang an – als Inhaber oder Manager eines Hauses finden Sie den {tool} dann unter {url}.',
      button: 'Anmelden',
      buttonText: 'Anmelden: {url}',
      forgot: 'Passwort vergessen? Dann setzen Sie es hier neu:',
      note: 'Haben Sie sich nicht erneut registriert, können Sie diese E-Mail ignorieren – an Ihrem Zugang hat sich nichts geändert.',
    },
  },

  /** Zustand einer Sendung, wie ihn `mail_log` kennt. */
  status: {
    queued: 'Wird übergeben …',
    sent: 'An den Versand übergeben – warte auf die Zustellbestätigung …',
    delayed: 'Zustellung verzögert: Der Empfänger-Server nimmt gerade nicht an, es wird weiter versucht.',
    delivered: 'Zugestellt.',
    complained: 'Der Empfänger hat die E-Mail als Spam gemeldet.',
    bounced: 'Vom Empfänger-Server abgewiesen.',
    bouncedDetail: 'Vom Empfänger-Server abgewiesen: {detail}',
    suppressed: 'Nicht zugestellt: Die Adresse steht nach einem früheren Bounce auf der Sperrliste des Versanddienstes. Erst freigeben, dann erneut senden.',
    failed: 'Konnte nicht verschickt werden.',
    failedDetail: 'Konnte nicht verschickt werden: {detail}',
  },

  /** Statuszeile unter den Sende-Knöpfen. */
  line: {
    againIn: 'erneut in {seconds} s',
    to: ' an {recipient}',
    blockedTitle: 'Nicht gesendet – Adresse gesperrt',
    origin: {
      bounce: 'Der Empfänger-Server hat eine frühere E-Mail an diese Adresse abgewiesen',
      complaint: 'Der Empfänger hat eine frühere E-Mail als Spam gemeldet',
      manual: 'Die Adresse wurde von Hand auf die Sperrliste gesetzt',
      other: 'Eine frühere E-Mail an diese Adresse ist nicht angekommen',
    },
    blockedText: '{origin}{since}. Der Versanddienst liefert an diese Adresse nichts mehr aus, bis sie freigegeben wird.',
    reasonThen: 'Grund damals: {detail}',
    canRelease: 'Stimmt die Adresse? Dann freigeben und erneut senden. Bounct sie wieder, steht der neue Grund hier.',
    cannotRelease: 'Die Freigabe ist derzeit nicht aus der Anwendung möglich – bitte die Adresse prüfen oder den Zugang auf anderem Weg übergeben.',
    providerHint:
      'Hinweis: Bei <code>{domain}</code> wurden zuletzt {count} verschiedene Adressen abgewiesen und keine zugestellt (seit {since}). Dieser Anbieter nimmt unsere E-Mails derzeit womöglich nicht an – falls nichts ankommt, den Zugang auf anderem Weg übergeben.',
    failedTitle: 'Nicht angekommen',
    suppressedHelp: 'Stimmt die Adresse? Dann freigeben und erneut senden – sonst den Zugang auf anderem Weg übergeben.',
    failedHelp: 'Adresse prüfen und erneut senden – oder den Zugang auf anderem Weg übergeben. Die Adresse steht jetzt auf der Sperrliste; ein erneuter Versand gibt sie vorher frei.',
    deliveredTitle: 'Zugestellt',
    deliveredHelp: 'Der Empfänger-Server hat die E-Mail angenommen. Landet sie nicht im Posteingang, lohnt ein Blick in den Spam-Ordner.',
    delayedTitle: 'Verzögert',
    timedOutTitle: 'Übergeben, Zustellung noch unbestätigt',
    timedOutHelp: 'Manche Anbieter bestätigen erst nach Minuten. Bitte im Postfach nachsehen (auch Spam); bei Bedarf erneut senden.',
    sentTitle: 'Übergeben',
    inviteLink: {
      title: 'Einladungslink – per Messenger, SMS oder Notiz übergeben',
      copy: 'Link kopieren',
      copied: 'Kopiert',
      hide: 'Ausblenden',
      help: 'Wer diesen Link öffnet, vergibt das Passwort für diesen Zugang. Er gilt einmal und nur begrenzte Zeit. Nutzt ihn jemand anderes zuerst, scheitert die eingeladene Person und meldet sich – dann einfach einen neuen erzeugen.',
    },
  },

  /** Meldungen des Versands an die Person am Bildschirm. */
  errors: {
    notConfigured: 'E-Mail-Versand ist nicht eingerichtet.',
    invalidAddress: 'Bitte eine gültige E-Mail-Adresse angeben.',
    cooldown: 'Gerade erst verschickt – bitte kurz warten, bevor erneut gesendet wird.',
    sendFailed: 'Die E-Mail konnte nicht verschickt werden.',
    sendFailedDetail: 'Die E-Mail konnte nicht verschickt werden: {detail}',
    providerAnswered: 'Resend antwortete {status}',
    providerUnreachable: 'Resend nicht erreichbar',
    releaseForbidden: 'Die Freigabe ist mit dem hinterlegten Resend-Schlüssel nicht erlaubt (Vollzugriff nötig).',
    releaseFailed: 'Die Freigabe ist fehlgeschlagen (Resend antwortete {status}).',
    releaseUnreachable: 'Die Freigabe ist fehlgeschlagen: Resend nicht erreichbar.',
  },

  fromVia: '{hotel} via RoSe',
}

export type MailMessages = typeof mail
