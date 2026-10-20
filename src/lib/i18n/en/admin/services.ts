import type { Shape } from '../../format'
import type { services as de } from '../../de/admin/services'

/** Front desk — service builder and links. American English. */
export const services = {
  title: 'Service builder',
  count: {
    one: '{count} service',
    other: '{count} services',
  },

  create: {
    heading: 'Add a new service',
    kindAria: 'Type of service',
    kindOrder: 'Orderable',
    kindLink: 'Link',
    templates: 'Templates:',
    name: 'Name',
    namePlaceholder: 'e.g. Extra towels',
    description: 'Description (optional)',
    descriptionPlaceholder: 'Short note for the guest',
    price: 'Price in {currency} (optional)',
    linkUrl: 'Address (link)',
    urgent: 'Urgent',
    maintenance: 'Maintenance report',
    submit: 'Create',
    linkExplanation:
      'A <b>link</b> is a tile in the guest portal that opens an outside website — a tipping app for the housekeeping team, food delivery, a taxi. It doesn’t create a request and appears neither on the front desk board nor on the check-out statement. The provider is responsible for the content and privacy of the destination; the portal embeds nothing, it only links.',
    urgentExplanation:
      'Urgent requests flash red at the front desk — on the room tile and in the navigation. You add options with their own prices (such as sizes) on the service after creating it.',
    maintenanceExplanation:
      'A <b>maintenance report</b> is meant for defects and repairs — something about the room, not the stay. Such requests stay open at check-out (a defect doesn’t disappear with the guest), appear on no check-out statement, and show a warning at the next check-in.',
  },

  empty: {
    title: 'No services yet.',
    text: 'Guests see the services in the guest portal and send their request with one tap.',
    examples: 'Create example services',
  },

  service: {
    urgentBadge: 'urgent',
    maintenanceBadge: 'Maintenance report',
    linkBadge: 'Link',
    /** Beschriftung der Schalter – die Eigenschaft, nicht die Aktion. */
    urgent: 'Urgent',
    maintenance: 'Maintenance report',
    archive: 'Archive',
    archiveConfirm:
      'Archive “{name}”? The service disappears from the guest portal; existing requests are kept.',
    archiveYes: 'Yes, archive',
    address: 'Address',
    saveAddress: 'Save address',
    test: 'Test',
    archiveOption: 'Archive option',
    archiveOptionAria: 'Archive {label}',
    noOptions: 'No options — the guest orders the service as a whole.',
    option: 'Option',
    optionPlaceholder: 'e.g. Large towel',
    price: 'Price in {currency} (optional)',
    wholePrice: 'Service price in {currency} (optional)',
    savePrice: 'Save price',
    /** `{price}` = Preis des Service, z. B. „14,50 €“. */
    wholePriceIgnored: 'This service has options, so their prices apply. The service price ({price}) is not charged.',
    addOption: 'Add',
  },

  languages: {
    label: 'Languages:',
    home: 'source text',
    missing: 'missing',
    /** Sprache, die das Haus nicht gewählt hat – übersetzbar, aber ohne Mahnung. */
    optional: 'optional',
    editTitle: 'Edit {lang} translation',
    editorTitle: '{lang} translation',
    editorIntro:
      'Guests who see the guest portal in {lang} get these texts. Fields left empty are shown in {home}. Feel free to translate with a tool of your choice — just paste the result here.',
    name: 'Name',
    description: 'Description',
    options: 'Options',
    original: 'Source text: {text}',
    save: 'Save translation',
    close: 'Close',
    saved: 'Saved.',
    banner: {
      one: '<b>{count} service</b> isn’t fully translated into {lang} yet.',
      other: '<b>{count} services</b> aren’t fully translated into {lang} yet.',
    },
    bannerHint: 'Guests using {lang} see the texts there in {home}. You can still save — translate whenever it suits you.',
    bannerJump: 'Go to the first',
  },

  linkTemplates: {
    names: {
      tip: 'Tip for the housekeeping team',
      food: 'Order food — {brand}',
    },
    descriptions: {
      tip: 'Say thank you without cash — the tip goes to the housekeeping team.',
      food: 'Restaurants nearby deliver straight to our property.',
    },
    regions: {
      everywhere: 'everywhere',
      germany: 'Germany',
      germanyNordicsJapan: 'Germany, Northern Europe, Japan',
      worldwide: 'worldwide',
      southeastAsia: 'Southeast Asia',
      asia: 'Asia',
    },
    hints: {
      tip: 'Enter the address from your tipping app (the app’s QR code contains exactly this link). One link for the whole team — the guest portal shows no names.',
      lieferando:
        'Better than the home page: use the address for your street or postal code from {brand}’s search, so the guest immediately sees the restaurants that deliver to you.',
      wolt: 'Use {brand}’s city page (e.g. …/en/deu/berlin), so the guest doesn’t land on the country selection.',
      ubereats: 'Use the address with your city from {brand}’s search.',
      grab: 'Use {brand}’s country or city page.',
      foodpanda: 'Use {brand}’s country page.',
    },
  },

  errors: {
    invalidUrl: 'Address not readable — it must start with “https://”.',
    serviceNotFound: 'Service not found.',
    notALink: 'This service isn’t a link.',
    examplesExist: 'The example services already exist (possibly archived).',
    nameTooShort: 'The name must have at least {min} characters.',
    labelMissing: 'Label missing.',
    priceInvalid: 'Price not readable — e.g. “{example}” or leave empty.',
    unknownLanguage: 'Unknown language.',
  },
} satisfies Shape<typeof de>
