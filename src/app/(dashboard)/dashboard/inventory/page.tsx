'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { InventoryStats } from '@/components/inventory/InventoryStats';
import { ProductTable } from '@/components/inventory/ProductTable';
import { ProductFormModal } from '@/components/inventory/ProductFormModal';
import { productsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import type { CategoryStat } from '@/types';

// ─── Tab config ───────────────────────────────────────────────────────────────

type Tab = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

interface TabDef {
  key: Tab;
  label: string;
  icon: React.ElementType;
  iconClass: string;
}

const TABS: TabDef[] = [
  { key: 'all',          label: 'All',       icon: Package,       iconClass: 'text-muted-foreground' },
  { key: 'in_stock',     label: 'In Stock',  icon: CheckCircle,   iconClass: 'text-green-600 dark:text-green-400' },
  { key: 'low_stock',    label: 'Low Stock', icon: AlertTriangle, iconClass: 'text-amber-600 dark:text-amber-400' },
  { key: 'out_of_stock', label: 'Out',       icon: XCircle,       iconClass: 'text-red-600 dark:text-red-400' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { user } = useAuthStore();
  const canManage = user?.role === 'ADMIN' || user?.role === 'OWNER';

  const [tab, setTab]                   = useState<Tab>('all');
  const [search, setSearch]             = useState('');
  const [selectedCategory, setCategory] = useState('');
  const [addOpen, setAddOpen]           = useState(false);

  const {
    data: categories = [],
    isError: catError,
    refetch: refetchCats,
  } = useQuery<CategoryStat[]>({
    queryKey: ['inventory-categories'],
    queryFn: async () => {
      const res = await productsApi.categories();
      return res.data.data;
    },
    staleTime: 1000 * 60,
  });

  return (
    <div className="space-y-5 sm:space-y-6 max-w-[1600px] mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage products, track stock levels, and monitor inventory value
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      {/* Stats */}
      <InventoryStats />

      {/* Error */}
      {catError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between py-4 px-5">
            <p className="text-sm text-destructive">Failed to load categories.</p>
            <Button size="sm" variant="outline" onClick={() => refetchCats()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tab navigation */}
      <div className="border-b overflow-x-auto">
        <nav className="flex gap-0 min-w-max">
          {TABS.map(({ key, label, icon: Icon, iconClass }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setSearch(''); setCategory(''); }}
              className={cn(
                'flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                tab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              )}
            >
              <Icon
                className={cn(
                  'h-3.5 w-3.5 shrink-0',
                  tab === key ? 'text-primary' : iconClass
                )}
              />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search name, SKU, barcode…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex gap-1.5 flex-wrap items-center">
            <button
              onClick={() => setCategory('')}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                !selectedCategory
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setCategory(selectedCategory === cat.name ? '' : cat.name)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  selectedCategory === cat.name
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                )}
              >
                {cat.name}
                <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">
                  {cat.count}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product table */}
      <ProductTable
        search={search}
        category={selectedCategory}
        status={tab}
        categories={categories}
      />

      {/* Add product modal */}
      <ProductFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        product={null}
        categories={categories}
      />
    </div>
  );
}
