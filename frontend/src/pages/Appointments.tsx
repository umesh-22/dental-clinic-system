import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Calendar, Clock, User } from 'lucide-react';
import { format, startOfWeek, addDays, addMinutes, isSameDay, parseISO } from 'date-fns';
import { Appointment, AppointmentStatus } from '@/types';

const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  doctorId: z.string().optional(),
  chairNumber: z.number().min(1).max(3),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  notes: z.string().optional(),
});

type AppointmentForm = z.infer<typeof appointmentSchema>;

const Appointments = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', selectedDate],
    queryFn: async () => {
      const start = format(weekStart, 'yyyy-MM-dd');
      const end = format(addDays(weekStart, 6), 'yyyy-MM-dd');
      const response = await api.get('/appointments', {
        params: { startDate: start, endDate: end },
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

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      chairNumber: 1,
    },
  });

  const startTime = watch('startTime');

  const createMutation = useMutation({
    mutationFn: async (data: AppointmentForm) => {
      const response = await api.post('/appointments', {
        ...data,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment created successfully');
      setDialogOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create appointment');
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/appointments/${id}/check-in`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Patient checked in');
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/appointments/${id}/check-out`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Patient checked out');
    },
  });

  const onSubmit = (data: AppointmentForm) => {
    createMutation.mutate(data);
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'CHECKED_IN':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppointmentsForSlot = (day: Date, hour: number, chair: number) => {
    if (!appointments) return null;
    const slotStart = new Date(day);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = addMinutes(slotStart, 15);

    return appointments.find((apt: Appointment) => {
      const aptStart = parseISO(apt.startTime);
      const aptEnd = parseISO(apt.endTime);
      return (
        apt.chairNumber === chair &&
        isSameDay(aptStart, day) &&
        aptStart < slotEnd &&
        aptEnd > slotStart
      );
    });
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-gray-500">Schedule and manage appointments</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setSelectedDate(addDays(selectedDate, -7))}
          >
            Previous Week
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedDate(addDays(selectedDate, 7))}
          >
            Next Week
          </Button>
          <Button onClick={() => {
            reset();
            setDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Week of {format(weekStart, 'MMM d, yyyy')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2">Time</th>
                    {weekDays.map((day) => (
                      <th key={day.toString()} className="border p-2">
                        <div className="text-center">
                          <div className="font-semibold">{format(day, 'EEE')}</div>
                          <div className="text-sm text-gray-500">{format(day, 'MMM d')}</div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hours.map((hour) => (
                    <tr key={hour}>
                      <td className="border p-2 text-sm font-medium">
                        {hour}:00
                      </td>
                      {weekDays.map((day) => (
                        <td key={day.toString()} className="border p-1">
                          <div className="space-y-1">
                            {[1, 2, 3].map((chair) => {
                              const appointment = getAppointmentsForSlot(day, hour, chair);
                              if (appointment) {
                                return (
                                  <div
                                    key={chair}
                                    className="p-2 rounded text-xs bg-blue-50 border border-blue-200 cursor-pointer hover:bg-blue-100"
                                    title={`${appointment.patient?.firstName} ${appointment.patient?.lastName} - Chair ${chair}`}
                                  >
                                    <div className="font-medium truncate">
                                      {appointment.patient?.firstName} {appointment.patient?.lastName}
                                    </div>
                                    <div className="text-gray-600">
                                      {format(parseISO(appointment.startTime), 'HH:mm')} - {format(parseISO(appointment.endTime), 'HH:mm')}
                                    </div>
                                    <Badge className={`text-xs ${getStatusColor(appointment.status)}`}>
                                      {appointment.status}
                                    </Badge>
                                    <div className="mt-1 flex space-x-1">
                                      {appointment.status === 'SCHEDULED' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-6 text-xs"
                                          onClick={() => checkInMutation.mutate(appointment.id)}
                                        >
                                          Check In
                                        </Button>
                                      )}
                                      {appointment.status === 'CHECKED_IN' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-6 text-xs"
                                          onClick={() => checkOutMutation.mutate(appointment.id)}
                                        >
                                          Check Out
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <div
                                  key={chair}
                                  className="p-1 text-xs text-gray-400 border border-dashed border-gray-200 rounded"
                                >
                                  Chair {chair}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>New Appointment</DialogTitle>
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
                    {patient.firstName} {patient.lastName} - {patient.phone}
                  </option>
                ))}
              </select>
              {errors.patientId && <p className="text-sm text-destructive">{errors.patientId.message}</p>}
            </div>
            <div>
              <Label htmlFor="chairNumber">Chair Number *</Label>
              <select
                id="chairNumber"
                {...register('chairNumber', { valueAsNumber: true })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value={1}>Chair 1</option>
                <option value={2}>Chair 2</option>
                <option value={3}>Chair 3</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  {...register('startTime')}
                  onChange={(e) => {
                    register('startTime').onChange(e);
                    if (e.target.value) {
                      const start = new Date(e.target.value);
                      const end = addMinutes(start, 15);
                      reset({
                        ...watch(),
                        startTime: e.target.value,
                        endTime: format(end, "yyyy-MM-dd'T'HH:mm"),
                      });
                    }
                  }}
                />
                {errors.startTime && <p className="text-sm text-destructive">{errors.startTime.message}</p>}
              </div>
              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  {...register('endTime')}
                />
                {errors.endTime && <p className="text-sm text-destructive">{errors.endTime.message}</p>}
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
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Appointments;
