'use client';

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CopilotProvider } from '@/context/copilot-context';
import { CopilotDrawer } from '@/components/copilot/CopilotDrawer';
import { CopilotFAB } from '@/components/copilot/CopilotFAB';
import { CommandPaletteProvider } from '@/context/command-palette-context';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { NotificationProvider } from '@/context/notification-context';

// ── Page transition preset ────────────────────────────────────────────────────
// Subtle fade + 6 px upward drift — keeps navigations feeling instant while
// giving clear visual feedback that a new page has loaded.
const PAGE_TRANSITION = {
  initial:    { opacity: 0, y: 6 },
  animate:    { opacity: 1, y: 0 },
  exit:       { opacity: 0 },
  transition: { duration: 0.18, ease: 'easeOut' as const },
};

// ── Layout ────────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const openSidebar  = useCallback(() => setMobileSidebarOpen(true),  []);
  const closeSidebar = useCallback(() => setMobileSidebarOpen(false), []);

  return (
    <AuthGuard>
      <CopilotProvider>
        <NotificationProvider>
          <CommandPaletteProvider>

            {/* ── App shell ────────────────────────────────────────────── */}
            <div className="flex min-h-screen bg-background">

              {/* Mobile sidebar backdrop */}
              {mobileSidebarOpen && (
                <div
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                  onClick={closeSidebar}
                  aria-hidden="true"
                />
              )}

              {/* Left nav */}
              <Sidebar isOpen={mobileSidebarOpen} onClose={closeSidebar} />

              {/* Right: header + scrollable content */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Header is sticky via its own sticky top-0 class */}
                <Header onMenuClick={openSidebar} />

                {/* Page content — each route transition animates in */}
                <main className="flex-1 overflow-y-auto">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={pathname}
                      {...PAGE_TRANSITION}
                      className="p-4 sm:p-6 page-content"
                    >
                      {children}
                    </motion.div>
                  </AnimatePresence>
                </main>

              </div>
            </div>

            {/* ── Global overlays ──────────────────────────────────────── */}
            <CopilotDrawer />
            <CopilotFAB />
            <CommandPalette />

          </CommandPaletteProvider>
        </NotificationProvider>
      </CopilotProvider>
    </AuthGuard>
  );
}
