import React from "react";

export function Card({ children, className = "" }: any) { return <div className={className}>{children}</div>; }
export function CardContent({ children, className = "" }: any) { return <div className={className}>{children}</div>; }

export function Button({ children, variant, className = "", disabled, ...props }: any) {
  const base = "px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = variant === "outline"
    ? "border border-[#E2E8F0] bg-white hover:border-[#0077B6]"
    : "bg-[#0077B6] text-white hover:bg-[#005F8A]";
  return <button className={`${base} ${styles} ${className}`} disabled={disabled} {...props}>{children}</button>;
}
