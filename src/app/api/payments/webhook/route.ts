import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { verifyPayment } from "@/lib/payment";

/**
 * Ce webhook est appelé par CinetPay (en production) pour notifier qu'un
 * paiement a été effectué. Par sécurité, on ne fait JAMAIS confiance
 * directement aux données reçues : on rappelle l'API de l'agrégateur pour
 * vérifier le statut réel de la transaction avant de marquer la commande
 * comme payée. C'est une protection essentielle contre les faux appels.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const reference =
      body.cpm_trans_id || body.transaction_id || body.orderReference;

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

    if (order.status === "PAID") {
      return NextResponse.json({ success: true, alreadyConfirmed: true });
    }

    const verification = await verifyPayment(reference);

    if (verification.status === "PAID") {
      await db
        .update(orders)
        .set({
          status: "PAID",
          paidAt: new Date(),
          externalTxId: verification.externalTxId || order.externalTxId,
        })
        .where(eq(orders.id, order.id));
      return NextResponse.json({ success: true, status: "PAID" });
    }

    if (verification.status === "FAILED") {
      await db
        .update(orders)
        .set({ status: "FAILED" })
        .where(eq(orders.id, order.id));
      return NextResponse.json({ success: true, status: "FAILED" });
    }

    return NextResponse.json({ success: true, status: "PENDING" });
  } catch (error) {
    console.error("Erreur webhook paiement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
