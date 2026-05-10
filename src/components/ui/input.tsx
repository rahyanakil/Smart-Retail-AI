import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        // Layout
        'flex h-10 w-full rounded-md',
        // Typography
        'text-sm text-foreground placeholder:text-muted-foreground/60',
        // Surface
        'border border-input bg-background',
        'px-3 py-2',
        // Transitions
        'transition-colors duration-150',
        // Hover — subtle border brightening
        'hover:border-border',
        // Focus
        'focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ring-offset-background',
        'focus-visible:border-ring',
        // File input
        'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        // Disabled
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40',
        // Read-only
        'read-only:bg-muted/30 read-only:cursor-default',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
