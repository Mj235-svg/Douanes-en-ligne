import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { orders, courses, downloads } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { generateId } from "@/lib/utils-id";
import { readCourseFile } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Veuillez vous connecter" }, { status: 401 });
  }

  const { orderId } = await params;

  // Vérification stricte : la commande doit appartenir à l'utilisateur connecté
  // ET être au statut PAID. C'est le seul verrou qui protège le fichier.
  const orderRows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, session.userId)))
    .limit(1);

  const order = orderRows[0];
  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  if (order.status !== "PAID") {
    return NextResponse.json(
      { error: "Le paiement n'a pas encore été confirmé pour cette commande" },
      { status: 402 } // 402 Payment Required
    );
  }

  const courseRows = await db
    .select()
    .from(courses)
    .where(eq(courses.id, order.courseId))
    .limit(1);
  const course = courseRows[0];
  if (!course) {
    return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });
  }

  try {
    const fileBuffer = await readCourseFile(course.fileUrl);

    // On enregistre chaque téléchargement, utile pour les statistiques
    // et pour permettre à l'étudiant de re-télécharger plus tard sans repayer.
    await db.insert(downloads).values({
      id: generateId("dl"),
      userId: session.userId,
      courseId: course.id,
      orderId: order.id,
      ipAddress: req.headers.get("x-forwarded-for") || null,
      downloadedAt: new Date(),
    });

    const ext = path.extname(course.fileName).toLowerCase();
    const contentType =
      ext === ".pdf"
        ? "application/pdf"
        : ext === ".zip"
        ? "application/zip"
        : "application/octet-stream";

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          course.fileName
        )}"`,
      },
    });
  } catch (error) {
    console.error("Erreur lecture fichier:", error);
    return NextResponse.json(
      { error: "Le fichier du cours est introuvable sur le serveur" },
      { status: 500 }
    );
  }
}
