/**
 * Rahmen des Gast-Portals — designgewollt immer dark (wie in HotCord),
 * unabhängig vom Browser-Theme. CSS-Variablen kaskadieren durch den
 * data-theme-Wrapper.
 *
 * Wird von beiden Gast-Layouts benutzt: den mandantenfreien Token-/Hinweis-
 * Seiten unter `/guest` und dem mandantengebundenen Portal unter
 * `/h/<slug>/guest`.
 */
export default function GuestShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div data-theme="dark" className="flex min-h-screen flex-1 flex-col bg-surface text-ink">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col p-5">{children}</div>
    </div>
  )
}
