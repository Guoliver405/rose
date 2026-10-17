import type { Shape } from '../../format'
import type { SimMessages } from '../../de/help/sim'

/**
 * Help — replicas of the housekeeping board and the guest portal. Buttons and
 * status lines come from `service.ts` and `guest.ts`; here only what the real
 * portals don’t have: page header, explanations, example values. American English.
 */
export const sim = {
  house: 'Alpine View House',

  frame: {
    badge: 'Replica',
  },

  reinigung: {
    page: {
      title: 'The housekeeping board',
      intro:
        'This is the board your housekeepers use on their phones. It’s a replica with example rooms — nothing is saved here and nobody is notified. Feel free to try everything; the guide restores the matching view for each step.',
      why:
        'Why a replica and not a tour of the real board? The housekeeping board has its own sign-in and its own session — it can’t be reached from the front desk. If you want to see the real thing, sign in at <code>{path}</code> with a housekeeper’s account.',
    },
    frame: {
      login: 'Housekeeping — sign in',
      status: 'Housekeeping — my status',
    },
    scanCard: 'Scan access card',
    or: 'or',
    withinShift: 'Breaks and other cleaning happen within the shift.',
    nothingToDo: 'nothing to do',
    noTask: 'No cleaning is open for this room — it isn’t blocked, there’s just nothing to do right now.',
  },

  gast: {
    page: {
      title: 'What the guest sees',
      intro:
        'The guest portal as it looks on your guest’s phone. A replica with example values — property, room and services don’t come from your data, so the view shows something even before anything is set up. None of it is saved.',
      differs:
        'Your own texts differ in two places: which services appear is set in the service builder, and whether “not before” is offered at all — including the limit — is set under Property & rules.',
    },
    frame: {
      portal: 'Guest portal — phone',
    },
    scanned: 'Room sign scanned — now just the PIN from the check-in sheet.',
    otherMode: 'With the other method, this step is skipped: the personal link opens the guest portal directly.',
    onlyDaily: 'This button exists only in properties with daily cleaning.',
    services: {
      towels: { name: 'Extra towels', meta: 'free of charge' },
      breakfast: { name: 'Breakfast in the room', meta: '€14.50' },
      technician: { name: 'Maintenance', meta: 'urgent' },
    },
    requested: 'requested',
    openRequests: {
      one: 'One request is open — the front desk is on it.',
      other: '{count} requests are open — the front desk is on it.',
    },
    noRequests: 'No open requests. The access expires on its own at check-out.',
  },
} satisfies Shape<SimMessages>
