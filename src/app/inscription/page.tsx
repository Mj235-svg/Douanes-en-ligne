"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

export default function InscriptionPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        setLoading(false);
        return;
      }
      await refresh();
      router.push("/cours");
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
          <h1 className="font-display text-3xl mb-2">Créer un compte</h1>
          <p className="text-ink/60 mb-8">
            Rejoignez Lokemo pour accéder aux cours en ligne.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Nom complet"
              type="text"
              value={fullName}
              onChange={setFullName}
              placeholder="Ex : Aïssatou Fomekong"
              required
            />
            <Field
              label="Adresse email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="vous@exemple.com"
              required
            />
            <Field
              label="Numéro de téléphone"
              type="tel"
              value={phone}
              onChange={setPhone}
              placeholder="6XX XXX XXX"
            />
            <Field
              label="Mot de passe"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="6 caractères minimum"
              required
            />

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
              {loading ? "Création du compte..." : "Créer mon compte"}
            </button>
          </form>

          <p className="text-sm text-ink/60 mt-6 text-center">
            Vous avez déjà un compte ?{" "}
            <Link href="/connexion" className="text-school-green font-semibold">
              Se connecter
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink/80 mb-1.5">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 rounded-xl border border-line bg-white focus:outline-none focus:ring-2 focus:ring-school-green/40 focus:border-school-green"
      />
    </label>
  );
}
