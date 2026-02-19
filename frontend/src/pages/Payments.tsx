import { useState, useEffect } from 'react';
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
import { Plus, Search, DollarSign } from 'lucide-react';
import { Payment, PaymentMethod } from '@/types';

const paymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice is required'),
  patientId: z.string().min(1, 'Patient is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  method: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER']),
  transactionId: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentForm = z.infer<typeof paymentSchema>;

const Payments = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string>('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, search],
    queryFn: async () => {
      const response = await api.get('/payments', {
        params: { page, limit: 20, invoiceId: search || undefined },
      });
      return response.data.data;
    },
  });

  const { data: invoices } = useQuery({
    queryKey: ['invoices-pending'],
    queryFn: async () => {
      const response = await api.get('/invoices', {
        params: { status: 'PENDING', limit: 1000 },
      });
      return response.data.data.invoices;
    },
  });

  const { data: invoiceDetails } = useQuery({
    queryKey: ['invoice-details', selectedInvoice],
    queryFn: async () => {
      if (!selectedInvoice) return null;
      const response = await api.get(`/invoices/${selectedInvoice}`);
      return response.data.data;
    },
    enabled: !!selectedInvoice,
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      method: 'CASH',
    },
  });

  const selectedInvoiceId = watch('invoiceId');
  const amount = watch('amount');

  // Update patientId when invoice changes
  useEffect(() => {
    if (selectedInvoiceId && invoiceDetails) {
      reset({
        ...watch(),
        patientId: invoiceDetails.patientId,
        amount: Math.min(invoiceDetails.total - invoiceDetails.paidAmount, invoiceDetails.total - invoiceDetails.paidAmount),
      });
    }
  }, [selectedInvoiceId, invoiceDetails]);

  const createMutation = useMutation({
    mutationFn: async (data: PaymentForm) => {
      const response = await api.post('/payments', {
        ...data,
        paymentDate: new Date().toISOString(),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Payment recorded successfully');
      setDialogOpen(false);
      reset();
      setSelectedInvoice('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    },
  });

  const onSubmit = (data: PaymentForm) => {
    createMutation.mutate(data);
  };

  const getMethodColor = (method: PaymentMethod) => {
    switch (method) {
      case 'CASH':
        return 'bg-green-100 text-green-800';
      case 'UPI':
        return 'bg-blue-100 text-blue-800';
      case 'CARD':
        return 'bg-purple-100 text-purple-800';
      case 'BANK_TRANSFER':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-gray-500">Record and manage payments</p>
        </div>
        <Button onClick={() => {
          reset();
          setSelectedInvoice('');
          setDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by invoice..."
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
                    <TableHead>Invoice</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.payments?.map((payment: Payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {/* {payment.invoiceid?.invoiceNumber || 'N/A'} */}
                         {payment.invoiceId|| 'N/A'}
                      </TableCell>
                      <TableCell>
                        {/* {payment.patientId?.} {payment.patient?.lastName} */}
                        {payment.patientId} {payment.patientId}
                      </TableCell>
                      <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getMethodColor(payment.method)}>
                          {payment.method}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell>{payment.transactionId || payment.reference || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data?.pagination && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                    {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                    {data.pagination.total} payments
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
        <DialogContent onClose={() => setDialogOpen(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="invoiceId">Invoice *</Label>
              <select
                id="invoiceId"
                {...register('invoiceId', {
                  onChange: (e) => {
                    setSelectedInvoice(e.target.value);
                    register('invoiceId').onChange(e);
                  },
                })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select invoice...</option>
                {invoices?.filter((inv: any) => inv.status !== 'PAID').map((invoice: any) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} - {invoice.patient?.firstName} {invoice.patient?.lastName} 
                    (Balance: ₹{(invoice.total - invoice.paidAmount).toLocaleString()})
                  </option>
                ))}
              </select>
              {errors.invoiceId && <p className="text-sm text-destructive">{errors.invoiceId.message}</p>}
              {invoiceDetails && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                  <p>Total: ₹{invoiceDetails.total.toLocaleString()}</p>
                  <p>Paid: ₹{invoiceDetails.paidAmount.toLocaleString()}</p>
                  <p className="font-medium">Balance: ₹{(invoiceDetails.total - invoiceDetails.paidAmount).toLocaleString()}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })}
                />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
              </div>
              <div>
                <Label htmlFor="method">Payment Method *</Label>
                <select
                  id="method"
                  {...register('method')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
                {errors.method && <p className="text-sm text-destructive">{errors.method.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transactionId">Transaction ID</Label>
                <Input id="transactionId" {...register('transactionId')} />
              </div>
              <div>
                <Label htmlFor="reference">Reference</Label>
                <Input id="reference" {...register('reference')} />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                {...register('notes')}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Record Payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payments;
