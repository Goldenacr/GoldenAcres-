
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import ProductsTab from '@/components/admin/ProductsTab';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

const AdminProductsPage = () => {
    const { toast } = useToast();
    const [products, setProducts] = useState([]);
    const [farmers, setFarmers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const fetchData = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);

        let productsQuery = supabase.from('products').select('*, farmer:profiles(full_name, phone_number)');
        if (debouncedSearchTerm) {
            productsQuery = productsQuery.ilike('name', `%${debouncedSearchTerm}%`);
        }

        const [productsRes, farmersRes] = await Promise.all([
            productsQuery,
            supabase.from('profiles').select('*').eq('role', 'farmer'),
        ]);

        if (productsRes.error) toast({ variant: 'destructive', title: 'Error fetching products', description: productsRes.error.message });
        else setProducts(productsRes.data);

        if (farmersRes.error) toast({ variant: 'destructive', title: 'Error fetching farmers', description: farmersRes.error.message });
        else setFarmers(farmersRes.data);

        setLoading(false);
    }, [toast, debouncedSearchTerm]);

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('admin-products-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchData(false))
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [fetchData]);
    
    const handleApiResponse = (error, successMsg, errorMsg, onSuccess) => {
        if (error) toast({ variant: 'destructive', title: errorMsg, description: error.message });
        else {
            if (successMsg) toast({ title: successMsg });
            if (onSuccess) onSuccess();
        }
    };
    
    const deleteProduct = async (product) => {
        if (product.image_url) {
            const fileName = product.image_url.split('/').pop();
            await supabase.storage.from('product_images').remove([fileName]);
        }
        const { error } = await supabase.from('products').delete().eq('id', product.id);
        handleApiResponse(error, 'Product deleted', 'Failed to delete product', () => fetchData(false));
    };

    return (
        <>
            <Helmet><title>Manage Products - Admin</title></Helmet>
            <div className="py-8">
                 <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Manage Products</h1>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by product name..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                {loading ? <div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div> : 
                    <ProductsTab products={products} farmers={farmers} onAdd={() => fetchData(false)} onEdit={() => fetchData(false)} onDelete={deleteProduct} />
                }
            </div>
        </>
    );
};

export default AdminProductsPage;
