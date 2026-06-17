import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guards";
import { saveCourseFile, saveCoverImage } from "@/lib/storage";

const MAX_COURSE_FILE_SIZE = 100 * 1024 * 1024; // 100 Mo
const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5 Mo

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // "course" ou "cover"

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    if (type === "cover") {
      if (file.size > MAX_COVER_SIZE) {
        return NextResponse.json(
          { error: "Image trop volumineuse (max 5 Mo)" },
          { status: 400 }
        );
      }
      const url = await saveCoverImage(file);
      return NextResponse.json({ url });
    }

    // type === "course" (par défaut)
    if (file.size > MAX_COURSE_FILE_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 100 Mo)" },
        { status: 400 }
      );
    }
    const stored = await saveCourseFile(file);
    return NextResponse.json(stored);
  } catch (error) {
    console.error("Erreur upload:", error);
    return NextResponse.json({ error: "Échec de l'upload" }, { status: 500 });
  }
}
