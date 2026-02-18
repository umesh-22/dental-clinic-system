import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Layout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF'] },
    { path: '/patients', label: 'Patients', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { path: '/appointments', label: 'Appointments', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { path: '/treatments', label: 'Treatments', roles: ['ADMIN', 'DOCTOR'] },
    { path: '/prescriptions', label: 'Prescriptions', roles: ['ADMIN', 'DOCTOR'] },
    { path: '/invoices', label: 'Invoices', roles: ['ADMIN', 'RECEPTIONIST'] },
    { path: '/payments', label: 'Payments', roles: ['ADMIN', 'RECEPTIONIST'] },
    { path: '/inventory', label: 'Inventory', roles: ['ADMIN', 'STAFF'] },
    { path: '/attendance', label: 'Attendance', roles: ['ADMIN', 'STAFF'] },
    { path: '/reports', label: 'Reports', roles: ['ADMIN', 'DOCTOR'] },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    user?.role && item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold text-primary">Dental Clinic</h1>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="p-4 space-y-2">
            {filteredMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className="block px-4 py-2 rounded-md hover:bg-gray-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r">
          <div className="flex items-center flex-shrink-0 px-4 py-4 border-b">
            <h1 className="text-xl font-bold text-primary">Dental Clinic</h1>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {filteredMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="block px-4 py-2 rounded-md hover:bg-gray-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex-shrink-0 p-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-4 bg-white border-b lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">Dental Clinic</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
