import type { Shape } from '../../format'
import type { houses as de } from '../../de/account/houses'

/** Account — page `/admin` (properties and account box), add property, account name, delete data, header, logo check. American English. */
export const houses = {
  shell: {
    logout: 'Sign out',
  },

  account: {
    heading: 'Account',
    billingLink: 'Plan & billing',
    houseCount: { one: '{count} property', other: '{count} properties' },
    roomsActive: '{count} rooms in service',
    roomsBillable: '{count} billable in the current month',
    expected: 'estimated {amount}',
    expectedFree: 'estimated {amount} (free month)',
    invoiceFailed: '<b>An invoice couldn’t be issued.</b> {reason} <link>Go to billing</link>',
    invoiceOverdue: '<b>Invoice {number} is overdue.</b> Please pay it; otherwise access may be suspended after a reminder (Section 6(6) of the terms). <link>View invoice</link>',
    noPaymentMethod: '<b>No payment method yet.</b> Card, SEPA direct debit, or bank transfer — <link>add one now</link>. Nothing is charged until after the free month.',
    billingRule: 'Billing is per room and calendar month; every room that was in service during the month, <em>even briefly</em>, counts.',
    billingNotSetUp: 'Invoicing and payment methods aren’t set up yet — nothing is being charged at the moment.',
    billingTestMode: 'Invoices are issued monthly on the 1st — currently as test invoices; nothing is charged.',
    billingLive: 'Invoices are issued monthly on the 1st for the previous month.',
  },

  list: {
    heading: 'Properties',
    rooms: '{count} rooms',
    toClean: '{count} to clean',
    allReady: 'all ready',
    manager: 'Manager',
  },

  simulator: {
    text: 'Run the numbers for your property with different figures — staff, times, occupancy — over many days, without coordination and with RoSe.',
  },

  create: {
    button: 'Add property',
    name: 'Property name',
    namePlaceholder: 'e.g. City Hotel Crown',
    submit: 'Create',
    hint: 'The address is generated from the name and can be changed afterwards under Settings → Property & rules. Example services are created as well.',
  },

  accountName: {
    rename: 'Rename account',
    save: 'Save',
    cancel: 'Cancel',
    hint: 'The account name is independent of the property names — when the account was created, the name of the first property was used. You rename the properties themselves under Settings → Property & rules.',
  },

  deletion: {
    summary: 'Delete data',
    summaryHint: 'Permanently remove a property or the account',
    intro: 'Removes <b>everything</b>: rooms, stays, requests, cleaning records, room history, and the sign-in accounts of the people concerned. This can’t be undone or restored — there’s no backup. <b>Only the invoices are kept</b>, because they must be retained.',
    singleHouse: 'Single property',
    delete: 'Delete',
    deleteAccount: 'Delete the entire account',
    deleteAccountHint: 'With all properties and your own access. Signing in is no longer possible afterwards.',
    loadFailed: 'Couldn’t be loaded.',
    houseRemoved: '{name} was removed completely.',
    headingHouse: 'Delete {name} — this will be gone for good:',
    headingAccount: 'Delete account “{name}” — this will be gone for good:',
    houses: { one: '{count} property: {names}', other: '{count} properties: {names}' },
    rooms: { one: '{count} room', other: '{count} rooms' },
    stays: { one: '{count} stay', other: '{count} stays' },
    orders: { one: '{count} request', other: '{count} requests' },
    staffLog: { one: '{count} activity log entry', other: '{count} activity log entries' },
    transitions: { one: '{count} room history entry', other: '{count} room history entries' },
    snapshots: { one: '{count} recorded billing month', other: '{count} recorded billing months' },
    authUsers: { one: '{count} sign-in account including email address', other: '{count} sign-in accounts including email addresses' },
    authUsersKept: {
      one: '{count} sign-in account remains — this person is still added to other properties.',
      other: '{count} sign-in accounts remain — these people are still added to other properties.',
    },
    finalBill: 'Cancellation at the end of the month: when deleting, a final invoice of <b>{amount}</b> plus VAT is issued for {month} ({rooms}) — collected via the stored payment method or, without a card or direct debit, with a payment page that’s shown here after deletion.',
    finalBillFree: '{month} is your free month — nothing more is charged when deleting.',
    finalBillRooms: { one: '{count} room', other: '{count} rooms' },
    accountDeleted: 'The account has been deleted.',
    openInvoicesHint: 'An invoice is still open. Please open the payment page and download the invoice there — once you leave this page, there’s no longer any access to it.',
    openInvoiceLink: 'View and pay invoice {n}',
    toLogin: 'Go to sign-in',
    confirmLabel: 'Type “{phrase}” to confirm',
    deleting: 'Deleting …',
    confirm: 'Yes, delete permanently',
    cancel: 'Cancel',
  },

  logo: {
    empty: 'The file is empty.',
    tooLarge: 'The file is too large ({kb} KB). 1 MB max.',
    wrongType: 'PNG, JPG, or SVG only — the file is none of these.',
  },

  errors: {
    noPermission: 'No permission.',
    accountNameTooShort: 'The account name must have at least 2 characters.',
    accountNameTooLong: 'The account name can have at most 80 characters.',
    houseNameTooShort: 'The property name must have at least 2 characters.',
    createFailed: 'Creating failed: {message}',
    ownerOnlyDelete: 'Only the account owner can delete data.',
    ownerOnlyDeleteAccount: 'Only the account owner can delete the account.',
    houseNotFound: 'Property not found.',
    confirmPhrase: 'Please type “{phrase}” to confirm.',
    deleteFailed: 'Deleting failed: {message}',
    finalInvoiceFailed: 'The final invoice for the current month couldn’t be created ({message}). The account wasn’t deleted — please check the billing details under “Plan & billing” and try again.',
  },
} satisfies Shape<typeof de>
