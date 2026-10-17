import type { Shape } from '../format'
import type { GuestMessages } from '../de/guest'

/**
 * Guest portal — American English (decision of 17.10.2026). Structure and
 * context of every text: `de/guest.ts` and `de/guest.context.ts`.
 *
 * Tone: polite and plain, the property speaks as “we” (“our property” only
 * where German says „unser Haus“). Typography: “…”, … and a spaced em dash,
 * as on the printed sheet (`en/sheet.ts`). Button labels also appear on the
 * printed sheet — keep them short.
 */
export const guest = {
  brand: {
    portal: 'Guest portal',
    signIn: 'Guest portal — sign in',
  },

  login: {
    room: 'Room {number}',
    roomNumber: 'Room number',
    roomNumberPlaceholder: 'e.g. 101',
    pin: 'PIN',
    submit: 'Sign in',
    submitting: 'Signing in …',
    pinHint: 'You receive your PIN at check-in.',
    linkModeHint:
      'We use personal access links: please scan the QR code on the sheet you received at check-in, or open the link in your email. The form below only applies if you received a PIN at check-in.',
    invalidLink: 'This link is not valid.',
    invalidLinkHint: 'Please contact reception.',
  },

  entry: {
    scanTitle: 'Please scan the QR code in your room.',
    scanText:
      'You can also use the property’s web address — it is on the sheet you received at check-in. Reception is always happy to help.',
    expiredTitle: 'This access is no longer valid.',
    expiredText:
      'The access was valid for one stay and expired at check-out. For a new stay, reception will give you new access — they are always happy to help.',
  },

  status: {
    room: 'Room {number}',
    signOut: 'Sign out',
    inProgress: {
      title: 'Your room is being cleaned right now.',
      text: 'Housekeeping is in your room.',
    },
    scheduled: {
      title: 'Cleaning is planned.',
      text: 'Housekeeping will stop by today.',
    },
    scheduledFrom: {
      title: 'Cleaning today from {time}.',
      guest: 'We got your request — nobody will come before then.',
      door: 'As agreed at the door — nobody will come before then.',
      daily: 'We clean daily. If you don’t need cleaning today, tap “No cleaning today”.',
    },
    dnd: {
      title: 'No cleaning — you don’t want to be disturbed.',
      text: 'Switch off “Do not disturb” if you would like your room cleaned after all.',
    },
    done: {
      title: 'Your room was cleaned today at {time}.',
      text: 'Would you like it cleaned again? Then tap “Clean my room”.',
    },
    declined: {
      title: 'No cleaning today.',
      text: 'Thank you — that saves water and detergent. Changed your mind? Then tap “Clean my room”.',
    },
    departure: {
      title: 'Today is your day of departure.',
      text: 'Your room will be cleaned after check-out. Would you like it cleaned before then? Tap “Clean my room”.',
    },
    none: {
      title: 'No cleaning is planned for today.',
      firstDay: 'From tomorrow, we clean daily from {time}. Would you like cleaning today already? Tap “Clean my room”.',
      onRequest: 'We clean on request — tap “Clean my room” whenever you like.',
    },
  },

  signal: {
    clean: {
      label: 'Clean my room',
      active: 'Request is active — tap again to cancel',
      activeFrom: 'Request is active — not before {time}. Tap again to cancel',
      blocked: 'Not possible right now',
      idle: 'Housekeeping will be notified',
      idleFrom: 'Housekeeping will come no earlier than {time}',
    },
    defer: {
      title: 'Not before',
      now: 'now',
      onlyNow: 'Today, only “now” is still possible.',
      limit:
        'You can postpone cleaning until <b>{limit}</b> at the latest — nobody will come before then. We set this limit so that cleaning can still happen the same day.',
    },
    window:
      'We accept cleaning requests daily between <b>{start}</b> and <b>{end}</b>. Simply tap “Clean my room” again during that time — or contact reception.',
    skip: {
      label: 'No cleaning today',
      active: 'Thank you! Applies to today only — tap again to cancel',
      idle: 'Services still come. Cleaning resumes tomorrow.',
    },
    dnd: {
      label: 'Do not disturb',
      active: 'Active — tap again to switch off',
      idle: 'Nobody knocks — not even for services.',
    },
  },

  services: {
    heading: 'Request a service',
    links: 'Useful links',
    opensExternally: '{host} · opens in a new window',
    orders: 'Your requests',
    notePlaceholder: 'Note (optional)',
    order: 'Order',
    report: 'Report',
    sending: 'Sending …',
    sent: 'Reception has your request.',
    fallbackName: 'Service',
    orderStatus: {
      open: 'open',
      done: 'done',
      cancelled: 'not provided',
    },
  },

  review: {
    hint: 'Did you enjoy your stay?',
    button: {
      google: 'Review us on Google',
      tripadvisor: 'Review us on Tripadvisor',
      booking: 'Review us on Booking.com',
      holidaycheck: 'Review us on HolidayCheck',
      other: 'Write a review',
    },
  },

  thanks: {
    title: 'Thank you for staying with us!',
    text: 'Your stay has ended, and with it your access to the guest portal.',
    review: 'We would be delighted if you left a review — it helps other guests choose.',
    signInAgain: 'New stay? Sign in again',
  },

  errors: {
    loginFailed: 'Sign-in failed — room number or PIN is incorrect.',
    pinFormat: 'Please enter the PIN (digits only).',
    tooManyAttempts: 'Too many failed attempts — please try again in {minutes} min.',
    tooManyFromNetwork: 'Too many failed attempts — please try again in {minutes} min. or contact reception.',
    sessionExpired: 'Your session has expired — please sign in again.',
    invalidSignal: 'Invalid selection.',
    outsideWindow: 'Cleaning requests are only possible between {start} and {end}.',
    deferNotAllowed: 'We don’t offer postponing.',
    deferPast: 'The selected time has already passed.',
    deferTooLate: 'Postponing is only possible until {time}.',
    saveFailed: 'Saving failed — please try again.',
    serviceUnavailable: 'This service is no longer available.',
    serviceIsLink: 'This entry is a link and does not accept requests.',
    pickOption: 'Please select at least one option.',
    sendFailed: 'Your request could not be sent — please try again.',
    onRequestOnly: 'We only clean on request.',
  },
} satisfies Shape<GuestMessages>
