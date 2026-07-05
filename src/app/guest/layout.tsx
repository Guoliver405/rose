/**
 * Gast-Portal ist designgewollt immer dark (wie in HotCord) — unabhängig
 * vom Browser-Theme. CSS-Variablen kaskadieren durch den data-theme-Wrapper.
 */
export default function GuestLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div data-theme="dark" className="flex min-h-screen flex-1 flex-col bg-surface text-ink">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col p-5">{children}</div>
    </div>
  )
}
