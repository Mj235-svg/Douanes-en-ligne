"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminGuard } from "@/components/AdminGuard";

export default function NewCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Veuillez sélectionner le fichier du cours (PDF, ZIP, etc.)");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload du fichier de cours (privé)
      const courseFileForm = new FormData();
      courseFileForm.append("file", file);
      courseFileForm.append("type", "course");
      const fileRes = await fetch("/api/admin/upload", {
        method: "POST",
        body: courseFileForm,
      });
      const fileData = await fileRes.json();
      if (!fileRes.ok) {
        setError(fileData.error || "Échec de l'envoi du fichier");
        setSubmitting(false);
        return;
      }

      // 2. Upload optionnel de l'image de couverture (publique)
      let coverImageUrl: string | undefined;
      if (cover) {
        const coverForm = new FormData();
        coverForm.append("file", cover);
        coverForm.append("type", "cover");
        const coverRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: coverForm,
        });
        const coverData = await coverRes.json();
        if (coverRes.ok) coverImageUrl = coverData.url;
      }

      // 3. Création du cours en base
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          priceXAF: parseInt(price, 10),
          fileUrl: fileData.fileUrl,
          fileName: fileData.fileName,
          coverImageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        setSubmitting(false);
        return;
      }

      router.push("/admin");
    } catch {
      setError("Impossible de contacter le serveur");
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <AdminGuard>
          <div className="mx-auto max-w-2xl px-6 py-14">
            <h1 className="font-display text-3xl mb-8">Nouveau cours</h1>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="block text-sm font-medium text-ink/80 mb-1.5">
                  Titre du cours
                </span>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-line bg-white focus:outline-none focus:ring-2 focus:ring-school-green/40"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium text-ink/80 mb-1.5">
                  Description
                </span>
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-line bg-white focus:outline-none focus:ring-2 focus:ring-school-green/40"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium text-ink/80 mb-1.5">
                  Prix (FCFA)
                </span>
                <input
                  type="number"
                  required
                  min={100}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex : 2500"
                  className="w-full px-4 py-3 rounded-xl border border-line bg-white focus:outline-none focus:ring-2 focus:ring-school-green/40"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium text-ink/80 mb-1.5">
                  Fichier du cours (PDF, ZIP...)
                </span>
                <input
                  type="file"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 rounded-xl border border-line bg-white"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium text-ink/80 mb-1.5">
                  Image de couverture (optionnel)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCover(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 rounded-xl border border-line bg-white"
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
                className="w-full py-3.5 rounded-full bg-school-green text-cream font-semibold hover:bg-school-green-light transition-colors disabled:opacity-60"
              >
                {submitting ? "Création..." : "Publier le cours"}
              </button>
            </form>
          </div>
        </AdminGuard>
      </main>
      <Footer />
    </>
  );
}
