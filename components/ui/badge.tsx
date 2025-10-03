import React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeStyles = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 w-fit gap-1 overflow-hidden [&>svg]:size-3 [&>svg]:pointer-events-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 transition-[color,box-shadow]',
  {
    variants: {
      tone: {
        primary: 'bg-primary text-primary-foreground border-transparent hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/90',
        danger: 'bg-destructive text-white border-transparent hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline: 'text-foreground hover:bg-accent hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      tone: 'primary',
    },
  }
)

type BadgeProps = React.ComponentProps<'span'> & VariantProps<typeof badgeStyles> & { asChild?: boolean }

export function Tag({ className, tone, asChild, ...rest }: BadgeProps) {
  const Element = asChild ? Slot : 'span'
  return <Element className={cn(badgeStyles({ tone }), className)} {...rest} />
}

export { badgeStyles }
