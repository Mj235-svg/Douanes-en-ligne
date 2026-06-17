import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { requireAdmin } from "@/lib/guards";
import { deleteCourseFile } from "@/lib/storage";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { id } = await params;
  const body = await req.json();

  const allowedFields: Record<string, unknown> = {};
  if (typeof body.title === "string") allowedFields.title = body.title;
  if (typeof body.description === "string")
    allowedFields.description = body.description;
  if (typeof body.priceXAF === "number") allowedFields.priceXAF = body.priceXAF;
  if (typeof body.isPublished === "boolean")
    allowedFields.isPublished = body.isPublished;
  if (typeof body.coverImageUrl === "string")
    allowedFields.coverImageUrl = body.coverImageUrl;
  if (typeof body.categoryId === "string")
    allowedFields.categoryId = body.categoryId;

  allowedFields.updatedAt = new Date();

  await db.update(courses).set(allowedFields).where(eq(courses.id, id));

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { id } = await params;

  const existing = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (existing[0]) {
    await deleteCourseFile(existing[0].fileUrl);
  }

  await db.delete(courses).where(eq(courses.id, id));

  return NextResponse.json({ success: true });
}
