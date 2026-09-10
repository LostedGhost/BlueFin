import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';
import { AuthProvider } from '../../contexts/AuthContext';

function AdminLayoutContent() {
  const { isDark } = useTheme();

  return (
    <div className={`flex h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-100'} transition-colors duration-300`}>
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className={`flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 ${isDark ? 'bg-slate-900' : 'bg-gray-100'} transition-colors duration-300`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AdminLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AdminLayoutContent />
      </ThemeProvider>
    </AuthProvider>
  );
}