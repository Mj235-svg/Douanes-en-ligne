import { NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { orders, courses } from "@/db/schema";
import { requireAuth } from "@/lib/guards";

export async function GET() {
  const guard = await requireAuth();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const rows = await db
    .select({
      orderId: orders.id,
      reference: orders.reference,
      paidAt: orders.paidAt,
      amountXAF: orders.amountXAF,
      courseId: courses.id,
      title: courses.title,
      slug: courses.slug,
      coverImageUrl: courses.coverImageUrl,
      fileName: courses.fileName,
    })
    .from(orders)
    .innerJoin(courses, eq(orders.courseId, courses.id))
    .where(and(eq(orders.userId, guard.session.userId), eq(orders.status, "PAID")))
    .orderBy(desc(orders.paidAt));

  return NextResponse.json({ purchasedCourses: rows });
}
