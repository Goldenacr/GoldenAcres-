import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, Package, CheckCircle, Truck, Home } from 'lucide-react'; // Added Home icon
import { motion } from 'framer-motion';

const statusIcons = {
    'Order Placed': <Package className="h-5 w-5 text-gray-500" />,
    'Rider Dispatched to Farm': <Truck className="h-5 w-5 text-blue-500" />,
    'Products Picked Up': <Package className="h-5 w-5 text-yellow-500" />,
    'Out for Delivery': <Truck className="h-5 w-5 text-orange-500" />,
    'Delivered': <CheckCircle className="h-5 w-5 text-green-500" />,
    'Cancelled': <CheckCircle className="h-5 w-5 text-red-500" />,
};

const OrderTrackingPage = () => {
    const { orderId } = useParams();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [order, setOrder] = useState(null);
    const [statusHistory, setStatusHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrderData = useCallback(async () => {
        if (!user || !orderId) return;

        setLoading(true);
        
        const [orderRes, historyRes] = await Promise.all([
            supabase.from('orders').select('*').eq('id', orderId).single(),
            supabase.from('order_status_history').select('*').eq('order_id', orderId).order('created_at', { ascending: false })
        ]);
        
        if (orderRes.error || orderRes.data?.user_id !== user.id) {
            toast({ variant: 'destructive', title: 'Error', description: 'Order not found or you do not have permission to view it.' });
            setOrder(null);
        } else {
            setOrder(orderRes.data);
        }

        if (historyRes.error) {
            toast({ variant: 'destructive', title: 'Error fetching status history', description: historyRes.error.message });
        } else {
            setStatusHistory(historyRes.data);
        }

        setLoading(false);
    }, [orderId, user, toast]);
    
    useEffect(() => {
        if (!authLoading) {
            fetchOrderData();
        }
    }, [authLoading, fetchOrderData]);
    
    useEffect(() => {
        if (!orderId) return;

        const channel = supabase.channel(`order_tracking:${orderId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'order_status_history',
                filter: `order_id=eq.${orderId}`
            }, (payload) => {
                // Refetch all data to ensure consistency
                fetchOrderData();
                 toast({ title: "Order Status Updated!", description: `Your order is now: ${payload.new.status}` });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orderId, fetchOrderData, toast]);

    if (loading || authLoading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
        );
    }
    
    if (!order) {
        return (
             <div className="text-center py-20">
                <h2 className="text-2xl font-bold">Order Not Found</h2>
                <Button asChild className="mt-4">
                    <Link to="/customer-dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
                </Button>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Track Order {order.id.substring(0, 8)} - Golden Acres</title>
            </Helmet>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex justify-between items-center mb-6">
                    <Link to="/customer-dashboard">
                        <Button variant="ghost">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                        </Button>
                    </Link>
                    <Button asChild variant="outline">
                        <Link to="/">
                            <Home className="h-4 w-4 mr-2" />
                            Home
                        </Link>
                    </Button>
                </div>

                <Card className="mb-8 bg-card/80 backdrop-blur-sm border">
                    <CardHeader>
                        <CardTitle>Order #{order.id.substring(0, 8)}</CardTitle>
                        <CardDescription>Placed on {new Date(order.created_at).toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-4">
                            <Package className="h-10 w-10 text-primary"/>
                            <div>
                                <p className="text-lg font-semibold">{order.status}</p>
                                <p className="text-sm text-gray-500">Total: GHS {order.total_amount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <h2 className="text-2xl font-semibold mb-4">Order History</h2>

                <div className="flow-root">
                    <ul className="-mb-8">
                        {statusHistory.map((status, statusIdx) => (
                            <li key={status.id}>
                                <div className="relative pb-8">
                                    {statusIdx !== statusHistory.length - 1 ? (
                                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                    ) : null}
                                    <div className="relative flex space-x-3 items-start">
                                        <div>
                                            <motion.span 
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: statusIdx * 0.1 }}
                                                className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center ring-8 ring-white">
                                                {statusIcons[status.status] || <Package className="h-5 w-5 text-primary" />}
                                            </motion.span>
                                        </div>
                                        <motion.div 
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: statusIdx * 0.1 + 0.1 }}
                                            className="min-w-0 flex-1 pt-1.5">
                                            <p className="text-sm text-gray-500">
                                                {new Date(status.created_at).toLocaleString()}
                                            </p>
                                            <p className="font-medium text-gray-900">{status.status}</p>
                                            <p className="text-sm text-gray-600">{status.notes}</p>
                                        </motion.div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
};

export default OrderTrackingPage;