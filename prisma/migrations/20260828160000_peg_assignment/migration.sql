-- Méthode d'attribution des postes choisie par l'organisateur.
-- Valeur par défaut PRECISION_THROW : préserve le comportement des enduros existants
-- (l'onglet « Lancer » reste disponible pour eux).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PegAssignment') THEN
    CREATE TYPE "public"."PegAssignment" AS ENUM ('PRECISION_THROW', 'SINGLE_DRAW', 'DOUBLE_DRAW', 'OTHER');
  END IF;
END
$$;

ALTER TABLE "public"."Enduro"
  ADD COLUMN IF NOT EXISTS "pegAssignment" "public"."PegAssignment" NOT NULL DEFAULT 'PRECISION_THROW';

ALTER TABLE "public"."Enduro"
  ADD COLUMN IF NOT EXISTS "pegAssignmentNote" TEXT;
