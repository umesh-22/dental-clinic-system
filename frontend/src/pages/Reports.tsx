import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Users, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const Reports = () => {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [reportType, setReportType] = useState<'revenue' | 'patients' | 'doctors'>('revenue');

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-report', startDate, endDate],
    queryFn: async () => {
      const response = await api.get('/reports/revenue', {
        params: {
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
        },
      });
      return response.data.data;
    },
    enabled: reportType === 'revenue',
  });

  const { data: patientData, isLoading: patientLoading } = useQuery({
    queryKey: ['patient-analytics', startDate, endDate],
    queryFn: async () => {
      const response = await api.get('/reports/patients', {
        params: {
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
        },
      });
      return response.data.data;
    },
    enabled: reportType === 'patients',
  });

  const { data: doctorData, isLoading: doctorLoading } = useQuery({
    queryKey: ['doctor-performance', startDate, endDate],
    queryFn: async () => {
      const response = await api.get('/reports/doctors', {
        params: {
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
        },
      });
      return response.data.data;
    },
    enabled: reportType === 'doctors',
  });

  const isLoading = revenueLoading || patientLoading || doctorLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-gray-500">View detailed reports and analytics</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <Button
                variant={reportType === 'revenue' ? 'default' : 'outline'}
                onClick={() => setReportType('revenue')}
              >
                Revenue
              </Button>
              <Button
                variant={reportType === 'patients' ? 'default' : 'outline'}
                onClick={() => setReportType('patients')}
              >
                Patients
              </Button>
              <Button
                variant={reportType === 'doctors' ? 'default' : 'outline'}
                onClick={() => setReportType('doctors')}
              >
                Doctors
              </Button>
            </div>
            <div className="flex items-center space-x-2 ml-auto">
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
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              {reportType === 'revenue' && revenueData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Total Revenue</p>
                            <p className="text-2xl font-bold">₹{revenueData.totalRevenue.toLocaleString()}</p>
                          </div>
                          <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Total Payments</p>
                            <p className="text-2xl font-bold">{revenueData.payments?.length || 0}</p>
                          </div>
                          <Calendar className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Revenue by Method</p>
                          <div className="space-y-1">
                            {revenueData.revenueByMethod?.map((item: any) => (
                              <div key={item.method} className="flex justify-between text-sm">
                                <span>{item.method}:</span>
                                <span className="font-medium">₹{Number(item._sum.amount || 0).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead>Invoice</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {revenueData.payments?.slice(0, 10).map((payment: any) => (
                            <TableRow key={payment.id}>
                              <TableCell>{format(new Date(payment.paymentDate), 'MMM d, yyyy')}</TableCell>
                              <TableCell>
                                {payment.invoice?.patient?.firstName} {payment.invoice?.patient?.lastName}
                              </TableCell>
                              <TableCell>{payment.invoice?.invoiceNumber}</TableCell>
                              <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                              <TableCell>{payment.method}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}

              {reportType === 'patients' && patientData && (
                <div className="space-y-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">New Patients</p>
                          <p className="text-2xl font-bold">{patientData.newPatients || 0}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Patients by Appointments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Patient</TableHead>
                            <TableHead>Appointments</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {patientData.topPatients?.map((item: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>
                                {item.patient?.firstName} {item.patient?.lastName}
                              </TableCell>
                              <TableCell>{item.appointmentCount}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}

              {reportType === 'doctors' && doctorData && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Doctor Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Doctor</TableHead>
                            <TableHead>Treatments</TableHead>
                            <TableHead>Total Revenue</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {doctorData?.map((item: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>
                                {item.doctor?.firstName} {item.doctor?.lastName}
                              </TableCell>
                              <TableCell>{item.treatmentCount}</TableCell>
                              <TableCell>₹{Number(item.totalRevenue || 0).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
