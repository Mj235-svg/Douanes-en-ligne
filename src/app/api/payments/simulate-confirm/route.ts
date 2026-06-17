import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getPaymentMode } from "@/lib/payment";

/**
 * Cette route n'existe QUE pour le mode simulation/développement.
 * Elle permet de marquer une commande comme payée sans passer par un vrai
 * agrégateur, pour tester tout le parcours étudiant. Elle est désactivée
 * automatiquement si PAYMENT_MODE="cinetpay" (paiement réel).
 */
export async function POST(req: NextRequest) {
  if (getPaymentMode() !== "simulation") {
    return NextResponse.json(
      { error: "Cette action n'est disponible qu'en mode simulation" },
      { status: 403 }
    );
  }

  try {
    const { reference, succeed } = await req.json();
    if (!reference) {
      return NextResponse.json({ error: "Référence manquante" }, { status: 400 });
    }

    const orderRows = await db
      .select()
      .from(orders)
      .where(eq(orders.reference, reference))
      .limit(1);
    const order = orderRows[0];
    if (!order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    if (succeed === false) {
      await db
        .update(orders)
        .set({ status: "FAILED" })
        .where(eq(orders.id, order.id));
      return NextResponse.json({ success: true, status: "FAILED" });
    }

    await db
      .update(orders)
      .set({ status: "PAID", paidAt: new Date() })
      .where(eq(orders.id, order.id));

    return NextResponse.json({ success: true, status: "PAID", orderId: order.id });
  } catch (error) {
    console.error("Erreur simulation paiement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
