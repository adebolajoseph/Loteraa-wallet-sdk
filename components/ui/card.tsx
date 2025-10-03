import React from 'react'
import { cn } from '@/lib/utils'

function Panel({ className, ...rest }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="panel"
      className={cn(
        "flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm",
        className
      )}
      {...rest}
    />
  )
}

function PanelHeader({ className, ...rest }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="panel-header"
      className={cn(
        "@container/panel-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=panel-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...rest}
    />
  )
}

function PanelHeading({ className, ...rest }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="panel-heading"
      className={cn("font-semibold leading-none", className)}
      {...rest}
    />
  )
}

function PanelNote({ className, ...rest }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="panel-note"
      className={cn("text-sm text-muted-foreground", className)}
      {...rest}
    />
  )
}

function PanelAction({ className, ...rest }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="panel-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...rest}
    />
  )
}

function PanelBody({ className, ...rest }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="panel-body"
      className={cn("px-6", className)}
      {...rest}
    />
  )
}

function PanelFooter({ className, ...rest }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="panel-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...rest}
    />
  )
}

export {
  Panel,
  PanelHeader,
  PanelHeading,
  PanelNote,
  PanelAction,
  PanelBody,
  PanelFooter,
}
