import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const variants = {
  default: "bg-zinc-900 text-white",
  secondary: "bg-zinc-100 text-zinc-800"
};

export function Badge({ className = "", variant = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold",
        variants[variant] ?? variants.default,
        className
      )}
      {...props}
    />
  );
}
