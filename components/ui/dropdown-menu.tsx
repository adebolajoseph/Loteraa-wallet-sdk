'use client'

import React from 'react'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronRight, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

function MenuRoot(props: React.ComponentProps<typeof Menu.Root>) {
  return <Menu.Root data-slot="menu-root" {...props} />
}

function MenuPortal(props: React.ComponentProps<typeof Menu.Portal>) {
  return <Menu.Portal data-slot="menu-portal" {...props} />
}

function MenuTrigger(props: React.ComponentProps<typeof Menu.Trigger>) {
  return <Menu.Trigger data-slot="menu-trigger" {...props} />
}

function MenuContent({
  className,
  sideOffset = 4,
  ...rest
}: React.ComponentProps<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        data-slot="menu-content"
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className
        )}
        {...rest}
      />
    </Menu.Portal>
  )
}

function MenuGroup(props: React.ComponentProps<typeof Menu.Group>) {
  return <Menu.Group data-slot="menu-group" {...props} />
}

function MenuItem({
  className,
  inset,
  tone = 'default',
  ...rest
}: React.ComponentProps<typeof Menu.Item> & {
  inset?: boolean
  tone?: 'default' | 'danger'
}) {
  return (
    <Menu.Item
      data-slot="menu-item"
      data-inset={inset}
      data-tone={tone}
      className={cn(
        "relative flex select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[tone=danger]:text-destructive data-[tone=danger]:focus:bg-destructive/10 dark:data-[tone=danger]:focus:bg-destructive/20 data-[tone=danger]:focus:text-destructive",
        className
      )}
      {...rest}
    />
  )
}

function MenuCheckboxItem({
  className,
  children,
  checked,
  ...rest
}: React.ComponentProps<typeof Menu.CheckboxItem>) {
  return (
    <Menu.CheckboxItem
      data-slot="menu-checkbox-item"
      className={cn(
        "relative flex select-none items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...rest}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <Menu.ItemIndicator>
          <Check className="size-4" />
        </Menu.ItemIndicator>
      </span>
      {children}
    </Menu.CheckboxItem>
  )
}

function MenuRadioGroup(props: React.ComponentProps<typeof Menu.RadioGroup>) {
  return <Menu.RadioGroup data-slot="menu-radio-group" {...props} />
}

function MenuRadioItem({
  className,
  children,
  ...rest
}: React.ComponentProps<typeof Menu.RadioItem>) {
  return (
    <Menu.RadioItem
      data-slot="menu-radio-item"
      className={cn(
        "relative flex select-none items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...rest}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <Menu.ItemIndicator>
          <Circle className="size-2 fill-current" />
        </Menu.ItemIndicator>
      </span>
      {children}
    </Menu.RadioItem>
  )
}

function MenuLabel({
  className,
  inset,
  ...rest
}: React.ComponentProps<typeof Menu.Label> & { inset?: boolean }) {
  return (
    <Menu.Label
      data-slot="menu-label"
      data-inset={inset}
      className={cn('px-2 py-1.5 text-sm font-medium data-[inset]:pl-8', className)}
      {...rest}
    />
  )
}

function MenuSeparator({
  className,
  ...rest
}: React.ComponentProps<typeof Menu.Separator>) {
  return (
    <Menu.Separator
      data-slot="menu-separator"
      className={cn('bg-border -mx-1 my-1 h-px', className)}
      {...rest}
    />
  )
}

function MenuShortcut({
  className,
  ...rest
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="menu-shortcut"
      className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)}
      {...rest}
    />
  )
}

function MenuSub(props: React.ComponentProps<typeof Menu.Sub>) {
  return <Menu.Sub data-slot="menu-sub" {...props} />
}

function MenuSubTrigger({
  className,
  inset,
  children,
  ...rest
}: React.ComponentProps<typeof Menu.SubTrigger> & { inset?: boolean }) {
  return (
    <Menu.SubTrigger
      data-slot="menu-sub-trigger"
      data-inset={inset}
      className={cn(
        'flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground data-[inset]:pl-8',
        className
      )}
      {...rest}
    >
      {children}
      <ChevronRight className="ml-auto size-4" />
    </Menu.SubTrigger>
  )
}

function MenuSubContent({
  className,
  ...rest
}: React.ComponentProps<typeof Menu.SubContent>) {
  return (
    <Menu.SubContent
      data-slot="menu-sub-content"
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)',
        className
      )}
      {...rest}
    />
  )
}

export {
  MenuRoot,
  MenuPortal,
  MenuTrigger,
  MenuContent,
  MenuGroup,
  MenuLabel,
  MenuItem,
  MenuCheckboxItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubTrigger,
  MenuSubContent,
}
