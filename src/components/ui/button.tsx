import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-extrabold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // The warm gradient with its own bloom — used for the one real
        // action on a screen.
        default:
          "bg-gradient-to-br from-coral to-marigold text-on-ink shadow-[0_8px_24px_-6px_rgb(var(--coral)/calc(0.9*var(--glow))),inset_0_1px_0_rgb(255_255_255_/_0.4)] hover:brightness-105",
        // Ink-filled. Quieter than default, still clearly a button.
        solid:
          "bg-ink text-paper shadow-[0_8px_20px_-7px_hsl(var(--ink)/0.6)] hover:brightness-110",
        outline:
          "border-card border-edge bg-card text-ink backdrop-blur-card hover:bg-paper-2",
        secondary: "bg-paper-2 text-ink hover:brightness-110",
        ghost: "text-ink-soft hover:bg-paper-2 hover:text-ink",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_8px_24px_-6px_hsl(var(--destructive)/calc(0.8*var(--glow)))] hover:brightness-105",
        link: "text-coral underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 text-[13px]",
        sm: "h-9 px-4 text-[12.5px]",
        lg: "h-14 px-7 text-[14.5px]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
