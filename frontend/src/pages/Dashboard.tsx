import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, DollarSign, Package } from 'lucide-react';

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/reports/dashboard');
      return response.data.data;
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const statCards = [
    {
      title: 'Total Patients',
      value: stats?.totalPatients || 0,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Today\'s Appointments',
      value: stats?.todayAppointments || 0,
      icon: Calendar,
      color: 'text-green-600',
    },
    {
      title: 'Total Revenue',
      value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-yellow-600',
    },
    {
      title: 'Low Stock Items',
      value: stats?.lowStockItems || 0,
      icon: Package,
      color: 'text-red-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Appointment list will appear here</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Treatments</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.topTreatments?.length > 0 ? (
              <div className="space-y-2">
                {stats.topTreatments.map((treatment: any, index: number) => (
                  <div key={index} className="flex justify-between">
                    <span>{treatment.treatmentType}</span>
                    <span className="font-medium">{treatment._count.id}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No treatments yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
