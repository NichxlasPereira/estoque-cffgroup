import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "ghostOnDark" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-[#8d6ef7] to-[#6d4bde] text-accent-ink shadow-[0_8px_24px_rgba(124,92,240,0.45)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100",
  ghost:
    "bg-white/[0.03] text-ink border border-border hover:border-border-strong hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed",
  // Fixed light-on-dark styling for use over the header's always-dark hero,
  // independent of the light/dark app theme.
  ghostOnDark:
    "bg-white/[0.06] text-white border border-white/15 hover:border-white/30 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed",
  danger:
    "bg-critical text-[#2b1620] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
