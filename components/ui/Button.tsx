"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed",
  secondary:
    "bg-transparent text-foreground border border-border hover:bg-black/5 disabled:opacity-40",
  danger:
    "bg-danger text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed",
  ghost: "bg-transparent text-muted hover:text-foreground",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`px-5 py-3 rounded-xl font-medium text-base transition-colors ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
