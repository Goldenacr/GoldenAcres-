
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, AlertTriangle, PlusCircle } from 'lucide-react';
import BlogModal from '@/components/admin/BlogModal';

const BlogTab = ({ blogPosts, onAdd, onEdit, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPost, setCurrentPost] = useState(null);

    const handleModalOpen = (post) => {
        setCurrentPost(post);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        setIsModalOpen(false);
        if (currentPost) onEdit();
        else onAdd();
    };
    
    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Blog Posts</h3>
                <Button onClick={() => handleModalOpen(null)} size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Post
                </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left font-medium text-muted-foreground">Title</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Category</th>
                                <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                             {blogPosts.map((post, index) => (
                                <motion.tr 
                                    key={post.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white hover:bg-gray-50/50"
                                >
                                    <td className="p-3 font-medium">{post.title}</td>
                                    <td className="p-3 text-muted-foreground">{post.category}</td>
                                    <td className="p-3 text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleModalOpen(post)}><Edit className="h-4 w-4" /></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="flex items-center"><AlertTriangle className="h-6 w-6 text-red-500 mr-2" />Confirm Deletion</AlertDialogTitle>
                                                    <AlertDialogDescription>Permanently delete <span className="font-bold">"{post.title}"</span>? This cannot be undone.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onDelete(post)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {blogPosts.length === 0 && <p className="text-center text-muted-foreground py-8">No blog posts found.</p>}

            <BlogModal 
                isOpen={isModalOpen} 
                onOpenChange={setIsModalOpen} 
                post={currentPost} 
                onSave={handleSave} 
            />
        </>
    );
};

export default BlogTab;
