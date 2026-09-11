import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-[52px] w-full rounded-field border-card border-edge bg-field px-4 py-3 font-body text-[15px] font-semibold text-ink transition-shadow",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:font-semibold placeholder:text-ink-faint",
          "focus-visible:border-coral focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_hsl(var(--coral)/0.22),0_6px_22px_-8px_hsl(var(--coral)/calc(0.9*var(--glow)))]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
