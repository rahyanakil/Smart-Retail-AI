import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Table — premium data-table primitives.
 *
 * Design decisions:
 *  • TableHeader gets a subtle muted background so columns read cleanly
 *  • TableHead uses uppercase tracking like Stripe/Vercel — tiny text, big clarity
 *  • TableRow hover uses a soft accent tint (not full muted) for lightness
 *  • TableCell padding reduced from p-4 → px-4 py-3 for a tighter data density
 */

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn('w-full caption-bottom text-sm', className)}
      {...props}
    />
  </div>
));
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      // Sticky-friendly: background keeps the header distinct while scrolling
      'bg-muted/40 dark:bg-muted/20',
      '[&_tr]:border-b [&_tr]:border-border/60',
      className,
    )}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t border-border/60 bg-muted/30 font-medium [&>tr]:last:border-b-0',
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      // Divider + transitions
      'border-b border-border/50 transition-colors duration-100',
      // Hover: lighter tint vs the old hover:bg-muted/50 for subtlety
      'hover:bg-accent/40 dark:hover:bg-accent/30',
      // Selection state
      'data-[state=selected]:bg-primary/[0.07]',
      className,
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      // Stripe-style column headers: tight height, uppercase, wide tracking
      'h-10 px-4',
      'text-left align-middle',
      'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70',
      'whitespace-nowrap',
      '[&:has([role=checkbox])]:pr-0',
      className,
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      // Tighter than default p-4 — keeps rows compact on data-dense screens
      'px-4 py-3 align-middle text-sm',
      '[&:has([role=checkbox])]:pr-0',
      className,
    )}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-xs text-muted-foreground', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

export {
  Table, TableHeader, TableBody, TableFooter,
  TableHead, TableRow, TableCell, TableCaption,
};
