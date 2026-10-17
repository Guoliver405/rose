import type { Shape } from '../format'
import type { SymbolsMessages } from '../de/symbols'

/** Room tile symbols — labels and legend texts for the help. American English. */
export const symbols = {
  symbols: {
    deactivated: {
      label: 'Out of service',
      text: 'The room accepts no check-in and appears on no housekeeping board. It keeps its history and can be put back into service under Rooms & floors.',
    },
    occupied: {
      label: 'Occupied',
      text: 'A stay is running. The guest has a PIN or a link and can request cleaning, set “Do not disturb” and request services in the portal.',
    },
    departure: {
      label: 'Departure today',
      text: 'The departure date entered at check-in or later is today. Daily cleaning is skipped on this day — the room is cleaned after check-out.',
    },
    dnd: {
      label: 'Do not disturb',
      text: 'The guest set it in the portal. Nobody knocks, daily cleaning is skipped, and the room is grayed out on the housekeeping board. Only the guest can switch it off.',
    },
    clean: {
      label: 'Guest requests cleaning',
      text: 'One tap in the portal. The room immediately appears as open on the housekeeping board — no appointment; the housekeeping team comes when it fits into the round.',
    },
    deferred: {
      label: 'Cleaning from HH:MM',
      text: 'Not before a certain time: the guest chose this with the cleaning request, or told the housekeeper at the door “later, please”. Until then, the room counts as not open for all housekeepers; at that time it opens up again on its own.',
    },
    declined: {
      label: 'No cleaning today',
      text: 'The guest skips cleaning today — via the button in the portal or by telling the housekeeper at the door. Daily cleaning is skipped today and it doesn’t count as a cleaning; tomorrow it applies again. If the guest taps “Clean my room” after all, the room is open again immediately.',
    },
    routine: {
      label: 'Daily cleaning due',
      text: 'Only if the property cleans occupied rooms daily (Property & rules): from the second night and from the set time — without a departure date no earlier than the check-out time —, as long as the room hasn’t been cleaned today and there’s no “Do not disturb”.',
    },
    checkout: {
      label: 'Checked out — cleaning open',
      text: 'The guest has checked out and the room hasn’t been cleaned yet. It stays open until a housekeeper finishes or the front desk marks the cleaning as done.',
    },
    priority: {
      label: 'Prioritized',
      text: 'Set manually by the front desk — for complaints and special cases. The room moves up on the housekeeping board and the floor shows a purple warning light. Never automatic.',
    },
    cleaning: {
      label: 'Cleaning in progress',
      text: 'A housekeeper has pulled the start slider; their name appears in the room. If finishing is forgotten, the room reopens on its own after the time limit.',
    },
    orders: {
      label: 'Open service request',
      text: 'The guest requested something nobody has checked off yet. Requests are under “Requests” in the navigation; check them off there or in the room dialog.',
    },
    urgent: {
      label: 'Urgent service request',
      text: 'At least one open request concerns a service marked “urgent” in the builder. Bell, ring and the number in the navigation flash red until it’s checked off.',
    },
  },
  bars: {
    priority: {
      label: 'Prioritized',
      text: 'Beats everything else. As long as the priority stands, the bar is purple — even for a checked-out room.',
    },
    working: {
      label: 'In progress',
      text: 'Only on the housekeeping board: someone from the team is in the room right now. At the front desk, only the spinner shows this; the bar keeps its color.',
    },
    checkout: {
      label: 'Checked out',
      text: 'Cleaning after check-out open.',
    },
    wanted: {
      label: 'Cleaning requested or daily cleaning due',
      text: 'The guest tapped, or the property’s daily cleaning is due. A postponed request (“from HH:MM”) only colors the bar at that time.',
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
      text: 'Only on the housekeeping board: vacant, occupied without a request, “Do not disturb”, or a request that applies only later. Visible but grayed out — not blocked.',
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
