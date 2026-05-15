import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Card({ className = "", ...props }) {
  return <div className={cn("border bg-white text-zinc-950", className)} {...props} />;
}

export function CardHeader({ className = "", ...props }) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className = "", ...props }) {
  return <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function CardContent({ className = "", ...props }) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}
