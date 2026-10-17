import type { Shape } from '../../format'
import type { SimulatorMessages } from '../../de/simulator'

/** Housekeeping Simulator — account, American English. */
export const account = {
  /**
   * Wording of the marketing consent — its own version (`MARKETING_TEXT_VERSIONS.en`
   * in `lib/sim-account.ts`). Change the text ⇒ bump that version.
   */
  marketing: {
    text: 'Yes, RoSe may occasionally inform me by email about new features and special offers — about RoSe only. My address will not be passed on. I can unsubscribe at any time with one click or in my account.',
    optional: '(optional)',
  },

  signup: {
    metaTitle: 'Register – {tool}',
    intro: 'Free and without payment details. After registering, you confirm your email address via a link.',
    mailNotReady: 'Registration isn’t possible at the moment because email sending isn’t set up.',
    email: 'Email',
    password: 'Password',
    passwordHint: 'At least {min} characters.',
    submit: 'Register for free',
    submitting: 'Creating …',
    terms:
      'By registering, you accept the <terms>simulator terms of use</terms> (in German). How we handle your data is described in the <privacy>privacy policy</privacy> (in German).',
    haveAccount: 'Already registered? <link>Sign in</link>',
    resendLink: 'Resend confirmation link',
    sent: {
      title: 'Please confirm your address',
      text: 'We sent an email to <code>{email}</code>. The link in it activates your account and signs you in. It can be opened on any device.',
      hint: 'Nothing arrived? Please also check your spam folder. If an account already exists for this address, the email explains what to do next.',
      again: 'Send email again',
      againIn: 'Send again in {seconds} s',
    },
    resend: {
      linkExpired: 'The confirmation link has expired or has already been used. Request a new one.',
      submit: 'Send new confirmation link',
      signupInstead: 'Register again instead',
    },
  },

  konto: {
    metaTitle: 'My account – {tool}',
    title: 'My account',
    access: {
      title: 'Access',
      email: 'Email: <code>{email}</code>',
      password: 'Change password: via <link>Forgot your password?</link> — you’ll receive a link at this address.',
      hotel: 'This access belongs to a property account; you use the simulator with it, without a separate account.',
    },
    marketing: {
      title: 'News about RoSe by email',
      saved: 'Saved — thank you!',
      unsubscribed: 'Unsubscribed. You’ll no longer receive marketing emails.',
      since: 'Consent given on {date}.',
      none: 'No consent given.',
    },
    delete: {
      titleSim: 'Delete account',
      titleHotel: 'Delete simulator data',
      textSim: 'Deletes your access, saved scenarios, and consent immediately and permanently.',
      textHotel: 'Deletes your saved scenarios and consent. Your property access remains.',
      confirmLabel: 'Type “{phrase}” to confirm',
      submit: 'Delete permanently',
    },
  },

  deletePhrase: 'DELETE',

  convert: {
    title: 'Get started with RoSe as a property',
    intro:
      'Try RoSe free for at least one month — no payment details required. If it doesn’t convince you, simply delete the account before then; there are no costs. Your access and your scenarios stay as they are.',
    prices: 'Pricing',
    next: 'Continue',
    closed: 'Registration as a property is currently by invitation only and isn’t open at the moment. Write to us — the address is in the legal notice.',
    houseName: 'Property name',
    yourName: 'Your name',
    inviteCode: 'Invitation code',
    take: 'Taken from the simulator',
    rooms: {
      one: '{rooms} rooms on one floor, numbered 101, 102 … — can be changed at any time in the room setup',
      other: '{rooms} rooms on {count} floors, numbered 101, 102 … — can be changed at any time in the room setup',
    },
    rulesDaily: 'Rules: clean stayover rooms daily from {from}, check-out until {checkout}, check-in from {checkin}',
    rulesOnDemand: 'Rules: clean stayover rooms on request only, check-out until {checkout}, check-in from {checkin}',
    rulesHint: 'Follows the “daily / on request only” switch above; can be changed under “Property & rules.”',
    submit: 'Create property account',
    submitting: 'Creating …',
    cancel: 'Cancel',
    after: 'Next: payment method (optional) and setup. The terms and conditions apply.',
  },

  errors: {
    emailInvalid: 'Please enter a valid email address.',
    passwordShort: 'The password needs at least {min} characters.',
    passwordLong: 'The password can have at most {max} characters.',
    signInAgain: 'Please sign in again.',
    deletePhrase: 'Please type “{phrase}” to confirm.',
    mailNotReady: 'Registration isn’t possible at the moment (email sending isn’t set up).',
    signupThrottled: 'Too many registrations came from this connection just now. Please try again in an hour.',
    resendThrottled: 'Too many requests came from this connection just now. Please try again in an hour.',
    signupFailed: 'The account couldn’t be created. Please try again later.',
    notSaved: 'Couldn’t be saved.',
    confirmFirst: 'Please confirm your email address first.',
    deleteFailed: 'The account couldn’t be deleted. Please try again later.',
    scenarioName: 'Please enter a name.',
    scenarioSaveFailed: 'The scenario couldn’t be saved.',
    scenarioLimit: 'At most {max} scenarios — please delete one first.',
    scenarioRenameFailed: 'Renaming failed.',
    scenarioDeleteFailed: 'Deleting failed.',
    convertConfirmedOnly: 'Only for confirmed simulator accounts.',
    convertExists: 'A property account already exists for this access.',
    convertHouseName: 'Please enter the property name.',
    convertYourName: 'Please enter your name.',
    convertTooManyRooms:
      'At most {max} rooms can be taken over directly — please convert without rooms and create them in the room setup.',
    convertFailed: 'The property account couldn’t be created.',
  },
} satisfies Shape<SimulatorMessages['account']>
