import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { courses, orders, users } from "@/db/schema";
import { requireAuth } from "@/lib/guards";
import { generateId, generateOrderReference } from "@/lib/utils-id";
import { initiatePayment } from "@/lib/payment";

const createOrderSchema = z.object({
  courseId: z.string().min(1),
  operatorPhone: z.string().min(8, "Numéro de téléphone invalide"),
  paymentMethod: z.enum(["ORANGE_MONEY", "MTN_MOMO"]),
});

export async function POST(req: NextRequest) {
  const guard = await requireAuth();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Données invalides" },
        { status: 400 }
      );
    }
    const { courseId, operatorPhone, paymentMethod } = parsed.data;

    const courseRows = await db
      .select()
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.isPublished, true)))
      .limit(1);
    const course = courseRows[0];
    if (!course) {
      return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });
    }

    // Empêcher un double achat si déjà payé
    const existingPaid = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.userId, guard.session.userId),
          eq(orders.courseId, courseId),
          eq(orders.status, "PAID")
        )
      )
      .limit(1);
    if (existingPaid.length > 0) {
      return NextResponse.json({
        success: true,
        alreadyPurchased: true,
        orderId: existingPaid[0].id,
      });
    }

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, guard.session.userId))
      .limit(1);
    const user = userRows[0];

    const orderId = generateId("order");
    const reference = generateOrderReference();
    const now = new Date();

    await db.insert(orders).values({
      id: orderId,
      reference,
      amountXAF: course.priceXAF,
      status: "PENDING",
      paymentMethod,
      operatorPhone,
      userId: guard.session.userId,
      courseId,
      createdAt: now,
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const result = await initiatePayment({
      orderReference: reference,
      amountXAF: course.priceXAF,
      description: `Achat du cours : ${course.title}`,
      customerName: user.fullName,
      customerEmail: user.email,
      customerPhone: operatorPhone,
      returnUrl: `${baseUrl}/commande/${orderId}/confirmation`,
      notifyUrl: `${baseUrl}/api/payments/webhook`,
    });

    if (!result.success) {
      await db
        .update(orders)
        .set({ status: "FAILED" })
        .where(eq(orders.id, orderId));
      return NextResponse.json(
        { error: result.errorMessage || "Impossible d'initier le paiement" },
        { status: 502 }
      );
    }

    if (result.externalTxId) {
      await db
        .update(orders)
        .set({ externalTxId: result.externalTxId })
        .where(eq(orders.id, orderId));
    }

    return NextResponse.json({
      success: true,
      orderId,
      reference,
      paymentUrl: result.paymentUrl,
    });
  } catch (error) {
    console.error("Erreur création commande:", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
