import type { Shape } from '../../format'
import type { common as de } from '../../de/admin/common'

/** Front desk — texts shared by several areas. American English. */
export const common = {
  back: 'Back',
  backToOverview: 'Back to overview',
  backToSettings: 'Back to settings',
  save: 'Save',
  saving: 'Saving …',
  cancel: 'Cancel',
  close: 'Close',
  edit: 'Edit',
  delete: 'Delete',
  errors: {
    notSignedIn: 'Not signed in.',
    noPermission: 'No permission.',
    roomNotFound: 'Room not found.',
  },
} satisfies Shape<typeof de>
