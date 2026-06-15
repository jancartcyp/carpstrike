import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Proxy (anciennement « middleware » avant Next.js 16).
 * - Rafraîchit la session Supabase à chaque requête (réécriture des cookies)
 * - Effectue des redirections optimistes basées sur le rôle (lu depuis user_metadata,
 *   sans appel DB — voir DAL pour les checks sécurisés)
 */

// Routes nécessitant une authentification (rôles fusionnés : tout compte y accède)
const PROTECTED_ROUTES = ['/dashboard', '/profil']
const AUTH_ROUTES = ['/connexion', '/inscription']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
          if (headers) {
            Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
          }
        },
      },
    }
  )

  // IMPORTANT : appeler getUser() tôt pour déclencher le rafraîchissement de session.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  const isProtectedRoute = PROTECTED_ROUTES.some((r) => path.startsWith(r))
  const isAuthRoute = AUTH_ROUTES.some((r) => path.startsWith(r))

  // Non authentifié sur une route protégée → /connexion
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/connexion'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  // Déjà connecté sur une page d'auth → tableau de bord
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
