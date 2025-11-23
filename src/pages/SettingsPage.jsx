import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Import Button component

const settingsNavItems = [
  { path: '/settings/profile', icon: User, label: 'Profile' },
  { path: '/settings/password', icon: Lock, label: 'Password' },
];

const SettingsPage = () => {
  const location = useLocation();

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button asChild variant="ghost" className="mb-4">
            <Link to="/customer-dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <p className="text-lg text-gray-600">Manage your account settings and preferences.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <motion.aside 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-1"
          >
            <nav className="space-y-1">
              {settingsNavItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <motion.div
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                      whileHover={{ x: isActive ? 0 : 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      <span>{item.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </nav>
          </motion.aside>

          <motion.main 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-3 bg-card p-6 sm:p-8 rounded-xl shadow-lg border"
          >
            <Outlet />
          </motion.main>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;