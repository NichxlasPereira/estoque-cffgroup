export function DoodleSquiggle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 160"
      fill="none"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 18c18 6 30 24 46 30 20 8 34-10 30-24-5-16-28-14-32 2-5 19 14 34 32 36 22 3 40-16 60-20 17-4 32 6 46 16"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
