'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** Reduces vertical padding for use inside cards/table rows */
  compact?: boolean;
  /** Disable entrance animation (e.g. when parent already animates) */
  animate?: boolean;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] as const } },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
  animate = true,
}: EmptyStateProps) {
  const Wrap = animate ? motion.div : 'div';
  const wrapProps = animate
    ? { variants: container, initial: 'hidden', animate: 'show' }
    : {};
  const Item = animate ? motion.div : 'div';
  const itemProps = animate ? { variants: item } : {};

  return (
    <Wrap
      {...(wrapProps as object)}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-3 py-10 px-4' : 'gap-4 py-16 px-6',
        className,
      )}
    >
      {Icon && (
        <Item {...(itemProps as object)}>
          <div className="relative">
            {/* Outer glow ring */}
            <div className={cn(
              'flex items-center justify-center rounded-2xl border border-border/50',
              'bg-gradient-to-br from-muted to-muted/40',
              'shadow-sm',
              compact ? 'h-11 w-11' : 'h-14 w-14',
            )}>
              <Icon className={cn(
                'text-muted-foreground/60',
                compact ? 'h-5 w-5' : 'h-6 w-6',
              )} />
            </div>
          </div>
        </Item>
      )}

      <Item {...(itemProps as object)} className="space-y-1.5 max-w-[280px]">
        <p className={cn(
          'font-semibold text-foreground/80',
          compact ? 'text-sm' : 'text-[15px]',
        )}>
          {title}
        </p>
        {description && (
          <p className={cn(
            'text-muted-foreground leading-relaxed',
            compact ? 'text-xs' : 'text-sm',
          )}>
            {description}
          </p>
        )}
      </Item>

      {action && (
        <Item {...(itemProps as object)} className="mt-1">
          {action}
        </Item>
      )}
    </Wrap>
  );
}
