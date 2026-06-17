"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CourseCard, CourseCardData } from "@/components/CourseCard";

export default function CataloguePage() {
  const [courses, setCourses] = useState<CourseCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => setCourses(data.courses || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="border-b border-line bg-cream-deep/50">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <h1 className="font-display text-4xl mb-3">
              Catalogue de cours
            </h1>
            <p className="text-ink/65 max-w-xl">
              Parcourez les cours disponibles. Le paiement se fait par Orange
              Money ou MTN Mobile Money, directement depuis votre téléphone.
            </p>
            <input
              type="text"
              placeholder="Rechercher un cours..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-6 w-full max-w-md px-4 py-3 rounded-xl border border-line bg-white focus:outline-none focus:ring-2 focus:ring-school-green/40"
            />
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 py-12">
          {loading ? (
            <p className="text-ink/50">Chargement des cours...</p>
          ) : filtered.length === 0 ? (
            <p className="text-ink/50">
              Aucun cours disponible pour le moment.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
