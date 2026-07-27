import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Les photos de prises transitent par une Server Action (limite par défaut 1 Mo).
    // On aligne sur le plafond applicatif de l'upload (8 Mo) avec un peu de marge.
    serverActions: {
      bodySizeLimit: '12mb',
    },
  },
};

export default nextConfig;
