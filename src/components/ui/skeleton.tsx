import { cn } from '@/lib/utils';

/**
 * Skeleton — shimmer-based loading placeholder.
 *
 * A gradient highlight travels across the element using the @keyframes
 * sk-shimmer animation defined in globals.css. The highlight colour adapts
 * automatically via the --sk-shimmer CSS variable:
 *   • Light mode: rgba(255,255,255,0.58)  — bright sweep over near-white bg
 *   • Dark mode:  rgba(255,255,255,0.07)  — soft whisper over dark blue-gray
 *
 * Drop-in replacement — just pass sizing via className:
 *   <Skeleton className="h-4 w-24" />
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-md bg-muted', className)}
      {...props}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, var(--sk-shimmer) 50%, transparent 100%)',
        }}
      />
    </div>
  );
}

export { Skeleton };
