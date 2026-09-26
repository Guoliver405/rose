import { createAdminClient } from '@/utils/supabase/service'
import { MAX_SCENARIOS, formFromSaved, toSaved, type SimForm } from '@/lib/sim-form'

/*
 * Gespeicherte Szenarien des Housekeeping-Simulators (Phase 3, 26.09.2026).
 * Tabelle `sim_scenarios`, RLS „nur eigene"; geschrieben wird trotzdem über
 * den Admin-Client mit ausdrücklichem Filter auf den Nutzer — Supabase meldet
 * bei einem von RLS verschluckten UPDATE/DELETE keinen Fehler (AGENTS.md).
 */

export type ScenarioItem = { id: string; name: string; updatedAt: string; form: SimForm }

export async function listScenarios(userId: string): Promise<ScenarioItem[]> {
  const { data } = await createAdminClient()
    .from('sim_scenarios')
    .select('id, name, config, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(MAX_SCENARIOS)
  return (data ?? []).map(r => ({ id: r.id, name: r.name, updatedAt: r.updated_at, form: formFromSaved(r.config) }))
}

const cleanName = (name: string) => name.replace(/\s+/g, ' ').trim().slice(0, 120)

/** Neu anlegen (ohne `id`) oder ein eigenes überschreiben (mit `id`). */
export async function saveScenario(userId: string, name: string, form: SimForm, id?: string): Promise<{ id?: string; error?: string }> {
  const n = cleanName(name)
  if (!n) return { error: 'Bitte einen Namen angeben.' }
  const admin = createAdminClient()
  const now = new Date().toISOString()
  if (id) {
    const { data, error } = await admin.from('sim_scenarios')
      .update({ name: n, config: toSaved(form), updated_at: now })
      .eq('id', id).eq('user_id', userId).select('id')
    if (error || !data?.length) return { error: 'Das Szenario konnte nicht gespeichert werden.' }
    return { id }
  }
  const { count } = await admin.from('sim_scenarios').select('id', { count: 'exact', head: true }).eq('user_id', userId)
  if ((count ?? 0) >= MAX_SCENARIOS) return { error: `Höchstens ${MAX_SCENARIOS} Szenarien — bitte zuerst eines löschen.` }
  const { data, error } = await admin.from('sim_scenarios')
    .insert({ user_id: userId, name: n, config: toSaved(form) }).select('id').single()
  if (error || !data) return { error: 'Das Szenario konnte nicht gespeichert werden.' }
  return { id: data.id }
}

export async function renameScenario(userId: string, id: string, name: string): Promise<{ error?: string }> {
  const n = cleanName(name)
  if (!n) return { error: 'Bitte einen Namen angeben.' }
  const { data, error } = await createAdminClient().from('sim_scenarios')
    .update({ name: n, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId).select('id')
  return error || !data?.length ? { error: 'Umbenennen fehlgeschlagen.' } : {}
}

export async function deleteScenario(userId: string, id: string): Promise<{ error?: string }> {
  const { data, error } = await createAdminClient().from('sim_scenarios')
    .delete().eq('id', id).eq('user_id', userId).select('id')
  return error || !data?.length ? { error: 'Löschen fehlgeschlagen.' } : {}
}
