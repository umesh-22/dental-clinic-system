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
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Search, Download, Eye, X } from 'lucide-react';
import { Invoice, PaymentStatus } from '@/types';
import { useAuthStore } from '@/store/authStore';

const invoiceItemSchema = z.object({
  treatmentId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
});

const invoiceSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  appointmentId: z.string().optional(),
  dueDate: z.string().optional(),
  discount: z.number().min(0).optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
});

type InvoiceForm = z.infer<typeof invoiceSchema>;

const Invoices = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, search],
    queryFn: async () => {
      const response = await api.get('/invoices', {
        params: { page, limit: 20, patientId: search || undefined },
      });
      return response.data.data;
    },
  });

  const { data: invoiceDetails } = useQuery({
    queryKey: ['invoice', selectedInvoice?.id],
    queryFn: async () => {
      if (!selectedInvoice) return null;
      const response = await api.get(`/invoices/${selectedInvoice.id}`);
      return response.data.data;
    },
    enabled: !!selectedInvoice && viewDialogOpen,
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const response = await api.get('/patients', { params: { limit: 1000 } });
      return response.data.data.patients;
    },
  });

  const { data: treatments } = useQuery({
    queryKey: ['treatments-list'],
    queryFn: async () => {
      const response = await api.get('/treatments', { params: { limit: 1000 } });
      return response.data.data.treatments;
    },
  });

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
      discount: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const watchedDiscount = watch('discount') || 0;

  const subtotal = watchedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxAmount = (subtotal - watchedDiscount) * 0.18;
  const total = subtotal - watchedDiscount + taxAmount;

  const createMutation = useMutation({
    mutationFn: async (data: InvoiceForm) => {
      const response = await api.post('/invoices', {
        ...data,
        issuedBy: user?.id,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created successfully');
      setDialogOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    },
  });

  const onSubmit = (data: InvoiceForm) => {
    createMutation.mutate(data);
  };

  const handleView = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const handleDownloadPDF = async (id: string) => {
    try {
      const response = await api.get(`/invoices/${id}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${selectedInvoice?.invoiceNumber || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Invoice PDF downloaded');
    } catch (error: any) {
      toast.error('Failed to download invoice PDF');
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PARTIAL':
        return 'bg-blue-100 text-blue-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'REFUNDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-gray-500">Manage invoices and billing</p>
        </div>
        <Button onClick={() => {
          reset();
          setDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by patient..."
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
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.invoices?.map((invoice: Invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        {invoice.patient?.firstName} {invoice.patient?.lastName}
                      </TableCell>
                      <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell>₹{invoice.total.toLocaleString()}</TableCell>
                      <TableCell>₹{invoice.paidAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleView(invoice)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDownloadPDF(invoice.id)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
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
                    {data.pagination.total} invoices
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

      {/* Create Invoice Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)} className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patientId">Patient *</Label>
                <select
                  id="patientId"
                  {...register('patientId')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select patient...</option>
                  {patients?.map((patient: any) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
                    </option>
                  ))}
                </select>
                {errors.patientId && <p className="text-sm text-destructive">{errors.patientId.message}</p>}
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" type="date" {...register('dueDate')} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Invoice Items *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              {fields.map((field, index) => (
                <Card key={field.id} className="mb-4">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Description *</Label>
                        <Input {...register(`items.${index}.description`)} />
                        {errors.items?.[index]?.description && (
                          <p className="text-sm text-destructive">{errors.items[index]?.description?.message}</p>
                        )}
                      </div>
                      <div>
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        />
                        {errors.items?.[index]?.quantity && (
                          <p className="text-sm text-destructive">{errors.items[index]?.quantity?.message}</p>
                        )}
                      </div>
                      <div>
                        <Label>Unit Price (₹) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                        />
                        {errors.items?.[index]?.unitPrice && (
                          <p className="text-sm text-destructive">{errors.items[index]?.unitPrice?.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Total: ₹{(watchedItems[index]?.quantity * watchedItems[index]?.unitPrice || 0).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div>
              <Label htmlFor="discount">Discount (₹)</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                {...register('discount', { valueAsNumber: true })}
              />
            </div>
            <Card className="bg-gray-50">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  {watchedDiscount > 0 && (
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-₹{watchedDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax (18%):</span>
                    <span>₹{taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Create Invoice
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent onClose={() => setViewDialogOpen(false)} className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice {invoiceDetails?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {invoiceDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Patient:</p>
                  <p>{invoiceDetails.patient?.firstName} {invoiceDetails.patient?.lastName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Date:</p>
                  <p>{new Date(invoiceDetails.issueDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Items:</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceDetails.items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₹{item.unitPrice.toLocaleString()}</TableCell>
                        <TableCell>₹{item.total.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{invoiceDetails.subtotal.toLocaleString()}</span>
                </div>
                {invoiceDetails.discount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-₹{invoiceDetails.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax ({invoiceDetails.taxRate}%):</span>
                  <span>₹{invoiceDetails.taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>₹{invoiceDetails.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid:</span>
                  <span>₹{invoiceDetails.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Balance:</span>
                  <span>₹{(invoiceDetails.total - invoiceDetails.paidAmount).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => handleDownloadPDF(invoiceDetails.id)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
