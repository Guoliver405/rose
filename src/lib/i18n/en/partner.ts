import type { Shape } from '../format'
import type { PartnerMessages } from '../de/partner'

/** Partner program — American English. Readers: owners, managers, front desk, simulator accounts. */
export const partner = {
  metaTitle: 'Partner program – RoSe',

  header: {
    title: 'Partner program',
    backHouses: 'Properties',
    backHouse: 'To the overview',
    backSimulator: 'Simulator',
    signOut: 'Sign out',
  },

  entry: {
    title: 'Partner program',
    text: 'Recommend RoSe and earn a share of every paid invoice.',
    open: 'Open',
  },

  join: {
    title: 'Recommend RoSe and earn with it',
    intro: 'Recommend RoSe to properties you know. For every property that registers through your link, you receive {rate} of each paid invoice — permanently, for as long as the property remains a customer.',
    points: [
      'Your personal link and a QR code to pass on',
      'Commission on every paid invoice, with no time limit',
      'An overview of referred accounts and your commission',
    ],
    payoutNote: 'Payouts will follow in a later step. Your commission is collected from day one.',
    terms: 'I have read the <terms>partner terms</terms> and agree to them.',
    submit: 'Become a partner',
    submitting: 'Setting up …',
  },

  link: {
    title: 'Your link',
    text: 'Anyone who registers through this link is assigned to you. The code can also be entered by hand under “Referred by” during registration.',
    linkLabel: 'Link',
    codeLabel: 'Code',
    copy: 'Copy',
    copied: 'Copied',
    qrAlt: 'QR code with your partner link',
    qrHint: 'To print or pass on: right-click or long-press the QR code, then save it.',
  },

  notApproved: {
    title: 'Not approved yet',
    text: 'Registration is currently open by invitation only. Your link already assigns registrations to you, but it only opens registration once we have approved you. To get approved, write to us at {email}.',
  },

  stats: {
    title: 'Your numbers',
    accounts: 'Referred accounts',
    accountsPaying: '{count} of them with a paid invoice',
    rooms: 'Rooms',
    roomsHint: 'billed for {month}',
    roomsNone: 'no billing yet',
    pending: 'Pending',
    pendingHint: 'released {days} days after payment',
    available: 'Available',
    availableHint: 'payouts will follow',
    reversed: 'Reversed',
    reversedHint: 'after a refund or chargeback',
    privacy: 'You see numbers, not the names of the referred properties.',
  },

  months: {
    title: 'Commission by month',
    month: 'Service month',
    amount: 'Commission',
    pending: 'of which pending',
    reversed: 'reversed',
    empty: 'No commission yet. It arises as soon as a referred property has paid its first invoice.',
  },

  errors: {
    signInAgain: 'Please sign in again.',
    notEligible: 'You can’t become a partner with this account.',
    termsMissing: 'Please agree to the partner terms.',
    failed: 'That didn’t work. Please try again.',
  },
} satisfies Shape<PartnerMessages>
