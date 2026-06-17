import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { courses, categories } from "@/db/schema";

export async function GET(req: NextRequest) {
  const categorySlug = req.nextUrl.searchParams.get("category");

  const rows = await db
    .select({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
      description: courses.description,
      priceXAF: courses.priceXAF,
      coverImageUrl: courses.coverImageUrl,
      fileName: courses.fileName,
      createdAt: courses.createdAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .where(
      categorySlug
        ? and(eq(courses.isPublished, true), eq(categories.slug, categorySlug))
        : eq(courses.isPublished, true)
    );

  return NextResponse.json({ courses: rows });
}
