import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Session-Refresh für Admin- und Reinigungs-Portal (Next-16-Proxy).
 *
 * Server Components können keine Cookies setzen — ohne diesen Refresh würde
 * die Token-Rotation nach Ablauf des Access-Tokens verloren gehen und die
 * Session mit "refresh_token_already_used" sterben.
 *
 * /admin + /login nutzen die Default-Supabase-Cookies, /service den
 * svc_-Namespace (Präfix wird beim Lesen entfernt, beim Schreiben
 * hinzugefügt) — beide Sessions koexistieren im selben Browser.
 */
const SVC = 'svc_'

export async function proxy(request: NextRequest) {
  const isService = request.nextUrl.pathname.startsWith('/service')
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          if (!isService) return request.cookies.getAll()
          return request.cookies
            .getAll()
            .filter(c => c.name.startsWith(SVC))
            .map(c => ({ name: c.name.slice(SVC.length), value: c.value }))
        },
        setAll(cookiesToSet) {
          const prefix = isService ? SVC : ''
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(prefix + name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(prefix + name, value, options),
          )
        },
      },
    },
  )

  // Triggert bei Bedarf den Token-Refresh und persistiert ihn im Response.
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/service/:path*'],
}
