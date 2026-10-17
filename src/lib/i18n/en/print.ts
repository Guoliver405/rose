import type { Shape } from '../format'
import type { PrintMessages } from '../de/print'

/**
 * Front desk print pages — American English: controls around the check-in
 * sheet, room signs and access card, plus the check-out statement. The
 * printed guest sheet itself lives in `sheet.ts` (own languages per property).
 */
export const print = {
  backToOverview: 'Back to overview',

  checkinSheet: {
    notOccupied: 'Room {number} isn’t occupied right now — check in first, then print the check-in sheet.',
    formatA4: 'A4 — folder, stand, frame',
    formatCompact: 'Compact — to hand out',
    printA4: 'Print check-in sheet (A4)',
    printCompact: 'Print check-in sheet (compact)',
    mailTitle: 'Send by email instead',
    mailPlaceholder: 'address@example.com',
    send: 'Send',
    mailHint:
      'The address is <b>not stored</b> — it’s only used for this email. The email goes out in the property’s first language; pictograms and the second language appear only on the printout.',
    release: 'Unblock address and resend',
    orPrint: 'Or: print the check-in sheet — it carries the same access.',
    mailNotConfigured:
      'Sending by email isn’t set up — it requires <code>RESEND_API_KEY</code> and <code>GUEST_MAIL_FROM</code> in the environment variables.',
  },

  roomSigns: {
    backToGuestAccess: 'Back to guest access',
    backToSettings: 'Back to settings',
    linkModeWarning:
      'This property uses personal access per stay. The room signs lead to a PIN entry that new guests can’t use — they don’t belong in the rooms while this method applies.',
    title: 'Room signs',
    createMissing: {
      one: 'Create one missing QR code',
      other: 'Create {count} missing QR codes',
    },
    formatA4: 'A4 — one page per room',
    formatCompact: 'Compact — four per page',
    printAll: {
      one: 'Print all (1 page)',
      other: 'Print all ({count} pages)',
    },
    hint:
      'Print once, place in the room, hang it up or put it in the folder — the guest scans and only types the PIN they receive at check-in. The compact format can be cut apart. A new code makes the room’s old sign stop working.',
    noRooms: 'No rooms set up yet.',
    allHaveCodes: 'All rooms already have a QR code.',
    created: {
      one: 'One QR code created.',
      other: '{count} QR codes created.',
    },
    renewed: 'New QR code for room {number} — the old sign no longer works.',
    noCode: 'Room {number}: no QR code yet — create it above.',
    renew: 'Renew code',
    errors: {
      notSignedIn: 'Not signed in.',
      noPermission: 'No permission.',
      roomNotFound: 'Room not found.',
    },
  },

  accessCard: {
    back: 'Back to staff',
    title: 'Housekeeping access card',
    scan: 'Scan QR → signed in automatically',
    qrAlt: 'QR code to the housekeeping board',
    manual: 'Manual sign-in → credentials',
    username: 'Username',
    pin: 'PIN',
    address: 'Address: {url}',
    help:
      'Scan the QR code with the tablet, or enter username and PIN at the address above — the username is <code>{username}</code>, not the name at the top of the card. Keep this card confidential — it opens the housekeeping board without further confirmation.',
    target: 'QR destination: {url}',
    print: 'Print card',
  },

  statement: {
    title: 'Statement of extra services',
    room: 'Room',
    arrival: 'Arrival',
    departure: 'Departure',
    stayRunning: 'Stay in progress',
    created: 'Created',
    none: 'No paid extra services were used during this stay.',
    service: 'Service',
    ordered: 'Ordered',
    done: 'Done',
    amount: 'Amount',
    openNotCharged: 'open — not charged',
    notProvidedNotCharged: 'not provided — not charged',
    total: 'Total',
    excludedNote: 'Services that weren’t provided or are still open are marked and not included in the total.',
    footer:
      'This statement is <b>not an invoice</b> and not a tax document. It lists only the extra services for this room ordered via the guest portal; accommodation, other items and invoicing are handled in the property’s own system.',
    print: 'Print statement',
  },
} satisfies Shape<PrintMessages>
