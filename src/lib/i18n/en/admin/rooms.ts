import type { Shape } from '../../format'
import type { rooms as de } from '../../de/admin/rooms'

/** Front desk — room setup: create, edit and delete rooms, floors and buildings. American English. */
export const rooms = {
  page: {
    title: 'Manage rooms',
  },

  create: {
    heading: 'Add rooms',
    modeAria: 'Creation mode',
    modeIndividual: 'Floors individually',
    modeIdentical: 'Identical floors',
    modeIndividualHint: 'Room numbers apply to the one floor given.',
    modeIdenticalHint: 'The same range of numbers is created on every floor given.',
    buildingLabel: 'Building (optional)',
    buildingPlaceholder: 'e.g. Main building',
    floorLabel: 'Floor',
    floorsLabel: 'Floors — comma list or range',
    floorsPlaceholder: 'e.g. 1-3',
    numbersLabelIndividual: 'Room numbers — single, comma list, or range',
    numbersLabelIdentical: 'Room numbers per floor — single, comma list, or range',
    numbersPlaceholderIndividual: 'e.g. 101-110 or 201, 202, 205',
    numbersPlaceholderIdentical: 'e.g. 01-10',
    prefixFloor: 'Prefix the floor number (floor 2 + “05” → “205”)',
    collisionWarning:
      'Without a floor prefix, the same number can’t exist on several floors — room numbers are unique per building. Only the first floor would be created.',
    planned: {
      one: '{count} room will be created: {list}',
      other: '{count} rooms will be created: {list}',
    },
    plannedMore: '{list} … (+{more})',
    submit: 'Create',
    submitting: 'Creating …',
    created: {
      one: '{count} room created.',
      other: '{count} rooms created.',
    },
    createdSkipped: {
      one: '{count} room created, {skipped} skipped (number already existed).',
      other: '{count} rooms created, {skipped} skipped (number already existed).',
    },
    errors: {
      invalidFloors: 'Please enter valid floor(s).',
    },
  },

  list: {
    empty: 'No rooms yet.',
    intro:
      'Click a room, floor, or building to <b>edit</b> it, <b>take it out of service</b>, or <b>delete</b> it. A typo? Editing changes number, floor, and building without losing anything.',
    noBuilding: 'No building',
    floor: 'Floor {floor}',
    room: 'Room {number}',
    roomCount: {
      one: '{count} room',
      other: '{count} rooms',
    },
    buildingSubtitle: {
      one: '{rooms} rooms on {count} floor',
      other: '{rooms} rooms on {count} floors',
    },
    separator: ' · ',
    deactivatedCount: '{count} out of service',
    occupiedCount: '{count} occupied',
    deactivatedTitle: 'Out of service',
    occupiedAria: 'occupied',
    deactivatedAria: 'out of service',
  },

  dialog: {
    editHintRoom: 'Correct number, floor, or building — nothing is lost',
    editHintFloor: 'Move the floor or change the building — nothing is lost',
    editHintBuilding: 'Rename the building — nothing is lost',
    deactivate: 'Take out of service',
    deactivateHint: 'Disappears from boards and room signs, history stays complete',
    reactivate: 'Put back into service',
    reactivateHint: {
      one: 'Bring back {count} room',
      other: 'Bring back {count} rooms',
    },
    deleteForever: 'Delete permanently',
    deleteHint: 'With all stays and records — can’t be undone',
    deleting: 'Deleting …',

    roomNumber: 'Room number',
    floor: 'Floor',
    buildingOrNone: 'Building (empty = none)',
    buildingPlaceholder: 'e.g. Main building',
    appliesToAll: {
      one: 'Applies to the {count} room in this section.',
      other: 'Applies to all {count} rooms in this section.',
    },
    reprintWarning:
      'The QR codes stay valid — they belong to the room, not the number. Room signs and check-in sheets that were already <b>printed</b> show the old label, though, and should be reprinted.',

    checkingImpact: 'Checking the impact …',
    occupiedBlocks: {
      one: 'The room is occupied and can’t be deleted — please check out first.',
      other: '{count} rooms are occupied and can’t be deleted — please check out first.',
    },
    confirmLabel: 'Type “{phrase}” to confirm',
    deactivateInstead: 'Take out of service instead — the history is kept',

    reactivated: {
      one: '{count} room back in service.',
      other: '{count} rooms back in service.',
    },
    deactivated: {
      one: '{count} room out of service — history is kept.',
      other: '{count} rooms out of service — history is kept.',
    },
    deactivatedSkipped: {
      one: '{count} room out of service, {skipped} occupied skipped — history is kept.',
      other: '{count} rooms out of service, {skipped} occupied skipped — history is kept.',
    },
    noChange: 'No change — everything was already set like this.',
    edited: {
      one: '{count} room changed.',
      other: '{count} rooms changed.',
    },
    deleted: {
      one: '{label} deleted ({count} room).',
      other: '{label} deleted ({count} rooms).',
    },
    errors: {
      invalidFloor: 'Please enter a valid floor.',
    },
  },

  impact: {
    rooms: {
      one: '{count} room',
      other: '{count} rooms',
    },
    stays: {
      one: '{count} stay',
      other: '{count} stays',
    },
    ordersOpen: {
      one: '{count} open service request',
      other: '{count} open service requests',
    },
    ordersDone: {
      one: '{count} completed service request',
      other: '{count} completed service requests',
    },
    ordersDoneAmount: {
      one: '{count} completed service request ({amount})',
      other: '{count} completed service requests ({amount})',
    },
    transitions: {
      one: '{count} room history entry',
      other: '{count} room history entries',
    },
    qrPosters: {
      one: '{count} QR code — printed room signs stop working',
      other: '{count} QR codes — printed room signs stop working',
    },
    neverUsed: 'Never used — no data is lost by deleting.',
    willBeDeleted: 'This will be permanently deleted as well:',
    cleaningLogsKept: {
      one: '{count} housekeeping entry is <b>kept</b> — the work times in the reports only lose the room reference.',
      other: '{count} housekeeping entries are <b>kept</b> — the work times in the reports only lose the room reference.',
    },
  },

  scope: {
    room: 'Room {number}',
    floor: 'Floor {floor}',
    floorInBuilding: '{building} · Floor {floor}',
    unnamedBuilding: 'Rooms without a building',
    confirmFloor: 'Floor {floor}',
    confirmUnnamedBuilding: 'DELETE',
  },

  errors: {
    noRoomNumbers: 'No room numbers given.',
    invalidFloor: 'Invalid floor.',
    tooMany: '{max} rooms max. per operation.',
    createFailed: 'Creating failed: {message}',
    roomStatesFailed: 'Creating the room status failed: {message}',
    loadFailed: 'Loading failed: {message}',
    roomOccupied: 'The room is occupied — please check out first.',
    roomsOccupied: {
      one: '{count} room is occupied — please check out first.',
      other: '{count} rooms are occupied — please check out first.',
    },
    noRoomsFound: '{label}: no rooms found.',
    numberEmpty: 'The room number can’t be empty.',
    numberTooLong: 'The room number is too long ({max} characters max.).',
    numberSingleOnly: 'A room number can only be assigned individually.',
    buildingTooLong: 'The building name is too long ({max} characters max.).',
    nothingToChange: 'Nothing to change.',
    numberTakenInBuilding: 'Room number {number} is already taken in building “{building}” (floor {floor}).',
    numberTakenNoBuilding: 'Room number {number} is already taken without a building (floor {floor}).',
    numberDuplicate: 'Room number {number} would appear twice — numbers are unique per building.',
    editFailed: 'Change failed: {message}',
    noRoomsInScope: 'No rooms in this section.',
    confirmMismatch: 'Please type “{phrase}” to confirm.',
    snapshotFailed: 'The billing record couldn’t be saved: {message}',
    historyDeleteFailed: 'Deleting the history failed: {message}',
    deleteFailed: 'Deleting failed: {message}',
  },
} satisfies Shape<typeof de>
