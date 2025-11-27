
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ShoppingCart, BarChart, PenSquare, Tractor, Search, MapPin, PackageCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import SystemOverview from '@/components/admin/SystemOverview';
import UsersTab from '@/components/admin/UsersTab';
import ProductsTab from '@/components/admin/ProductsTab';
import FarmersTab from '@/components/admin/FarmersTab';
import OrdersTab from '@/components/admin/OrdersTab';
import BlogTab from '@/components/admin/BlogTab';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();

    const [data, setData] = useState({ users: [], products: [], orders: [], blogPosts: [], farmers: [] });
    const [loading, setLoading] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteAction, setDeleteAction] = useState(null);

    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const debouncedUserSearch = useDebounce(userSearchTerm, 300);
    const debouncedProductSearch = useDebounce(productSearchTerm, 300);

    const fetchData = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);

        const [usersRes, productsRes, ordersRes, blogPostsRes, farmersRes] = await Promise.all([
            supabase.rpc('get_all_users_with_profiles'),
            supabase.from('products').select('*, farmer:profiles(id, full_name, is_verified)'),
            supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
            supabase.from('blog_posts').select('*, author:profiles(id, full_name)'),
            supabase.from('profiles').select('*').eq('role', 'farmer').order('created_at', { ascending: false }),
        ]);

        setData({
            users: usersRes.data || [],
            products: productsRes.data || [],
            orders: ordersRes.data || [],
            blogPosts: blogPostsRes.data || [],
            farmers: farmersRes.data || [],
        });

        if (showLoader) setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('admin-dashboard-realtime')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData(false))
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [fetchData]);

    const filteredUsers = useMemo(() => {
        if (!debouncedUserSearch) return data.users;
        return data.users.filter(u => 
            u.full_name?.toLowerCase().includes(debouncedUserSearch.toLowerCase()) ||
            u.email?.toLowerCase().includes(debouncedUserSearch.toLowerCase())
        );
    }, [data.users, debouncedUserSearch]);

    const filteredProducts = useMemo(() => {
        if (!debouncedProductSearch) return data.products;
        return data.products.filter(p => p.name.toLowerCase().includes(debouncedProductSearch.toLowerCase()));
    }, [data.products, debouncedProductSearch]);


    const handleApiResponse = (error, successMsg, errorMsg, onSuccess) => {
        if (error) {
            toast({ variant: 'destructive', title: errorMsg, description: error.message });
        } else {
            if (successMsg) toast({ title: successMsg });
            if (onSuccess) onSuccess();
        }
    };
    
    const confirmDelete = (item, action) => {
        setItemToDelete(item);
        setDeleteAction(() => action);
        setShowDeleteConfirm(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete || !deleteAction) return;
        await deleteAction(itemToDelete);
        setShowDeleteConfirm(false); setItemToDelete(null); setDeleteAction(null);
    };
    
    // User Management
    const deleteUser = async (user) => {
        const { error } = await supabase.functions.invoke('delete-user', { body: { userId: user.id } });
        handleApiResponse(error, 'User deleted successfully', 'Failed to delete user', () => fetchData(false));
    };
    
    const updateUserRole = async (userId, newRole) => {
        if (userId === currentUser.id && newRole !== 'admin') {
            toast({ variant: "destructive", title: "Action Forbidden", description: "You cannot remove your own admin role." });
            return;
        }
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        handleApiResponse(error, 'User role updated', 'Failed to update role', () => fetchData(false));
    };

    const handleBanUser = async (userToManage, banDuration) => {
        let bannedUntil = null;
        if (banDuration !== 'permanent' && banDuration !== 'unban') {
            const date = new Date();
            date.setDate(date.getDate() + parseInt(banDuration, 10));
            bannedUntil = date.toISOString();
        } else if (banDuration === 'permanent') {
            bannedUntil = new Date('9999-12-31T23:59:59Z').toISOString();
        }
        const { error } = await supabase.from('profiles').update({ banned_until: bannedUntil }).eq('id', userToManage.id);
        handleApiResponse(error, `User status updated`, 'Failed to update status', () => fetchData(false));
    };
    
    const handleVerifyFarmer = async (farmerId) => {
        const { error } = await supabase.from('profiles').update({ is_verified: true }).eq('id', farmerId);
        handleApiResponse(error, 'Farmer verified!', 'Failed to verify farmer', () => fetchData(false));
    };

    // Product Management
    const deleteProduct = async (product) => {
        const { error } = await supabase.from('products').delete().eq('id', product.id);
        handleApiResponse(error, 'Product deleted', 'Failed to delete product', () => fetchData(false));
    };

    // Order Management
    const deleteOrder = async (order) => {
        const { error } = await supabase.rpc('delete_order_and_dependents', { order_id_to_delete: order.id });
        handleApiResponse(error, 'Order deleted', 'Failed to delete order', () => fetchData(false));
    };

    // Blog Management
    const deleteBlogPost = async (post) => {
        const { error } = await supabase.from('blog_posts').delete().eq('id', post.id);
        handleApiResponse(error, 'Blog post deleted', 'Failed to delete post', () => fetchData(false));
    };

    return (
        <>
            <Helmet><title>Admin Dashboard - Golden Acres</title></Helmet>
            <div className="py-8">
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            </div>
            
            <Tabs defaultValue="overview">
                 <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-8 mb-4">
                    <TabsTrigger value="overview"><BarChart className="h-4 w-4 mr-2" /> Overview</TabsTrigger>
                    <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" /> Users</TabsTrigger>
                    <TabsTrigger value="farmers"><Tractor className="h-4 w-4 mr-2" /> Farmers</TabsTrigger>
                    <TabsTrigger value="products"><ShoppingCart className="h-4 w-4 mr-2" /> Products</TabsTrigger>
                    <TabsTrigger value="orders"><BarChart className="h-4 w-4 mr-2" /> Orders</TabsTrigger>
                    <TabsTrigger asChild>
                        <Link to="/admin-dashboard/mass-delivery" className="flex items-center justify-center"><PackageCheck className="h-4 w-4 mr-2" />Delivery</Link>
                    </TabsTrigger>
                    <TabsTrigger value="blog"><PenSquare className="h-4 w-4 mr-2" /> Blog</TabsTrigger>
                    <TabsTrigger asChild>
                        <Link to="/admin-dashboard/pickup-hubs" className="flex items-center justify-center">
                            <MapPin className="h-4 w-4 mr-2" /> Hubs
                        </Link>
                    </TabsTrigger>
                </TabsList>

                {loading ? <p className="text-center py-10">Loading data...</p> : (
                    <>
                        <TabsContent value="overview"><SystemOverview users={data.users} products={data.products} orders={data.orders} /></TabsContent>
                        <TabsContent value="users">
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input placeholder="Search by name or email..." className="pl-10" value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} />
                            </div>
                            <UsersTab users={filteredUsers} currentUser={currentUser} onRoleUpdate={updateUserRole} onBan={handleBanUser} onDelete={(user) => confirmDelete(user, deleteUser)} />
                        </TabsContent>
                        <TabsContent value="farmers"><FarmersTab farmers={data.farmers} onVerify={handleVerifyFarmer} /></TabsContent>
                        <TabsContent value="products">
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input placeholder="Search by product name..." className="pl-10" value={productSearchTerm} onChange={e => setProductSearchTerm(e.target.value)} />
                            </div>
                            <ProductsTab products={filteredProducts} farmers={data.users.filter(u => u.role === 'farmer')} onAdd={fetchData} onEdit={fetchData} onDelete={(p) => confirmDelete(p, deleteProduct)} />
                        </TabsContent>
                        <TabsContent value="orders"><OrdersTab orders={data.orders} onStatusUpdate={() => fetchData(false)} onDelete={(o) => confirmDelete(o, deleteOrder)} /></TabsContent>
                        <TabsContent value="blog"><BlogTab posts={data.blogPosts} authors={data.users.filter(u => u.role === 'admin')} onSave={fetchData} onDelete={(p) => confirmDelete(p, deleteBlogPost)} /></TabsContent>
                    </>
                )}
            </Tabs>
            
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone and will permanently delete the item.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-destructive hover:bg-destructive/90">Confirm Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default AdminDashboard;
