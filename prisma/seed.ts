import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seed CarpStrike…')

  // Nettoyage (ordre inverse des dépendances)
  await prisma.catch.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.communication.deleteMany()
  await prisma.registrationRequest.deleteMany()
  await prisma.team.deleteMany()
  await prisma.commissaire.deleteMany()
  await prisma.sector.deleteMany()
  await prisma.enduro.deleteMany()
  await prisma.user.deleteMany()

  // ── Utilisateurs ──
  const organizer = await prisma.user.create({
    data: {
      email: 'orga@carpstrike.test',
      role: 'ORGANIZER',
      firstName: 'Marc',
      lastName: 'Dubois',
      phone: '0612345678',
    },
  })

  const fisherman = await prisma.user.create({
    data: {
      email: 'pecheur@carpstrike.test',
      role: 'FISHERMAN',
      firstName: 'Julien',
      lastName: 'Moreau',
      phone: '0698765432',
    },
  })

  // ── Enduro LIVE ──
  const now = new Date()
  const startAt = new Date(now.getTime() - 12 * 60 * 60 * 1000) // commencé il y a 12 h
  const endAt = new Date(now.getTime() + 36 * 60 * 60 * 1000) // se termine dans 36 h

  const enduro = await prisma.enduro.create({
    data: {
      organizerId: organizer.id,
      name: 'Enduro des Étangs de Saulieu',
      slug: 'enduro-etangs-saulieu-2026',
      description: 'Un enduro de 48h sur un plan d’eau mythique. Grosses carpes garanties.',
      status: 'LIVE',
      mode: 'WITH_REGISTRATION',
      startAt,
      endAt,
      durationHours: 48,
      locationName: 'Étangs de Saulieu',
      address: 'Route du Lac',
      postalCode: '21210',
      lat: 47.2807,
      lng: 4.2306,
      maxTeams: 20,
      maxFishersPerTeam: 2,
      registrationFee: 12000, // 120 €
      prizePool: 300000, // 3000 €
      theme: 'Carpe de nuit',
      rulesText: 'No-kill obligatoire. Maille à 3 kg. Photos contrôlées par les commissaires.',
      minWeightKg: 3.0,
    },
  })

  // ── Secteurs ──
  const sectorsData = [
    { name: 'A', color: '#e8212b' },
    { name: 'B', color: '#f0a500' },
    { name: 'C', color: '#00c850' },
    { name: 'D', color: '#4a9eff' },
  ]
  const sectors = []
  for (const s of sectorsData) {
    sectors.push(
      await prisma.sector.create({ data: { enduroId: enduro.id, name: s.name, color: s.color } })
    )
  }

  // ── Commissaire ──
  const commissaire = await prisma.commissaire.create({
    data: {
      enduroId: enduro.id,
      username: 'pdurand.enduro-etangs-saulieu-2026',
      passwordHash: 'SEED-PLACEHOLDER-HASH',
      displayName: 'Pierre Durand',
      active: true,
    },
  })

  // ── Équipes (réparties sur les secteurs) ──
  const teamsData = [
    { name: 'Les Traqueurs', sector: 0, peg: 1 },
    { name: 'Carpe Diem', sector: 0, peg: 2 },
    { name: 'Big Fish Crew', sector: 1, peg: 5 },
    { name: 'Les Noctambules', sector: 1, peg: 6 },
    { name: 'Strike Force', sector: 2, peg: 9 },
    { name: 'Team Mirror', sector: 3, peg: 13 },
  ]

  const teams = []
  for (const t of teamsData) {
    const team = await prisma.team.create({
      data: {
        enduroId: enduro.id,
        name: t.name,
        sectorId: sectors[t.sector].id,
        pegNumber: t.peg,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        members: {
          create: [
            {
              userId: t.name === 'Les Traqueurs' ? fisherman.id : null,
              firstName: t.name === 'Les Traqueurs' ? fisherman.firstName : 'Capitaine',
              lastName: t.name === 'Les Traqueurs' ? fisherman.lastName : t.name,
              email: t.name === 'Les Traqueurs' ? fisherman.email : null,
              isCaptain: true,
            },
            {
              firstName: 'Équipier',
              lastName: t.name,
              isCaptain: false,
            },
          ],
        },
      },
    })
    teams.push(team)
  }

  // ── Prises (quelques captures réparties) ──
  const species = ['COMMUNE', 'MIROIR', 'CUIR', 'KOI', 'AMOUR_BLANC'] as const
  const catchesData = [
    { team: 0, weight: 8.4, sp: 1 },
    { team: 0, weight: 12.1, sp: 0 },
    { team: 1, weight: 5.7, sp: 2 },
    { team: 2, weight: 15.3, sp: 1 },
    { team: 2, weight: 9.9, sp: 0 },
    { team: 3, weight: 6.2, sp: 4 },
    { team: 4, weight: 18.6, sp: 1 },
    { team: 5, weight: 4.1, sp: 3 },
  ]

  for (const c of catchesData) {
    await prisma.catch.create({
      data: {
        enduroId: enduro.id,
        teamId: teams[c.team].id,
        commissaireId: commissaire.id,
        weightKg: c.weight,
        species: species[c.sp],
        photoUrl: 'https://placehold.co/600x400/0a0908/e8212b?text=Carpe',
        status: 'VALID',
        caughtAt: new Date(now.getTime() - Math.random() * 10 * 60 * 60 * 1000),
      },
    })
  }

  // ── Paiement des frais organisateur ──
  await prisma.payment.create({
    data: {
      type: 'ORGANIZER_FEE',
      enduroId: enduro.id,
      userId: organizer.id,
      amountCents: 5000, // 50 € (mode WITH_REGISTRATION)
      status: 'PAID',
      paidAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    },
  })

  console.log(`✅ Seed terminé :`)
  console.log(`   - ${2} utilisateurs (1 orga, 1 pêcheur)`)
  console.log(`   - 1 enduro LIVE « ${enduro.name} »`)
  console.log(`   - ${sectors.length} secteurs, ${teams.length} équipes, ${catchesData.length} prises`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
