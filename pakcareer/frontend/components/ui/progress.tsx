import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-white/40 backdrop-blur-md border border-white/70 p-0.5 shadow-2xs",
        className
      )}
      {...props}
    >
      <div
        className="h-full bg-gradient-to-r from-[#2b64ab] to-[#518ee0] transition-all duration-300 rounded-full shadow-xs"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
);
Progress.displayName = "Progress";

export { Progress };
