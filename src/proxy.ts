import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { DEFAULT_SPACE, parseSpace, SPACE_COOKIE, spaceHome } from '@/lib/auth/space'

/**
 * Proxy (anciennement « middleware » avant Next.js 16).
 * - Rafraîchit la session Supabase à chaque requête (réécriture des cookies)
 * - Protège les routes authentifiées
 * - Filtre selon l'« espace » actif de la session (organisateur / pêcheur) : un même
 *   compte n'accède qu'à l'espace choisi à la connexion (bascule possible via switchSpace).
 */

// Routes nécessitant une authentification
const PROTECTED_ROUTES = ['/dashboard', '/profil']
const AUTH_ROUTES = ['/connexion', '/inscription']

// Routes réservées à un espace donné
const ORGANIZER_ONLY = ['/dashboard']
const FISHERMAN_ONLY = ['/profil']

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

  const space = parseSpace(request.cookies.get(SPACE_COOKIE)?.value) ?? DEFAULT_SPACE

  // Déjà connecté sur une page d'auth → home de son espace
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL(spaceHome(space), request.url))
  }

  // Filtrage par espace : on redirige vers l'espace actif (avec un indice pour l'UI).
  if (user) {
    const wrongSpace =
      (space === 'fisherman' && ORGANIZER_ONLY.some((r) => path.startsWith(r))) ||
      (space === 'organizer' && FISHERMAN_ONLY.some((r) => path.startsWith(r)))
    if (wrongSpace) {
      const url = request.nextUrl.clone()
      url.pathname = spaceHome(space)
      url.search = ''
      url.searchParams.set('espace', space)
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
