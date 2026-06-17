import { getSession, SessionPayload } from "./auth";

export async function requireAdmin(): Promise<
  { ok: true; session: SessionPayload } | { ok: false; status: number; error: string }
> {
  const session = await getSession();
  if (!session) {
    return { ok: false, status: 401, error: "Non authentifié" };
  }
  if (session.role !== "ADMIN") {
    return { ok: false, status: 403, error: "Accès réservé aux administrateurs" };
  }
  return { ok: true, session };
}

export async function requireAuth(): Promise<
  { ok: true; session: SessionPayload } | { ok: false; status: number; error: string }
> {
  const session = await getSession();
  if (!session) {
    return { ok: false, status: 401, error: "Veuillez vous connecter" };
  }
  return { ok: true, session };
}
