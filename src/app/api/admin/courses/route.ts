import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { requireAdmin } from "@/lib/guards";
import { generateId, slugify } from "@/lib/utils-id";

const createCourseSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  priceXAF: z.number().int().positive(),
  fileUrl: z.string().min(1),
  fileName: z.string().min(1),
  coverImageUrl: z.string().optional(),
  categoryId: z.string().optional(),
});

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const rows = await db.select().from(courses);
  return NextResponse.json({ courses: rows });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body = await req.json();
    const parsed = createCourseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Données invalides" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const now = new Date();
    const id = generateId("course");
    let slug = slugify(data.title);

    // S'assurer que le slug est unique en ajoutant un suffixe si besoin
    const existing = await db.select().from(courses);
    const slugsUsed = new Set(existing.map((c) => c.slug));
    if (slugsUsed.has(slug)) {
      slug = `${slug}-${id.slice(-5)}`;
    }

    await db.insert(courses).values({
      id,
      title: data.title,
      slug,
      description: data.description,
      priceXAF: data.priceXAF,
      coverImageUrl: data.coverImageUrl || null,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      categoryId: data.categoryId || null,
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, courseId: id, slug });
  } catch (error) {
    console.error("Erreur création cours:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
