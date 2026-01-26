import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Monitor, LayoutDashboard, Package, FileText, ClipboardList, HelpCircle,
  Key, User, LogOut, Menu, X, ChevronDown, Users,
  BarChart3, Shield, Laptop,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import useRequestStore from '../../stores/requestStore';
import toast from 'react-hot-toast';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { cart } = useRequestStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  const mainNavItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/assets', icon: Package, label: 'Asset Catalog' },
    { to: '/my-assets', icon: Laptop, label: 'My Assets' },
    { to: '/requests', icon: FileText, label: 'My Requests' },
    { to: '/support', icon: HelpCircle, label: 'Support' },
    { to: '/licenses', icon: Key, label: 'Licenses' },
  ];

  const adminNavItems = [
    { to: '/admin', icon: BarChart3, label: 'Admin Dashboard' },
    { to: '/admin/assets', icon: Package, label: 'Manage Assets' },
    { to: '/admin/requests', icon: ClipboardList, label: 'Manage Requests' },
    { to: '/admin/tickets', icon: HelpCircle, label: 'Manage Tickets' },
    { to: '/admin/users', icon: Users, label: 'Manage Users' },
    { to: '/admin/licenses', icon: Key, label: 'Manage Licenses' },
    { to: '/admin/audit', icon: Shield, label: 'Audit Logs' },
    { to: '/admin/reports', icon: FileText, label: 'Reports' },
  ];

  const NavItem = ({ to, icon: Icon, label, onClick }) => (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
          isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
        }`
      }
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700 transform transition-transform duration-300 lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">IT Assets</span>
          </div>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">Main Menu</p>
            {mainNavItems.map((item) => (
              <NavItem key={item.to} {...item} onClick={() => setSidebarOpen(false)} />
            ))}
          </div>

          {isAdmin && (
            <div className="mb-6">
              <button
                onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300"
              >
                <span>Administration</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {adminMenuOpen && (
                <div className="mt-1 space-y-1">
                  {adminNavItems.map((item) => (
                    <NavItem key={item.to} {...item} onClick={() => setSidebarOpen(false)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 lg:px-6">
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <NavLink to="/asset-request" className="relative text-gray-400 hover:text-white transition-colors" title="Asset Request">
              <ClipboardList className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full text-xs flex items-center justify-center text-white">
                  {cart.length}
                </span>
              )}
            </NavLink>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 hover:bg-gray-700 rounded-lg p-2 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">{user?.name?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20 py-1">
                    <NavLink to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                      <User className="w-4 h-4" /> Profile
                    </NavLink>
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
