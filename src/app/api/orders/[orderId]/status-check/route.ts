import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { verifyPayment } from "@/lib/payment";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { orderId } = await params;

  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = rows[0];

  if (!order || order.userId !== session.userId) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  // Si toujours en attente, on revérifie activement auprès de l'agrégateur
  // (utile en mode CinetPay réel si le webhook n'est pas encore arrivé).
  if (order.status === "PENDING") {
    const verification = await verifyPayment(order.reference);
    if (verification.status === "PAID") {
      await db
        .update(orders)
        .set({ status: "PAID", paidAt: new Date() })
        .where(eq(orders.id, order.id));
      return NextResponse.json({ status: "PAID", reference: order.reference });
    }
    if (verification.status === "FAILED") {
      await db
        .update(orders)
        .set({ status: "FAILED" })
        .where(eq(orders.id, order.id));
      return NextResponse.json({ status: "FAILED", reference: order.reference });
    }
  }

  return NextResponse.json({ status: order.status, reference: order.reference });
}
