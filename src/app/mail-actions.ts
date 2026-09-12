'use server'

import { mailStatus, type MailStatusView } from '@/utils/mail'

/**
 * Stand einer verschickten Mail — das, was die Oberfläche nach dem Senden
 * eine Minute lang nachfragt (`useMailDispatch`).
 *
 * Bewusst ohne Sitzungsprüfung: Die Zeilen-ID ist eine unratbare UUID, die
 * nur derjenige kennt, der den Versand ausgelöst hat — und die Antwort trägt
 * keine Adresse, nur Status und Grund. Eine Rollenprüfung müsste drei
 * Auth-Welten unterscheiden (Verwaltung, Rezeption, die öffentliche
 * Passwort-Seite) für eine Information, die der Aufrufer ohnehin selbst
 * erzeugt hat.
 */
export async function getMailStatusAction(logId: string): Promise<MailStatusView | null> {
  if (!/^[0-9a-f-]{36}$/i.test(logId)) return null
  return mailStatus(logId)
}
