"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

type CourseDetail = {
  id: string;
  title: string;
  description: string;
  priceXAF: number;
  coverImageUrl: string | null;
  fileName: string;
  categoryName: string | null;
};

function formatXAF(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"ORANGE_MONEY" | "MTN_MOMO">(
    "ORANGE_MONEY"
  );
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/courses/${params.slug}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setCourse(data.course);
        setAlreadyPurchased(data.alreadyPurchased);
      })
      .finally(() => setLoading(false));
  }, [params.slug]);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!user) {
      router.push(`/connexion?next=/cours/${params.slug}`);
      return;
    }
    if (!course) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          operatorPhone: phone,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        setSubmitting(false);
        return;
      }
      if (data.alreadyPurchased) {
        router.push(`/commande/${data.orderId}/confirmation`);
        return;
      }
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch {
      setError("Impossible de contacter le serveur");
      setSubmitting(false);
    }
  }

  if (loading || authLoading) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center text-ink/50">
          Chargement...
        </main>
        <Footer />
      </>
    );
  }

  if (notFound || !course) {
    return (
      <>
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 py-24">
          <p className="text-ink/60">Ce cours n&apos;existe pas ou plus.</p>
          <Link href="/cours" className="text-school-green font-semibold">
            Retour au catalogue
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
        <div className="mx-auto max-w-4xl px-6 py-12">
          <Link
            href="/cours"
            className="text-sm text-ink/50 hover:text-ink mb-6 inline-block"
          >
            ← Retour au catalogue
          </Link>

          <div className="grid md:grid-cols-[1.4fr_1fr] gap-10">
            <div>
              {course.categoryName && (
                <span className="text-xs font-semibold text-school-green bg-school-green/10 px-2.5 py-1 rounded-full">
                  {course.categoryName}
                </span>
              )}
              <h1 className="font-display text-3xl md:text-4xl mt-4 mb-4 leading-tight">
                {course.title}
              </h1>
              <p className="text-ink/70 leading-relaxed whitespace-pre-line">
                {course.description}
              </p>
              <p className="text-sm text-ink/45 mt-6">
                Fichier fourni : {course.fileName}
              </p>
            </div>

            <div className="bg-white border border-line rounded-2xl p-6 h-fit sticky top-28">
              <p className="text-3xl font-display text-terracotta mb-1">
                {formatXAF(course.priceXAF)}
              </p>
              <p className="text-sm text-ink/50 mb-6">Paiement unique</p>

              {alreadyPurchased ? (
                <Link
                  href="/mes-cours"
                  className="block text-center w-full py-3.5 rounded-full bg-school-green text-cream font-semibold hover:bg-school-green-light transition-colors"
                >
                  Voir dans mes cours
                </Link>
              ) : !showPayment ? (
                <button
                  onClick={() => setShowPayment(true)}
                  className="w-full py-3.5 rounded-full bg-terracotta text-cream font-semibold hover:bg-terracotta-deep transition-colors"
                >
                  Acheter ce cours
                </button>
              ) : (
                <form onSubmit={handlePay} className="space-y-4">
                  <div>
                    <span className="block text-sm font-medium text-ink/80 mb-2">
                      Moyen de paiement
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <OperatorButton
                        label="Orange Money"
                        active={paymentMethod === "ORANGE_MONEY"}
                        onClick={() => setPaymentMethod("ORANGE_MONEY")}
                        color="#FF7900"
                      />
                      <OperatorButton
                        label="MTN MoMo"
                        active={paymentMethod === "MTN_MOMO"}
                        onClick={() => setPaymentMethod("MTN_MOMO")}
                        color="#FFCC00"
                      />
                    </div>
                  </div>

                  <label className="block">
                    <span className="block text-sm font-medium text-ink/80 mb-1.5">
                      Numéro {paymentMethod === "ORANGE_MONEY" ? "Orange" : "MTN"}
                    </span>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="6XX XXX XXX"
                      className="w-full px-4 py-3 rounded-xl border border-line bg-cream focus:outline-none focus:ring-2 focus:ring-school-green/40"
                    />
                  </label>

                  {error && (
                    <p className="text-sm text-terracotta-deep bg-terracotta/10 px-4 py-3 rounded-lg">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="stamp-ring text-school-green w-full py-3.5 rounded-full bg-school-green text-cream font-semibold hover:bg-school-green-light transition-colors disabled:opacity-60"
                  >
                    {submitting
                      ? "Initialisation du paiement..."
                      : `Payer ${formatXAF(course.priceXAF)}`}
                  </button>
                  <p className="text-xs text-ink/45 text-center">
                    Vous allez recevoir une demande de confirmation sur votre
                    téléphone.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function OperatorButton({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
        active
          ? "border-school-green bg-school-green/5"
          : "border-line bg-white"
      }`}
    >
      <span
        className="w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </button>
  );
}
