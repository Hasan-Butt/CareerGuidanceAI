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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        {
          "bg-[#0f766e] text-white": variant === "default",
          "bg-teal-50 text-teal-800 border border-teal-200": variant === "secondary",
          "border border-slate-200 text-slate-800": variant === "outline",
          "bg-[#c45c26]/10 text-[#c45c26] border border-[#c45c26]/20": variant === "accent",
          "bg-emerald-50 text-emerald-800 border border-emerald-200": variant === "success",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };

