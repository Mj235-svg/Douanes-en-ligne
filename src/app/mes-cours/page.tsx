"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

type PurchasedCourse = {
  orderId: string;
  reference: string;
  paidAt: string | null;
  amountXAF: number;
  courseId: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  fileName: string;
};

export default function MesCoursPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<PurchasedCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetch("/api/my-courses")
      .then((res) => res.json())
      .then((data) => setItems(data.purchasedCourses || []))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (!authLoading && !user) {
    return (
      <>
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 py-24 px-6 text-center">
          <p className="text-ink/60">
            Connectez-vous pour voir vos cours achetés.
          </p>
          <Link
            href="/connexion?next=/mes-cours"
            className="px-6 py-3 rounded-full bg-school-green text-cream font-semibold"
          >
            Se connecter
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h1 className="font-display text-3xl mb-8">Mes cours</h1>

          {loading ? (
            <p className="text-ink/50">Chargement...</p>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-ink/60 mb-6">
                Vous n&apos;avez encore acheté aucun cours.
              </p>
              <Link
                href="/cours"
                className="px-6 py-3 rounded-full bg-terracotta text-cream font-semibold hover:bg-terracotta-deep transition-colors"
              >
                Parcourir le catalogue
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {items.map((item) => (
                <div
                  key={item.orderId}
                  className="bg-white border border-line rounded-2xl p-5 flex flex-col"
                >
                  <h3 className="font-display text-lg mb-1">{item.title}</h3>
                  <p className="text-xs text-ink/45 mb-4">
                    Acheté le{" "}
                    {item.paidAt
                      ? new Date(item.paidAt).toLocaleDateString("fr-FR")
                      : "—"}
                  </p>
                  <a
                    href={`/api/download/${item.orderId}`}
                    className="mt-auto text-center py-2.5 rounded-full bg-school-green text-cream font-semibold hover:bg-school-green-light transition-colors text-sm"
                  >
                    Télécharger
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
