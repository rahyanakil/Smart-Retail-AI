'use client';

import { Plus, AlertTriangle } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/cartStore';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, items } = useCartStore();
  const cartItem = items.find((i) => i.productId === product.id);
  const cartQty = cartItem?.quantity ?? 0;
  const isOutOfStock = product.stock === 0;
  const isLowStock = !isOutOfStock && product.stock <= product.lowStockAlert;
  const isMaxed = cartQty >= product.stock;

  const stockBadgeVariant = isOutOfStock
    ? 'destructive'
    : isLowStock
    ? 'warning'
    : 'success';

  const stockLabel = isOutOfStock
    ? 'Out of stock'
    : isLowStock
    ? `${product.stock} left`
    : `${product.stock} in stock`;

  return (
    <button
      type="button"
      disabled={isOutOfStock || isMaxed}
      onClick={() => addItem(product)}
      className={cn(
        'group relative flex flex-col items-start text-left rounded-xl border bg-card p-4 transition-all duration-150',
        'hover:border-primary hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        (isOutOfStock || isMaxed) && 'opacity-50 cursor-not-allowed hover:border-border hover:shadow-none hover:translate-y-0'
      )}
    >
      {/* Category pill */}
      {product.category && (
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
          {product.category}
        </span>
      )}

      {/* Product name */}
      <p className="font-semibold text-sm leading-snug mb-1 line-clamp-2">{product.name}</p>
      <p className="text-xs text-muted-foreground font-mono mb-3">{product.sku}</p>

      {/* Price */}
      <p className="text-lg font-bold text-primary mt-auto">{formatCurrency(product.price)}</p>

      {/* Stock badge */}
      <div className="flex items-center gap-1.5 mt-2">
        {isLowStock && !isOutOfStock && (
          <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
        )}
        <Badge variant={stockBadgeVariant} className="text-[10px] px-1.5 py-0">
          {stockLabel}
        </Badge>
        {cartQty > 0 && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {cartQty} in cart
          </Badge>
        )}
      </div>

      {/* Add icon — visible on hover */}
      {!isOutOfStock && !isMaxed && (
        <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          <Plus className="h-4 w-4" />
        </span>
      )}
    </button>
  );
}
