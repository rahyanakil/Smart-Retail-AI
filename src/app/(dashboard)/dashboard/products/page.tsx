'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { productsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/authStore';
import type { Product, PaginatedResponse } from '@/types';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.coerce.number().positive('Price must be positive'),
  costPrice: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  storeId: z.string(),
});

type ProductForm = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<Product>>({
    queryKey: ['products', search],
    queryFn: async () => {
      const res = await productsApi.list(search ? { search } : undefined);
      return res.data.data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { storeId: user?.storeId ?? '' },
  });

  const createMutation = useMutation({
    mutationFn: (data: ProductForm) => productsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product created successfully', variant: 'default' });
      setShowForm(false);
      reset();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create product';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product deleted' });
    },
  });

  const onSubmit = (data: ProductForm) => createMutation.mutate(data);

  const openEdit = (product: Product) => {
    setEditing(product);
    setValue('name', product.name);
    setValue('sku', product.sku);
    setValue('price', product.price);
    setValue('costPrice', product.costPrice);
    setValue('stock', product.stock);
    setValue('category', product.category ?? '');
    setValue('storeId', product.storeId);
    setShowForm(true);
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'OWNER';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Products</h2>
          <p className="text-muted-foreground mt-1">Manage your product catalog and inventory</p>
        </div>
        {canManage && (
          <Button onClick={() => { setEditing(null); setShowForm(!showForm); reset(); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && canManage && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? 'Edit Product' : 'Add New Product'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Name *</Label>
                <Input placeholder="e.g. Cola 330ml" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>SKU *</Label>
                <Input placeholder="e.g. BEV-001" {...register('sku')} />
                {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Selling Price *</Label>
                <Input type="number" step="0.01" placeholder="0.00" {...register('price')} />
                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Cost Price</Label>
                <Input type="number" step="0.01" placeholder="0.00" {...register('costPrice')} />
              </div>
              <div className="space-y-2">
                <Label>Initial Stock</Label>
                <Input type="number" placeholder="0" {...register('stock')} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input placeholder="e.g. Beverages" {...register('category')} />
              </div>
              <input type="hidden" {...register('storeId')} value={user?.storeId ?? ''} />
              <div className="col-span-2 flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editing ? 'Update' : 'Create Product'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); reset(); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: canManage ? 7 : 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (data?.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 7 : 6} className="text-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                (data?.data ?? []).map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>
                      {product.category ? (
                        <Badge variant="secondary">{product.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {product.stock <= product.lowStockAlert && product.stock > 0 && (
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                        )}
                        <span className={product.stock === 0 ? 'text-destructive font-medium' : ''}>
                          {product.stock}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.stock === 0 ? 'destructive' : product.stock <= product.lowStockAlert ? 'warning' : 'success'}>
                        {product.stock === 0 ? 'Out of stock' : product.stock <= product.lowStockAlert ? 'Low stock' : 'In stock'}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm('Delete this product?')) deleteMutation.mutate(product.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
