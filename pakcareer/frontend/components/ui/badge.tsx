import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "accent" | "success";
}

function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold transition-colors shadow-2xs backdrop-blur-md",
        {
          "bg-[#2b64ab] text-white shadow-blue-900/15": variant === "default",
          "bg-white/70 text-[#2b64ab] border border-white/90": variant === "secondary",
          "border border-white/80 bg-white/60 text-slate-800": variant === "outline",
          "bg-blue-100/70 text-[#2b64ab] border border-blue-200/60": variant === "accent",
          "bg-emerald-50/90 text-emerald-800 border border-emerald-200": variant === "success",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
