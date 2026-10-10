/**
 * Anmeldung, Registrierung und Passwort — deutsche Texte (ausgelagert
 * 11.10.2026). Wer liest: Inhaber, Manager, Rezeption (Sie).
 *
 * Begriffe nach `Sessions/Begriffe-Entscheidungen.md` („Anmeldung“ statt
 * „Login“, „Haus“, „E-Mail“, „…“ und „ – “). Zwei Aussagen sind dabei
 * korrigiert, weil sie seit dem 12.09.2026 nicht mehr stimmten: Passwort-
 * Links lassen sich auf jedem Gerät öffnen, und das Zurücksetzen per E-Mail
 * ist eingerichtet.
 */
export const auth = {
  login: {
    title: 'Anmeldung',
    email: 'E-Mail',
    password: 'Passwort',
    submit: 'Anmelden',
    submitting: 'Anmelden …',
    forgot: 'Passwort vergessen?',
    noAccount: 'Noch kein Konto? <link>Haus registrieren</link>',
  },

  signup: {
    title: 'Konto anlegen',
    inviteCode: 'Einladungscode',
    inviteCodeHint: 'RoSe ist in der frühen Testphase – die Registrierung ist noch auf eingeladene Häuser beschränkt.',
    houseName: 'Name des Hauses',
    houseNamePlaceholder: 'z. B. Pension Alpenblick',
    yourName: 'Ihr Name',
    yourNamePlaceholder: 'z. B. Anna Berg',
    email: 'E-Mail (Anmeldung)',
    password: 'Passwort',
    passwordHint: 'Mindestens {min} Zeichen.',
    submit: 'Konto anlegen',
    submitting: 'Wird angelegt …',
    terms:
      'Mit dem Anlegen des Kontos akzeptieren Sie die <terms>AGB</terms> und nehmen die <privacy>Datenschutzerklärung</privacy> zur Kenntnis. Der Kalendermonat der Registrierung und der erste volle Monat danach sind kostenfrei.',
    nextStep: 'Im nächsten Schritt legen Sie die Zimmer an. Beispiel-Services sind bereits eingerichtet und jederzeit änderbar.',
    haveAccount: 'Schon ein Konto? <link>Anmelden</link>',
  },

  forgot: {
    title: 'Passwort zurücksetzen',
    linkInvalid: 'Der Link ist abgelaufen oder wurde bereits benutzt. Bitte einen neuen anfordern.',
    email: 'E-Mail',
    submit: 'Link zum Zurücksetzen senden',
    submitting: 'Wird verschickt …',
    sentTitle: 'E-Mail ist unterwegs',
    sentText:
      'Falls es zu <code>{email}</code> ein Konto gibt, liegt gleich ein Link im Postfach. Er ist begrenzt gültig und lässt sich auf jedem Gerät öffnen.',
    sentSpam: 'Nichts angekommen? Auch den Spam-Ordner prüfen.',
    again: 'Erneut anfordern',
    againIn: 'Erneut anfordern in {seconds} s',
    backToLogin: 'Zurück zur Anmeldung',
  },

  newPassword: {
    titleInvite: 'Zugang einrichten',
    title: 'Neues Passwort vergeben',
    introInvite: 'Willkommen! Vergeben Sie ein Passwort für <b>{email}</b>. Nach dem Speichern sind Sie direkt angemeldet.',
    intro: 'Für <b>{email}</b>. Nach dem Speichern sind Sie direkt angemeldet.',
    linkInvalid: 'Dieser Link ist nicht (mehr) gültig – er ist abgelaufen oder wurde schon benutzt.',
    requestNew: 'Neuen Link anfordern',
    password: 'Neues Passwort',
    passwordHint: 'Mindestens {min} Zeichen.',
    confirm: 'Wiederholen',
    submit: 'Passwort speichern',
    submitting: 'Wird gespeichert …',
    backToLogin: 'Zurück zur Anmeldung',
  },

  errors: {
    loginFailed: 'Anmeldung fehlgeschlagen – E-Mail oder Passwort falsch.',
    confirmEmailFirst: 'Bitte zuerst die E-Mail-Adresse bestätigen – den Link haben wir Ihnen bei der Registrierung geschickt.',
    notForReception: 'Dieser Zugang ist nicht für die Rezeption freigeschaltet.',
    invalidEmail: 'Bitte eine gültige E-Mail-Adresse angeben.',
    passwordTooShort: 'Das Passwort braucht mindestens {min} Zeichen.',
    houseNameMissing: 'Bitte den Namen des Hauses angeben.',
    yourNameMissing: 'Bitte Ihren Namen angeben.',
    emailTaken: 'Für diese E-Mail-Adresse gibt es bereits ein Konto. Bitte anmelden.',
    accessNotCreated: 'Der Zugang konnte nicht angelegt werden.',
    accountNotCreated: 'Das Konto konnte nicht angelegt werden.',
    signInAfterSignupFailed: 'Das Konto ist angelegt, aber die Anmeldung schlug fehl. Bitte über die Anmeldeseite anmelden.',
    mailNotConfigured: 'Der E-Mail-Versand ist nicht eingerichtet. Bitte an den Betreiber wenden.',
    passwordsDiffer: 'Die beiden Passwörter stimmen nicht überein.',
    sessionExpired: 'Die Sitzung ist abgelaufen. Bitte einen neuen Link anfordern.',
    samePassword: 'Das ist bereits Ihr aktuelles Passwort. Bitte ein anderes wählen.',
    signupClosed: 'Die Anmeldung als Hotel ist derzeit nicht freigeschaltet.',
    inviteCodeWrong: 'Der Einladungscode stimmt nicht.',
    createAccountFailed: 'Das Konto konnte nicht angelegt werden: {detail}',
    createHouseFailed: 'Das Haus konnte nicht angelegt werden: {detail}',
    createProfileFailed: 'Das Profil konnte nicht angelegt werden: {detail}',
    createOwnerFailed: 'Der Inhaber konnte nicht eingetragen werden: {detail}',
  },
}

export type AuthMessages = typeof auth
