import * as React from 'react'

import { cn } from '@/lib/utils'

function Table({ className, ...props }: React.ComponentProps<'table'>): React.JSX.Element {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>): React.JSX.Element {
  return (
    <thead
      data-slot="table-header"
      className={cn('text-xs uppercase tracking-[0.25em] text-muted-foreground/80', className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>): React.JSX.Element {
  return (
    <tbody
      data-slot="table-body"
      className={cn('divide-y divide-white/20', className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>): React.JSX.Element {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn('text-sm text-muted-foreground/80', className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>): React.JSX.Element {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'transition-colors hover:bg-white/40 data-[state=selected]:bg-white/50',
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>): React.JSX.Element {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'h-10 px-2 text-left align-middle font-semibold whitespace-nowrap text-muted-foreground/80',
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>): React.JSX.Element {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'p-3 align-middle whitespace-nowrap text-foreground/90 text-sm',
        className
      )}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>): React.JSX.Element {
  return (
    <caption
      data-slot="table-caption"
      className={cn('text-muted-foreground mt-4 text-sm', className)}
      {...props}
    />
  )
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
