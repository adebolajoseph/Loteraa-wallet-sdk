import React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const btnStyles = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all gap-2 shrink-0 whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none [&_svg]:shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:border-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      tone: {
        primary: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        danger: "bg-destructive text-white shadow-xs hover:bg-destructive/90 dark:bg-destructive/60 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      dimension: {
        md: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 px-3 gap-1.5 rounded-md has-[>svg]:px-2.5",
        lg: "h-10 px-6 rounded-md has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      tone: "primary",
      dimension: "md",
    },
  }
)

type BtnProps = React.ComponentProps<'button'> & VariantProps<typeof btnStyles> & { asChild?: boolean }

export function ActionButton({ className, tone, dimension, asChild, ...rest }: BtnProps) {
  const Element = asChild ? Slot : 'button'
  return <Element className={cn(btnStyles({ tone, dimension, className }))} {...rest} />
}

export { btnStyles }
