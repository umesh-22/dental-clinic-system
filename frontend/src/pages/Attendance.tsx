import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { Clock, Calendar, LogIn, LogOut } from 'lucide-react';
import type { Attendance } from '@/types';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';

const Attendance = () => {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', startDate, endDate],
    queryFn: async () => {
      const response = await api.get('/attendance', {
        params: {
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          userId: user?.id,
        },
      });
      return response.data.data;
    },
  });

  const clockInMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/attendance/clock-in');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Clocked in successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to clock in');
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/attendance/clock-out');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Clocked out successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to clock out');
    },
  });

  const todayAttendance = data?.attendance?.find((a: Attendance) => {
    const attendanceDate = new Date(a.date);
    const today = new Date();
    return (
      attendanceDate.getDate() === today.getDate() &&
      attendanceDate.getMonth() === today.getMonth() &&
      attendanceDate.getFullYear() === today.getFullYear()
    );
  });

  const canClockIn = !todayAttendance || !todayAttendance.clockIn;
  const canClockOut = todayAttendance?.clockIn && !todayAttendance.clockOut;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-gray-500">Track staff attendance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => clockInMutation.mutate()}
            disabled={!canClockIn || clockInMutation.isPending}
            variant={canClockIn ? 'default' : 'outline'}
          >
            <LogIn className="h-4 w-4 mr-2" />
            Clock In
          </Button>
          <Button
            onClick={() => clockOutMutation.mutate()}
            disabled={!canClockOut || clockOutMutation.isPending}
            variant={canClockOut ? 'default' : 'outline'}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Clock Out
          </Button>
        </div>
      </div>

      {todayAttendance && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Clock In</p>
                <p className="text-lg font-medium">
                  {todayAttendance.clockIn
                    ? format(new Date(todayAttendance.clockIn), 'HH:mm:ss')
                    : 'Not clocked in'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Clock Out</p>
                <p className="text-lg font-medium">
                  {todayAttendance.clockOut
                    ? format(new Date(todayAttendance.clockOut), 'HH:mm:ss')
                    : 'Not clocked out'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Hours</p>
                <p className="text-lg font-medium">
                  {todayAttendance.totalHours
                    ? `${todayAttendance.totalHours.toFixed(2)} hours`
                    : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
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
                    <TableHead>Date</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.attendance?.map((attendance: Attendance) => (
                    <TableRow key={attendance.id}>
                      <TableCell>{format(new Date(attendance.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        {attendance.clockIn
                          ? format(new Date(attendance.clockIn), 'HH:mm:ss')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {attendance.clockOut
                          ? format(new Date(attendance.clockOut), 'HH:mm:ss')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {attendance.totalHours
                          ? `${attendance.totalHours.toFixed(2)} hours`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {attendance.clockIn && attendance.clockOut ? (
                          <Badge className="bg-green-100 text-green-800">Complete</Badge>
                        ) : attendance.clockIn ? (
                          <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Absent</Badge>
                        )}
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
                    {data.pagination.total} records
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
