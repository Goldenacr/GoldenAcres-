import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Package, User, Home, LogOut, Settings } from 'lucide-react';

const FancyLoader = () => (
    <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
);

const CustomerDashboard = () => {
    const { user, profile, loading: authLoading, signOut } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    product_name,
                    quantity,
                    price
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            toast({
                variant: 'destructive',
                title: 'Error fetching orders',
                description: error.message,
            });
        } else {
            setOrders(data);
        }
        setLoading(false);
    }, [user, toast]);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                navigate('/login');
            } else {
                fetchOrders();
            }
        }
    }, [user, authLoading, navigate, fetchOrders]);

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    if (authLoading || loading) {
        return <FancyLoader />;
    }

    return (
        <>
            <Helmet>
                <title>My Dashboard - Golden Acres</title>
            </Helmet>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Welcome, {profile?.full_name || user?.email}!</h1>
                        <p className="text-gray-600 mt-1">Here's an overview of your account and recent orders.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link to="/">
                                <Home className="h-4 w-4 mr-2" />
                                Home
                            </Link>
                        </Button>
                        <Button variant="destructive" onClick={handleLogout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{orders.length}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
                            <User className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">Active</div>
                            <p className="text-xs text-muted-foreground">
                                All systems normal
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-red-100 bg-red-50/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-red-900">Account Actions</CardTitle>
                            <Settings className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <Button variant="destructive" className="w-full" onClick={handleLogout}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                
                <h2 className="text-2xl font-semibold mb-4">My Orders</h2>
                <Card className="bg-card/80 backdrop-blur-sm border">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white/30 divide-y divide-gray-200">
                                    {orders.map(order => (
                                        <tr key={order.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{order.id.substring(0, 8)}...</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">GHS {order.total_amount}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link to={`/track-order/${order.id}`}>Track Order</Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                         {orders.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-500">You haven't placed any orders yet.</p>
                                <Button asChild className="mt-4">
                                    <Link to="/marketplace">Start Shopping</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default CustomerDashboard;