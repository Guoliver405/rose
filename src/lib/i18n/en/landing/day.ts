import type { Shape } from '../../format'
import type { LandingMessages } from '../../de/landing'

/**
 * Day view (`CleaningSimulation`) in American English — used by the simulator.
 * The landing page itself is still German; `caption` is translated for completeness.
 */
export const day = {
  titles: { paper: 'Without coordination', rose: 'With RoSe' },

  lead: {
    paper: {
      routine: 'Paper list per floor. No one knows when guests check out; what hangs on the doors and what a guest has said is only known to whoever comes to the floor.',
      onDemand: 'Paper list and “Please clean” door hangers — visible only to whoever is standing in the hallway.',
    },
    rose: {
      routine: 'Shared board: check-out, request, “not before,” “Do not disturb,” and “later” — immediately for everyone.',
      onDemand: 'Guests tap “Clean my room” or “not before” — immediately on the board, for everyone.',
    },
  },

  policy: {
    label: 'Clean stayover rooms:',
    aria: 'Cleaning of stayover rooms',
    routine: 'daily',
    onDemand: 'on request only',
    note: 'applies to both views — only coordination is compared',
  },

  controls: {
    pause: 'Pause',
    again: 'Play again',
    play: 'Play',
    reset: 'Back to {time}',
    minuteBack: 'One minute back',
    minuteForward: 'One minute forward',
    minute: '1 min',
    clock: 'Time',
  },

  legend: {
    states: {
      occupied: 'Guest in the room',
      departed: 'checked out',
      wants: 'Guest out, cleaning open',
      dnd: 'Do not disturb',
      declined: 'declined — no cleaning today',
      deferred: '“not before” — known as a time with RoSe',
      skipped: 'no cleaning wanted',
      empty: 'empty',
      cleaning: 'being cleaned',
      done: 'done',
    },
    later: 'Guest still in — “later” (without software, only whoever knocked knows)',
    repeat: 'knocks again, although someone on the team already heard',
    priority: 'Special case (prioritized)',
    maids: 'Housekeeper {range}',
    idle: 'waiting — nothing to do right now',
    search: 'walks the floors looking for work',
  },

  panel: {
    floorSuffix: '',
    departuresReady: 'Departures ready',
    status: 'All done <b>{time}</b> · wasted trips to the door <b>{count}×</b>',
  },

  activity: {
    now: 'Now: ',
    nobody: 'no one out yet',
    item: '<b>{count}</b> {label}',
    labels: {
      clean: 'cleaning',
      door: 'at the door',
      walk: 'on the way',
      search: 'looking for work',
      radio: 'on the radio',
      idle: 'waiting',
      done: 'done',
    },
    totals: 'So far at the door <b>{door} min</b> · waited <b>{idle} min</b>',
    totalsSearch: 'So far at the door <b>{door} min</b> · waited <b>{idle} min</b> · searched floors <b>{search} min</b>',
  },

  later: {
    title: '{nr}: guest still in, “later” — {who}',
    all: 'everyone knows',
    one: 'only housekeeper {name} knows',
  },

  caption: 'Without coordination shows a typical conventional process: paper list from the morning, assigned floors per housekeeper, departures first as soon as the list shows them as free. Other processes — such as check-outs radioed by the front desk or freely chosen floors — are compared in the <link>Housekeeping Simulator</link>, with your property’s numbers. A typical day: the median of 101 days calculated, measured by how much earlier departures are ready in both positions of the switch. {rooms} rooms on {floors} floors, {maids} housekeepers from 8:00 (without software, two assigned floors each), check-out until 11:00, check-in from 15:00. The same guests in both views: they check out or leave their rooms between 7:00 and 11:00, evenly spread — the later it is, the more likely knocking pays off. Daily: stayover rooms in both views from 8:00, without software according to the list, with RoSe via the departure date entered at check-in. Assumptions about guest behavior: {signals}% of guests who want cleaning show it when leaving (on request: all), {notBefore}% give a “not before” time in RoSe, {dnd}% have “Do not disturb” on the door in the morning, a third of them all day. Without software, a housekeeper only sees hangers and signs once on the floor; what a guest says at the door goes on a list that stays on the floor — whoever comes there reads it (2 min), whoever helps out asks the team. With RoSe, all of this is on the board immediately, for everyone. Changing floors with a cart: 5 min. Cleaning times as an assumption, rather tight: departure rooms 30 min, stayover rooms 18 min — measured times were 35–43 and 20–25 min (sources Q4 and Q7 in the savings calculator).',
} satisfies Shape<LandingMessages['day']>
