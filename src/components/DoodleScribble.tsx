export function DoodleScribble({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M46 8C33 5 18 10 14 22c-4 12 8 20 20 16 13-4 17-19 6-24-11-5-25 2-27 14-2 13 12 22 24 18 14-5 16-23 3-27"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
