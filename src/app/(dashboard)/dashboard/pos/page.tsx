'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Clock } from 'lucide-react';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CartPanel } from '@/components/pos/CartPanel';
import { InvoiceModal } from '@/components/pos/InvoiceModal';
import { useAuthStore } from '@/store/authStore';
import { ROLE_LABELS } from '@/lib/utils';
import type { Invoice } from '@/types';

export default function POSPage() {
  const { user } = useAuthStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const handleSaleComplete = (inv: Invoice) => {
    setInvoice(inv);
    setInvoiceOpen(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-6">
      {/* POS Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <span className="font-bold text-lg">Point of Sale</span>
          {user?.store && (
            <span className="text-sm text-muted-foreground ml-2">— {user.store.name}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <LiveClock />
          </div>
          {user && (
            <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
              {user.name} · {ROLE_LABELS[user.role]}
            </span>
          )}
        </div>
      </div>

      {/* No store warning */}
      {!user?.storeId && (
        <div className="mx-6 mt-4 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">
          ⚠️ Your account is not assigned to a store. Ask an admin to assign you to a store before processing sales.
        </div>
      )}

      {/* Main POS layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Product Grid */}
        <div className="flex-1 overflow-hidden p-4 pr-2">
          <ProductGrid />
        </div>

        {/* Right: Cart (fixed width) */}
        <div className="w-80 xl:w-96 shrink-0 p-4 pl-2">
          <CartPanel onSaleComplete={handleSaleComplete} />
        </div>
      </div>

      {/* Invoice modal — shown after successful checkout */}
      <InvoiceModal
        invoice={invoice}
        open={invoiceOpen}
        onClose={() => {
          setInvoiceOpen(false);
          setInvoice(null);
        }}
      />
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    // Align first tick to the next whole second
    const initial = setTimeout(() => {
      setTime(new Date());
      const interval = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(interval);
    }, 1000 - new Date().getMilliseconds());
    return () => clearTimeout(initial);
  }, []);

  return (
    <span className="tabular-nums">
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}
