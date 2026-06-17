import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { courses, categories, orders } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const rows = await db
    .select({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
      description: courses.description,
      priceXAF: courses.priceXAF,
      coverImageUrl: courses.coverImageUrl,
      fileName: courses.fileName,
      categoryName: categories.name,
    })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .where(and(eq(courses.slug, slug), eq(courses.isPublished, true)))
    .limit(1);

  const course = rows[0];
  if (!course) {
    return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });
  }

  // Vérifier si l'utilisateur connecté a déjà payé pour ce cours
  let alreadyPurchased = false;
  const session = await getSession();
  if (session) {
    const paidOrder = await db
      .select({ id: orders.id })
      .from(orders)
      .where(
        and(
          eq(orders.userId, session.userId),
          eq(orders.courseId, course.id),
          eq(orders.status, "PAID")
        )
      )
      .limit(1);
    alreadyPurchased = paidOrder.length > 0;
  }

  return NextResponse.json({ course, alreadyPurchased });
}
