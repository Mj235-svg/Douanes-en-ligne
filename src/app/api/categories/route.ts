import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/guards";
import { generateId, slugify } from "@/lib/utils-id";

export async function GET() {
  const rows = await db.select().from(categories);
  return NextResponse.json({ categories: rows });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { name } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  const id = generateId("cat");
  await db.insert(categories).values({
    id,
    name,
    slug: slugify(name),
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true, id });
}
