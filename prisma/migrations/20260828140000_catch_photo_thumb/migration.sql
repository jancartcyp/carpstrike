-- Miniature des photos de prises : affichée dans les listes et galeries (~18 Ko au lieu de ~220 Ko).
-- Nullable : les photos enregistrées avant la compression n'en ont pas et retombent sur photoUrl.
ALTER TABLE "public"."Catch" ADD COLUMN IF NOT EXISTS "photoThumbUrl" TEXT;
