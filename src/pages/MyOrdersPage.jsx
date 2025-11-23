import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Package, ShoppingBag, ArrowRight, CheckCircle, Truck, Warehouse, Home as HomeIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';

const orderStatusSteps = [
    { name: 'Order Placed', icon: CheckCircle },
    { name: 'Rider Dispatched to Farm', icon: ArrowRight },
    { name: 'Products Picked Up', icon: Warehouse },
    { name: 'Out for Delivery', icon: Truck },
    { name: 'Delivered', icon: HomeIcon }
];

const StatusTimeline = ({ currentStatus }) => {
    const currentIndex = orderStatusSteps.findIndex(s => s.name === currentStatus);
    
    if (currentStatus === 'Cancelled') {
        return (
            <div className="text-center py-4 text-red-600 font-bold border-2 border-dashed border-red-300 rounded-lg">
                This order has been cancelled.
            </div>
        )
    }

    return (
        <div className="flex items-center justify-between mt-4 overflow-x-auto pb-4">
            {orderStatusSteps.map((status, index) => {
                const isActive = index <= currentIndex;
                const isCurrent = index === currentIndex;
                const Icon = status.icon;
                return (
                    <React.Fragment key={status.name}>
                        <motion.div 
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex flex-col items-center text-center px-2"
                        >
                            <motion.div 
                                animate={{ scale: isCurrent ? 1.1 : 1 }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                                <Icon className="w-5 h-5" />
                            </motion.div>
                            <p className={`text-xs mt-2 w-20 ${isCurrent ? 'font-bold text-primary' : 'text-gray-500'}`}>{status.name}</p>
                        </motion.div>
                        {index < orderStatusSteps.length - 1 && (
                            <motion.div 
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: index * 0.1 + 0.05, duration: 0.5 }}
                                style={{ transformOrigin: 'left' }}
                                className={`flex-1 h-1 mx-2 transition-colors duration-300 min-w-[20px] ${index < currentIndex ? 'bg-primary' : 'bg-gray-200'}`}></motion.div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const OrderCard = ({ order }) => {
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
            className="bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div>
                    <p className="text-sm text-gray-500">Order ID: <span className="font-mono">{order.id.substring(0, 8)}</span></p>
                    <p className="text-sm text-gray-500">Date: {new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="mt-2 sm:mt-0 text-left sm:text-right">
                    <p className="font-semibold text-lg">Total: GHS {Number(order.total_amount).toLocaleString()}</p>
                </div>
            </div>
            
            <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Order Status:</h4>
                <StatusTimeline currentStatus={order.status} />
            </div>

            <div className="mt-4">
                <Button variant="link" onClick={() => setIsDetailsVisible(!isDetailsVisible)} className="p-0 h-auto text-primary">
                    {isDetailsVisible ? 'Hide Details' : 'View Details & Tracking History'}
                    <motion.div animate={{ rotate: isDetailsVisible ? 180 : 0 }}>
                        <ChevronDown className="w-4 h-4 ml-2" />
                    </motion.div>
                </Button>
            </div>
            
            <AnimatePresence>
            {isDetailsVisible && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div className="flex flex-col md:flex-row gap-8 mt-4 pt-4 border-t">
                        <div className="flex-1">
                             <h4 className="font-semibold mb-3">Items Ordered:</h4>
                             <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                                {order.order_items.map((item, i) => (
                                    <motion.div 
                                      key={item.id} 
                                      className="flex items-center space-x-4"
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.1 }}
                                    >
                                        <img src={item.products?.image_url || 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300'} alt={item.product_name} className="w-12 h-12 rounded-md object-cover border"/>
                                        <div>
                                            <p className="font-semibold text-sm">{item.product_name}</p>
                                            <p className="text-xs text-gray-600">Qty: {item.quantity} x GHS {Number(item.price).toLocaleString()}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1">
                             <h4 className="font-semibold mb-3">Tracking History:</h4>
                              <div className="space-y-4">
                                {order.order_status_history.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map((history, i) => (
                                    <motion.div 
                                      key={history.id} 
                                      className="flex items-start"
                                      initial={{ opacity: 0, x: 20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.1 }}
                                    >
                                        <div className="w-5 h-5 bg-primary rounded-full mt-1 mr-4 border-4 border-card"></div>
                                        <div>
                                            <p className="font-semibold text-sm">{history.status}</p>
                                            <p className="text-xs text-gray-500">{new Date(history.created_at).toLocaleString()}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </motion.div>
    );
};

const MyOrdersPage = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    products ( name, image_url )
                ),
                order_status_history (*)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching orders', description: error.message });
        } else {
            setOrders(data);
        }
        setLoading(false);
    }, [user, toast]);

    useEffect(() => {
        if (!authLoading) {
            if (user) {
                setLoading(true);
                fetchOrders();
            } else {
                navigate('/login');
            }
        }
    }, [user, authLoading, navigate, fetchOrders]);

    useEffect(() => {
        if (!user) return;
        
        const orderChannel = supabase.channel('my-orders-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user?.id}` }, payload => {
                fetchOrders();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'order_status_history' }, payload => {
                const changedOrderId = payload.new.order_id;
                if(orders.some(o => o.id === changedOrderId)) {
                    toast({ title: "Order Status Updated!", description: `Your order is now: ${payload.new.status}` });
                    fetchOrders();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(orderChannel);
        }
    }, [user, fetchOrders, orders, toast]);

    if (loading || authLoading) {
        return (
            <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-transparent">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

  return (
    <>
      <Helmet>
        <title>My Orders - Golden Acres</title>
        <meta name="description" content="View your order history and track your current orders with Golden Acres." />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex justify-between items-center"
        >
            <div>
                <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
                <p className="text-lg text-gray-600">Track and view your order history below.</p>
            </div>
            <Button asChild variant="outline">
                <Link to="/">
                    <HomeIcon className="h-4 w-4 mr-2" />
                    Home
                </Link>
            </Button>
        </motion.div>
        
        <h2 className="text-2xl font-bold mb-6 flex items-center mt-8"><ShoppingBag className="w-6 h-6 mr-3 text-primary"/>Your Order History</h2>
        
        {orders.length > 0 ? (
            <div className="space-y-8">
                <AnimatePresence>
                    {orders.map(order => <OrderCard key={order.id} order={order} />)}
                </AnimatePresence>
            </div>
        ) : (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 bg-card/80 backdrop-blur-sm rounded-xl border">
                <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-700">No orders yet</h2>
                <p className="text-gray-500 mt-2 mb-6">You haven't placed any orders. Let's change that!</p>
                 <Button asChild className="bg-primary hover:bg-primary/90">
                    <Link to="/marketplace">Start Shopping</Link>
                </Button>
            </motion.div>
        )}
      </div>
    </>
  );
};

export default MyOrdersPage;