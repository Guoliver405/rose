import type { Shape } from '../format'
import type { SheetMessages } from '../de/sheet'

/** Printed sheets and guest access mail — English. Structure: `de/sheet.ts`. */
export const sheet = {
  langLabel: 'English',
  heading: 'How it works',
  sheet: {
    welcome: 'Welcome',
    room: 'Room',
    scan: 'Scan the QR code',
    pin: 'Your PIN',
    pinFromReception: 'You receive your PIN at check-in.',
    qrAlt: 'QR code to the guest portal',
    withoutQr: 'Without a QR code',
    keep: 'Please keep this sheet — it is your access.',
  },
  buttonHints: {
    clean: 'Tap whenever you would like your room cleaned.',
    dnd: 'Nobody knocks — not even for services.',
    services: 'Towels, repairs and more — reception sees it right away.',
  },
  sustainabilityNeutral:
    'Every cleaning that isn’t needed saves water, detergent and energy — it is your choice in the portal.',
  footer: 'All details and current times are in the portal.',
  labels: {
    cleaning: 'Cleaning',
    sustainability: 'Sustainability',
    dnd: 'Quiet',
    services: 'Services',
    access: 'Access',
  },
  purpose:
    'The guest portal connects you to reception straight from your room — around the clock, without a phone call.',
  dnd: '“Do not disturb” in the portal keeps staff away from your room until you switch it off again.',
  services:
    'Ask for fresh towels, report a repair or request other services directly in the portal — reception sees your request immediately.',
  cleaningRoutine:
    'Your room is cleaned daily from {due} — you don’t have to request anything; on your day of departure after check-out. Would you like cleaning in between? Simply request it in the portal.',
  cleaningOnRequest:
    'Your room is cleaned on request: please ask for cleaning in the portal whenever it suits you — without a request we leave your room untouched.',
  window: ' The portal accepts cleaning requests daily from {start} to {end}.',
  defer: ' You can also postpone cleaning until {limit} at the latest — nobody will come before then.',
  sustainabilityRoutine:
    'No cleaning needed today? One tap on “Heute keine Reinigung” (no cleaning today) in the portal saves water, detergent and energy — cleaning resumes tomorrow.',
  sustainabilityOnRequest:
    'Less cleaning, less consumption: every cleaning that isn’t needed saves water, detergent and energy. That is why we only come when you want us to.',
  access: {
    link: 'The QR code or link is your personal access — no PIN needed. It is valid for this stay only and expires at check-out.',
    pinDeep: 'Scan the QR code and enter the PIN — you stay signed in afterwards. The PIN is valid until check-out.',
    pinManual: 'Open the address, enter your room number and PIN — you stay signed in afterwards. The PIN is valid until check-out.',
  },
  mail: {
    subject: 'Your access to the guest portal — {hotel}, room {room}',
    greeting: 'Hello,',
    intro: 'here is your access to the guest portal of <b>{hotel}</b>, room <b>{room}</b>.',
    open: 'Open the guest portal',
    pin: 'Your PIN:',
    fallback: 'If the button does not open:',
    howTo: 'How the portal works',
  },
} satisfies Shape<SheetMessages>
