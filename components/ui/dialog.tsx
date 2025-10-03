'use client'

import React from 'react'
import * as Primitive from '@radix-ui/react-dialog'
import { X as CloseIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

function Modal(props: React.ComponentProps<typeof Primitive.Root>) {
  return <Primitive.Root data-slot="modal" {...props} />
}

function ModalTrigger(props: React.ComponentProps<typeof Primitive.Trigger>) {
  return <Primitive.Trigger data-slot="modal-trigger" {...props} />
}

function ModalPortal(props: React.ComponentProps<typeof Primitive.Portal>) {
  return <Primitive.Portal data-slot="modal-portal" {...props} />
}

function ModalDismiss(props: React.ComponentProps<typeof Primitive.Close>) {
  return <Primitive.Close data-slot="modal-dismiss" {...props} />
}

function ModalBackdrop({
  className,
  ...rest
}: React.ComponentProps<typeof Primitive.Overlay>) {
  return (
    <Primitive.Overlay
      data-slot="modal-backdrop"
      className={cn(
        'fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
        className
      )}
      {...rest}
    />
  )
}

function ModalContent({
  className,
  children,
  withClose = true,
  ...rest
}: React.ComponentProps<typeof Primitive.Content> & { withClose?: boolean }) {
  return (
    <ModalPortal>
      <ModalBackdrop />
      <Primitive.Content
        data-slot="modal-content"
        className={cn(
          'fixed left-1/2 top-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 sm:max-w-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
          className
        )}
        {...rest}
      >
        {children}
        {withClose && (
          <Primitive.Close
            data-slot="modal-dismiss"
            className="absolute right-4 top-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4"
          >
            <CloseIcon />
            <span className="sr-only">Close</span>
          </Primitive.Close>
        )}
      </Primitive.Content>
    </ModalPortal>
  )
}

function ModalHeader({
  className,
  ...rest
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="modal-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...rest}
    />
  )
}

function ModalFooter({
  className,
  ...rest
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="modal-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...rest}
    />
  )
}

function ModalTitle({
  className,
  ...rest
}: React.ComponentProps<typeof Primitive.Title>) {
  return (
    <Primitive.Title
      data-slot="modal-title"
      className={cn('text-lg font-semibold leading-none', className)}
      {...rest}
    />
  )
}

function ModalText({
  className,
  ...rest
}: React.ComponentProps<typeof Primitive.Description>) {
  return (
    <Primitive.Description
      data-slot="modal-text"
      className={cn('text-sm text-muted-foreground', className)}
      {...rest}
    />
  )
}

export {
  Modal,
  ModalTrigger,
  ModalPortal,
  ModalDismiss,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalText,
}
