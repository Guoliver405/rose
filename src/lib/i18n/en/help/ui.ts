import type { Shape } from '../../format'
import type { ui as de } from '../../de/help/ui'

/** Help — controls: “?” button, sidebar, topic page, guide card and help hub. American English. */
export const ui = {
  button: {
    open: 'Help',
    openTopic: 'Help: {title}',
    close: 'Close help',
  },

  sidebar: {
    label: 'Help',
    allTopics: 'All topics',
    close: 'Close help',
    closeHint: 'Close help (Esc)',
    startLotse: 'Start guide',
    asPage: 'Open as page',
    asPageHint: 'To print or share',
    noTopic: 'There’s no dedicated topic for this page. Choose one from the list — the sidebar stays open until you close it.',
  },

  topic: {
    questions: 'Questions',
    seeAlso: 'See also',
    startLotse: 'Start guide',
    backHub: 'Help',
    backHouses: 'Properties',
  },

  pilot: {
    region: 'Guide: {title}',
    progress: '{step} / {total}',
    close: 'End guide',
    missing: 'The area described isn’t on the page right now — it depends on a setting that’s different in your property, or on data that doesn’t exist here yet.',
    back: 'Back',
    end: 'End',
    next: 'Next',
    done: 'Done',
  },

  hub: {
    title: 'Help & guides',
    intro: 'For every area there’s an explanation to look things up — symbols, questions, answers — and a guide: a guided tour over the real page that shows step by step what happens where. You can keep using the page as usual, nothing is locked; you can end the guide at any time with “End”. The “?” at the top right opens the explanation next to any page.',
    setupTitle: 'Setting up your property',
    setupCount: '{done} of {total}',
    setupContinue: 'Continue setup',
    setupAgain: 'Review setup again',
    optional: 'optional',
    catalogTitle: 'Help by topic',
    catalogIntro: 'Both take you to the page in question: the explanation in the sidebar next to it, the guide step by step on top of it — as often as you like.',
    explanation: 'Explanation',
    lotse: { one: 'Guide ({count} step)', other: 'Guide ({count} steps)' },
  },
} satisfies Shape<typeof de>
