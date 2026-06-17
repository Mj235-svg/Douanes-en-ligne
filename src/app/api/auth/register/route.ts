import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { generateId } from "@/lib/utils-id";

const registerSchema = z.object({
  fullName: z.string().min(2, "Le nom complet est trop court"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide").optional(),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Données invalides" },
        { status: 400 }
      );
    }

    const { fullName, email, phone, password } = parsed.data;

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();
    const userId = generateId("user");

    await db.insert(users).values({
      id: userId,
      fullName,
      email,
      phone: phone || null,
      passwordHash,
      role: "STUDENT",
      createdAt: now,
      updatedAt: now,
    });

    const token = createSessionToken({ userId, role: "STUDENT", email });
    await setSessionCookie(token);

    return NextResponse.json({
      user: { id: userId, fullName, email, role: "STUDENT" },
    });
  } catch (error) {
    console.error("Erreur inscription:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue, veuillez réessayer" },
      { status: 500 }
    );
  }
}
