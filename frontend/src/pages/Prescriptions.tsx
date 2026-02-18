import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Download, X } from 'lucide-react';
import { Prescription } from '@/types';
import { useAuthStore } from '@/store/authStore';

const prescriptionItemSchema = z.object({
  medicationName: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
  instructions: z.string().optional(),
});

const prescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  doctorId: z.string().min(1, 'Doctor is required'),
  notes: z.string().optional(),
  items: z.array(prescriptionItemSchema).min(1, 'At least one medication is required'),
});

type PrescriptionForm = z.infer<typeof prescriptionSchema>;

const Prescriptions = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['prescriptions', page, search],
    queryFn: async () => {
      const response = await api.get('/prescriptions', {
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

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<PrescriptionForm>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      doctorId: user?.id || '',
      items: [{ medicationName: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const createMutation = useMutation({
    mutationFn: async (data: PrescriptionForm) => {
      const response = await api.post('/prescriptions', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      toast.success('Prescription created successfully');
      setDialogOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create prescription');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PrescriptionForm }) => {
      const response = await api.put(`/prescriptions/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      toast.success('Prescription updated successfully');
      setDialogOpen(false);
      setSelectedPrescription(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update prescription');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/prescriptions/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      toast.success('Prescription deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete prescription');
    },
  });

  const onSubmit = (data: PrescriptionForm) => {
    if (selectedPrescription) {
      updateMutation.mutate({ id: selectedPrescription.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    reset({
      patientId: prescription.patientId,
      doctorId: prescription.doctorId,
      notes: prescription.notes || '',
      items: prescription.items.length > 0
        ? prescription.items.map(item => ({
            medicationName: item.medicationName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions || '',
          }))
        : [{ medicationName: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this prescription?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDownloadPDF = async (id: string) => {
    try {
      const response = await api.get(`/prescriptions/${id}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescription-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Prescription PDF downloaded');
    } catch (error: any) {
      toast.error('Failed to download prescription PDF');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prescriptions</h1>
          <p className="text-gray-500">Manage patient prescriptions</p>
        </div>
        <Button onClick={() => {
          setSelectedPrescription(null);
          reset();
          setDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Prescription
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
                    <TableHead>Date</TableHead>
                    <TableHead>Medications</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.prescriptions?.map((prescription: Prescription) => (
                    <TableRow key={prescription.id}>
                      <TableCell>
                        {prescription.patient?.firstName} {prescription.patient?.lastName}
                      </TableCell>
                      <TableCell>{new Date(prescription.date).toLocaleDateString()}</TableCell>
                      <TableCell>{prescription.items.length} medication(s)</TableCell>
                      <TableCell>
                        {prescription.doctor?.firstName} {prescription.doctor?.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadPDF(prescription.id)}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(prescription)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(prescription.id)}>
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
                    {data.pagination.total} prescriptions
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
        <DialogContent onClose={() => setDialogOpen(false)} className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPrescription ? 'Edit Prescription' : 'Add New Prescription'}</DialogTitle>
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
                value={user?.id || ''}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                {user?.firstName} {user?.lastName}
              </p>
              {errors.doctorId && <p className="text-sm text-destructive">{errors.doctorId.message}</p>}
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
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Medications *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ medicationName: '', dosage: '', frequency: '', duration: '', instructions: '' })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Medication
                </Button>
              </div>
              {fields.map((field, index) => (
                <Card key={field.id} className="mb-4">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Medication {index + 1}</h4>
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
                    <div className="space-y-3">
                      <div>
                        <Label>Medication Name *</Label>
                        <Input {...register(`items.${index}.medicationName`)} />
                        {errors.items?.[index]?.medicationName && (
                          <p className="text-sm text-destructive">{errors.items[index]?.medicationName?.message}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label>Dosage *</Label>
                          <Input {...register(`items.${index}.dosage`)} placeholder="e.g., 500mg" />
                          {errors.items?.[index]?.dosage && (
                            <p className="text-sm text-destructive">{errors.items[index]?.dosage?.message}</p>
                          )}
                        </div>
                        <div>
                          <Label>Frequency *</Label>
                          <Input {...register(`items.${index}.frequency`)} placeholder="e.g., 2x daily" />
                          {errors.items?.[index]?.frequency && (
                            <p className="text-sm text-destructive">{errors.items[index]?.frequency?.message}</p>
                          )}
                        </div>
                        <div>
                          <Label>Duration *</Label>
                          <Input {...register(`items.${index}.duration`)} placeholder="e.g., 7 days" />
                          {errors.items?.[index]?.duration && (
                            <p className="text-sm text-destructive">{errors.items[index]?.duration?.message}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label>Instructions</Label>
                        <Input {...register(`items.${index}.instructions`)} placeholder="e.g., After meals" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {errors.items && <p className="text-sm text-destructive">{errors.items.message}</p>}
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {selectedPrescription ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Prescriptions;
