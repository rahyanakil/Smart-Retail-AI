'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Package, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from './ProductCard';
import { productsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Product, PaginatedResponse } from '@/types';

export function ProductGrid() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<PaginatedResponse<Product>>({
    queryKey: ['pos-products'],
    queryFn: async () => {
      const res = await productsApi.list({ limit: '200', sortBy: 'name', sortOrder: 'asc' });
      return res.data.data;
    },
    staleTime: 1000 * 60 * 2, // 2 min cache — products don't change that fast
  });

  const allProducts = data?.data ?? [];

  // Derive categories from fetched products
  const categories = useMemo(() => {
    const cats = new Set(allProducts.map((p) => p.category).filter(Boolean) as string[]);
    return Array.from(cats).sort();
  }, [allProducts]);

  // Client-side filter: search + category
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allProducts.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.category?.toLowerCase().includes(q) ?? false);
      const matchesCategory = !activeCategory || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allProducts, search, activeCategory]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search + actions */}
      <div className="flex items-center gap-2 pb-3 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          title="Refresh products"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Category filter pills */}
      {categories.length > 0 && (
        <div className="flex gap-1.5 flex-wrap pb-3 shrink-0">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
              activeCategory === null
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Product count */}
      <div className="flex items-center justify-between pb-2 shrink-0">
        <p className="text-xs text-muted-foreground">
          {isLoading ? 'Loading…' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Product grid — scrollable */}
      <div className="flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Package className="h-10 w-10 opacity-30" />
            <p className="text-sm">Failed to load products</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <Package className="h-10 w-10 opacity-30" />
            <p className="text-sm font-medium">No products found</p>
            {search && (
              <button
                className="text-xs text-primary underline"
                onClick={() => { setSearch(''); setActiveCategory(null); }}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
