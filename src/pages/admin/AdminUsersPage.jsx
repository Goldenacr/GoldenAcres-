
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import UsersTab from '@/components/admin/UsersTab';
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

const AdminUsersPage = () => {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const fetchData = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);
        const { data, error } = await supabase.rpc('get_all_users_with_profiles');
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching users', description: error.message });
        } else {
            setUsers(data);
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('admin-users-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData(false))
            .on('postgres_changes', { event: '*', schema: 'auth', table: 'users' }, () => fetchData(false))
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
        const { error } = await supabase.functions.invoke('delete-user', { body: { userId: itemToDelete.id } });
        handleApiResponse(error, 'User deleted successfully', 'Failed to delete user', () => fetchData(false));
        setShowDeleteConfirm(false); setItemToDelete(null);
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

    return (
        <>
            <Helmet><title>Manage Users - Admin</title></Helmet>
            <div className="py-8">
                <h1 className="text-3xl font-bold tracking-tight mb-8">Manage Users</h1>
                {loading ? <p>Loading users...</p> : <UsersTab users={users} currentUser={currentUser} onRoleUpdate={updateUserRole} onBan={handleBanUser} onDelete={confirmDelete} />}
            </div>
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the user and all their associated data. This action cannot be undone.</AlertDialogDescription>
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

export default AdminUsersPage;
