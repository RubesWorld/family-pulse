import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-extrabold transition-colors focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 focus:ring-offset-paper",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-coral text-on-ink hover:brightness-110",
        secondary:
          "border-transparent bg-paper-2 text-ink-soft hover:brightness-110",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:brightness-110",
        outline: "border-edge text-ink-soft",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
