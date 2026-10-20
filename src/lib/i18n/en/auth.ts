import type { Shape } from '../format'
import type { AuthMessages } from '../de/auth'

/** Sign-in, registration and password — American English. Readers: owners, managers, front desk. */
export const auth = {
  login: {
    title: 'Sign in',
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
    submitting: 'Signing in …',
    forgot: 'Forgot your password?',
    noAccount: 'No account yet? <link>Register your property</link>',
  },

  signup: {
    title: 'Create account',
    /** Nur mit Zahlungsweg (Stripe): Schritt 2 ist dann die Seite „Zahlungsweg“. */
    step: 'Step 1 of 2 — account and property',
    inviteCode: 'Invitation code',
    inviteCodeHint: 'RoSe is in an early test phase — registration is still limited to invited properties.',
    houseName: 'Property name',
    houseNamePlaceholder: 'e.g. Alpine View Guesthouse',
    yourName: 'Your name',
    yourNamePlaceholder: 'e.g. Anna Berg',
    email: 'Email (sign-in)',
    password: 'Password',
    passwordHint: 'At least {min} characters.',
    submit: 'Create account',
    submitting: 'Creating …',
    terms:
      'By creating the account, you accept the <terms>terms and conditions</terms> and acknowledge the <privacy>privacy policy</privacy>. The calendar month of registration and the first full month after it are free of charge.',
    nextStep: 'In the next step, you’ll set up the rooms. Example services are already set up and can be changed at any time.',
    haveAccount: 'Already have an account? <link>Sign in</link>',
  },

  forgot: {
    title: 'Reset password',
    linkInvalid: 'The link has expired or has already been used. Please request a new one.',
    email: 'Email',
    submit: 'Send reset link',
    submitting: 'Sending …',
    sentTitle: 'The email is on its way',
    sentText:
      'If an account exists for <code>{email}</code>, a link will arrive in that inbox shortly. It’s valid for a limited time and can be opened on any device.',
    sentSpam: 'Nothing arrived? Please also check your spam folder.',
    again: 'Request again',
    againIn: 'Request again in {seconds} s',
    backToLogin: 'Back to sign-in',
  },

  newPassword: {
    titleInvite: 'Set up your access',
    title: 'Set a new password',
    introInvite: 'Welcome! Set a password for <b>{email}</b>. After saving, you’re signed in right away.',
    intro: 'For <b>{email}</b>. After saving, you’re signed in right away.',
    linkInvalid: 'This link is no longer valid — it has expired or has already been used.',
    requestNew: 'Request a new link',
    password: 'New password',
    passwordHint: 'At least {min} characters.',
    confirm: 'Repeat',
    submit: 'Save password',
    submitting: 'Saving …',
    backToLogin: 'Back to sign-in',
  },

  errors: {
    loginFailed: 'Sign-in failed — email or password is incorrect.',
    confirmEmailFirst: 'Please confirm your email address first — we sent you the link when you registered.',
    notForReception: 'This account isn’t enabled for the front desk.',
    invalidEmail: 'Please enter a valid email address.',
    passwordTooShort: 'The password needs at least {min} characters.',
    houseNameMissing: 'Please enter the property name.',
    yourNameMissing: 'Please enter your name.',
    emailTaken: 'An account already exists for this email address. Please sign in.',
    accessNotCreated: 'The access couldn’t be created.',
    accountNotCreated: 'The account couldn’t be created.',
    signInAfterSignupFailed: 'The account has been created, but signing in failed. Please sign in via the sign-in page.',
    mailNotConfigured: 'Email sending isn’t set up. Please contact the operator.',
    passwordsDiffer: 'The two passwords don’t match.',
    sessionExpired: 'The session has expired. Please request a new link.',
    samePassword: 'That’s already your current password. Please choose a different one.',
    signupClosed: 'Registration for properties isn’t open at the moment.',
    inviteCodeWrong: 'The invitation code is incorrect.',
    createAccountFailed: 'The account couldn’t be created: {detail}',
    createHouseFailed: 'The property couldn’t be created: {detail}',
    createProfileFailed: 'The profile couldn’t be created: {detail}',
    createOwnerFailed: 'The owner couldn’t be added: {detail}',
  },
} satisfies Shape<AuthMessages>
