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
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Treatment } from '@/types';
import { useAuthStore } from '@/store/authStore';

const treatmentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  appointmentId: z.string().optional(),
  doctorId: z.string().min(1, 'Doctor is required'),
  toothNumber: z.string().optional(),
  treatmentType: z.string().min(1, 'Treatment type is required'),
  description: z.string().min(1, 'Description is required'),
  clinicalNotes: z.string().optional(),
  treatmentDate: z.string().min(1, 'Treatment date is required'),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  cost: z.number().min(0),
});

type TreatmentForm = z.infer<typeof treatmentSchema>;

const Treatments = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['treatments', page, search],
    queryFn: async () => {
      const response = await api.get('/treatments', {
        params: { page, limit: 20, patientId: search || undefined },
      });
      return response.data.data;
    },
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const response = await api.get('/patients', { params: { limit: 1000 } });
      return response.data.data.patients;
    },
  });

  // For now, use current user as doctor. In production, you'd fetch from a users endpoint
  const doctors = user?.role === 'DOCTOR' ? [user] : [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TreatmentForm>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      doctorId: user?.id || '',
      status: 'PLANNED',
      cost: 0,
      treatmentDate: new Date().toISOString().split('T')[0],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TreatmentForm) => {
      const response = await api.post('/treatments', {
        ...data,
        treatmentDate: new Date(data.treatmentDate),
        cost: parseFloat(data.cost.toString()),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      toast.success('Treatment created successfully');
      setDialogOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create treatment');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TreatmentForm> }) => {
      const response = await api.put(`/treatments/${id}`, {
        ...data,
        treatmentDate: data.treatmentDate ? new Date(data.treatmentDate) : undefined,
        cost: data.cost ? parseFloat(data.cost.toString()) : undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      toast.success('Treatment updated successfully');
      setDialogOpen(false);
      setSelectedTreatment(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update treatment');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/treatments/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      toast.success('Treatment deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete treatment');
    },
  });

  const onSubmit = (data: TreatmentForm) => {
    if (selectedTreatment) {
      updateMutation.mutate({ id: selectedTreatment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (treatment: Treatment) => {
    setSelectedTreatment(treatment);
    reset({
      patientId: treatment.patientId,
      appointmentId: treatment.appointmentId || '',
      doctorId: treatment.doctorId,
      toothNumber: treatment.toothNumber || '',
      treatmentType: treatment.treatmentType,
      description: treatment.description,
      clinicalNotes: treatment.clinicalNotes || '',
      treatmentDate: treatment.treatmentDate.split('T')[0],
      status: treatment.status as any,
      cost: treatment.cost,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this treatment?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Treatments</h1>
          <p className="text-gray-500">Manage treatment records</p>
        </div>
        <Button onClick={() => {
          setSelectedTreatment(null);
          reset();
          setDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Treatment
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
                    <TableHead>Patient</TableHead>
                    <TableHead>Treatment Type</TableHead>
                    <TableHead>Tooth Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.treatments?.map((treatment: Treatment) => (
                    <TableRow key={treatment.id}>
                      <TableCell>
                        {treatment.patient?.firstName} {treatment.patient?.lastName}
                      </TableCell>
                      <TableCell>{treatment.treatmentType}</TableCell>
                      <TableCell>{treatment.toothNumber || '-'}</TableCell>
                      <TableCell>{new Date(treatment.treatmentDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(treatment.status)}>
                          {treatment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>₹{treatment.cost.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(treatment)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(treatment.id)}>
                            <Trash2 className="h-4 w-4" />
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
                    {data.pagination.total} treatments
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
            <DialogTitle>{selectedTreatment ? 'Edit Treatment' : 'Add New Treatment'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <Label htmlFor="doctorId">Doctor *</Label>
              <Input
                id="doctorId"
                {...register('doctorId')}
                value={user?.id || ''}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                {user?.firstName} {user?.lastName}
              </p>
              {errors.doctorId && <p className="text-sm text-destructive">{errors.doctorId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="treatmentType">Treatment Type *</Label>
                <Input id="treatmentType" {...register('treatmentType')} />
                {errors.treatmentType && <p className="text-sm text-destructive">{errors.treatmentType.message}</p>}
              </div>
              <div>
                <Label htmlFor="toothNumber">Tooth Number (FDI)</Label>
                <Input id="toothNumber" placeholder="e.g., 11, 21" {...register('toothNumber')} />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                {...register('description')}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
            <div>
              <Label htmlFor="clinicalNotes">Clinical Notes</Label>
              <textarea
                id="clinicalNotes"
                {...register('clinicalNotes')}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="treatmentDate">Treatment Date *</Label>
                <Input id="treatmentDate" type="date" {...register('treatmentDate')} />
                {errors.treatmentDate && <p className="text-sm text-destructive">{errors.treatmentDate.message}</p>}
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  {...register('status')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="PLANNED">Planned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <Label htmlFor="cost">Cost (₹) *</Label>
                <Input id="cost" type="number" step="0.01" {...register('cost', { valueAsNumber: true })} />
                {errors.cost && <p className="text-sm text-destructive">{errors.cost.message}</p>}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {selectedTreatment ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Treatments;
