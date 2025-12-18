
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import RecentLogins from '@/components/admin/RecentLogins';

const AdminActivityPage = () => {
    const { toast } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

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
        const channel = supabase.channel('admin-activity-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchData(false))
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [fetchData]);

    return (
        <>
            <Helmet><title>User Activity - Admin</title></Helmet>
            <div className="py-8">
                <h1 className="text-3xl font-bold tracking-tight mb-8">User Activity</h1>
                {loading ? <p>Loading activity...</p> : <RecentLogins users={users} />}
            </div>
        </>
    );
};

export default AdminActivityPage;
