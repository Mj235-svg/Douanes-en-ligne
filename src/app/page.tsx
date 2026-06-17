import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="texture-grain absolute inset-0 opacity-40" />
          <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-school-green bg-school-green/10 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-school-green" />
                Orange Money &amp; MTN Mobile Money acceptés
              </span>
              <h1 className="font-display text-5xl md:text-6xl leading-[1.05] mt-6 text-ink">
                Le savoir s&apos;achète aussi par{" "}
                <span className="text-terracotta">téléphone</span>.
              </h1>
              <p className="mt-6 text-lg text-ink/70 leading-relaxed max-w-xl">
                Lokemo réunit des cours préparés par des enseignants et
                étudiants camerounais. Choisissez un cours, payez avec votre
                numéro Mobile Money, et téléchargez immédiatement après
                confirmation.
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <Link
                  href="/cours"
                  className="px-7 py-3.5 rounded-full bg-school-green text-cream font-semibold hover:bg-school-green-light transition-colors"
                >
                  Voir le catalogue
                </Link>
                <Link
                  href="/inscription"
                  className="px-7 py-3.5 rounded-full border border-ink/20 font-semibold hover:bg-ink/5 transition-colors"
                >
                  Créer un compte étudiant
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="border-y border-line bg-cream-deep/60">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="font-display text-3xl text-center mb-14">
              Comment ça marche
            </h2>
            <div className="grid md:grid-cols-3 gap-10">
              <Step
                eyebrow="Étape 1"
                title="Choisissez un cours"
                text="Parcourez le catalogue, lisez la description et le prix affiché en Francs CFA."
              />
              <Step
                eyebrow="Étape 2"
                title="Payez avec votre téléphone"
                text="Entrez votre numéro Orange Money ou MTN MoMo et validez la transaction sur votre téléphone."
              />
              <Step
                eyebrow="Étape 3"
                title="Téléchargez votre cours"
                text="Dès la confirmation du paiement, le bouton de téléchargement se débloque automatiquement."
              />
            </div>
          </div>
        </section>

        {/* Confiance */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="stamp-ring inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-school-green text-school-green font-display text-sm text-center leading-tight">
                Accès<br />vérifié
              </span>
              <h2 className="font-display text-3xl mt-8 leading-tight">
                Chaque téléchargement est lié à un paiement confirmé.
              </h2>
              <p className="mt-4 text-ink/70 leading-relaxed">
                Aucun fichier n&apos;est accessible sans confirmation réelle
                du paiement Mobile Money. Vous gardez l&apos;accès à vos
                cours achetés dans votre espace personnel, à tout moment.
              </p>
            </div>
            <div className="bg-ink text-cream rounded-2xl p-8">
              <p className="font-display text-xl mb-4">
                Vous enseignez ou préparez des supports de cours&nbsp;?
              </p>
              <p className="text-cream/70 mb-6">
                Lokemo permet aussi aux enseignants et créateurs de contenu
                de mettre leurs cours en vente sur la plateforme.
              </p>
              <a
                href="mailto:contact@lokemo.cm"
                className="inline-block px-6 py-3 rounded-full bg-terracotta text-cream font-semibold hover:bg-terracotta-deep transition-colors"
              >
                Nous contacter
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Step({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-terracotta mb-2">{eyebrow}</p>
      <h3 className="font-display text-xl mb-2">{title}</h3>
      <p className="text-ink/65 text-[15px] leading-relaxed">{text}</p>
    </div>
  );
}
