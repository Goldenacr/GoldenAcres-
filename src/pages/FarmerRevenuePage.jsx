import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, DollarSign, ShoppingBag, Package, BarChart2, LayoutGrid } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const StatCard = ({ title, value, icon, subtext }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-500">{title}</span>
            <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                {icon}
            </div>
        </div>
        <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
    </div>
);

const FarmerRevenuePage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const location = useLocation();
    const [stats, setStats] = useState({ revenue: 0, sales: 0, orders: 0 });
    const [productSales, setProductSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRevenueData = async () => {
            if (!user) return;

            setLoading(true);

            try {
                // Fetch products by the current farmer
                const { data: products, error: productsError } = await supabase
                    .from('products')
                    .select('id')
                    .eq('farmer_id', user.id);
                
                if (productsError) throw productsError;
                
                const productIds = products.map(p => p.id);

                if (productIds.length === 0) {
                    setStats({ revenue: 0, sales: 0, orders: 0 });
                    setProductSales([]);
                    setLoading(false);
                    return;
                }

                // Fetch order items for those products with status 'Order Placed'
                const { data, error } = await supabase
                    .from('order_items')
                    .select(`
                        *,
                        orders!inner(status)
                    `)
                    .in('product_id', productIds)
                    .eq('orders.status', 'Order Placed');

                if (error) throw error;

                // Calculate stats
                const totalRevenue = data.reduce((acc, item) => acc + item.price * item.quantity, 0);
                const totalSales = data.reduce((acc, item) => acc + item.quantity, 0);
                const totalOrders = new Set(data.map(item => item.order_id)).size;

                const finalStats = { revenue: totalRevenue, sales: totalSales, orders: totalOrders };
                setStats(finalStats);

                // Aggregate sales by product
                const salesByProduct = data.reduce((acc, item) => {
                    const productId = item.product_id;
                    if (!acc[productId]) {
                        acc[productId] = {
                            name: item.product_name,
                            unitsSold: 0,
                            revenue: 0,
                        };
                    }
                    acc[productId].unitsSold += item.quantity;
                    acc[productId].revenue += item.price * item.quantity;
                    return acc;
                }, {});
                
                const finalProductSales = Object.values(salesByProduct).sort((a, b) => b.revenue - a.revenue);
                setProductSales(finalProductSales);

            } catch (err) {
                console.error("Error fetching revenue data:", err);
                toast({ variant: "destructive", title: "Error", description: "Could not load revenue data." });
            } finally {
                setLoading(false);
            }
        };

        fetchRevenueData();

        const channel = supabase.channel('farmer-revenue-updates')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'orders' }, 
                () => {
                    fetchRevenueData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, [user, toast]);
    
    const NavLink = ({ to, icon, children }) => {
        const isActive = location.pathname === to;
        return (
            <Link
                to={to}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
            >
                {icon}
                {children}
            </Link>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 min-h-screen bg-white">
            <Helmet>
                <title>Revenue Analytics - Golden Acres</title>
            </Helmet>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Revenue Dashboard</h1>
                    <p className="text-gray-600 mt-1">Your sales performance at a glance.</p>
                </div>
                 <nav className="flex items-center gap-2 p-1 bg-gray-100/70 rounded-lg">
                    <NavLink to="/farmer-dashboard" icon={<LayoutGrid className="h-4 w-4" />}>
                        Products
                    </NavLink>
                    <NavLink to="/farmer-dashboard/revenue" icon={<BarChart2 className="h-4 w-4" />}>
                        Revenue
                    </NavLink>
                </nav>
            </div>
            
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <StatCard 
                            title="Total Revenue" 
                            value={`GHS ${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            icon={<DollarSign className="h-5 w-5" />} 
                            subtext="From placed orders"
                        />
                        <StatCard 
                            title="Total Sales" 
                            value={stats.sales.toLocaleString()}
                            icon={<Package className="h-5 w-5" />} 
                            subtext="Total units sold in placed orders"
                        />
                        <StatCard 
                            title="Open Orders" 
                            value={stats.orders.toLocaleString()}
                            icon={<ShoppingBag className="h-5 w-5" />} 
                            subtext="Unique orders to be fulfilled"
                        />
                    </div>

                    <h2 className="text-xl font-bold mb-4 text-gray-800">Sales by Product</h2>
                     <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50">
                                <tr className="border-b border-gray-200">
                                    <th className="py-3 px-4 font-semibold text-gray-600">Product</th>
                                    <th className="py-3 px-4 font-semibold text-gray-600 text-right">Units Sold</th>
                                    <th className="py-3 px-4 font-semibold text-gray-600 text-right">Revenue Generated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productSales.length > 0 ? productSales.map((product, index) => (
                                    <tr key={index} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                                        <td className="py-4 px-4 font-medium text-gray-800">{product.name}</td>
                                        <td className="py-4 px-4 text-gray-600 text-right">{product.unitsSold.toLocaleString()}</td>
                                        <td className="py-4 px-4 text-green-600 font-semibold text-right">GHS {product.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="text-center py-10 text-gray-500">
                                            No open orders with your products yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default FarmerRevenuePage;