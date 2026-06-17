"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

function formatXAF(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function SimulationContent() {
  const params = useSearchParams();
  const router = useRouter();
  const reference = params.get("ref") || "";
  const amount = Number(params.get("amount") || 0);

  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function handleConfirm(succeed: boolean) {
    setStatus("loading");
    try {
      const res = await fetch("/api/payments/simulate-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, succeed }),
      });
      const data = await res.json();
      setStatus("done");
      setTimeout(() => {
        if (data.orderId) {
          router.push(`/commande/${data.orderId}/confirmation`);
        } else {
          router.push("/cours");
        }
      }, 700);
    } catch {
      setStatus("idle");
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm bg-white border border-line rounded-2xl p-7 text-center">
        <span className="inline-block text-xs font-semibold uppercase tracking-wide text-terracotta bg-terracotta/10 px-3 py-1 rounded-full mb-5">
          Mode simulation — environnement de test
        </span>
        <p className="text-sm text-ink/50 mb-1">Référence {reference}</p>
        <p className="font-display text-3xl text-ink mb-6">
          {formatXAF(amount)}
        </p>
        <p className="text-sm text-ink/60 mb-8">
          Sur votre vrai téléphone, cet écran serait remplacé par la demande
          de confirmation Orange Money / MTN MoMo envoyée par l&apos;opérateur.
        </p>

        {status === "done" ? (
          <p className="text-school-green font-semibold">
            Confirmation enregistrée, redirection...
          </p>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => handleConfirm(true)}
              disabled={status === "loading"}
              className="w-full py-3.5 rounded-full bg-school-green text-cream font-semibold hover:bg-school-green-light transition-colors disabled:opacity-60"
            >
              {status === "loading" ? "Traitement..." : "Simuler un paiement réussi"}
            </button>
            <button
              onClick={() => handleConfirm(false)}
              disabled={status === "loading"}
              className="w-full py-3.5 rounded-full border border-line font-semibold hover:bg-cream-deep transition-colors disabled:opacity-60"
            >
              Simuler un échec
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SimulationPaymentPage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <main className="flex-1 flex items-center justify-center text-ink/50">
            Chargement...
          </main>
        }
      >
        <SimulationContent />
      </Suspense>
      <Footer />
    </>
  );
}
