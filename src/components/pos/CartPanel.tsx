'use client';

import { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingCart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { CheckoutModal } from './CheckoutModal';
import { useCartStore, TAX_RATE } from '@/store/cartStore';
import { formatCurrency } from '@/lib/utils';
import type { Invoice } from '@/types';

interface CartPanelProps {
  onSaleComplete: (invoice: Invoice) => void;
}

export function CartPanel({ onSaleComplete }: CartPanelProps) {
  const {
    items,
    discountPercent,
    incrementQty,
    decrementQty,
    removeItem,
    setDiscount,
    clearCart,
    itemCount,
    subtotal,
    discountAmount,
    taxAmount,
    total,
  } = useCartStore();

  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const count = itemCount();
  const sub = subtotal();
  const disc = discountAmount();
  const tax = taxAmount();
  const tot = total();

  return (
    <>
      <div className="flex flex-col h-full bg-card border rounded-xl overflow-hidden">
        {/* Cart header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Cart</span>
            {count > 0 && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {count}
              </span>
            )}
          </div>
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive h-7 text-xs px-2"
              onClick={clearCart}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Cart items — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground py-12">
              <ShoppingCart className="h-10 w-10 opacity-20" />
              <p className="text-sm font-medium">Cart is empty</p>
              <p className="text-xs opacity-60">Click a product to add it</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) => (
                <div key={item.productId} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} each</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => decrementQty(item.productId)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={item.quantity >= item.maxStock}
                        onClick={() => incrementQty(item.productId)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Line total */}
                    <span className="text-sm font-bold">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals + checkout — always visible at bottom */}
        {items.length > 0 && (
          <div className="shrink-0 border-t bg-muted/10">
            <div className="px-4 pt-3 pb-2 space-y-2">
              {/* Discount row */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground flex-1">Discount</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercent === 0 ? '' : discountPercent}
                    placeholder="0"
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="h-7 w-14 text-center text-xs px-1 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                  <span className="text-xs font-medium text-green-600 w-16 text-right">
                    -{formatCurrency(disc)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(sub)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>

              <Separator />

              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-lg text-primary">{formatCurrency(tot)}</span>
              </div>
            </div>

            <div className="px-4 pb-4">
              <Button
                className="w-full h-11 text-base font-semibold"
                onClick={() => setCheckoutOpen(true)}
              >
                Checkout
              </Button>
            </div>
          </div>
        )}
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onComplete={(invoice) => {
          setCheckoutOpen(false);
          clearCart();
          onSaleComplete(invoice);
        }}
      />
    </>
  );
}
