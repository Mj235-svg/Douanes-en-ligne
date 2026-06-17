import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line mt-auto">
      <div className="mx-auto max-w-6xl px-6 py-12 flex flex-col md:flex-row justify-between gap-8">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-7 h-7 rounded-full bg-school-green flex items-center justify-center text-cream font-display text-sm">
              L
            </span>
            <span className="font-display text-lg">Lokemo</span>
          </div>
          <p className="text-sm text-ink/60 max-w-xs">
            La plateforme camerounaise de cours en ligne, payable par Orange
            Money et MTN Mobile Money.
          </p>
        </div>

        <div className="flex gap-12 text-sm">
          <div>
            <p className="font-semibold mb-3 text-ink/90">Plateforme</p>
            <ul className="space-y-2 text-ink/60">
              <li>
                <Link href="/cours" className="hover:text-school-green">
                  Catalogue de cours
                </Link>
              </li>
              <li>
                <Link href="/inscription" className="hover:text-school-green">
                  Créer un compte
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-3 text-ink/90">Paiement</p>
            <ul className="space-y-2 text-ink/60">
              <li>Orange Money</li>
              <li>MTN Mobile Money</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-ink/50">
        © {new Date().getFullYear()} Lokemo — Fait avec soin au Cameroun.
      </div>
    </footer>
  );
}
