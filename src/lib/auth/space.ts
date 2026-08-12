/**
 * « Espace » de session : organisateur ou pêcheur — helpers PURS (aucune dépendance
 * à next/headers), donc importables depuis le proxy (middleware) comme du serveur.
 *
 * Un email = un seul compte Supabase (unicité). L'espace choisi à la connexion détermine
 * la partie du site accessible pour la session ; la bascule est possible sans se reconnecter.
 */
export type SpaceMode = 'organizer' | 'fisherman'

export const SPACE_COOKIE = 'cs_space'
export const DEFAULT_SPACE: SpaceMode = 'fisherman'

/** Home de chaque espace. */
export function spaceHome(mode: SpaceMode): string {
  return mode === 'organizer' ? '/dashboard' : '/profil'
}

export function parseSpace(value: string | undefined | null): SpaceMode | null {
  return value === 'organizer' || value === 'fisherman' ? value : null
}

export const SPACE_LABEL: Record<SpaceMode, string> = {
  organizer: 'Organisateur',
  fisherman: 'Pêcheur',
}
