import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const variants = {
  default: "bg-zinc-900 text-white hover:bg-zinc-800",
  outline: "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50",
  ghost: "bg-transparent text-zinc-700 hover:bg-zinc-100"
};

export function Button({ className = "", variant = "default", type = "button", ...props }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50",
        variants[variant] ?? variants.default,
        className
      )}
      {...props}
    />
  );
}
