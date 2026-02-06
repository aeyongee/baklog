import Link from "next/link";

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
      <p className="text-lg font-semibold text-gray-800">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-gray-400 leading-relaxed">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 inline-block rounded-xl bg-[#FF2F92] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#e6287f] active:scale-[0.97] transition-all"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
