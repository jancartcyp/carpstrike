-- Lancer de précision (SPEC 4.6) : deux lancers par équipe, distance à la cible en cm.
-- Colonnes nullables ajoutées à Team ; aucune donnée existante impactée.
ALTER TABLE "public"."Team" ADD COLUMN IF NOT EXISTS "throw1Cm" INTEGER;
ALTER TABLE "public"."Team" ADD COLUMN IF NOT EXISTS "throw2Cm" INTEGER;
