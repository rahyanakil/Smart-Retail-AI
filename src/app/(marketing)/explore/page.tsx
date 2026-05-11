'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Search, SlidersHorizontal, Package, ChevronLeft, ChevronRight,
  Star, Store, ArrowUpDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, formatCurrency } from '@/lib/utils';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

interface PublicProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  imageUrl?: string;
  sku: string;
  store?: { id: string; name: string; address?: string };
  createdAt: string;
}

interface PublicProductsResponse {
  data: PublicProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  categories: string[];
}

function CategoryPill({ name, active, onClick }: { name: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-accent'
      )}
    >
      {name}
    </button>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: PublicProduct }) {
  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:shadow-md hover:border-primary/20 transition-all h-full">
      {/* Image */}
      <div className="h-48 bg-muted flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={cn(product.imageUrl ? 'hidden' : '', 'flex flex-col items-center text-muted-foreground/40')}>
          <Package className="h-12 w-12 mb-2" />
          <span className="text-xs">No image</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {product.category && (
          <Badge variant="secondary" className="self-start mb-2 text-xs">{product.category}</Badge>
        )}
        <h3 className="font-semibold text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
            {product.description}
          </p>
        )}
        <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Store className="h-3 w-3" />
          {product.store?.name ?? 'SmartRetail Store'}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div>
            <span className="text-lg font-bold">{formatCurrency(product.price)}</span>
            <div className={cn(
              'text-xs mt-0.5 font-medium',
              product.stock > 10 ? 'text-emerald-600 dark:text-emerald-400' :
              product.stock > 0 ? 'text-amber-600 dark:text-amber-400' :
              'text-destructive'
            )}>
              {product.stock > 10 ? 'In stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of stock'}
            </div>
          </div>
          <Button size="sm" asChild>
            <Link href={`/explore/${product.id}`}>View Details</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ExploreContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PublicProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const page = parseInt(searchParams.get('page') ?? '1');
  const category = searchParams.get('category') ?? 'all';
  const sort = searchParams.get('sort') ?? 'newest';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const search = searchParams.get('q') ?? '';

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const current = searchParams.get('q') ?? '';
      if (searchInput !== current) updateParams({ q: searchInput });
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '12', sort });
        if (search) params.set('q', search);
        if (category !== 'all') params.set('category', category);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        const res = await axios.get<{ success: boolean; data: PublicProductsResponse }>(
          `${API_URL}/api/products/public?${params}`
        );
        setData(res.data.data);
      } catch {
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [page, category, sort, search, minPrice, maxPrice]);

  const categories = ['all', ...(data?.categories ?? [])];

  return (
    <div className="pt-20 pb-24">
      {/* Header */}
      <section className="py-12 text-center max-w-3xl mx-auto px-4 sm:px-6">
        <Badge variant="secondary" className="mb-4">Product Catalog</Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Explore Products</h1>
        <p className="text-muted-foreground">
          Browse products from SmartRetail AI-managed stores. Search, filter, and find exactly what you need.
        </p>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products by name, category..."
              className="pl-9 h-10"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex gap-1">
              <Input
                placeholder="Min $"
                value={minPrice}
                onChange={(e) => updateParams({ minPrice: e.target.value })}
                className="w-20 h-10 text-sm"
                type="number"
                min="0"
              />
              <Input
                placeholder="Max $"
                value={maxPrice}
                onChange={(e) => updateParams({ maxPrice: e.target.value })}
                className="w-20 h-10 text-sm"
                type="number"
                min="0"
              />
            </div>
            <Select value={sort} onValueChange={(v) => updateParams({ sort: v })}>
              <SelectTrigger className="w-40 h-10">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="name_asc">Name: A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {categories.map((cat) => (
            <CategoryPill
              key={cat}
              name={cat === 'all' ? 'All Categories' : cat}
              active={category === cat}
              onClick={() => updateParams({ category: cat })}
            />
          ))}
        </div>

        {/* Results count */}
        {!loading && data && (
          <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
            <span>
              {data.total === 0
                ? 'No products found'
                : `${data.total} product${data.total !== 1 ? 's' : ''} found`}
            </span>
            {data.totalPages > 1 && (
              <span>Page {data.page} of {data.totalPages}</span>
            )}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : data?.data.map((product) => <ProductCard key={product.id} product={product} />)
          }
        </div>

        {/* Empty state */}
        {!loading && data?.data.length === 0 && (
          <div className="text-center py-16">
            <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No products found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters.
            </p>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(data.totalPages - 4, page - 2)) + i;
                return (
                  <Button
                    key={p}
                    variant={p === page ? 'default' : 'outline'}
                    size="sm"
                    className="w-9"
                    onClick={() => updateParams({ page: String(p) })}
                  >
                    {p}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="pt-20 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 text-center">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
          {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}
