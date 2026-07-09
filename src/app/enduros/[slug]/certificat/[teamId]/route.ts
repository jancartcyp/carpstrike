import { buildCertificatePdf } from '@/lib/certificate'
import { prisma } from '@/lib/prisma'
import { getEnduroResults } from '@/lib/ranking'

function slugifyFilename(s: string): string {
  // NFD décompose les accents ; le strip non-alphanumérique retire les marques restantes.
  return (
    s
      .normalize('NFD')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .toLowerCase() || 'certificat'
  )
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; teamId: string }> }
) {
  const { slug, teamId } = await params

  // Uniquement pour un enduro CLÔTURÉ (getEnduroResults renvoie null sinon).
  const results = await getEnduroResults(slug)
  if (!results) return new Response('Résultats indisponibles.', { status: 404 })

  const entry = results.general.find((t) => t.id === teamId)
  if (!entry) return new Response('Équipe introuvable.', { status: 404 })

  const team = await prisma.team.findFirst({
    where: { id: teamId, enduroId: results.enduro.id },
    include: { members: { orderBy: { isCaptain: 'desc' } } },
  })
  const members = team ? team.members.map((m) => `${m.firstName} ${m.lastName}`.trim()) : []

  const dateLabel = results.enduro.startAt.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const pdf = await buildCertificatePdf({
    enduroName: results.enduro.name,
    locationName: results.enduro.locationName,
    dateLabel,
    teamName: entry.name,
    members,
    rank: entry.rank,
    totalKg: entry.total,
    catches: entry.catches,
    biggestKg: entry.biggest,
  })

  const filename = `certificat-${slugifyFilename(results.enduro.name)}-${slugifyFilename(entry.name)}.pdf`

  return new Response(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
