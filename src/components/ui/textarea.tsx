import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[92px] w-full rounded-field border-card border-edge bg-field px-4 py-3.5 font-body text-[15px] font-semibold leading-relaxed text-ink transition-shadow",
        "placeholder:font-semibold placeholder:text-ink-faint",
        "focus-visible:border-coral focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_hsl(var(--coral)/0.22),0_6px_22px_-8px_hsl(var(--coral)/calc(0.9*var(--glow)))]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
