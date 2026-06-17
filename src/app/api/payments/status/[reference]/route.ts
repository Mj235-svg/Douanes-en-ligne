import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { reference } = await params;

  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.reference, reference))
    .limit(1);

  const order = rows[0];
  if (!order || order.userId !== session.userId) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    status: order.status,
    orderId: order.id,
  });
}
