import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export type CertificateData = {
  enduroName: string
  locationName: string
  dateLabel: string // ex. « 12 juin 2026 »
  teamName: string
  members: string[]
  rank: number
  totalKg: number
  catches: number
  biggestKg: number
}

const GREEN = rgb(0.18, 0.63, 0.35)
const DARK = rgb(0.05, 0.04, 0.03)
const GREY = rgb(0.42, 0.42, 0.42)

function ordinalFr(n: number): string {
  return n === 1 ? '1re' : `${n}e`
}

function titleForRank(rank: number): string {
  if (rank === 1) return 'CHAMPION'
  if (rank <= 3) return 'PODIUM'
  return 'CERTIFICAT DE PARTICIPATION'
}

/** Génère le PDF d'un certificat (A4 paysage) pour une équipe. Renvoie les octets du PDF. */
export async function buildCertificatePdf(d: CertificateData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([841.89, 595.28]) // A4 paysage
  const { width, height } = page.getSize()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const center = (text: string, y: number, size: number, f = font, color = DARK) => {
    const w = f.widthOfTextAtSize(text, size)
    page.drawText(text, { x: (width - w) / 2, y, size, font: f, color })
  }

  // Cadres décoratifs.
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.99, 0.99, 0.98) })
  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: GREEN, borderWidth: 3 })
  page.drawRectangle({ x: 34, y: 34, width: width - 68, height: height - 68, borderColor: rgb(0.85, 0.85, 0.82), borderWidth: 1 })

  // Marque + accent.
  center('CARP  STRIKE', height - 96, 26, bold, DARK)
  page.drawRectangle({ x: (width - 120) / 2, y: height - 112, width: 120, height: 3, color: rgb(0.85, 0.16, 0.16) })

  // Titre.
  center(titleForRank(d.rank), height - 176, 40, bold, GREEN)
  if (d.rank <= 3) {
    center(`${ordinalFr(d.rank)} place au classement général`, height - 206, 15, font, GREY)
  }

  // Équipe.
  center('décerné à', height - 256, 13, font, GREY)
  center(d.teamName, height - 298, 34, bold, DARK)
  if (d.members.length > 0) {
    center(d.members.join('  ·  '), height - 326, 14, font, GREY)
  }

  // Contexte enduro.
  center(`pour sa participation à l'enduro « ${d.enduroName} »`, height - 372, 15, font, DARK)
  center(`${d.locationName} — ${d.dateLabel}`, height - 396, 13, font, GREY)

  // Statistiques (3 colonnes).
  const stats: [string, string][] = [
    [`${d.totalKg.toFixed(1)} kg`, 'Poids total'],
    [String(d.catches), d.catches > 1 ? 'Prises validées' : 'Prise validée'],
    [`${d.biggestKg.toFixed(1)} kg`, 'Plus grosse prise'],
  ]
  const colW = (width - 200) / 3
  const yVal = height - 452
  stats.forEach(([val, label], i) => {
    const cx = 100 + colW * i + colW / 2
    const vw = bold.widthOfTextAtSize(val, 22)
    page.drawText(val, { x: cx - vw / 2, y: yVal, size: 22, font: bold, color: GREEN })
    const lw = font.widthOfTextAtSize(label, 11)
    page.drawText(label, { x: cx - lw / 2, y: yVal - 18, size: 11, font, color: GREY })
  })

  // Pied de page.
  center(`Délivré par CarpStrike — ${d.dateLabel}`, 54, 10, font, GREY)

  return doc.save()
}
