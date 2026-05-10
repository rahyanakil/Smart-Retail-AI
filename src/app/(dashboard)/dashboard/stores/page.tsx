'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Store,
  Users,
  Package,
  ShoppingCart,
  Edit2,
  Trash2,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { storesApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import type { StoreWithCounts } from '@/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const storeSchema = z.object({
  name: z.string().min(1, 'Store name is required').max(200).trim(),
  address: z.string().max(500).trim().optional().or(z.literal('')),
  phone: z.string().max(30).trim().optional().or(z.literal('')),
});

type StoreForm = z.infer<typeof storeSchema>;

// ─── Store Form Modal ─────────────────────────────────────────────────────────

interface StoreModalProps {
  open: boolean;
  onClose: () => void;
  store: StoreWithCounts | null;
}

function StoreModal({ open, onClose, store }: StoreModalProps) {
  const qc = useQueryClient();
  const isEdit = !!store;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StoreForm>({
    resolver: zodResolver(storeSchema),
    values: store
      ? { name: store.name, address: store.address ?? '', phone: store.phone ?? '' }
      : { name: '', address: '', phone: '' },
  });

  const onSubmit = async (data: StoreForm) => {
    const clean = {
      name: data.name,
      address: data.address || undefined,
      phone: data.phone || undefined,
    };
    try {
      if (isEdit) {
        await storesApi.update(store.id, clean);
        toast({ title: 'Store updated' });
      } else {
        await storesApi.create(clean);
        toast({ title: 'Store created' });
      }
      qc.invalidateQueries({ queryKey: ['stores'] });
      reset();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        `Failed to ${isEdit ? 'update' : 'create'} store`;
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !isSubmitting && !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Store' : 'Create New Store'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the store details below.'
              : 'Add a new store location to the platform.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="s-name">Store Name *</Label>
            <Input id="s-name" placeholder="e.g. SmartRetail Downtown" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-address">Address</Label>
            <Input
              id="s-address"
              placeholder="e.g. 123 Main St, New York, NY"
              {...register('address')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-phone">Phone</Label>
            <Input id="s-phone" placeholder="e.g. +1 (555) 000-0000" {...register('phone')} />
          </div>
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
                'Create Store'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────

interface DeleteDialogProps {
  store: StoreWithCounts | null;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteDialog({ store, onConfirm, onCancel, isPending }: DeleteDialogProps) {
  return (
    <Dialog open={!!store} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 mb-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <DialogTitle>Delete store?</DialogTitle>
          <DialogDescription>
            This will hide{' '}
            <span className="font-semibold text-foreground">{store?.name}</span> from the platform.
            Existing users and products will be unaffected.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Deleting…' : 'Delete Store'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Store Card ───────────────────────────────────────────────────────────────

interface StoreCardProps {
  store: StoreWithCounts;
  onEdit: (store: StoreWithCounts) => void;
  onDelete: (store: StoreWithCounts) => void;
}

function StoreCard({ store, onEdit, onDelete }: StoreCardProps) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Store className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-base truncate">{store.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Created {formatDate(store.createdAt)}
              </p>
            </div>
          </div>
          <Badge variant="success" className="shrink-0 text-xs">
            Active
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="space-y-1.5">
          {store.address ? (
            <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/60" />
              <span className="line-clamp-2 text-xs">{store.address}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/40">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              No address
            </div>
          )}
          {store.phone ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              {store.phone}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/40">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              No phone
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Users, count: store._count.users, label: 'Users' },
            { icon: Package, count: store._count.products, label: 'Products' },
            { icon: ShoppingCart, count: store._count.sales, label: 'Sales' },
          ].map(({ icon: Icon, count, label }) => (
            <div
              key={label}
              className="flex flex-col items-center rounded-lg bg-muted/60 dark:bg-muted/40 px-2 py-2.5"
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground mb-1" />
              <span className="text-base font-bold leading-none">{count}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Actions */}
      <div className="flex gap-1.5 px-6 pb-4">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8"
          onClick={() => onEdit(store)}
        >
          <Edit2 className="mr-1.5 h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 hover:border-destructive/40"
          onClick={() => onDelete(store)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface StoresResponse {
  data: StoreWithCounts[];
  total: number;
}

export default function StoresPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editStore, setEditStore] = useState<StoreWithCounts | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StoreWithCounts | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<StoresResponse>({
    queryKey: ['stores'],
    queryFn: async () => {
      const res = await storesApi.list();
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Store deleted' });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({ title: 'Failed to delete store', variant: 'destructive' });
      setDeleteTarget(null);
    },
  });

  const handleEdit = (store: StoreWithCounts) => {
    setEditStore(store);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditStore(null);
  };

  const stores = data?.data ?? [];

  return (
    <div className="space-y-5 sm:space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Stores</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage store locations, staff, and inventory
          </p>
        </div>
        <Button onClick={() => { setEditStore(null); setModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          New Store
        </Button>
      </div>

      {/* Error state */}
      {isError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between py-4 px-5">
            <p className="text-sm text-destructive">Failed to load stores.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary bar */}
      {!isLoading && stores.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 px-5 py-3 text-sm">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {stores.length} location{stores.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{stores.reduce((s, st) => s + st._count.users, 0)} total users</span>
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{stores.reduce((s, st) => s + st._count.products, 0)} total products</span>
          </div>
        </div>
      )}

      {/* Store grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="rounded-xl border border-dashed py-20">
          <EmptyState
            icon={Store}
            title="No stores yet"
            description="Create your first store to start managing inventory and staff."
            action={
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Store
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <StoreModal open={modalOpen} onClose={handleClose} store={editStore} />

      <DeleteDialog
        store={deleteTarget}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
