
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import FarmersTab from '@/components/admin/FarmersTab';

const AdminFarmersPage = () => {
    const { toast } = useToast();
    const [farmers, setFarmers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'farmer')
            .order('is_verified', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching farmers', description: error.message });
        } else {
            setFarmers(data);
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('admin-farmers-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: 'role=eq.farmer' }, () => fetchData(false))
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
    
    const handleVerifyFarmer = async (farmerId) => {
        const { error } = await supabase.from('profiles').update({ is_verified: true }).eq('id', farmerId);
        handleApiResponse(error, 'Farmer verified!', 'Failed to verify farmer', () => fetchData(false));
    };

    return (
        <>
            <Helmet><title>Manage Farmers - Admin</title></Helmet>
            <div className="py-8">
                <h1 className="text-3xl font-bold tracking-tight mb-8">Manage Farmers</h1>
                {loading ? <p>Loading farmers...</p> : <FarmersTab farmers={farmers} onVerify={handleVerifyFarmer} />}
            </div>
        </>
    );
};

export default AdminFarmersPage;
