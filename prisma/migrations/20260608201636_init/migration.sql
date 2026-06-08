-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ORGANIZER', 'FISHERMAN');

-- CreateEnum
CREATE TYPE "EnduroStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'LIVE', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EnduroMode" AS ENUM ('MANAGED_ONLY', 'WITH_REGISTRATION');

-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('PENDING', 'CONFIRMED', 'WAITLIST', 'REJECTED');

-- CreateEnum
CREATE TYPE "TeamPaymentStatus" AS ENUM ('NONE', 'AWAITING', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID', 'EXPIRED');

-- CreateEnum
CREATE TYPE "Species" AS ENUM ('COMMUNE', 'MIROIR', 'CUIR', 'KOI', 'AMOUR_BLANC');

-- CreateEnum
CREATE TYPE "CatchStatus" AS ENUM ('VALID', 'CONTESTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('ORGANIZER_FEE', 'REGISTRATION_FEE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CommunicationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- CreateEnum
CREATE TYPE "CommunicationRecipients" AS ENUM ('ALL', 'CONFIRMED', 'WAITLIST', 'PENDING');

-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('EMAIL', 'NOTIF', 'SMS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enduro" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "EnduroStatus" NOT NULL DEFAULT 'DRAFT',
    "mode" "EnduroMode" NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "locationName" TEXT NOT NULL,
    "address" TEXT,
    "postalCode" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "maxTeams" INTEGER NOT NULL,
    "maxFishersPerTeam" INTEGER NOT NULL DEFAULT 2,
    "registrationFee" INTEGER NOT NULL DEFAULT 0,
    "prizePool" INTEGER,
    "theme" TEXT,
    "rulesText" TEXT,
    "minWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enduro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sector" (
    "id" TEXT NOT NULL,
    "enduroId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "enduroId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sectorId" TEXT,
    "pegNumber" INTEGER,
    "status" "TeamStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "TeamPaymentStatus" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationRequest" (
    "id" TEXT NOT NULL,
    "enduroId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "members" JSONB NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "paymentDeadline" TIMESTAMP(3),
    "rejectionReason" TEXT,

    CONSTRAINT "RegistrationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Catch" (
    "id" TEXT NOT NULL,
    "enduroId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "commissaireId" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "species" "Species" NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "caughtAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "CatchStatus" NOT NULL DEFAULT 'VALID',
    "note" TEXT,

    CONSTRAINT "Catch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commissaire" (
    "id" TEXT NOT NULL,
    "enduroId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commissaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "type" "PaymentType" NOT NULL,
    "enduroId" TEXT NOT NULL,
    "teamId" TEXT,
    "userId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "stripeSessionId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" TEXT NOT NULL,
    "enduroId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" "CommunicationPriority" NOT NULL DEFAULT 'NORMAL',
    "recipients" "CommunicationRecipients" NOT NULL DEFAULT 'ALL',
    "channels" "CommunicationChannel"[],
    "sentAt" TIMESTAMP(3),
    "sentById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Enduro_slug_key" ON "Enduro"("slug");

-- CreateIndex
CREATE INDEX "Enduro_organizerId_idx" ON "Enduro"("organizerId");

-- CreateIndex
CREATE INDEX "Enduro_status_idx" ON "Enduro"("status");

-- CreateIndex
CREATE INDEX "Sector_enduroId_idx" ON "Sector"("enduroId");

-- CreateIndex
CREATE INDEX "Team_enduroId_idx" ON "Team"("enduroId");

-- CreateIndex
CREATE INDEX "Team_sectorId_idx" ON "Team"("sectorId");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_idx" ON "TeamMember"("teamId");

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE INDEX "RegistrationRequest_enduroId_idx" ON "RegistrationRequest"("enduroId");

-- CreateIndex
CREATE INDEX "RegistrationRequest_status_idx" ON "RegistrationRequest"("status");

-- CreateIndex
CREATE INDEX "Catch_enduroId_idx" ON "Catch"("enduroId");

-- CreateIndex
CREATE INDEX "Catch_teamId_idx" ON "Catch"("teamId");

-- CreateIndex
CREATE INDEX "Catch_commissaireId_idx" ON "Catch"("commissaireId");

-- CreateIndex
CREATE UNIQUE INDEX "Commissaire_username_key" ON "Commissaire"("username");

-- CreateIndex
CREATE INDEX "Commissaire_enduroId_idx" ON "Commissaire"("enduroId");

-- CreateIndex
CREATE INDEX "Payment_enduroId_idx" ON "Payment"("enduroId");

-- CreateIndex
CREATE INDEX "Payment_teamId_idx" ON "Payment"("teamId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Communication_enduroId_idx" ON "Communication"("enduroId");

-- AddForeignKey
ALTER TABLE "Enduro" ADD CONSTRAINT "Enduro_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sector" ADD CONSTRAINT "Sector_enduroId_fkey" FOREIGN KEY ("enduroId") REFERENCES "Enduro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_enduroId_fkey" FOREIGN KEY ("enduroId") REFERENCES "Enduro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationRequest" ADD CONSTRAINT "RegistrationRequest_enduroId_fkey" FOREIGN KEY ("enduroId") REFERENCES "Enduro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catch" ADD CONSTRAINT "Catch_enduroId_fkey" FOREIGN KEY ("enduroId") REFERENCES "Enduro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catch" ADD CONSTRAINT "Catch_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catch" ADD CONSTRAINT "Catch_commissaireId_fkey" FOREIGN KEY ("commissaireId") REFERENCES "Commissaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commissaire" ADD CONSTRAINT "Commissaire_enduroId_fkey" FOREIGN KEY ("enduroId") REFERENCES "Enduro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_enduroId_fkey" FOREIGN KEY ("enduroId") REFERENCES "Enduro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_enduroId_fkey" FOREIGN KEY ("enduroId") REFERENCES "Enduro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
