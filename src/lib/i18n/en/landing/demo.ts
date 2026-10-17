import type { Shape } from '../../format'
import type { LandingMessages } from '../../de/landing'

/** Interactive product preview (`LiveDemo`) in American English — labels as in the real portals. */
export const demo = {
  hotel: 'Alpine View Hotel',
  maid: 'Maria',

  services: {
    towels: { name: 'Extra towels', meta: 'free of charge' },
    breakfast: { name: 'Breakfast in the room', meta: '€14.50' },
    repair: { name: 'Maintenance', meta: 'urgent' },
  },

  events: {
    initial: 'Starting point: room 202 is free and ready.',
    checkin: 'Check-in room {nr}: stay created, PIN {pin}.',
    checkout: 'Check-out room {nr}: access expired, cleaning after check-out open.',
    signal: 'Guest in {nr}: {label}.',
    signalClean: 'cleaning requested',
    signalDnd: 'Do not disturb',
    signalNone: 'request withdrawn',
    order: 'Guest in {nr} requests “{name}.”',
    report: 'Guest in {nr} reports “{name}” — urgent.',
    orderDone: 'Front desk: request from {nr} completed.',
    priorityOn: 'Front desk: room {nr} prioritized.',
    priorityOff: 'Front desk: room {nr} no longer prioritized.',
    start: '{maid} starts cleaning {nr}.',
    finish: '{maid} has finished {nr} — room ready.',
  },

  tone: {
    priority: 'prioritized',
    checkedOut: 'checked out',
    wants: 'cleaning requested',
    dnd: 'Do not disturb',
    occupied: 'occupied',
    ready: 'ready',
  },

  story: {
    checkin: {
      who: 'Front desk',
      title: 'One-click check-in',
      text: 'One click on room {nr} — RoSe creates the anonymous stay and shows the PIN.',
    },
    access: {
      who: 'Guest',
      title: 'Access in hand',
      text: 'PIN on the check-in sheet, a room sign, or a link by email — no account, no app.',
    },
    tap: {
      who: 'Guest',
      title: 'One tap in the room',
      text: '“Clean my room” — that’s all it takes.',
    },
    visible: {
      who: 'Front desk',
      title: 'Visible right away',
      text: 'The tile turns amber; a request brings the bell and the counter.',
    },
    board: {
      who: 'Housekeeping',
      title: 'Targeted and coordinated',
      text: '{maid} starts with a swipe and finishes — the front desk sees green.',
    },
  },

  head: {
    step: 'Step {step} of {total} · {who}',
    ended: 'Done — now try it yourself.',
    tryIt: 'Try it out.',
    hint: 'Tap in the guest portal, click at the front desk, swipe on the board.',
    free: 'Try it yourself',
    play: 'Play the story',
    reset: 'Reset',
  },

  reception: {
    title: 'Front desk – overview',
    badge: 'Requests {count}',
    floor: 'Floor 2',
    counts: '{open} open · {inWork} in progress',
    checkin: 'Check-in {nr}',
    checkout: 'Check-out {nr}',
    priority: 'Prio {nr}',
    stay: 'Stay {nr}',
    pin: 'PIN {pin}',
    done: 'Done',
  },

  guest: {
    frame: 'Guest portal – phone',
    room: 'Room {nr}',
    noStay: 'No stay yet — the access is created at check-in at the front desk.',
    checkin: 'Check in at the front desk',
    sheet: 'Check-in sheet: QR + PIN {pin}',
    clean: 'Clean my room',
    dnd: 'Do not disturb',
    services: 'Services',
    order: 'Order',
    report: 'Report',
    openRequests: { one: '{count} request open', other: '{count} requests open' },
  },

  board: {
    title: 'Housekeeping board',
    floor: 'Floor 2',
    next: 'Up next · {count} open',
    inWork: '{count} in progress',
    allDone: 'all done',
    empty: 'No open cleaning on this floor.',
    room: 'Room {nr}',
    maidIn: '{maid} in {nr}',
    finish: 'Finish cleaning',
    start: 'Start cleaning',
  },

  tile: {
    cleaning: 'being cleaned',
    request: 'Service request',
  },
} satisfies Shape<LandingMessages['demo']>
