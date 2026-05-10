'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CreditCard, Banknote, Smartphone, Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCartStore, TAX_RATE } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { salesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Invoice, PaymentMethod } from '@/types';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'CARD', label: 'Card', icon: CreditCard },
  { value: 'DIGITAL_WALLET', label: 'Digital Wallet', icon: Smartphone },
];

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (invoice: Invoice) => void;
}

export function CheckoutModal({ open, onClose, onComplete }: CheckoutModalProps) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { items, discountPercent, subtotal, discountAmount, taxAmount, total } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sub = subtotal();
  const disc = discountAmount();
  const tax = taxAmount();
  const tot = total();

  const handleComplete = async () => {
    if (!user?.storeId) {
      setError('No store assigned to your account. Contact your administrator.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const saleRes = await salesApi.create({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod,
        discount: discountPercent,
        taxRate: TAX_RATE,
        notes: notes.trim() || undefined,
        storeId: user.storeId,
      });

      const saleId: string = saleRes.data.data.id;

      // Fetch full invoice
      const invoiceRes = await salesApi.invoice(saleId);
      const invoice: Invoice = invoiceRes.data.data;

      // Invalidate related caches
      qc.invalidateQueries({ queryKey: ['pos-products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });

      onComplete(invoice);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Checkout failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>Review the order and select payment method.</DialogDescription>
        </DialogHeader>

        {/* Order items */}
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm py-0.5">
              <span className="text-muted-foreground truncate flex-1 mr-2">
                {item.name}
                <span className="ml-1 text-xs">×{item.quantity}</span>
              </span>
              <span className="font-medium shrink-0">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span><span>{formatCurrency(sub)}</span>
          </div>
          {disc > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount ({discountPercent}%)</span>
              <span>-{formatCurrency(disc)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(tot)}</span>
          </div>
        </div>

        {/* Payment method */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Payment Method</Label>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPaymentMethod(value)}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors ${
                  paymentMethod === value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium" htmlFor="notes">
            Notes <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="notes"
            placeholder="e.g. Customer name, special instructions…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleComplete} disabled={loading || items.length === 0} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              `Complete Sale · ${formatCurrency(tot)}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
