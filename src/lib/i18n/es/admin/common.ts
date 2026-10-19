import type { Shape } from '../../format'
import type { common as de } from '../../de/admin/common'

/** Recepción: textos comunes a varias áreas. Español. */
export const common = {
  back: 'Volver',
  backToOverview: 'Volver a la vista general',
  backToSettings: 'Volver a los ajustes',
  save: 'Guardar',
  saving: 'Guardando…',
  cancel: 'Cancelar',
  close: 'Cerrar',
  edit: 'Editar',
  delete: 'Eliminar',
  errors: {
    notSignedIn: 'No ha iniciado sesión.',
    noPermission: 'Sin permiso.',
    roomNotFound: 'Habitación no encontrada.',
  },
} satisfies Shape<typeof de>
