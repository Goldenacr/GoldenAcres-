
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import OrdersTab from '@/components/admin/OrdersTab';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminOrdersPage = () => {
    const { toast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const fetchData = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);

        let query = supabase.from('orders').select(`
            *,
            order_items (
                product_name,
                farmer_name
            )
        `).order('created_at', { ascending: false });

        if (debouncedSearchTerm) {
            query = query.or(`id::text.ilike.%${debouncedSearchTerm}%,customer_name.ilike.%${debouncedSearchTerm}%,customer_phone.ilike.%${debouncedSearchTerm}%`);
        }

        const { data, error } = await query;
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching orders', description: error.message });
        } else {
            setOrders(data);
        }
        if (showLoader) setLoading(false);
    }, [toast, debouncedSearchTerm]);

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('admin-orders-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchData(false))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchData(false))
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [fetchData]);

    const handleApiResponse = (error, successMsg, errorMsg, onSuccess) => {
        if (error) {
            toast({ variant: 'destructive', title: errorMsg, description: error.message });
        } else {
            if (successMsg) toast({ title: successMsg });
            if (onSuccess) onSuccess();
        }
    };
    
    const confirmDelete = (item) => {
        setItemToDelete(item);
        setShowDeleteConfirm(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        const { error } = await supabase.rpc('delete_order_and_dependents', { order_id_to_delete: itemToDelete.id });
        handleApiResponse(error, 'Order deleted successfully', 'Failed to delete order', () => fetchData(false));
        setShowDeleteConfirm(false); setItemToDelete(null);
    };
    
    const updateOrderStatus = async (orderId, newStatus) => {
        // Find the order in the current state to update it locally first for responsiveness
        const originalOrders = [...orders];
        const updatedOrders = orders.map(o => o.id === orderId ? {...o, status: newStatus} : o);
        setOrders(updatedOrders);

        // Update the database
        const { error: updateError } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
        if (updateError) { 
            setOrders(originalOrders); // Revert on error
            handleApiResponse(updateError, '', 'Failed to update order status'); 
            return; 
        }
        
        // Log the update to history
        const { error: logError } = await supabase.from('order_status_history').insert({ order_id: orderId, status: newStatus, notes: `Status updated by admin.` });
        if(logError) {
             setOrders(originalOrders); // Revert on error
             handleApiResponse(logError, '', 'Failed to log status update');
        } else {
            handleApiResponse(null, 'Order status updated', '', () => fetchData(false)); // Refetch to be sure
        }
    };

    return (
        <>
            <Helmet><title>Manage Orders - Admin</title></Helmet>
            <div className="py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Manage Orders</h1>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by Order ID, Name, Phone..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                {loading ? <div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div> : <OrdersTab orders={orders} onStatusUpdate={updateOrderStatus} onDelete={confirmDelete} />}
            </div>
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the order. This action cannot be undone.</AlertDialogDescription>
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

export default AdminOrdersPage;
