"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

type Status = "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "checking";

export default function OrderConfirmationPage() {
  const params = useParams<{ orderId: string }>();
  const [status, setStatus] = useState<Status>("checking");
  const [reference, setReference] = useState<string | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    // On a besoin de la référence pour interroger le statut ; on la récupère
    // simplement en redemandant la commande via une petite route dédiée.
    // Pour rester simple, on réutilise le statut déjà connu si la commande
    // a été créée en mode simulation (déjà confirmée par l'action utilisateur).
    let mounted = true;

    async function poll() {
      attemptsRef.current += 1;
      try {
        const res = await fetch(`/api/orders/${params.orderId}/status-check`);
        if (!res.ok) {
          // route de secours si non trouvée : on tente via reference connue
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        setReference(data.reference || null);
        setStatus(data.status);
        if (data.status === "PENDING" && attemptsRef.current < 20) {
          setTimeout(poll, 3000);
        }
      } catch {
        if (attemptsRef.current < 20) setTimeout(poll, 3000);
      }
    }

    poll();
    return () => {
      mounted = false;
    };
  }, [params.orderId]);

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">
          {status === "checking" || status === "PENDING" ? (
            <>
              <div className="w-14 h-14 mx-auto mb-6 rounded-full border-4 border-school-green/20 border-t-school-green animate-spin" />
              <h1 className="font-display text-2xl mb-2">
                Vérification du paiement...
              </h1>
              <p className="text-ink/60">
                Confirmez la transaction sur votre téléphone si ce n&apos;est
                pas déjà fait. Cette page se met à jour automatiquement.
              </p>
            </>
          ) : status === "PAID" ? (
            <>
              <span className="stamp-ring text-school-green inline-flex items-center justify-center w-16 h-16 rounded-full bg-school-green/10 text-school-green text-3xl mb-6">
                ✓
              </span>
              <h1 className="font-display text-2xl mb-2">
                Paiement confirmé !
              </h1>
              <p className="text-ink/60 mb-8">
                Votre cours est maintenant disponible dans votre espace.
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href={`/api/download/${params.orderId}`}
                  className="py-3.5 rounded-full bg-terracotta text-cream font-semibold hover:bg-terracotta-deep transition-colors"
                >
                  Télécharger le cours
                </a>
                <Link
                  href="/mes-cours"
                  className="py-3.5 rounded-full border border-line font-semibold hover:bg-cream-deep transition-colors"
                >
                  Voir mes cours
                </Link>
              </div>
            </>
          ) : (
            <>
              <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-terracotta/10 text-terracotta text-3xl mb-6">
                ✕
              </span>
              <h1 className="font-display text-2xl mb-2">
                Le paiement n&apos;a pas pu être confirmé
              </h1>
              <p className="text-ink/60 mb-8">
                Aucun montant n&apos;a été débité avec succès. Vous pouvez
                réessayer depuis la page du cours.
              </p>
              <Link
                href="/cours"
                className="inline-block py-3.5 px-8 rounded-full bg-school-green text-cream font-semibold hover:bg-school-green-light transition-colors"
              >
                Retour au catalogue
              </Link>
            </>
          )}

          {reference && (
            <p className="text-xs text-ink/40 mt-8">Référence : {reference}</p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
