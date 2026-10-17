import type { Shape } from '../format'
import type { SymbolsMessages } from '../de/symbols'

/** Room tile symbols — labels and legend texts for the help. American English. */
export const symbols = {
  symbols: {
    deactivated: {
      label: 'Out of service',
      text: 'The room can’t be checked into and doesn’t appear on any housekeeping board. Its history is retained, and you can return it to service under Rooms & floors.',
    },
    occupied: {
      label: 'Occupied',
      text: 'A stay is in progress. The guest has a PIN or a link and can request cleaning, turn on “Do not disturb,” and request services in the portal.',
    },
    departure: {
      label: 'Departure today',
      text: 'The departure date entered at check-in or later is today. Daily cleaning is skipped on this day — the room is cleaned after check-out.',
    },
    dnd: {
      label: 'Do not disturb',
      text: 'The guest enabled this in the portal. No one will knock, daily cleaning is skipped, and the room is grayed out on the housekeeping board. Only the guest can turn this setting off.',
    },
    clean: {
      label: 'Guest requests cleaning',
      text: 'One tap in the portal makes the room appear as open on the housekeeping board, with no appointment. The housekeeping team will clean it when it fits into their rounds.',
    },
    deferred: {
      label: 'Cleaning from HH:MM',
      text: 'The guest either selected a time in the cleaning request or asked the housekeeper at the door to come back later. Until then, the room isn’t available for cleaning to any housekeeper. It becomes available automatically at the specified time.',
    },
    declined: {
      label: 'No cleaning today',
      text: 'The guest skips cleaning for today, either by tapping the button in the portal or by telling the housekeeper at the door. Today’s daily cleaning is skipped and doesn’t count as a completed cleaning; daily cleaning resumes tomorrow. If the guest later taps “Clean my room,” the room becomes available immediately.',
    },
    routine: {
      label: 'Daily cleaning due',
      text: 'Only if the property cleans occupied rooms daily (under Property & rules): cleaning becomes available from the second night, starting at the configured time. If no departure date is set, it won’t become available before the check-out time. This applies only if the room hasn’t been cleaned today and “Do not disturb” isn’t on.',
    },
    checkout: {
      label: 'Checked out — cleaning open',
      text: 'The guest has checked out and the room hasn’t been cleaned yet. It stays open until a housekeeper finishes or the front desk marks the cleaning as done.',
    },
    priority: {
      label: 'Prioritized',
      text: 'Set manually by the front desk for complaints or special cases. The room moves up the housekeeping board, and the floor displays a purple warning light. This is never automatic.',
    },
    cleaning: {
      label: 'Cleaning in progress',
      text: 'A housekeeper has moved the start slider, and their name appears in the room. If they forget to mark the cleaning complete, the room automatically reopens after the time limit.',
    },
    orders: {
      label: 'Open service request',
      text: 'The guest has made a request that hasn’t been marked complete. Requests appear under “Requests” in the navigation; mark them complete there or in the room dialog.',
    },
    urgent: {
      label: 'Urgent service request',
      text: 'At least one open request is for a service marked “urgent” in the service builder. The bell, ring, and navigation count flash red until the request is marked complete.',
    },
  },
  bars: {
    priority: {
      label: 'Prioritized',
      text: 'Overrides all other states. As long as the priority is active, the bar stays purple — even after check-out.',
    },
    working: {
      label: 'In progress',
      text: 'Only on the housekeeping board: a team member is currently in the room. On the front desk screen, this is shown only by the spinner; the bar keeps its color.',
    },
    checkout: {
      label: 'Checked out',
      text: 'Cleaning after check-out open.',
    },
    wanted: {
      label: 'Cleaning requested or daily cleaning due',
      text: 'The guest has requested cleaning, or the property’s daily cleaning is due. A postponed request (“from HH:MM”) changes the bar’s color only at the specified time.',
    },
    dnd: {
      label: '“Do not disturb”',
      text: 'Occupied, and the guest doesn’t want to be disturbed.',
    },
    occupied: {
      label: 'Occupied',
      text: 'Stay running, nothing to do.',
    },
    ready: {
      label: 'Vacant & ready',
      text: 'Vacant and cleaned — check-in is one click.',
    },
    neutral: {
      label: 'No task',
      text: 'Only on the housekeeping board: vacant, occupied with no request, “Do not disturb,” or a request scheduled for later. The room remains visible but grayed out — it isn’t blocked.',
    },
    deactivated: {
      label: 'Out of service',
      text: 'Dashed border, faded tile. No check-in possible.',
    },
  },
  rings: {
    urgent: {
      label: 'Red flashing border',
      text: 'Urgent service request. Beats the purple ring; the priority stays visible via bar and flag.',
    },
    priority: {
      label: 'Purple flashing border',
      text: 'Prioritized cleaning, as long as there’s no urgent request.',
    },
  },
} satisfies Shape<SymbolsMessages>
