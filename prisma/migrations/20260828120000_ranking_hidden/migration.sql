-- Permet à l'organisateur de masquer le classement live au public (suspense),
-- tout en continuant à le voir lui-même.
ALTER TABLE "public"."Enduro" ADD COLUMN IF NOT EXISTS "rankingHidden" BOOLEAN NOT NULL DEFAULT false;
