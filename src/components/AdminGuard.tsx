"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-ink/50">Chargement...</div>;
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-ink/60">
          Cette page est réservée aux administrateurs.
        </p>
        <Link
          href="/connexion?next=/admin"
          className="px-6 py-3 rounded-full bg-school-green text-cream font-semibold"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
