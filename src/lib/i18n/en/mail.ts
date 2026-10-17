import type { Shape } from '../format'
import type { MailMessages } from '../de/mail'

/**
 * Email sending — American English: templates for invitation, password link
 * and simulator account, the status line under the send buttons, and sending
 * messages. The guest access email lives with the printed sheets (`sheet.ts`).
 */
export const mail = {
  templates: {
    greeting: 'Hello,',
    fallback: 'If the button doesn’t open:',
    invite: {
      subject: 'Invitation: {role} for {hotel} in RoSe',
      greeting: 'Hello {name},',
      invited: 'You’ve been invited as <b>{role}</b> for <b>{hotel}</b> in RoSe.',
      invitedBy: '{by} has invited you as <b>{role}</b> for <b>{hotel}</b> in RoSe.',
      body: 'Use the button below to set your password, then sign in with this email address.',
      bodyText: 'Use the link below to set your password, then sign in with this email address.',
      button: 'Set password',
      note: 'The link is valid for a limited time. If you weren’t expecting this invitation, you can ignore this email.',
    },
    recovery: {
      subject: 'New password for RoSe',
      subjectInvite: 'Your password link for RoSe',
      intro: 'a new password was requested for your RoSe account.',
      introInvite: 'here is your new link to set the password for your RoSe account.',
      button: 'Set new password',
      buttonInvite: 'Set password',
      note: 'The link is valid for a limited time and can be opened on any device. If you didn’t request a new password, you can ignore this email — your password stays unchanged.',
    },
    simConfirm: {
      subject: 'Please confirm: your account for the {tool}',
      purpose: 'Please confirm your email address so you can use the RoSe {tool}.',
      marketing:
        'You also agreed that RoSe may occasionally inform you by email about new features and special offers — about RoSe only. Clicking also confirms this consent; you can withdraw it at any time in your account.',
      button: 'Confirm email address',
      note: 'The link is valid for a limited time. If you didn’t register, simply ignore this email — without confirmation, the account is deleted after seven days.',
    },
    simExists: {
      subject: 'You already have a RoSe account',
      text: 'An account for RoSe already exists for this email address. A second account can’t be created with the same address. Sign in with your existing account — as the owner or manager of a property, you’ll find the {tool} at {url}.',
      button: 'Sign in',
      buttonText: 'Sign in: {url}',
      forgot: 'Forgot your password? Reset it here:',
      note: 'If you didn’t register again, you can ignore this email — nothing has changed in your account.',
    },
  },

  status: {
    queued: 'Handing over …',
    sent: 'Handed over for sending — waiting for delivery confirmation …',
    delayed: 'Delivery delayed: the receiving server isn’t accepting right now; delivery will be retried.',
    delivered: 'Delivered.',
    complained: 'The recipient reported the email as spam.',
    bounced: 'Rejected by the receiving server.',
    bouncedDetail: 'Rejected by the receiving server: {detail}',
    suppressed: 'Not delivered: after an earlier rejection, the address is on the sending service’s block list. Unblock it first, then resend.',
    failed: 'Couldn’t be sent.',
    failedDetail: 'Couldn’t be sent: {detail}',
  },

  line: {
    againIn: 'again in {seconds} s',
    to: ' to {recipient}',
    blockedTitle: 'Not sent — address blocked',
    origin: {
      bounce: 'The receiving server rejected an earlier email to this address',
      complaint: 'The recipient reported an earlier email as spam',
      manual: 'The address was added to the block list manually',
      other: 'An earlier email to this address didn’t arrive',
    },
    blockedText: '{origin}{since}. The sending service won’t deliver anything to this address until it’s unblocked.',
    reasonThen: 'Reason back then: {detail}',
    canRelease: 'Is the address correct? Then unblock it and resend. If it bounces again, the new reason appears here.',
    cannotRelease: 'Unblocking isn’t currently possible from the app — please check the address or hand over the access another way.',
    providerHint:
      'Note: at <code>{domain}</code>, {count} different addresses were recently rejected and none delivered (since {since}). This provider may currently not accept our emails — if nothing arrives, hand over the access another way.',
    failedTitle: 'Not delivered',
    suppressedHelp: 'Is the address correct? Then unblock it and resend — otherwise hand over the access another way.',
    failedHelp: 'Check the address and resend — or hand over the access another way. The address is now on the block list; resending unblocks it first.',
    deliveredTitle: 'Delivered',
    deliveredHelp: 'The receiving server accepted the email. If it isn’t in the inbox, it’s worth checking the spam folder.',
    delayedTitle: 'Delayed',
    timedOutTitle: 'Handed over, delivery not yet confirmed',
    timedOutHelp: 'Some providers only confirm after a few minutes. Please check the inbox (including spam); resend if needed.',
    sentTitle: 'Handed over',
    inviteLink: {
      title: 'Invitation link — hand it over via messenger, text message or note',
      copy: 'Copy link',
      copied: 'Copied',
      hide: 'Hide',
      help: 'Whoever opens this link sets the password for this account. It works once and only for a limited time. If someone else uses it first, the invited person will fail and get in touch — then simply create a new one.',
    },
  },

  errors: {
    notConfigured: 'Email sending isn’t set up.',
    invalidAddress: 'Please enter a valid email address.',
    cooldown: 'Just sent — please wait a moment before sending again.',
    sendFailed: 'The email couldn’t be sent.',
    sendFailedDetail: 'The email couldn’t be sent: {detail}',
    providerAnswered: 'Resend responded {status}',
    providerUnreachable: 'Resend unreachable',
    releaseForbidden: 'Unblocking isn’t allowed with the stored Resend key (full access required).',
    releaseFailed: 'Unblocking failed (Resend responded {status}).',
    releaseUnreachable: 'Unblocking failed: Resend unreachable.',
  },

  fromVia: '{hotel} via RoSe',
} satisfies Shape<MailMessages>
