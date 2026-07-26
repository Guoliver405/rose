import GuestShell from '@/components/GuestShell'

export default function GuestLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <GuestShell>{children}</GuestShell>
}
