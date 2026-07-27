import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Le pooler Supabase en mode session (port 5432) est limité à 15 connexions.
  // En serverless (Vercel), chaque instance ouvre son propre pool `pg` (max 10 par défaut) →
  // quelques instances suffisent à saturer les 15 et à faire pendre toutes les requêtes.
  // On borne donc le pool à peu de connexions par instance + fermeture rapide des connexions inactives.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    idleTimeoutMillis: 10_000,
  })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
