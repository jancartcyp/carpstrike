/**
 * Diffuse un signal « mise à jour » sur le canal broadcast d'un enduro (Supabase Realtime).
 *
 * On passe par l'endpoint HTTP de broadcast : pas de connexion websocket persistante côté
 * serveur, et surtout le broadcast NE dépend PAS des policies RLS des tables (contrairement à
 * postgres_changes). C'est donc compatible avec notre posture « RLS deny-all + accès Prisma ».
 *
 * Non bloquant : toute erreur (réseau, realtime indisponible) est silencieusement ignorée —
 * le polling de secours côté client prend le relais.
 */
export async function broadcastEnduroUpdate(enduroId: string): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        messages: [{ topic: `enduro-${enduroId}`, event: 'update', payload: { at: Date.now() } }],
      }),
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout))
  } catch {
    // Realtime best-effort : on n'échoue jamais une action métier à cause du broadcast.
  }
}
