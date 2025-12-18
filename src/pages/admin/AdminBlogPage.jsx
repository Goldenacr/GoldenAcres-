
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import BlogTab from '@/components/admin/BlogTab';
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

const AdminBlogPage = () => {
    const { toast } = useToast();
    const [blogPosts, setBlogPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const fetchData = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);
        const { data, error } = await supabase.from('blog_posts').select('*, author:profiles(full_name)');
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching blog posts', description: error.message });
        } else {
            setBlogPosts(data);
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('admin-blog-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, () => fetchData(false))
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
        const { error } = await supabase.from('blog_posts').delete().eq('id', itemToDelete.id);
        handleApiResponse(error, 'Blog post deleted', 'Failed to delete blog post', () => fetchData(false));
        setShowDeleteConfirm(false); setItemToDelete(null);
    };

    return (
        <>
            <Helmet><title>Manage Blog - Admin</title></Helmet>
            <div className="p-4 sm:p-8">
                <h1 className="text-3xl font-bold tracking-tight mb-8">Manage Blog</h1>
                {loading ? <p>Loading blog posts...</p> : 
                    <BlogTab blogPosts={blogPosts} onAdd={() => fetchData(false)} onEdit={() => fetchData(false)} onDelete={confirmDelete} />
                }
            </div>
             <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the blog post. This action cannot be undone.</AlertDialogDescription>
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

export default AdminBlogPage;
