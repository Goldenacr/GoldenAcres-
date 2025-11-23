import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import SystemOverview from '@/components/admin/SystemOverview';
import RecentLogins from '@/components/admin/RecentLogins';

const FancyLoader = () => (
    <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="fancy-loader"></div>
    </div>
);

const AdminDashboard = () => {
    const { toast } = useToast();
    const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalUsers: 0, totalProducts: 0 });
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [ordersRes, profilesRes, productsRes, usersLoginRes] = await Promise.all([
                supabase.from('orders').select('total_amount', { count: 'exact' }),
                supabase.from('profiles').select('id', { count: 'exact' }),
                supabase.from('products').select('id', { count: 'exact' }),
                supabase.rpc('get_recent_users_with_profiles')
            ]);

            if (ordersRes.error) throw ordersRes.error;
            if (profilesRes.error) throw profilesRes.error;
            if (productsRes.error) throw productsRes.error;
            if (usersLoginRes.error) throw usersLoginRes.error;
            
            const totalRevenue = ordersRes.data.reduce((acc, order) => acc + Number(order.total_amount), 0);
            
            setStats({
                totalRevenue,
                totalOrders: ordersRes.count,
                totalUsers: profilesRes.count,
                totalProducts: productsRes.count,
            });
            
            setRecentUsers(usersLoginRes.data);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching dashboard data', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <FancyLoader />;

    return (
        <>
            <Helmet><title>Admin Dashboard - Golden Acres</title></Helmet>
            <div className="flex-1 space-y-8 py-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <Button asChild variant="outline">
                        <Link to="/">
                            <Home className="h-4 w-4 mr-2" />
                            Back to Home
                        </Link>
                    </Button>
                </div>
                
                <SystemOverview stats={stats} />
                
                <div className="grid gap-8 grid-cols-1">
                     <RecentLogins users={recentUsers} />
                </div>
            </div>
        </>
    );
};

export default AdminDashboard;