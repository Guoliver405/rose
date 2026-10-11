'use server'

import { confirmEmailChange, type ConfirmResult } from '@/utils/email-change'

/** Umstellen — erst auf Knopfdruck, siehe `confirmEmailChange`. */
export async function confirmEmailChangeAction(token: string): Promise<ConfirmResult> {
  return confirmEmailChange(token)
}
