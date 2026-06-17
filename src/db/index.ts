import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// DATABASE_URL doit être une URL PostgreSQL, fournie automatiquement par
// Vercel dès que vous créez une base "Postgres" (propulsée par Neon) dans
// l'onglet Storage de votre projet. Voir le README pour la procédure.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
