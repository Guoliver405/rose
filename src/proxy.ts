import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Session-Refresh für das Admin-Portal (Next-16-Proxy, vormals Middleware).
 *
 * Server Components können keine Cookies setzen — ohne diesen Refresh würde
 * die Token-Rotation nach Ablauf des Access-Tokens verloren gehen und die
 * Session mit "refresh_token_already_used" sterben. Berührt nur die
 * Default-Supabase-Cookies; die svc_-Cookies des Reinigungs-Portals
 * bleiben unangetastet (eigener Namespace, eigener Refresh in Phase 3).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
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
  matcher: ['/admin/:path*', '/login'],
}
