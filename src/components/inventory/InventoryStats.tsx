'use client';

import { useQuery } from '@tanstack/react-query';
import { Package, CheckCircle, AlertTriangle, XCircle, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { productsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { InventoryStats as IStats } from '@/types';

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
}

function StatCard({ title, value, sub, icon: Icon, iconBg, iconColor, valueColor }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <p className={`text-xl sm:text-2xl font-bold ${valueColor ?? ''}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function InventoryStats() {
  const { data, isLoading } = useQuery<IStats>({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      const res = await productsApi.stats();
      return res.data.data;
    },
    staleTime: 1000 * 30,
  });

  if (isLoading) {
    return (
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-20 mt-1.5" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        title="Total Products"
        value={data.totalProducts}
        sub={`${data.categoriesCount} categories`}
        icon={Package}
        iconBg="bg-blue-500/10 dark:bg-blue-500/15"
        iconColor="text-blue-600 dark:text-blue-400"
      />
      <StatCard
        title="In Stock"
        value={data.inStock}
        sub={`${Math.round((data.inStock / (data.totalProducts || 1)) * 100)}% of catalog`}
        icon={CheckCircle}
        iconBg="bg-green-500/10 dark:bg-green-500/15"
        iconColor="text-green-600 dark:text-green-400"
        valueColor="text-green-700 dark:text-green-400"
      />
      <StatCard
        title="Low Stock"
        value={data.lowStock}
        sub="Need restocking soon"
        icon={AlertTriangle}
        iconBg="bg-amber-500/10 dark:bg-amber-500/15"
        iconColor="text-amber-600 dark:text-amber-400"
        valueColor={data.lowStock > 0 ? 'text-amber-700 dark:text-amber-400' : undefined}
      />
      <StatCard
        title="Out of Stock"
        value={data.outOfStock}
        sub="Unavailable in POS"
        icon={XCircle}
        iconBg="bg-red-500/10 dark:bg-red-500/15"
        iconColor="text-red-600 dark:text-red-400"
        valueColor={data.outOfStock > 0 ? 'text-red-700 dark:text-red-400' : undefined}
      />
      <StatCard
        title="Inventory Value"
        value={formatCurrency(data.inventoryValue)}
        sub="At cost price"
        icon={DollarSign}
        iconBg="bg-purple-500/10 dark:bg-purple-500/15"
        iconColor="text-purple-600 dark:text-purple-400"
      />
      <StatCard
        title="Potential Profit"
        value={formatCurrency(data.potentialProfit)}
        sub={`Retail: ${formatCurrency(data.retailValue)}`}
        icon={TrendingUp}
        iconBg="bg-emerald-500/10 dark:bg-emerald-500/15"
        iconColor="text-emerald-600 dark:text-emerald-400"
        valueColor="text-emerald-700 dark:text-emerald-400"
      />
    </div>
  );
}
