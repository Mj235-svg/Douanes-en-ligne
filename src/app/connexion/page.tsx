"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

export default function ConnexionPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        setLoading(false);
        return;
      }
      await refresh();
      if (data.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/cours");
      }
    } catch {
      setError("Impossible de se connecter au serveur");
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <h1 className="font-display text-3xl mb-2">Se connecter</h1>
          <p className="text-ink/60 mb-8">
            Accédez à votre espace Lokemo.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-ink/80 mb-1.5">
                Adresse email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-line bg-white focus:outline-none focus:ring-2 focus:ring-school-green/40 focus:border-school-green"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-ink/80 mb-1.5">
                Mot de passe
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-line bg-white focus:outline-none focus:ring-2 focus:ring-school-green/40 focus:border-school-green"
              />
            </label>

            {error && (
              <p className="text-sm text-terracotta-deep bg-terracotta/10 px-4 py-3 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-school-green text-cream font-semibold hover:bg-school-green-light transition-colors disabled:opacity-60"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p className="text-sm text-ink/60 mt-6 text-center">
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="text-school-green font-semibold">
              Créer un compte
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
