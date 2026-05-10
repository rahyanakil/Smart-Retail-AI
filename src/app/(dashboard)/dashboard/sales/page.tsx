'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ShoppingCart, Receipt, X, RefreshCw } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Separator } from '@/components/ui/separator';
import { salesApi, productsApi } from '@/lib/api';
import { formatCurrency, formatDateTime, SALE_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import type { Sale, Product, PaginatedResponse } from '@/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const saleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Select a product'),
        quantity: z.coerce.number().int().min(1),
      })
    )
    .min(1),
  paymentMethod: z.enum(['CASH', 'CARD', 'DIGITAL_WALLET']),
  discount: z.coerce.number().min(0).max(100).optional(),
  storeId: z.string(),
});

type SaleForm = z.infer<typeof saleSchema>;

const statusBadge: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  COMPLETED: 'success',
  PENDING: 'warning',
  CANCELLED: 'destructive',
  REFUNDED: 'secondary',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<PaginatedResponse<Sale>>({
    queryKey: ['sales', search],
    queryFn: async () => {
      const res = await salesApi.list(search ? { search } : undefined);
      return res.data.data;
    },
  });

  const { data: productsData } = useQuery<PaginatedResponse<Product>>({
    queryKey: ['products-for-sale'],
    queryFn: async () => {
      const res = await productsApi.list({ limit: '100' });
      return res.data.data;
    },
    enabled: showForm,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SaleForm>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      items: [{ productId: '', quantity: 1 }],
      paymentMethod: 'CASH',
      storeId: user?.storeId ?? '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');

  const createMutation = useMutation({
    mutationFn: (d: SaleForm) => salesApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Sale completed!' });
      setShowForm(false);
      reset();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create sale';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });

  const getProductById = (id: string) => productsData?.data.find((p) => p.id === id);

  const calculateTotal = () =>
    watchItems.reduce((acc, item) => {
      const product = getProductById(item.productId);
      return acc + (product?.price ?? 0) * (item.quantity || 0);
    }, 0);

  const closeForm = () => {
    setShowForm(false);
    reset();
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sales History</h1>
          <p className="text-muted-foreground mt-1 text-sm">View and record sales transactions</p>
        </div>
        <Button
          onClick={() => {
            if (showForm) {
              closeForm();
            } else {
              setShowForm(true);
            }
          }}
          variant={showForm ? 'outline' : 'default'}
        >
          {showForm ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              New Sale
            </>
          )}
        </Button>
      </div>

      {/* New Sale Form */}
      {showForm && (
        <Card className="border-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4 text-primary" />
              New Sale
            </CardTitle>
            <CardDescription>Add items, set payment method, and complete the transaction.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-5">
              {/* Items */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Sale Items</Label>
                <div className="space-y-2">
                  {fields.map((field, index) => {
                    const product = getProductById(watchItems[index]?.productId);
                    return (
                      <div
                        key={field.id}
                        className="flex flex-col sm:flex-row gap-2 p-3 rounded-lg border bg-muted/30"
                      >
                        {/* Product select */}
                        <div className="flex-1 min-w-0">
                          <Select
                            value={watchItems[index]?.productId ?? ''}
                            onValueChange={(v) => setValue(`items.${index}.productId`, v)}
                          >
                            <SelectTrigger className={cn(errors.items?.[index]?.productId && 'border-destructive')}>
                              <SelectValue placeholder="Select product…" />
                            </SelectTrigger>
                            <SelectContent>
                              {(productsData?.data ?? []).map((p) => (
                                <SelectItem
                                  key={p.id}
                                  value={p.id}
                                  disabled={p.stock === 0}
                                >
                                  <span className="flex items-center justify-between w-full gap-4">
                                    <span className="truncate">{p.name}</span>
                                    <span className="text-muted-foreground text-xs shrink-0">
                                      {formatCurrency(p.price)} · {p.stock} in stock
                                    </span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Quantity */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Input
                            type="number"
                            min="1"
                            max={product?.stock}
                            placeholder="Qty"
                            className="w-20"
                            {...register(`items.${index}.quantity`)}
                          />
                          {product && (
                            <span className="text-sm font-semibold w-24 text-right shrink-0 text-primary">
                              {formatCurrency(product.price * (watchItems[index]?.quantity || 0))}
                            </span>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => append({ productId: '', quantity: 1 })}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Item
                </Button>
              </div>

              <Separator />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <Label>Payment Method</Label>
                  <Select
                    defaultValue="CASH"
                    onValueChange={(v) =>
                      setValue('paymentMethod', v as 'CASH' | 'CARD' | 'DIGITAL_WALLET')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="DIGITAL_WALLET">Digital Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Discount (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    {...register('discount')}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground">Subtotal</Label>
                  <div className="flex h-10 items-center px-3 rounded-md border bg-muted text-base font-bold text-primary">
                    {formatCurrency(calculateTotal())}
                  </div>
                </div>
              </div>

              <input type="hidden" {...register('storeId')} value={user?.storeId ?? ''} />

              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                  {isSubmitting || createMutation.isPending ? 'Processing…' : 'Complete Sale'}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search receipt, cashier…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Error state */}
      {isError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between py-4 px-5">
            <p className="text-sm text-destructive">Failed to load sales data.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="hidden md:table-cell">Cashier</TableHead>
                  <TableHead className="hidden sm:table-cell">Items</TableHead>
                  <TableHead className="hidden lg:table-cell">Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (data?.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <EmptyState
                        icon={Receipt}
                        title="No sales found"
                        description={search ? `No results for "${search}"` : 'Sales will appear here once transactions are recorded.'}
                        compact
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  (data?.data ?? []).map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-xs sm:text-sm font-medium">
                        {sale.receiptNumber}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                        {formatDateTime(sale.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm hidden md:table-cell">
                        {sale.cashier.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                        {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="secondary" className="text-xs">
                          {PAYMENT_METHOD_LABELS[sale.paymentMethod]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-sm whitespace-nowrap">
                        {formatCurrency(sale.total)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadge[sale.status] ?? 'secondary'} className="text-xs">
                          {SALE_STATUS_LABELS[sale.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
