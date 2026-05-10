'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Minus, Hash, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { productsApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import type { Product, StockLog } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'ADD' | 'REMOVE' | 'SET';

interface Props {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StockAdjustModal({ product, open, onClose }: Props) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>('ADD');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qty = parseInt(quantity) || 0;
  const current = product?.stock ?? 0;

  const projected =
    mode === 'SET' ? qty : mode === 'ADD' ? current + qty : Math.max(0, current - qty);

  const projectedDelta = projected - current;

  const { data: logs, isLoading: logsLoading } = useQuery<StockLog[]>({
    queryKey: ['stock-logs', product?.id],
    queryFn: async () => {
      const res = await productsApi.stockLogs(product!.id);
      return res.data.data;
    },
    enabled: open && !!product,
  });

  const handleSubmit = async () => {
    if (!product || qty === 0) return;

    setError(null);
    setLoading(true);

    try {
      const payload =
        mode === 'SET'
          ? { setTo: qty, reason: reason.trim() || undefined }
          : {
              adjustment: mode === 'ADD' ? qty : -qty,
              reason: reason.trim() || undefined,
            };

      await productsApi.adjustStock(product.id, payload);

      qc.invalidateQueries({ queryKey: ['inventory-products'] });
      qc.invalidateQueries({ queryKey: ['inventory-stats'] });
      qc.invalidateQueries({ queryKey: ['stock-logs', product.id] });
      qc.invalidateQueries({ queryKey: ['pos-products'] });
      qc.invalidateQueries({ queryKey: ['products'] });

      toast({
        title: 'Stock updated',
        description: `${product.name} stock: ${current} → ${projected}`,
      });

      setQuantity('');
      setReason('');
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Stock adjustment failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const modeConfig = {
    ADD: { label: 'Add Stock', icon: Plus, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
    REMOVE: { label: 'Remove Stock', icon: Minus, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
    SET: { label: 'Set Exact', icon: Hash, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription className="line-clamp-1">
            {product?.name} · SKU: {product?.sku}
          </DialogDescription>
        </DialogHeader>

        {/* Current stock */}
        <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
          <span className="text-sm text-muted-foreground">Current Stock</span>
          <span className="text-2xl font-bold">{current}</span>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(modeConfig) as Mode[]).map((m) => {
            const { label, icon: Icon, color, bg } = modeConfig[m];
            return (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setQuantity(''); setError(null); }}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition-colors',
                  mode === m ? `${bg} ${color} border-current` : 'border-border text-muted-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Quantity input */}
        <div className="space-y-1.5">
          <Label>
            {mode === 'ADD' ? 'Units to add' : mode === 'REMOVE' ? 'Units to remove' : 'Set stock to'}
          </Label>
          <Input
            type="number"
            min="0"
            max={mode === 'REMOVE' ? current : undefined}
            placeholder="0"
            value={quantity}
            onChange={(e) => { setQuantity(e.target.value); setError(null); }}
            className="text-lg"
            autoFocus
          />
        </div>

        {/* Projected result */}
        {qty > 0 && (
          <div className={cn(
            'flex items-center justify-between rounded-lg border px-4 py-3',
            projectedDelta > 0 ? 'bg-green-50 border-green-200' :
            projectedDelta < 0 ? 'bg-red-50 border-red-200' : 'bg-muted'
          )}>
            <div className="flex items-center gap-2 text-sm">
              {projectedDelta > 0
                ? <ArrowUp className="h-4 w-4 text-green-600" />
                : projectedDelta < 0
                ? <ArrowDown className="h-4 w-4 text-red-600" />
                : null}
              <span className="text-muted-foreground">New stock</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm line-through">{current}</span>
              <span className={cn(
                'text-xl font-bold',
                projectedDelta > 0 ? 'text-green-700' : projectedDelta < 0 ? 'text-red-700' : ''
              )}>
                {projected}
              </span>
            </div>
          </div>
        )}

        {/* Reason */}
        <div className="space-y-1.5">
          <Label>Reason <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Textarea
            placeholder="e.g. Damaged goods, supplier delivery, stocktake correction…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || qty === 0}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Apply Adjustment'}
          </Button>
        </DialogFooter>

        {/* Audit log */}
        <Separator />
        <div>
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2">
            <Clock className="h-3 w-3" /> Recent Adjustments
          </p>
          {logsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : (logs ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No manual adjustments yet</p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {(logs ?? []).map((log) => {
                const delta = log.quantityAfter - log.quantityBefore;
                return (
                  <div key={log.id} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge
                        variant={log.adjustmentType === 'ADD' ? 'success' : log.adjustmentType === 'REMOVE' ? 'destructive' : 'secondary'}
                        className="text-[10px] px-1.5 shrink-0"
                      >
                        {log.adjustmentType}
                      </Badge>
                      <span className="text-muted-foreground truncate">{log.user.name}</span>
                      {log.reason && <span className="text-muted-foreground truncate italic">· {log.reason}</span>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className={cn('font-medium', delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : '')}>
                        {delta > 0 ? `+${delta}` : delta}
                      </span>
                      <span className="text-muted-foreground">{log.quantityBefore}→{log.quantityAfter}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
