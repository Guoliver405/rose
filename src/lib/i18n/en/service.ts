import type { Shape } from '../format'
import type { ServiceMessages } from '../de/service'

/**
 * Housekeeping board — American English (17.10.2026). Structure and context
 * of every text: `de/service.ts` and `de/service.context.ts`.
 *
 * Tone: friendly and short — read on a phone between two rooms. Terms match
 * the guest portal (“Do not disturb,” “No cleaning today,” “front desk”).
 * Room tiles are narrow: state labels stay at two or three words.
 */
export const service = {
  brand: {
    board: 'Housekeeping board',
    boardOf: 'Housekeeping board · {hotel}',
  },

  common: {
    signOut: 'Sign out',
    floor: 'Floor {floor}',
    floorInBuilding: '{building} · Floor {floor}',
    room: 'Room {number}',
    someone: 'Someone from the team',
    close: 'Close',
  },

  board: {
    youClean: 'You’re cleaning {number}',
    onBreak: 'Break',
    onOther: 'Other cleaning',
    onShift: 'On shift',
    onShiftSince: 'On shift since {time}',
    offShift: 'Not on shift',
    openCount: '{count} open',
    inProgressCount: '{count} in progress',
    priorityOpenTitle: 'Priority cleaning open: {floors}',
    priorityOpen: 'Priority open',
    statusLink: 'Status',
    offShiftHint: 'You’re not on shift — you can start cleaning once your shift has started (“Status” button).',

    backToFloors: 'Back to all floors',
    nothingOpen: 'nothing open',
    done: 'done',
    next: 'Up next',
    prio: 'Prio',
    switchPriority: 'Priority room on {floor} — switch?',
    switchDepartures: {
      one: 'One departure is waiting on {floor} — check-in is getting closer. Switch?',
      other: '{count} departures are waiting on {floor} — check-in is getting closer. Switch?',
    },
    switchLoad: 'There’s a lot more to do on {floor} — switch?',
    switchTo: 'Switch to {floor}',

    youAreCleaning: 'You’re cleaning this room',
    youAreHere: 'You’re here',
    someoneCleaning: '{name} is cleaning',
    stale: 'Forgot to finish?',
    state: {
      priority: 'Priority',
      checkout: 'Checked out',
      wanted: 'Cleaning requested',
      from: 'Cleaning from {time}',
      dndLifted: '“Do not disturb” lifted {time}',
      daily: 'Daily cleaning',
      declined: 'No cleaning today',
      dnd: 'Do not disturb',
      departureToday: 'Departure today',
      occupied: 'Occupied',
      vacant: 'Vacant',
    },

    finish: 'Finish cleaning',
    abort: 'Stop cleaning (room remains pending)',
    start: 'Start cleaning',
    otherInRoom: '{name} is in this room right now.',
    staleNamed: '{name}’s cleaning apparently wasn’t finished — the room counts as open again.',
    staleUnnamed: 'A cleaning apparently wasn’t finished — the room counts as open again.',
    door: {
      question: 'Guest is in the room and doesn’t want cleaning right now?',
      in30: 'In 30 min',
      in60: 'In 1 hr',
      today: 'Not today',
      hint: '“In 30 min” and “In 1 hr” take the room off the board for everyone until then. “Not today” settles it for today — if the guest still wants cleaning, they can tap it in the portal.',
    },
    startShiftFirst: 'Start your shift first, then you can start here.',
    busyElsewhere: 'You’re still in another room — finish or cancel there first.',
    guestDnd: 'The guest doesn’t want to be disturbed.',
    deferredUntil: 'Cleaning not before {time} — the room opens up again on its own.',
    guestDeclined: 'The guest doesn’t want cleaning today.',
    nothingToDo: 'No cleaning is open for this room.',
  },

  status: {
    back: 'Board',
    title: 'My status',
    youCleanRoom: 'You’re cleaning room {number}',
    onBreak: 'Break',
    onOther: 'Other cleaning in progress',
    onShift: 'On shift',
    offShift: 'Not on shift',
    since: 'since {time}',
    shiftSince: 'Shift since {time}',
    workToday: 'Work time today',
    breakToday: 'Break today',
    roomsToday: 'Rooms today',
    otherCleaning: 'Other cleaning',
    change: 'Change status',
    shiftStart: 'Start shift',
    shiftEnd: 'End shift',
    breakStart: 'Start break',
    breakEnd: 'End break',
    otherStart: 'Start other cleaning',
    otherEnd: 'End other cleaning',
    endBreakFirst: 'End your break first — activities can’t overlap.',
    roomStillOpen: 'Room {number} is still open — finish or cancel it on the board first.',
    otherEndsWithShift: 'Other cleaning in progress ends automatically when your shift ends.',
    saving: 'saving …',
    teamMode:
      'This property only evaluates cleaning as a team. You can see your daily summary during your shift; when your shift ends, your entries are saved without your name.',
  },

  login: {
    username: 'Username',
    usernamePlaceholder: 'username',
    usernameHint: 'The short username from your access card (after the @), not your display name.',
    pin: 'PIN',
    submit: 'Sign in',
    lostCard: 'Lost your access card with the QR code? The front desk can print a new one at any time.',
    invalid:
      'Username or PIN is incorrect. The username is the short name from your access card (after the @), not your display name.',
    missing: 'Please fill in all fields.',
    cardInvalid: 'This QR code is no longer valid. Please sign in with your username and PIN, or get a new card from the front desk.',
    deactivated: 'This access is no longer active. Please contact the front desk.',
    cardInvalidNoHouse: 'This QR code is no longer valid. Please get a new access card from the front desk.',
    scanTitle: 'Please scan your access card.',
    scanText:
      'To sign in with your username and PIN, you need your property’s web address — it’s on your access card. The front desk can print a new card at any time.',
  },

  errors: {
    notSignedIn: 'Not signed in.',
    shiftRunning: 'Your shift is already running.',
    noShift: 'No shift running.',
    finishCleaningFirst: 'Finish (or cancel) the current cleaning first.',
    invalidFloor: 'Invalid floor.',
    startShiftFirst: 'Start your shift first.',
    breakOnlyOnShift: 'Breaks only during your shift.',
    onlyOnShift: 'Only during your shift.',
    endBreakFirst: 'End your break first.',
    alreadyCleaning: 'A cleaning is already running — finish or cancel it first.',
    roomNotFound: 'Room not found.',
    guestDnd: 'The guest doesn’t want to be disturbed.',
    guestDeferred: 'Cleaning not before {time} — the room opens up again on its own.',
    nothingOpen: 'No cleaning is open for this room.',
    nothingOpenNow: 'No cleaning is open for this room right now.',
    takenByOther: 'Someone from the team is already cleaning this room.',
    justTaken: 'Someone from the team just took this room.',
    notYours: 'This cleaning isn’t under your name.',
    unknownChoice: 'Unknown choice.',
    saveFailed: 'Saving failed: {message}',
    enterFloorFailed: 'Couldn’t check in to the floor: {message}',
  },
} satisfies Shape<ServiceMessages>
