import type { Shape } from '../../format'
import type { billing as de } from '../../de/account/billing'

/**
 * Account — plan & billing, payment method, billing details, invoices.
 * American English. The texts on the Stripe invoice itself (`invoice`) are
 * translated for completeness; invoices are still issued in German
 * (`INVOICE_LOCALE` in `lib/invoice.ts`).
 */
export const billing = {
  kinds: {
    card: 'Card',
    sepa_debit: 'SEPA direct debit',
    bank_transfer: 'Invoice (bank transfer)',
  },

  page: {
    title: 'Plan & billing',
    backToHouses: 'Properties',
    notice: {
      testTitle: 'Test mode — nothing is charged.',
      testText:
        'Invoices are issued monthly on the 1st for the previous month, but currently through our payment provider’s test environment: they’re test invoices, and stored cards and accounts aren’t charged. You’ll be informed in writing before the switch to live operation.',
      noneTitle: 'Nothing is being charged at the moment.',
      noneText:
        'Invoicing and payment methods aren’t set up yet. The amounts on this page show what the account would cost under the pricing model. Before the first charge, you’ll be informed in writing and can add a payment method — until then, there are no costs.',
    },
    free: {
      label: 'free',
      title: 'Free month: the calendar month of registration and the first full month after it.',
    },
    insteadOf: 'instead of {amount}',
    plusVat: 'plus VAT',
    plan: {
      title: 'Your plan',
      perRoom: 'per room and month, plus VAT',
      minimum: 'Minimum amount <b>{amount}</b> per account and month — a flat price up to {rooms} rooms.',
      text:
        'One price for every property size, with all features included. There are no packages and nothing you’d have to upgrade to later. Your account has existed since {registered} and is free until the end of {freeUntil} — the month of registration and the first full calendar month after it cost nothing.',
    },
    current: {
      title: 'Current month — {month}',
      colHouse: 'Property',
      colRooms: 'Billable rooms',
      total: 'Total',
      expected: 'Estimated amount:',
      note:
        'Every room that was in service during the month, even briefly, counts — a room taken out of service today still counts for this month, and so does one created today. The number is only final at the end of the month.',
    },
    closed: {
      title: 'Closed months',
      empty: 'No closed month yet — the first one appears here from the 1st of the following month.',
      colMonth: 'Month',
      colRooms: 'Rooms',
      colAmount: 'Amount',
      colStatus: 'Status',
      fixed: 'recorded',
      fixedTitle: 'Recorded before rooms were deleted — this number no longer changes.',
      notCharged: 'not charged',
      note:
        'Closed months are recorded as soon as rooms are deleted — otherwise a deleted room would disappear retroactively from periods already billed. As long as nothing is deleted, counting from the rooms themselves is just as binding.',
    },
    paymentMethod: {
      title: 'Payment method',
      unavailable:
        'No payment method yet — and none can be chosen at the moment. As soon as invoicing is set up, you can add a payment method here. You’ll be informed in writing beforehand.',
      none: 'No payment method yet.',
      invoiceTo: 'Invoice to <b>{name}</b>, {postalCode} {city}, {country}',
      vatId: ' · VAT ID {vatId}',
      detailsMissing: 'Billing details are still missing.',
      change: 'Change payment method and billing details',
      add: 'Add payment method',
    },
    invoices: {
      title: 'Invoices',
      emptyStripe:
        'No invoice yet. The first one is created on the 1st of the month after the free month — monthly in arrears, electronically, due within 14 days without deduction.',
      emptyNone:
        'No invoices yet. Invoices appear here as soon as invoicing is set up — monthly in arrears, electronically, due within 14 days without deduction.',
      net: '{amount} net',
      due: 'due {date}',
      pdf: 'PDF',
      view: 'View',
      viewPay: 'View / pay',
    },
    status: {
      draft: 'in preparation',
      open: 'open',
      paid: 'paid',
      uncollectible: 'uncollectible',
      void: 'void',
      overdue: 'overdue',
    },
    terms: {
      title: 'Billing terms',
      interval:
        '<b>Billing interval:</b> calendar month, monthly in arrears — the invoice arrives by email on the 1st of the following month and appears here.',
      payment:
        '<b>Payment:</b> with a stored card or direct debit, payment is collected when the invoice is issued (direct debit after advance notice); otherwise within 14 days by bank transfer or via the payment page.',
      minimum: '<b>Minimum amount per account,</b> not per property — several properties pay for the sum of their rooms.',
      inactive: '<b>Rooms out of service</b> (renovation, season) don’t count as long as they’re out of service for the whole month.',
      cancel:
        '<b>No minimum term:</b> cancel monthly at the end of the month. Deleting the account under “Delete data” also counts as cancellation.',
      net: '<b>All prices are net,</b> plus statutory VAT.',
      details: 'Details in the <link>terms and conditions</link>, Sections 6 and 7.',
    },
  },

  paymentPage: {
    backToBilling: 'Plan & billing',
    title: 'Payment method & billing details',
    step: {
      title: 'Step 2 of 2 — payment method',
      text:
        'Your account and your property have been created. Now add billing details and a payment method — nothing is charged; the month of registration and the first full month after it are free. You can also complete this step later on the “Plan & billing” page.',
      later: 'Later — continue to room setup',
    },
    saveFailed: 'The card or account couldn’t be saved: {error}',
    confirmCancelled: 'Confirming the card or account was canceled. Please try again.',
  },

  details: {
    title: 'Billing details',
    intro:
      'These appear on every invoice. The address determines the VAT: Germany 19%; businesses in the EU with a VAT ID without German VAT (reverse charge); outside the EU without German VAT.',
    name: 'Invoice recipient (company)',
    line1: 'Street and number',
    line2: 'Address line 2 (optional)',
    postalCode: 'Postal code',
    city: 'City',
    country: 'Country',
    vatId: 'VAT ID {suffix}',
    vatRequired: '(required)',
    vatOptional: '(optional)',
    vatNotApplicable: '(not applicable)',
    vatStatus: 'Status: {status}',
    vatStatusText: {
      pending: 'being checked',
      verified: 'verified',
      unverified: 'verification failed — please check the number',
      unavailable: 'verification service unavailable, will be retried',
    },
    vatHint:
      'Businesses in the EU outside Germany need a VAT ID — only then can the invoice be issued without German VAT.',
    submit: 'Save billing details',
    submitting: 'Saving …',
    saved: 'Saved',
  },

  panel: {
    title: 'Payment method',
    remove: 'Remove',
    none:
      'No payment method yet. Three options, all through our payment provider Stripe: card or SEPA direct debit are stored here and collected monthly; with invoice and bank transfer, nothing is stored, and every invoice states bank details with a payment reference.',
    detailsFirst:
      'Please save the billing details above first — they appear on the invoice and determine the VAT.',
    change: 'Change card or direct debit',
    add: 'Add card or SEPA direct debit',
    bankTransfer: 'Invoice (bank transfer)',
    bankTransferChosen: 'Invoice (bank transfer) selected.',
    saved: '{label} saved.',
    stripeUnreachable: 'Stripe unreachable.',
    notes:
      'Bank transfer: the invoice states our payment provider’s bank details with a payment reference; incoming payments are matched automatically, payment term 14 days. Direct debit: collected when the invoice is issued, after advance notice. Card: charged when the invoice is issued.',
    next: 'Continue to room setup',
    form: {
      confirmFailed: 'Confirmation failed.',
      notConfirmed: 'Card or account not confirmed yet ({status}).',
      unknownStatus: 'unknown',
      submit: 'Save card or account',
      submitting: 'Saving …',
      cancel: 'Cancel',
      preferTransfer:
        'Rather not store a card or account? <link>Choose invoice (bank transfer)</link> — every invoice then states bank details and a payment reference, payment term 14 days.',
      noCharge:
        'Nothing is charged. The card or account is stored with Stripe and used for the monthly invoices; RoSe itself never sees card or account details.',
    },
  },

  labels: {
    card: '{brand} •••• {last4}',
    sepaDebit: 'SEPA direct debit •••• {last4}',
    bankTransfer: 'Invoice (bank transfer)',
  },

  invoice: {
    rooms: { one: '{count} room', other: '{count} rooms' },
    line: 'RoSe — usage in {month}: {rooms} × {price}',
    lineMinimum: 'RoSe — usage in {month}: {rooms} (minimum amount {minimum} per month)',
    memo: 'Service period {range}. Every room that was in service during the month, even briefly, is billed.',
    periodField: 'Service period',
    managingDirector: 'Managing director {name}',
    vatId: 'VAT ID {vatId}',
    due: 'Payable within {days} days without deduction.',
  },

  errors: {
    noPermission: 'No permission.',
    notReady: 'Payment methods aren’t set up yet.',
    stripeUnreachable: 'Stripe unreachable.',
    invalidId: 'Invalid identifier.',
    vat: {
      nameMissing: 'Please enter the invoice recipient.',
      countryMissing: 'Please select a country.',
      line1Missing: 'Please enter the street and number.',
      postalCodeMissing: 'Please enter the postal code.',
      cityMissing: 'Please enter the city.',
      outsideEu: 'VAT IDs only exist for businesses in the EU. Please leave the field empty.',
      format: 'The VAT ID doesn’t match the format for {country} (prefix {prefix}).',
      required:
        'Businesses in the EU outside Germany must provide a VAT ID — otherwise we’d have to charge German VAT.',
    },
    stripe: {
      notConfigured: 'Stripe isn’t set up.',
      accountNotFound: 'Account not found.',
      unreachable: 'Stripe unreachable.',
      customerFailed: 'The Stripe customer couldn’t be created.',
      detailsFailed: 'The billing details couldn’t be transferred.',
      noCustomer: 'No Stripe customer for this account.',
      wrongAccount: 'The payment details don’t belong to this RoSe account.',
      notConfirmed: 'Card or account not confirmed yet ({status}).',
      missingOnIntent: 'The card or account is missing from the confirmation.',
      unsupported: 'Payment method {type} isn’t supported.',
      saveFailed: 'The card or account couldn’t be saved.',
      detachFailed: 'The card or account couldn’t be removed.',
    },
    invoicing: {
      noCustomer: 'No Stripe customer — please open the “Payment method” page.',
      detailsMissing: 'Billing details are missing.',
    },
  },
} satisfies Shape<typeof de>
