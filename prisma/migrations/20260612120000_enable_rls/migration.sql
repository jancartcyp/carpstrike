-- Sécurité : active Row Level Security (RLS) sur toutes les tables du schéma public.
-- L'app n'utilise PAS l'API de données Supabase (PostgREST) — tout passe par Prisma
-- (connexion propriétaire, qui contourne la RLS). Activer la RLS SANS policy verrouille
-- donc l'accès via la clé anon publique, sans impacter l'application.
-- ENABLE ROW LEVEL SECURITY est idempotent (aucune erreur si déjà activé).

ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Enduro" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Sector" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."TeamMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."RegistrationRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Catch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Commissaire" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Communication" ENABLE ROW LEVEL SECURITY;

-- Table technique de Prisma (également exposée dans public).
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
