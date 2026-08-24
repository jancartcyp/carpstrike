-- Plan des postes : image téléversée par l'organisateur, affichée aux participants.
ALTER TABLE "public"."Enduro" ADD COLUMN IF NOT EXISTS "pegMapUrl" TEXT;
