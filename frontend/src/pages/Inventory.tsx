import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import type { Inventory } from '@/types';

const inventorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  currentStock: z.number().min(0),
  minStockLevel: z.number().min(0),
  maxStockLevel: z.number().optional(),
  unitPrice: z.number().optional(),
  expiryDate: z.string().optional(),
  supplier: z.string().optional(),
});

type InventoryForm = z.infer<typeof inventorySchema>;

const Inventory = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page, search],
    queryFn: async () => {
      const response = await api.get('/inventory', {
        params: { page, limit: 20, category: search || undefined },
      });
      return response.data.data;
    },
  });

  const { data: lowStockItems } = useQuery({
    queryKey: ['inventory-low-stock'],
    queryFn: async () => {
      const response = await api.get('/inventory/low-stock');
      return response.data.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InventoryForm>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      currentStock: 0,
      minStockLevel: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InventoryForm) => {
      const response = await api.post('/inventory', {
        ...data,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Inventory item created successfully');
      setDialogOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create inventory item');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InventoryForm> }) => {
      const response = await api.put(`/inventory/${id}`, {
        ...data,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Inventory item updated successfully');
      setDialogOpen(false);
      setSelectedItem(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update inventory item');
    },
  });

  const onSubmit = (data: InventoryForm) => {
    if (selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: Inventory) => {
    setSelectedItem(item);
    reset({
      name: item.name,
      description: item.description || '',
      category: item.category,
      unit: item.unit,
      currentStock: item.currentStock,
      minStockLevel: item.minStockLevel,
      maxStockLevel: item.maxStockLevel || undefined,
      unitPrice: item.unitPrice || undefined,
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
      supplier: item.supplier || '',
    });
    setDialogOpen(true);
  };

  const isLowStock = (item: Inventory) => {
    return item.currentStock <= item.minStockLevel;
  };

  const isExpiringSoon = (item: Inventory) => {
    if (!item.expiryDate) return false;
    const expiry = new Date(item.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-gray-500">Manage inventory and supplies</p>
        </div>
        <div className="flex items-center space-x-2">
          {lowStockItems && lowStockItems.length > 0 && (
            <Badge variant="destructive" className="mr-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {lowStockItems.length} Low Stock
            </Badge>
          )}
          <Button onClick={() => {
            setSelectedItem(null);
            reset();
            setDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {lowStockItems && lowStockItems.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.slice(0, 5).map((item: Inventory) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span>{item.name}</span>
                  <Badge variant="destructive">
                    Stock: {item.currentStock} / Min: {item.minStockLevel}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by category..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items?.map((item: Inventory) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <span className={isLowStock(item) ? 'text-red-600 font-medium' : ''}>
                          {item.currentStock}
                        </span>
                        {item.minStockLevel > 0 && (
                          <span className="text-gray-500 text-sm"> / {item.minStockLevel}</span>
                        )}
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.unitPrice ? `₹${item.unitPrice.toLocaleString()}` : '-'}</TableCell>
                      <TableCell>
                        {item.expiryDate ? (
                          <span className={isExpiringSoon(item) ? 'text-orange-600' : ''}>
                            {new Date(item.expiryDate).toLocaleDateString()}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {isLowStock(item) && (
                          <Badge variant="destructive">Low Stock</Badge>
                        )}
                        {isExpiringSoon(item) && (
                          <Badge className="bg-orange-100 text-orange-800">Expiring Soon</Badge>
                        )}
                        {!isLowStock(item) && !isExpiringSoon(item) && (
                          <Badge className="bg-green-100 text-green-800">In Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data?.pagination && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                    {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                    {data.pagination.total} items
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= data.pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)} className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Input id="category" {...register('category')} />
                {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                {...register('description')}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="unit">Unit *</Label>
                <Input id="unit" placeholder="e.g., pieces, ml, kg" {...register('unit')} />
                {errors.unit && <p className="text-sm text-destructive">{errors.unit.message}</p>}
              </div>
              <div>
                <Label htmlFor="currentStock">Current Stock *</Label>
                <Input
                  id="currentStock"
                  type="number"
                  step="0.01"
                  {...register('currentStock', { valueAsNumber: true })}
                />
                {errors.currentStock && <p className="text-sm text-destructive">{errors.currentStock.message}</p>}
              </div>
              <div>
                <Label htmlFor="minStockLevel">Min Stock Level *</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  step="0.01"
                  {...register('minStockLevel', { valueAsNumber: true })}
                />
                {errors.minStockLevel && <p className="text-sm text-destructive">{errors.minStockLevel.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="maxStockLevel">Max Stock Level</Label>
                <Input
                  id="maxStockLevel"
                  type="number"
                  step="0.01"
                  {...register('maxStockLevel', { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label htmlFor="unitPrice">Unit Price (₹)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  {...register('unitPrice', { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input id="expiryDate" type="date" {...register('expiryDate')} />
              </div>
            </div>
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input id="supplier" {...register('supplier')} />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {selectedItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
