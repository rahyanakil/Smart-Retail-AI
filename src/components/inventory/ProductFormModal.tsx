'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
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
import { productsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/use-toast';
import type { Product, CategoryStat } from '@/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(200).trim(),
  sku: z.string().min(1, 'SKU is required').max(50).trim(),
  barcode: z.string().max(50).optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
  category: z.string().max(100).trim().optional().or(z.literal('')),
  price: z.coerce.number().positive('Must be a positive number'),
  costPrice: z.coerce.number().min(0, 'Must be 0 or more').optional(),
  stock: z.coerce.number().int().min(0).optional(),
  lowStockAlert: z.coerce.number().int().min(0).optional(),
  storeId: z.string(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  product?: Product | null;         // null = create mode
  categories: CategoryStat[];       // for datalist suggestions
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductFormModal({ open, onClose, product, categories }: Props) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isEdit = !!product;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { storeId: user?.storeId ?? '', lowStockAlert: 10 },
  });

  // Populate form when editing
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode ?? '',
        description: product.description ?? '',
        category: product.category ?? '',
        price: product.price,
        costPrice: product.costPrice,
        lowStockAlert: product.lowStockAlert,
        storeId: product.storeId,
      });
    } else {
      reset({ storeId: user?.storeId ?? '', lowStockAlert: 10 });
    }
  }, [product, user, reset]);

  const onSubmit = async (data: FormData) => {
    // Strip empty optional strings
    const clean = {
      ...data,
      barcode: data.barcode || undefined,
      description: data.description || undefined,
      category: data.category || undefined,
    };

    try {
      if (isEdit) {
        const { sku: _sku, storeId: _sid, stock: _st, ...updateData } = clean;
        await productsApi.update(product.id, updateData);
        toast({ title: 'Product updated' });
      } else {
        await productsApi.create(clean);
        toast({ title: 'Product created' });
      }

      qc.invalidateQueries({ queryKey: ['inventory-products'] });
      qc.invalidateQueries({ queryKey: ['inventory-stats'] });
      qc.invalidateQueries({ queryKey: ['inventory-categories'] });
      qc.invalidateQueries({ queryKey: ['pos-products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        `Failed to ${isEdit ? 'update' : 'create'} product`;
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const CATEGORY_LIST_ID = 'category-suggestions';

  return (
    <Dialog open={open} onOpenChange={(v) => !isSubmitting && !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update product details. SKU and store cannot be changed.'
              : 'Fill in the product details. SKU must be unique.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name + SKU */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" placeholder="Cola 330ml" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                placeholder="BEV-001"
                disabled={isEdit}
                className={isEdit ? 'opacity-60' : ''}
                {...register('sku')}
              />
              {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
            </div>
          </div>

          {/* Category + Barcode */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="Beverages"
                list={CATEGORY_LIST_ID}
                {...register('category')}
              />
              <datalist id={CATEGORY_LIST_ID}>
                {categories.map((c) => (
                  <option key={c.name} value={c.name} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="barcode">Barcode</Label>
              <Input id="barcode" placeholder="1234567890" {...register('barcode')} />
            </div>
          </div>

          {/* Price + Cost Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Selling Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...register('price')}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="costPrice">Cost Price</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('costPrice')}
              />
            </div>
          </div>

          {/* Stock (create only) + Low Stock Alert */}
          <div className="grid grid-cols-2 gap-3">
            {!isEdit && (
              <div className="space-y-1.5">
                <Label htmlFor="stock">Initial Stock</Label>
                <Input id="stock" type="number" min="0" placeholder="0" {...register('stock')} />
              </div>
            )}
            <div className={`space-y-1.5 ${isEdit ? 'col-span-2' : ''}`}>
              <Label htmlFor="lowStockAlert">Low Stock Alert Threshold</Label>
              <Input
                id="lowStockAlert"
                type="number"
                min="0"
                placeholder="10"
                {...register('lowStockAlert')}
              />
              <p className="text-xs text-muted-foreground">
                Alert when stock drops to or below this number
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional product description…"
              rows={2}
              {...register('description')}
            />
          </div>

          <input type="hidden" {...register('storeId')} />

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? 'Saving…' : 'Creating…'}
                </>
              ) : isEdit ? (
                'Save Changes'
              ) : (
                'Create Product'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
