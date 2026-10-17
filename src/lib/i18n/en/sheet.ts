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
    pinFromReception: 'You’ll receive your PIN at check-in.',
    qrAlt: 'QR code to the guest portal',
    withoutQr: 'Without a QR code',
    keep: 'Please keep this sheet — it is your access.',
  },
  buttonHints: {
    clean: 'Tap whenever you would like your room cleaned.',
    dnd: 'Nobody knocks — not even for services.',
    services: 'Towels, repairs and more — the front desk sees it right away.',
  },
  sustainabilityNeutral:
    'Every unnecessary cleaning saves water, detergent, and energy. You decide whether you need cleaning in the guest portal.',
  footer: 'All details and current times are in the portal.',
  labels: {
    cleaning: 'Cleaning',
    sustainability: 'Sustainability',
    dnd: 'Quiet',
    services: 'Services',
    access: 'Access',
  },
  purpose:
    'The guest portal lets you contact the front desk directly from your room, 24/7, without calling.',
  dnd: '“Do not disturb” in the portal keeps staff away from your room until you switch it off.',
  services:
    'Request fresh towels, report a problem, or ask for other services directly in the portal. The front desk receives your request immediately.',
  cleaningRoutine:
    'Your room is cleaned daily starting at {due}, and after check-out on your departure day — no request is needed. For an extra cleaning in between, tap “Clean my room” in the portal.',
  cleaningOnRequest:
    'Your room is cleaned on request. Please request cleaning in the portal whenever it suits you. Without a request, no one will enter your room.',
  window: ' The portal accepts cleaning requests daily from {start} to {end}.',
  defer: ' You can also postpone cleaning in the portal until {limit} at the latest. No one will come before then.',
  sustainabilityRoutine:
    'Don’t need cleaning today? Tap “{skip}” in the portal to save water, detergent, and energy. Daily cleaning resumes tomorrow.',
  sustainabilityOnRequest:
    'Less cleaning means lower resource use. Every unnecessary cleaning saves water, detergent, and energy, so we come only when you want us to.',
  access: {
    link: 'This access is personal and doesn’t require a PIN. Please don’t share it. It’s valid only for this stay and expires at check-out.',
    pinDeep: 'Scan the QR code and enter the PIN — you stay signed in afterwards. The PIN is valid until check-out.',
    pinManual: 'Open the web address, enter your room number and PIN, and you’ll stay signed in. The PIN is valid until check-out.',
  },
  mail: {
    subject: 'Your access to the guest portal — {hotel}, room {room}',
    greeting: 'Hello,',
    intro: 'here is your access to the guest portal of <b>{hotel}</b>, room <b>{room}</b>.',
    open: 'Open the guest portal',
    pin: 'Your PIN:',
    fallback: 'If the button does not work, open this address:',
    howTo: 'How the portal works',
  },
} satisfies Shape<SheetMessages>
