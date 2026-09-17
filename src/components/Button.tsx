import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-[#8d6ef7] to-[#6d4bde] text-accent-ink shadow-[0_8px_24px_rgba(124,92,240,0.35)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100",
  ghost:
    "bg-transparent text-ink border border-border-strong hover:bg-ink hover:text-bg hover:border-ink disabled:opacity-50 disabled:cursor-not-allowed",
  danger:
    "bg-critical text-[#2b1620] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
