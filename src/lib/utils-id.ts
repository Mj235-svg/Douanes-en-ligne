import { nanoid } from "nanoid";

export function generateId(prefix: string = ""): string {
  return prefix ? `${prefix}_${nanoid(16)}` : nanoid(21);
}

export function generateOrderReference(): string {
  // Référence courte, lisible, unique — utilisée par l'agrégateur de paiement
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = nanoid(6).toUpperCase();
  return `CMD-${timestamp}-${random}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // enlève les accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
