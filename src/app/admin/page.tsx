"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminGuard } from "@/components/AdminGuard";

type AdminCourse = {
  id: string;
  title: string;
  slug: string;
  priceXAF: number;
  isPublished: boolean;
};

function formatXAF(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

export default function AdminDashboard() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch("/api/admin/courses")
      .then((res) => res.json())
      .then((data) => setCourses(data.courses || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function togglePublish(course: AdminCourse) {
    await fetch(`/api/admin/courses/${course.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !course.isPublished }),
    });
    load();
  }

  async function deleteCourse(id: string) {
    if (!confirm("Supprimer définitivement ce cours ?")) return;
    await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <AdminGuard>
          <div className="mx-auto max-w-5xl px-6 py-14">
            <div className="flex items-center justify-between mb-8">
              <h1 className="font-display text-3xl">Administration</h1>
              <Link
                href="/admin/cours/nouveau"
                className="px-5 py-2.5 rounded-full bg-terracotta text-cream font-semibold hover:bg-terracotta-deep transition-colors text-sm"
              >
                + Nouveau cours
              </Link>
            </div>

            {loading ? (
              <p className="text-ink/50">Chargement...</p>
            ) : courses.length === 0 ? (
              <p className="text-ink/50">Aucun cours créé pour le moment.</p>
            ) : (
              <div className="bg-white border border-line rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-cream-deep/60 text-ink/60">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium">Titre</th>
                      <th className="text-left px-5 py-3 font-medium">Prix</th>
                      <th className="text-left px-5 py-3 font-medium">Statut</th>
                      <th className="text-right px-5 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((c) => (
                      <tr key={c.id} className="border-t border-line">
                        <td className="px-5 py-3">{c.title}</td>
                        <td className="px-5 py-3">{formatXAF(c.priceXAF)}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              c.isPublished
                                ? "bg-school-green/10 text-school-green"
                                : "bg-ink/10 text-ink/60"
                            }`}
                          >
                            {c.isPublished ? "Publié" : "Masqué"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right space-x-3">
                          <button
                            onClick={() => togglePublish(c)}
                            className="text-school-green font-semibold hover:underline"
                          >
                            {c.isPublished ? "Masquer" : "Publier"}
                          </button>
                          <button
                            onClick={() => deleteCourse(c.id)}
                            className="text-terracotta-deep font-semibold hover:underline"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </AdminGuard>
      </main>
      <Footer />
    </>
  );
}
