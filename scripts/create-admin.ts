/**
 * Script pour créer (ou promouvoir) un compte administrateur.
 *
 * Utilisation :
 *   npx tsx scripts/create-admin.ts admin@exemple.com MonMotDePasse "Nom Complet"
 */
import "dotenv/config";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

async function main() {
  const [email, password, fullName] = process.argv.slice(2);

  if (!email || !password) {
    console.error(
      "Usage: npx tsx scripts/create-admin.ts <email> <mot_de_passe> [\"Nom Complet\"]"
    );
    process.exit(1);
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing.length > 0) {
    await db.update(users).set({ role: "ADMIN" }).where(eq(users.email, email));
    console.log(`Le compte ${email} existait déjà et a été promu administrateur.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();

  await db.insert(users).values({
    id: `user_${nanoid(16)}`,
    fullName: fullName || "Administrateur",
    email,
    passwordHash,
    role: "ADMIN",
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Compte administrateur créé avec succès : ${email}`);
}

main().then(() => process.exit(0));
