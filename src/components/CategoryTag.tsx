export function CategoryTag({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-strong">
      {category}
    </span>
  );
}
