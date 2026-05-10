'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useCopilotDrawer } from '@/context/copilot-context';
import { cn } from '@/lib/utils';

export function CopilotFAB() {
  const { isOpen, toggle, messages, isStreaming } = useCopilotDrawer();

  const msgCount = messages.filter((m) => m.role === 'user').length;
  const showBadge = !isOpen && msgCount > 0;

  return (
    <AnimatePresence>
      {!isOpen && (
        <motion.div
          key="copilot-fab"
          initial={{ opacity: 0, scale: 0.7, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 16 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="fixed bottom-6 right-6 z-[50]"
        >
          {/* Tooltip */}
          <div className="group relative">
            <span
              className={cn(
                'absolute -top-9 right-0 whitespace-nowrap rounded-lg px-2.5 py-1.5',
                'bg-popover border border-border text-[11px] font-medium text-popover-foreground shadow-md',
                'opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none',
                'before:absolute before:bottom-[-5px] before:right-3.5 before:h-2.5 before:w-2.5',
                'before:rotate-45 before:bg-popover before:border-r before:border-b before:border-border'
              )}
            >
              AI Copilot
            </span>

            <motion.button
              onClick={toggle}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.94 }}
              className={cn(
                'relative flex h-12 w-12 items-center justify-center rounded-2xl',
                'bg-primary text-primary-foreground shadow-lg',
                'hover:shadow-xl hover:shadow-primary/30 transition-shadow duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
              )}
              aria-label="Open AI Copilot"
            >
              {/* Streaming pulse ring */}
              {isStreaming && (
                <motion.span
                  className="absolute inset-0 rounded-2xl bg-primary"
                  animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              {/* Glow layer */}
              <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent" />

              <Sparkles className="h-5 w-5 relative z-10" />

              {/* Message count badge */}
              {showBadge && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    'absolute -top-1.5 -right-1.5 flex min-w-[18px] h-[18px] items-center justify-center',
                    'rounded-full bg-green-500 ring-2 ring-background',
                    'text-[9px] font-bold text-white px-1'
                  )}
                >
                  {msgCount > 9 ? '9+' : msgCount}
                </motion.span>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
