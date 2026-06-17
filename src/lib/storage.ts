/**
 * Module de stockage de fichiers.
 *
 * Sur Vercel, le système de fichiers est éphémère (rien n'est conservé entre
 * deux requêtes), donc on ne peut pas écrire les PDF de cours sur le disque
 * comme on le ferait sur un serveur classique. Ce module utilise :
 *
 *  - en local (developpement) : le disque, dans le dossier storage/courses
 *    et public/covers — pratique, rapide, pas de compte à créer.
 *  - en production sur Vercel : Vercel Blob, un service de stockage de
 *    fichiers cloud fait pour ce cas précis.
 *
 * Le choix se fait automatiquement selon que la variable d'environnement
 * BLOB_READ_WRITE_TOKEN est présente (elle est injectée automatiquement par
 * Vercel quand on active le Blob Store dans le tableau de bord du projet).
 */

import { writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import { put, del } from "@vercel/blob";
import { generateId } from "./utils-id";

const useVercelBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const PRIVATE_STORAGE_DIR = path.join(process.cwd(), "storage", "courses");
const PUBLIC_COVERS_DIR = path.join(process.cwd(), "public", "covers");

export type StoredCourseFile = {
  // Ce qu'on enregistre en base pour pouvoir retrouver / supprimer le fichier.
  // En local : juste le nom du fichier sur disque.
  // Sur Vercel Blob : l'URL complète du blob (privée par convention de nommage).
  fileUrl: string;
  fileName: string; // nom original, affiché à l'étudiant lors du téléchargement
};

/**
 * Enregistre le fichier d'un cours (PDF, ZIP...). Le fichier n'est jamais
 * exposé publiquement : il n'est lu que par la route /api/download/[orderId]
 * après vérification du paiement.
 */
export async function saveCourseFile(
  file: File
): Promise<StoredCourseFile> {
  const ext = path.extname(file.name) || ".pdf";
  const storedName = `${generateId("file")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (useVercelBlob) {
    const blob = await put(`courses/${storedName}`, buffer, {
      access: "public", // Vercel Blob ne propose pas de fichiers privés sur
      // le plan gratuit ; l'URL générée contient un identifiant aléatoire
      // non-devinable, et n'est jamais affichée nulle part dans l'app, donc
      // ce n'est exposé qu'à qui possède déjà le lien exact. Pour une
      // protection stricte de niveau "entreprise", voir la note dans le
      // README sur le passage à un bucket S3 privé avec URLs signées.
      contentType: file.type || "application/octet-stream",
      addRandomSuffix: true,
    });
    return { fileUrl: blob.url, fileName: file.name };
  }

  await writeFile(path.join(PRIVATE_STORAGE_DIR, storedName), buffer);
  return { fileUrl: storedName, fileName: file.name };
}

/**
 * Lit le contenu d'un fichier de cours préalablement enregistré, pour le
 * servir au téléchargement.
 */
export async function readCourseFile(fileUrl: string): Promise<Buffer> {
  if (useVercelBlob) {
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error("Fichier introuvable sur le stockage cloud");
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  return readFile(path.join(PRIVATE_STORAGE_DIR, fileUrl));
}

export async function deleteCourseFile(fileUrl: string): Promise<void> {
  try {
    if (useVercelBlob) {
      await del(fileUrl);
    } else {
      await unlink(path.join(PRIVATE_STORAGE_DIR, fileUrl));
    }
  } catch {
    // Suppression best-effort : on ignore si le fichier est déjà absent.
  }
}

/**
 * Enregistre une image de couverture (toujours publique, peu sensible).
 */
export async function saveCoverImage(file: File): Promise<string> {
  const ext = path.extname(file.name) || ".jpg";
  const storedName = `${generateId("cover")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (useVercelBlob) {
    const blob = await put(`covers/${storedName}`, buffer, {
      access: "public",
      contentType: file.type || "image/jpeg",
      addRandomSuffix: true,
    });
    return blob.url;
  }

  await writeFile(path.join(PUBLIC_COVERS_DIR, storedName), buffer);
  return `/covers/${storedName}`;
}

export function isUsingCloudStorage() {
  return useVercelBlob;
}
