"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="border-b border-line bg-cream/95 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-20">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="relative w-9 h-9 rounded-full bg-school-green flex items-center justify-center text-cream font-display text-lg stamp-ring text-school-green">
            <span className="text-cream">L</span>
          </span>
          <span className="font-display text-2xl tracking-tight text-ink">
            Lokemo
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-ink/80">
          <Link href="/cours" className="hover:text-school-green transition-colors">
            Catalogue
          </Link>
          {user && (
            <Link
              href="/mes-cours"
              className="hover:text-school-green transition-colors"
            >
              Mes cours
            </Link>
          )}
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="hover:text-school-green transition-colors"
            >
              Administration
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <>
              <span className="hidden sm:block text-sm text-ink/70">
                Bonjour, {user.fullName.split(" ")[0]}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-semibold px-4 py-2 rounded-full border border-ink/15 hover:border-ink/30 transition-colors"
              >
                Se déconnecter
              </button>
            </>
          ) : (
            <>
              <Link
                href="/connexion"
                className="text-sm font-semibold px-4 py-2 rounded-full hover:bg-ink/5 transition-colors"
              >
                Se connecter
              </Link>
              <Link
                href="/inscription"
                className="text-sm font-semibold px-4 py-2.5 rounded-full bg-terracotta text-cream hover:bg-terracotta-deep transition-colors"
              >
                Créer un compte
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
