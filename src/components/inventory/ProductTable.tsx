'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit2, Layers, Trash2, Package, ChevronUp, ChevronDown, ChevronsUpDown,
  AlertTriangle, XCircle, CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProductFormModal } from './ProductFormModal';
import { StockAdjustModal } from './StockAdjustModal';
import { productsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import type { Product, PaginatedResponse, CategoryStat } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = 'name' | 'price' | 'stock' | 'costPrice' | 'createdAt';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

interface Props {
  search: string;
  category: string;
  status: StatusFilter;
  categories: CategoryStat[];
}

// ─── Stock visual bar ─────────────────────────────────────────────────────────

function StockBar({ stock, alert }: { stock: number; alert: number }) {
  const isOut = stock === 0;
  const isLow = !isOut && stock <= alert;
  const max = Math.max(stock, alert * 3, 1);
  const pct = Math.min(100, (stock / max) * 100);
  const color = isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-green-500';

  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 bg-muted rounded-full h-1.5">
        <div className={cn('h-1.5 rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn('text-sm tabular-nums font-medium', isOut && 'text-red-600', isLow && 'text-amber-700')}>
        {stock}
      </span>
    </div>
  );
}

// ─── Sort button ──────────────────────────────────────────────────────────────

function SortBtn({
  field, current, dir, onSort,
}: { field: SortField; current: SortField; dir: SortDir; onSort: (f: SortField) => void }) {
  const active = current === field;
  return (
    <button onClick={() => onSort(field)} className="flex items-center gap-1 hover:text-foreground transition-colors">
      {active ? (dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProductTable({ search, category, status, categories }: Props) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortDir>('asc');

  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const params: Record<string, string> = {
    page: String(page),
    limit: '20',
    sortBy,
    sortOrder,
  };
  if (search) params.search = search;
  if (category) params.category = category;
  if (status !== 'all') params.status = status;

  const { data, isLoading } = useQuery<PaginatedResponse<Product>>({
    queryKey: ['inventory-products', params],
    queryFn: async () => {
      const res = await productsApi.list(params);
      return res.data.data;
    },
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onMutate: async (deletedId: string) => {
      await qc.cancelQueries({ queryKey: ['inventory-products', params] });
      const previous = qc.getQueryData<PaginatedResponse<Product>>(['inventory-products', params]);
      if (previous) {
        qc.setQueryData<PaginatedResponse<Product>>(['inventory-products', params], {
          ...previous,
          data: previous.data.filter((p) => p.id !== deletedId),
          total: previous.total - 1,
        });
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(['inventory-products', params], ctx.previous);
      toast({ title: 'Failed to archive product', variant: 'destructive' });
    },
    onSuccess: () => {
      toast({ title: 'Product archived' });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['inventory-products'] });
      qc.invalidateQueries({ queryKey: ['inventory-stats'] });
      qc.invalidateQueries({ queryKey: ['pos-products'] });
    },
  });

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
    setPage(1);
  };

  const products = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <>
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[280px]">
                <div className="flex items-center gap-1">
                  Product
                  <SortBtn field="name" current={sortBy} dir={sortOrder} onSort={handleSort} />
                </div>
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Cost
                  <SortBtn field="costPrice" current={sortBy} dir={sortOrder} onSort={handleSort} />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Price
                  <SortBtn field="price" current={sortBy} dir={sortOrder} onSort={handleSort} />
                </div>
              </TableHead>
              <TableHead className="w-[150px]">
                <div className="flex items-center gap-1">
                  Stock
                  <SortBtn field="stock" current={sortBy} dir={sortOrder} onSort={handleSort} />
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm text-muted-foreground">No products found</p>
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => {
                const isOut = p.stock === 0;
                const isLow = !isOut && p.stock <= p.lowStockAlert;
                const margin = p.costPrice > 0
                  ? Math.round(((p.price - p.costPrice) / p.price) * 100)
                  : null;

                return (
                  <TableRow key={p.id} className="group">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-mono text-muted-foreground">{p.sku}</span>
                          {p.barcode && (
                            <span className="text-xs text-muted-foreground opacity-70">· {p.barcode}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.category ? (
                        <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.costPrice > 0 ? formatCurrency(p.costPrice) : '—'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="text-sm font-medium">{formatCurrency(p.price)}</span>
                        {margin !== null && (
                          <span className="ml-1.5 text-[10px] text-green-600 font-medium">{margin}%</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StockBar stock={p.stock} alert={p.lowStockAlert} />
                    </TableCell>
                    <TableCell>
                      {isOut ? (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <XCircle className="h-3 w-3" /> Out of Stock
                        </Badge>
                      ) : isLow ? (
                        <Badge variant="warning" className="gap-1 text-xs">
                          <AlertTriangle className="h-3 w-3" /> Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="success" className="gap-1 text-xs">
                          <CheckCircle className="h-3 w-3" /> In Stock
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit product"
                          onClick={() => { setEditProduct(p); setEditOpen(true); }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Adjust stock"
                          onClick={() => { setAdjustProduct(p); setAdjustOpen(true); }}
                        >
                          <Layers className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete product"
                          onClick={() => {
                            if (confirm(`Archive "${p.name}"? It will be hidden from POS.`)) {
                              deleteMutation.mutate(p.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            {data?.total ?? 0} products · page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProductFormModal
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditProduct(null); }}
        product={editProduct}
        categories={categories}
      />
      <StockAdjustModal
        product={adjustProduct}
        open={adjustOpen}
        onClose={() => { setAdjustOpen(false); setAdjustProduct(null); }}
      />
    </>
  );
}
