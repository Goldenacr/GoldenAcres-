
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Package, 
  Settings, 
  LogOut, 
  Menu, 
  Tractor,
  FileText,
  Activity,
  Star,
  MapPin,
  Truck,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const AdminLayout = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/admin-dashboard', icon: LayoutDashboard, label: 'Overview', exact: true },
    { path: '/admin-dashboard/users', icon: Users, label: 'Users' },
    { path: '/admin-dashboard/farmers', icon: Tractor, label: 'Farmers' },
    { path: '/admin-dashboard/products', icon: ShoppingBag, label: 'Products' },
    { path: '/admin-dashboard/orders', icon: Package, label: 'Orders' },
    { path: '/admin-dashboard/mass-delivery', icon: Truck, label: 'Mass Delivery' },
    { path: '/admin-dashboard/pickup-hubs', icon: MapPin, label: 'Pickup Hubs' },
    { path: '/admin-dashboard/countries', icon: Globe, label: 'Allowed Countries' },
    { path: '/admin-dashboard/blog', icon: FileText, label: 'Blog' },
    { path: '/admin-dashboard/reviews', icon: Star, label: 'Reviews' },
    { path: '/admin-dashboard/activity', icon: Activity, label: 'Activity Log' },
    { path: '/admin-dashboard/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
           <img src="https://zuctusbetucsmsywshyk.supabase.co/storage/v1/object/public/imgurl/81ospn_1766280462621.jpg" alt="Logo" className="w-8 h-8 rounded-full" />
           Agribridge
        </h1>
        <p className="text-xs text-slate-400 mt-1">Admin Control Panel</p>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              isActive(item.path, item.exact)
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 mt-auto">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar - Sticky */}
      <aside className="hidden md:block w-64 bg-slate-950 h-screen sticky top-0 overflow-hidden flex-shrink-0 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar - Fixed */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950 z-[100] flex items-center justify-between px-4 border-b border-slate-800 shadow-md">
         <div className="flex items-center gap-2">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 border-r-slate-800 bg-slate-950 z-[101]">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <span className="font-bold text-white text-lg">Agribridge Admin</span>
         </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden pt-16 md:pt-0">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl min-h-[calc(100vh-4rem)]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
      
