import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// CarpStrike utilise .env.local (comme Next.js) ; on le charge en priorité,
// puis .env en repli.
loadEnv({ path: ".env.local" });
loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
