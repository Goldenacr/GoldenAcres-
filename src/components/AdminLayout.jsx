import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Tractor, 
  ShoppingCart, 
  BarChart3, 
  PenSquare, 
  Star, 
  Settings, 
  LogOut, 
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const AdminLayout = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { href: '/admin-dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { href: '/admin-dashboard/users', icon: Users, label: 'Users' },
    { href: '/admin-dashboard/farmers', icon: Tractor, label: 'Farmers' },
    { href: '/admin-dashboard/products', icon: ShoppingCart, label: 'Products' },
    { href: '/admin-dashboard/orders', icon: BarChart3, label: 'Orders' },
    { href: '/admin-dashboard/blog', icon: PenSquare, label: 'Blog Posts' },
    { href: '/admin-dashboard/reviews', icon: Star, label: 'Reviews' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
            />
        )}

      {/* Sidebar */}
      <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#1e293b] text-white transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-white">Golden Acres</h1>
                    <p className="text-xs text-gray-400">Admin Panel</p>
                </div>
                <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
                    <X className="h-6 w-6" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        end={item.end}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) => cn(
                            "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                            isActive 
                                ? "bg-orange-500 text-white" 
                                : "text-gray-400 hover:bg-gray-800 hover:text-white"
                        )}
                    >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-gray-700 space-y-4">
                <NavLink
                    to="/settings"
                    className={({ isActive }) => cn(
                        "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                         isActive ? "text-white" : "text-gray-400 hover:text-white"
                    )}
                >
                    <Settings className="mr-3 h-5 w-5" />
                    Settings
                </NavLink>
                <button
                    onClick={handleSignOut}
                    className="flex w-full items-center px-4 py-2 text-sm font-medium text-gray-400 rounded-lg hover:text-white transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign Out
                </button>
                
                {/* Profile Info */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-700/50">
                     <Avatar className="h-10 w-10 border border-gray-600">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback className="bg-orange-500 text-white">
                            {profile?.full_name?.charAt(0) || 'A'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'Admin'}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                             Administrator
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b p-4 flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)}>
                <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <span className="font-semibold">Admin Panel</span>
            <div className="w-6" /> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
            <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;