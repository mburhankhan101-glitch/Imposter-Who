import { HTMLAttributes } from "react";

export function Card({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-card border border-border rounded-2xl p-6 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
