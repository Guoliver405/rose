import type { Shape } from '../../format'
import type { LandingMessages } from '../../de/landing'

/**
 * Landing page (`/`) in American English. “Hotel” where the industry is meant,
 * “property” for the individual house, “housekeeping” as department and product.
 * Prices and numbers come from `pricing.ts` as placeholders.
 */
export const page = {
  meta: {
    title: 'RoSe – RoomService for hotels of any size',
    description:
      'Guests’ cleaning requests, “Do not disturb,” and service requests reach the front desk and housekeeping live — no guest app, no PMS project. {price} per room per month, at least one full month free.',
    ogDescription:
      'One-click check-in, guests via QR code, cleaning in sync. Three portals for front desk, housekeeping, and guests.',
    ogLocale: 'en_US',
    siteName: 'RoSe – RoomService',
  },

  header: {
    homeAria: 'RoSe – home',
    nav: { product: 'Product', flow: 'How it works', pricing: 'Pricing', faq: 'FAQ' },
    signIn: 'Sign in',
    start: 'Start for free',
  },

  hero: {
    badge: 'From country inns to hotel chains',
    title: 'Manage cleaning and offer services — <hl>digital and efficient</hl>',
    text: 'The guest taps “Clean my room,” the front desk sees it right away, and housekeeping works through it on the board. RoSe connects every area in real time — in one intuitive system, without training, data hassles, or a PMS project.',
    start: 'Start for free',
    demo: 'Product demo',
  },

  painPoints: [
    {
      pain: '“Didn’t room 204 say no cleaning?”',
      fix: 'Guests request cleaning or “Do not disturb” themselves — the board shows it live, without shouting down the hallway and without door hangers.',
    },
    {
      pain: '“Who’s in which room right now?”',
      fix: 'Housekeepers confirm start and finish with a swipe — the front desk and the team see right away where work is going on.',
    },
    {
      pain: '“Another system, another training …”',
      fix: 'Three tidy portals, each showing only what the role needs. Housekeepers sign in with an access card; guests don’t need an account at all.',
    },
  ],

  formula: {
    heading: 'The RoSe formula',
    terms: {
      portal: { means: 'Mobile guest portal', effect: 'better service quality' },
      cleaning: { means: 'Coordinated room cleaning', effect: 'saves costs, protects the environment' },
      flow: { means: 'Digital information flow', effect: 'overview and traceability' },
    },
    footnote: 'No PMS project, no training, set up in minutes — {price} per room per month, try it free for a month.',
  },

  sustainability: {
    sealTop: 'Cleaning',
    sealBottom: 'on request',
    badge: 'Sustainable hospitality',
    heading: 'Cleaning only when the guest wants it',
    text: 'Daily room cleaning is a habit, not a wish: 70% of guests don’t need it every day. With RoSe, “cleaning on request” becomes your property’s standard — guests tap when they want something, and everything else is left alone. That saves water, detergent, and energy, and it’s a sustainability argument you can make visible to guests and booking platforms.',
    wins: {
      water: {
        title: 'Water and detergent',
        text: 'Every skipped stayover cleaning saves a load of bed linen and towels — and the chemicals that go with it.',
      },
      energy: {
        title: 'Energy and walking',
        text: 'No vacuum, no cart down the hallway, no trip to the laundry for a room no one wanted cleaned.',
      },
      guests: {
        title: 'Guests decide for themselves',
        text: 'A tap in the guest portal instead of a door hanger. Guests who want cleaning get it — guests who don’t aren’t disturbed.',
      },
    },
    footnote: 'Daily cleaning from the second night remains available as an option — the property decides, not the software.',
  },

  product: {
    heading: 'Three portals, three kinds of users, one team',
    intro: 'Every role gets exactly the interface it needs — connected in real time. See it live here: one tap, and everyone sees it.',
    portals: {
      reception: {
        title: 'Front desk',
        lead: 'One click checks in, one click checks out.',
        points: [
          'Check-in creates the guest access right away — PIN on screen, check-in sheet to print or by email',
          'Room overview with live status; priorities for complaints and special cases',
          'Service requests as a task list, urgent ones flash red',
        ],
      },
      guests: {
        title: 'Guests',
        lead: 'Scan the QR code — done. No app, no account.',
        points: [
          'Room QR code plus PIN, or a personal link per stay — the property chooses',
          '“Clean my room” or “Do not disturb” with one tap',
          'Request services — from laundry service to breakfast in the room',
        ],
      },
      housekeeping: {
        title: 'Housekeeping',
        lead: 'One board for the whole team.',
        points: [
          'Floor view: requests, departures, priorities — with a recommendation on where to start',
          'Start and finish with a swipe; the whole team sees live who is in which room',
          'Sign-in with an access card, shift and break with two taps, reports included',
        ],
      },
    },
  },

  flow: {
    heading: 'How it works',
    intro: 'From check-in to the finished cleaning — five steps, no shouting, no notes.',
    panels: {
      checkin: {
        who: 'Front desk',
        title: 'One-click check-in',
        text: 'One click on the room — RoSe creates the anonymous stay and generates the access.',
      },
      access: {
        who: 'Guest',
        title: 'Access in hand',
        text: 'PIN on the check-in sheet, a room sign, or a link by email — no account, no app.',
      },
      tap: {
        who: 'Guest',
        title: 'One tap in the room',
        text: '“Clean my room,” “Do not disturb,” or a request from the service builder.',
      },
      visible: {
        who: 'Front desk',
        title: 'Visible right away',
        text: 'The bell on the room tile, the request in the list — urgent ones flash red.',
      },
      board: {
        who: 'Housekeeping',
        title: 'Targeted and coordinated',
        text: 'Prioritized and attentive — automatically aligned with demand and coordinated among the staff.',
      },
    },
    checkout: 'Check-out is one click again: the access expires immediately, and the room moves onto the board as “checked out.”',
  },

  comparison: {
    heading: 'The same day, with and without RoSe',
    intro: '100 rooms, the same guests, the same housekeepers. The only difference is what they know and how they choose the next room — whether your property cleans daily or only on request.',
    simulatorTitle: 'Run the numbers for your property',
    simulatorText: 'Set floors, rooms, staff, times, and guest behavior — the Housekeeping Simulator calculates many days. Free, with an email address, no payment details.',
    simulatorLink: 'Go to the simulator',
  },

  features: {
    heading: 'Thought through to the last detail',
    items: {
      qr: {
        title: 'QR codes as needed',
        text: 'Guest access per room with a PIN, or generated individually per stay. All with one click.',
      },
      secure: {
        title: 'Secure without accounts',
        text: 'Unguessable room codes, a PIN per stay, lockout after failed attempts — even against trial and error from the internet.',
      },
      dnd: {
        title: '“Do not disturb” is respected',
        text: '“Do not disturb” takes the room off the housekeeping board — no one knocks in vain.',
      },
      daily: {
        title: 'Daily cleaning',
        text: 'Optional: from the second night, RoSe puts daily cleaning on the board at the time you choose — also within a time window.',
      },
      services: {
        title: 'Service builder',
        text: 'Create your own services with options, prices, and priorities — guests request them digitally and without delay.',
      },
      print: {
        title: 'Ready to print',
        text: 'Check-in sheet for the guest, room signs, and access cards for the team — all from the browser, or by email.',
      },
      green: {
        title: 'Sustainable on request',
        text: 'Cleaning only when the guest wants it — less water, detergent, and walking, and a visible argument for your sustainability profile.',
      },
      proof: {
        title: 'Evidence instead of gut feeling',
        text: 'Room history and working-time reports per housekeeper — for complaints, payroll, and staff planning.',
      },
    },
  },

  useCases: {
    heading: 'Made for properties of any size',
    intro: 'From family businesses to chains — RoSe grows with you, without needing an IT department anywhere.',
    items: {
      small: {
        title: 'Guesthouse, inn, and vacation rentals',
        text: 'The front desk is often also kitchen, service, and housekeeping. RoSe keeps track: who is checking out, where cleaning is requested, what has been ordered — without piles of notes. From {min} per month.',
      },
      boutique: {
        title: 'Boutique and aparthotel',
        text: 'Longer stays, changing housekeepers: access cards instead of password chaos, daily cleaning appears on its own from the second night, and guests control “Do not disturb” and requests themselves.',
      },
      city: {
        title: 'City hotel with several floors',
        text: 'In-house or outsourced housekeeping: the floor board recommends where to start, and the front desk sees live who is working where. Reports provide working and cleaning times per housekeeper.',
      },
      chain: {
        title: 'Hotel chain and resort',
        text: 'One account, as many properties as you like; managers see their properties, the front desk only its own. Priorities redirect immediately for complaints, forgotten finishes expire automatically — with no room limit.',
      },
    },
  },

  pricing: {
    heading: 'One price. No packages.',
    intro: 'RoSe is priced per room — not per feature. Everything is always included, whether eight rooms or eight hundred.',
    badge: 'At least one full month free',
    perRoom: 'per room per month, plus VAT',
    minimum: 'Minimum <b>{min}</b> per month — up to {rooms} rooms, you pay a flat price.',
    included: [
      'All three portals — front desk, housekeeping, guests',
      'Unlimited properties, staff accounts, and housekeepers',
      'Service builder, daily cleaning, time windows',
      'Room signs, check-in sheets, access cards, email to guests',
      'Room history and working-time reports',
      'Light, dark, accessible — on any device',
    ],
    whatCounts: '<b>What counts as a room?</b> Every room that was in service, even temporarily, during the month. Rooms out of service (renovation, off-season) don’t count.',
    terms: '<b>No minimum term.</b> Cancel monthly, billed afterward per calendar month. The minimum applies per account, not per property. Details in the <link>terms and conditions</link> (in German).',
    start: 'Start for free',
  },

  faq: {
    heading: 'Frequently asked questions',
    items: [
      {
        q: 'Do guests need an app or an account?',
        a: 'No. Guests scan the QR code in the room and enter the PIN from check-in — or open their personal link from the check-in sheet or the email. Everything runs in the browser.',
      },
      {
        q: 'Does RoSe replace our booking system or PMS?',
        a: 'Deliberately not. RoSe takes care of the stay in the building — cleaning, requests, services. Booking, rates, and billing stay where they are. There’s nothing to integrate.',
      },
      {
        q: 'What data does RoSe store about guests?',
        a: 'No names, no contact details. A stay is anonymous: room, period, access. At check-out, the access expires immediately. Even an email address for the access link isn’t stored.',
      },
      {
        q: 'Where is the data stored?',
        a: 'The database and server functions run in the EU (Ireland). Access is separated per property, connections are encrypted. Details are in the privacy policy (in German).',
      },
      {
        q: 'What do housekeepers need?',
        a: 'Any smartphone or tablet. Sign-in with a printed access card or username + PIN — no email addresses needed.',
      },
      {
        q: 'What exactly does RoSe cost?',
        a: '{price} per room per month, at least {min} per month, plus VAT. The calendar month of registration and the first full month after it are free — at least one full month. No packages, no room limits, cancel monthly.',
      },
      {
        q: 'How long does setup take?',
        a: 'Create rooms (also as a range like “301–310”), print room signs, print access cards — realistically a few minutes. Example services are already there. There’s nothing to install.',
      },
      {
        q: 'Can I try RoSe now?',
        a: 'Yes. During the test phase, registration is still limited to invited properties — with an invitation code, your account is set up in a minute, and at least the first full month is free.',
      },
    ],
  },

  signup: {
    heading: 'Set up your property in a minute',
    text: 'Account, property, and example services are created in one go — then just add your rooms. At least the first full month is free; during the test phase, you need an invitation code.',
    start: 'Start for free',
    haveAccess: 'I already have access',
  },

  footer: {
    tagline: '– RoomService, lightweight.',
    reception: 'Front desk',
    housekeeping: 'Housekeeping',
    guests: 'Guest portal',
    imprint: 'Legal notice',
    privacy: 'Privacy',
    terms: 'Terms',
  },

  og: {
    alt: 'RoSe – cleaning, requests, and services in sync',
    claim: 'Cleaning, requests, and services — in sync',
    sub: 'Three portals for front desk, housekeeping, and guests. No guest app, no PMS project.',
    price: '{price} per room per month · first full month free',
    floor: 'Floor 2',
    counts: '2 open · 1 in progress',
    tiles: {
      occupied: 'occupied',
      ready: 'ready',
      wants: 'cleaning',
      checkedOut: 'checked out',
      priority: 'prioritized',
      dnd: 'Do not disturb',
    },
    checkin: 'Check-in 207',
    pin: 'PIN 4827',
  },
} satisfies Shape<LandingMessages['page']>
