import Link from "next/link";

export type CourseCardData = {
  id: string;
  title: string;
  slug: string;
  description: string;
  priceXAF: number;
  coverImageUrl: string | null;
  categoryName: string | null;
};

function formatXAF(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <Link
      href={`/cours/${course.slug}`}
      className="group block rounded-2xl border border-line bg-white overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      <div className="aspect-[16/10] bg-cream-deep relative overflow-hidden">
        {course.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.coverImageUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-display text-4xl text-school-green/30">
            {course.title.charAt(0)}
          </div>
        )}
        {course.categoryName && (
          <span className="absolute top-3 left-3 text-xs font-semibold bg-cream px-2.5 py-1 rounded-full text-school-green">
            {course.categoryName}
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg leading-snug mb-1.5 group-hover:text-school-green transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-ink/60 line-clamp-2 mb-4">
          {course.description}
        </p>
        <p className="font-semibold text-terracotta">
          {formatXAF(course.priceXAF)}
        </p>
      </div>
    </Link>
  );
}
