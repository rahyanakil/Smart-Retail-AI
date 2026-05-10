'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { ArrowLeft, Package, Store, Tag, Hash, Star, ShoppingCart, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn, formatCurrency } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

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

interface ProductDetailData {
  product: PublicProduct;
  related: Pick<PublicProduct, 'id' | 'name' | 'price' | 'category' | 'imageUrl' | 'stock'>[];
}

function ProductDetailSkeleton() {
  return (
    <div className="pt-20 pb-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <Skeleton className="h-5 w-32 mb-8 mt-6" />
      <div className="grid md:grid-cols-2 gap-12">
        <Skeleton className="h-80 rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-32 mt-6" />
        </div>
      </div>
    </div>
  );
}

const MOCK_RATINGS = [
  { user: 'J.M.', stars: 5, text: 'Great quality product, exactly as described. Fast shipping.' },
  { user: 'S.T.', stars: 5, text: 'Works perfectly. Would definitely buy again.' },
  { user: 'A.K.', stars: 4, text: 'Good value for the price. Solid build quality.' },
];

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get<{ success: boolean; data: ProductDetailData }>(
          `${API_URL}/api/products/public/${id}`
        );
        setData(res.data.data);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        setError(status === 404 ? 'Product not found.' : 'Failed to load product.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <ProductDetailSkeleton />;

  if (error || !data) {
    return (
      <div className="pt-24 pb-24 text-center max-w-3xl mx-auto px-4">
        <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">{error ?? 'Product not found'}</h2>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/explore">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to catalog
          </Link>
        </Button>
      </div>
    );
  }

  const { product, related } = data;
  const inStock = product.stock > 0;
  const avgRating = 4.8;

  return (
    <div className="pt-20 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mt-6 mb-8">
          <Link href="/explore" className="hover:text-foreground transition-colors">Explore</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          {product.category && (
            <>
              <Link
                href={`/explore?category=${encodeURIComponent(product.category)}`}
                className="hover:text-foreground transition-colors"
              >
                {product.category}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
          <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Product main */}
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">

          {/* Image */}
          <div className="rounded-2xl border border-border bg-muted overflow-hidden aspect-square flex items-center justify-center">
            {product.imageUrl && !imageError ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground/30">
                <Package className="h-20 w-20 mb-3" />
                <span className="text-sm">No image available</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {product.category && (
              <Badge variant="secondary" className="mb-3">{product.category}</Badge>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i < Math.floor(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{avgRating} ({MOCK_RATINGS.length} reviews)</span>
            </div>

            <div className="text-3xl font-bold mb-4">{formatCurrency(product.price)}</div>

            {/* Stock status */}
            <div className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-5',
              inStock
                ? product.stock > 10 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                : 'bg-destructive/10 text-destructive'
            )}>
              <span className={cn('w-1.5 h-1.5 rounded-full', inStock ? 'bg-emerald-500' : 'bg-destructive')} />
              {inStock ? (product.stock > 10 ? 'In Stock' : `Only ${product.stock} units left`) : 'Out of Stock'}
            </div>

            {product.description && (
              <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>
            )}

            <Separator className="my-5" />

            {/* Specifications */}
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-semibold">Product Information</h3>
              {[
                { icon: Hash, label: 'SKU', value: product.sku },
                { icon: Tag, label: 'Category', value: product.category ?? 'Uncategorized' },
                { icon: Store, label: 'Sold by', value: product.store?.name ?? 'SmartRetail Store' },
                ...(product.store?.address ? [{ icon: Store, label: 'Location', value: product.store.address }] : []),
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 text-sm">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-20 shrink-0">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>

            <Button disabled={!inStock} size="lg" className="w-full sm:w-auto gap-2">
              <ShoppingCart className="h-4 w-4" />
              {inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Managed and sold via SmartRetail AI.{' '}
              <Link href="/contact" className="text-primary hover:underline underline-offset-4">
                Contact store
              </Link>
            </p>
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-14">
          <h2 className="text-lg font-semibold mb-5">Customer Reviews</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {MOCK_RATINGS.map((r, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: r.stars }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{r.text}</p>
                <p className="text-xs font-semibold mt-3">{r.user}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-lg font-semibold mb-5">Related Products</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/explore/${rel.id}`}
                  className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/20 hover:shadow-sm transition-all"
                >
                  <div className="h-32 bg-muted flex items-center justify-center">
                    {rel.imageUrl ? (
                      <img src={rel.imageUrl} alt={rel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="p-3">
                    {rel.category && <p className="text-xs text-muted-foreground mb-1">{rel.category}</p>}
                    <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">{rel.name}</p>
                    <p className="text-sm font-bold mt-1">{formatCurrency(rel.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back link */}
        <div className="mt-10">
          <Button variant="outline" asChild>
            <Link href="/explore">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to catalog
            </Link>
          </Button>
        </div>

      </div>
    </div>
  );
}
