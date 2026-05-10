'use client';

import { useRef } from 'react';
import { Printer, ShoppingCart } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime, PAYMENT_METHOD_LABELS } from '@/lib/utils';
import type { Invoice } from '@/types';

interface InvoiceModalProps {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
}

export function InvoiceModal({ invoice, open, onClose }: InvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const html = printRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=400,height=700');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt – ${invoice?.receiptNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 13px; margin: 20px; color: #000; }
            .receipt { max-width: 320px; margin: 0 auto; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
            .item-name { flex: 1; }
            .item-total { text-align: right; min-width: 70px; }
            .total-row { font-weight: bold; font-size: 15px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${html}
        </body>
      </html>
    `);
    win.document.close();
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Invoice</DialogTitle>
        </DialogHeader>

        {/* Printable receipt area */}
        <div ref={printRef} className="receipt font-mono text-sm">
          {/* Store header */}
          <div className="center text-center mb-4 space-y-0.5">
            <p className="font-bold text-base uppercase tracking-widest">SmartRetail AI</p>
            <p className="font-semibold">{invoice.store.name}</p>
            {invoice.store.address && (
              <p className="text-xs text-muted-foreground">{invoice.store.address}</p>
            )}
            {invoice.store.phone && (
              <p className="text-xs text-muted-foreground">{invoice.store.phone}</p>
            )}
          </div>

          <Separator className="my-3 border-dashed" />

          {/* Receipt meta */}
          <div className="space-y-1 text-xs mb-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Receipt</span>
              <span className="font-medium">{invoice.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{formatDateTime(invoice.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cashier</span>
              <span>{invoice.cashier.name}</span>
            </div>
          </div>

          <Separator className="my-3 border-dashed" />

          {/* Items */}
          <div className="space-y-2 mb-3">
            {invoice.items.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs">
                  <span className="font-medium flex-1 mr-2 truncate">{item.name}</span>
                  <span className="shrink-0">{formatCurrency(item.total)}</span>
                </div>
                <div className="text-[11px] text-muted-foreground pl-0">
                  {item.quantity} × {formatCurrency(item.unitPrice)}
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-3 border-dashed" />

          {/* Totals */}
          <div className="space-y-1 text-sm mb-3">
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-green-600 text-xs">
                <span>Discount</span>
                <span>-{formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>Tax</span>
              <span>{formatCurrency(invoice.taxAmount)}</span>
            </div>

            <Separator className="my-2 border-dashed" />

            <div className="flex justify-between font-bold text-base">
              <span>TOTAL</span>
              <span className="text-primary">{formatCurrency(invoice.total)}</span>
            </div>

            <div className="flex justify-between text-xs pt-1">
              <span className="text-muted-foreground">Payment</span>
              <Badge variant="secondary" className="text-xs">
                {PAYMENT_METHOD_LABELS[invoice.paymentMethod]}
              </Badge>
            </div>
          </div>

          <Separator className="my-3 border-dashed" />

          {invoice.notes && (
            <>
              <p className="text-xs text-muted-foreground italic mb-2">Note: {invoice.notes}</p>
              <Separator className="my-3 border-dashed" />
            </>
          )}

          <div className="text-center text-xs text-muted-foreground py-2">
            <p className="font-medium">Thank you for shopping!</p>
            <p>Please keep this receipt for your records.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button className="flex-1" onClick={onClose}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
