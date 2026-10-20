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
    signIn: 'Guest portal — Sign in',
  },

  login: {
    room: 'Room {number}',
    roomNumber: 'Room number',
    roomNumberPlaceholder: 'e.g. 101',
    pin: 'PIN',
    submit: 'Sign in',
    submitting: 'Signing in …',
    pinHint: 'You’ll receive your PIN at check-in.',
    linkModeHint:
      'We use personal access links. Please scan the QR code on the sheet you received at check-in, or open the link in your email. Use the form below only if you received a PIN at check-in.',
    invalidLink: 'This link is not valid.',
    invalidLinkHint: 'Please contact the front desk.',
  },

  entry: {
    scanTitle: 'Please scan the QR code in your room.',
    scanText:
      'Alternatively, you can use the property’s web address, which is printed on the sheet you received at check-in. The front desk will be happy to help.',
    expiredTitle: 'This access is no longer valid.',
    expiredText:
      'This access was valid for one stay and expired at check-out. For your next stay, the front desk can provide new access and will be happy to help.',
  },

  status: {
    room: 'Room {number}',
    signOut: 'Sign out',
    inProgress: {
      title: 'Your room is being cleaned right now.',
      text: 'Housekeeping is in your room.',
    },
    scheduled: {
      title: 'Cleaning is planned for today.',
      text: 'Housekeeping will stop by today — there’s no fixed time.',
    },
    scheduledFrom: {
      title: 'Cleaning today, not before {time}.',
      guest: 'Your request has been noted — no one will come before then.',
      door: 'As discussed at your door, no one will come before then.',
      daily: 'We clean daily. If you don’t need your room cleaned today, tap “No cleaning today.”',
    },
    dnd: {
      title: 'No cleaning — you don’t want to be disturbed.',
      text: 'Switch off “Do not disturb” if you would like your room cleaned after all.',
    },
    done: {
      title: 'Your room was cleaned today at {time}.',
      text: 'Would you like it cleaned again? Then tap “Clean my room.”',
    },
    declined: {
      title: 'No cleaning today.',
      text: 'Thank you — that saves water and detergent. Changed your mind? Then tap “Clean my room.”',
    },
    departure: {
      title: 'Today is your check-out day.',
      text: 'Your room will be cleaned after check-out. Would you like it cleaned before then? Tap “Clean my room.”',
    },
    none: {
      title: 'No cleaning is planned for today.',
      firstDay: 'Starting tomorrow, we clean daily from {time}. Would you like your room cleaned today? Tap “Clean my room.”',
      firstDayDeparture: 'Tomorrow is your departure day, so your room will be cleaned after check-out. Would you like it cleaned today? Tap “Clean my room.”',
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
      idleFrom: 'Housekeeping will arrive no earlier than {time}',
    },
    defer: {
      title: 'Not before',
      now: 'now',
      onlyNow: 'Only “now” is available for the rest of today.',
      limit:
        'You can postpone cleaning until <b>{limit}</b> at the latest — no one will come before then. This cutoff helps us make sure your room can still be cleaned today.',
    },
    window:
      'We accept cleaning requests daily between <b>{start}</b> and <b>{end}</b>. During those hours, tap “Clean my room” again, or contact the front desk.',
    skip: {
      label: 'No cleaning today',
      active: 'Thank you! Applies to today only — tap again to cancel',
      idle: 'Other services still come to your room. Cleaning will resume tomorrow.',
    },
    dnd: {
      label: 'Do not disturb',
      active: 'Active — tap again to switch off',
      idle: 'No one will knock, including staff delivering other services.',
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
    sent: 'The front desk has received your request.',
    fallbackName: 'Service',
    orderStatus: {
      open: 'open',
      done: 'done',
      cancelled: 'canceled',
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
    text: 'Your stay has ended, and your access to the guest portal has expired.',
    review: 'We’d appreciate a review. It helps other guests choose where to stay.',
    signInAgain: 'New stay? Sign in again',
  },

  errors: {
    loginFailed: 'Sign-in failed — the room number or PIN is incorrect.',
    pinFormat: 'Please enter the PIN (digits only).',
    tooManyAttempts: 'Too many failed attempts — please try again in {minutes} min.',
    tooManyFromNetwork: 'Too many failed attempts — please try again in {minutes} min. or contact the front desk.',
    sessionExpired: 'Your session has expired — please sign in again.',
    invalidSignal: 'Invalid selection.',
    outsideWindow: 'You can submit cleaning requests only between {start} and {end}.',
    deferNotAllowed: 'Postponing cleaning isn’t available at this property.',
    deferPast: 'The selected time has already passed.',
    deferTooLate: 'You can postpone cleaning only until {time}.',
    saveFailed: 'Saving failed — please try again.',
    serviceUnavailable: 'This service is no longer available.',
    serviceIsLink: 'This entry is a link and does not accept requests.',
    pickOption: 'Please select at least one option.',
    sendFailed: 'Your request could not be sent — please try again.',
    onRequestOnly: 'This property offers cleaning on request only.',
  },
} satisfies Shape<GuestMessages>
