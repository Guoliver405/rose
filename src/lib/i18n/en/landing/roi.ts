import type { Shape } from '../../format'
import type { LandingMessages } from '../../de/landing'

/** Savings calculator of the landing page (`RoiCalculator`) in American English. Source titles stay in their original language. */
export const roi = {
  heading: 'What does your property gain?',
  intro: 'Two levers that can be quantified: cleanings that are no longer needed and less idle time per cleaning. Everything else — less laundry, fewer complaints, proof of work — we don’t count.',

  inputs: {
    rooms: 'Rooms',
    occupancy: 'Occupancy',
    nights: 'Avg. length of stay',
    nightsValue: { one: '{nights} night', other: '{nights} nights' },
    hourly: 'Cost of one cleaning hour',
    hourlyHint: 'Wages plus employer costs*',
  },

  cost: {
    label: 'RoSe costs',
    sub: 'per month, plus VAT · at least one full month free',
  },
  savings: {
    label: 'RoSe saves about',
    sub: 'cleaning time per month, with the assumptions below*',
  },

  bars: {
    skipped: 'Stayover cleanings no longer needed ({count} per month)',
    coordination: 'Less idle time across {count} remaining cleanings',
  },
  hours: '{count} h',
  minutes: '{value} min',
  percent: '{value}%',
  planning: 'Hours saved only turn into costs saved if staff scheduling follows. RoSe’s reports show how much cleaning time is actually needed.',

  assumptions: {
    toggle: 'Adjust assumptions*',
    preset: 'Preset:',
    presets: { vorsichtig: 'cautious', typisch: 'typical' },
    a1: {
      label: 'A1 · Time to clean a stayover room',
      hint: 'Measured 20–25 min, per room generally 15–30 min — 18 min is a cautious estimate [Q3, Q4, Q7, Q8]',
    },
    a2: {
      label: 'A2 · Guests who skip daily cleaning',
      hint: '20% planning value, 34% in a case study, 70% would like to [Q1–Q3]',
    },
    a3: {
      label: 'A3 · Less idle time per cleaning',
      hint: 'Vendors cite 25–67% — we use ≈ 7–10% [Q6]',
    },
    formula: {
      one: 'Share of stayover rooms = 1 − 1 / length of stay ({share} of occupied rooms at {nights} night). Month = {days} days. Default hourly cost: German minimum wage €13.90 × 1.23 for employer costs [Q5].',
      other: 'Share of stayover rooms = 1 − 1 / length of stay ({share} of occupied rooms at {nights} nights). Month = {days} days. Default hourly cost: German minimum wage €13.90 × 1.23 for employer costs [Q5].',
    },
  },

  sources: {
    summary: '* Sources for the assumptions',
    link: 'Source',
    note: 'Vendor figures are marked as such; we know of no German survey on guests opting out. All values are estimates, not a guarantee.',
    items: {
      Q1: 'AHLA, “Hotel Room Cleaning Practices Reflect Guest Preferences,” 2022 — 70% of guests don’t want daily cleaning; 38% only on request, 19% only at check-out.',
      Q2: 'Lodging Magazine, “The Value of Opting Out,” 2024 — 20% opt-out as the planning value of a Hilton property.',
      Q3: 'CityShift Finance, opt-out case study — 34% opt-out after 18 months; 25 minutes per stayover room; savings only with adjusted staff scheduling.',
      Q4: 'Time study by Heath & Company, reported in Hotel Business, 2018 — departure rooms 43 minutes on average, stayover rooms almost 20 minutes less (USA).',
      Q5: 'German statutory minimum wage €13.90/h from 2026 (DGB); Destatis: about €23 in employer costs per €100 of gross pay.',
      Q6: 'Vendor figures for housekeeping software: 25–67% productivity gain (Stayntouch, Flexkeeping via Lodging Magazine) — we deliberately calculate with a fraction of that.',
      Q7: 'Reinigung Aktuell, 2015 — departure rooms about 35, stayover rooms about 25 minutes, roughly 14 rooms per housekeeper (four-star hotel, Vienna).',
      Q8: 'CCOHS (Canadian Centre for Occupational Health and Safety), “Hotel Housekeeping” — 15 to 30 minutes per room, about 16 rooms per shift.',
    },
  },
} satisfies Shape<LandingMessages['roi']>
