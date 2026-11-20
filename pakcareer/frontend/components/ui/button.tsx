import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "accent";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b64ab] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          {
            "bg-[#2b64ab] text-white hover:bg-[#1f4f8b] shadow-md shadow-blue-900/25 hover:scale-[1.01]": variant === "default",
            "border border-white/85 bg-white/70 backdrop-blur-md hover:bg-white text-slate-800 shadow-2xs": variant === "outline",
            "bg-blue-50/80 text-[#2b64ab] hover:bg-blue-100 border border-blue-200/60 shadow-2xs": variant === "secondary",
            "hover:bg-white/40 text-slate-700": variant === "ghost",
            "bg-rose-600 text-white hover:bg-rose-700 shadow-sm": variant === "destructive",
            "bg-[#2b64ab] text-white hover:bg-[#1f4f8b] shadow-md": variant === "accent",
            "h-11 px-5 py-2": size === "default",
            "h-8 px-3.5 text-xs": size === "sm",
            "h-13 px-8 text-base font-bold": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
