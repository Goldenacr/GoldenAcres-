
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, AlertTriangle, PlusCircle, CheckCircle2, XCircle } from 'lucide-react';
import ProductModal from '@/components/admin/ProductModal';

const ProductsTab = ({ products, farmers, onAdd, onEdit, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);

    const handleModalOpen = (product) => {
        setCurrentProduct(product);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        setIsModalOpen(false);
        if (currentProduct) onEdit();
        else onAdd();
    };
    
    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Products</h3>
                <Button onClick={() => handleModalOpen(null)} size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Product
                </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left font-medium text-muted-foreground">Product</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Farmer</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Price</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Stock Status</th>
                                <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            <AnimatePresence>
                            {products.map((p) => (
                                <motion.tr
                                    key={p.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.3 }}
                                    className="bg-white hover:bg-gray-50/50"
                                >
                                    <td className="p-3 font-medium">{p.name}</td>
                                    <td className="p-3 text-muted-foreground">{p.farmer?.full_name || 'N/A'}</td>
                                    <td className="p-3 text-muted-foreground">GHS {Number(p.price).toLocaleString()}</td>
                                    <td className="p-3 text-muted-foreground">
                                        {p.stock > 0 ? (
                                            <span className="flex items-center text-green-600"><CheckCircle2 className="h-4 w-4 mr-1.5" /> In Stock</span>
                                        ) : (
                                            <span className="flex items-center text-red-600"><XCircle className="h-4 w-4 mr-1.5" /> Out of Stock</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleModalOpen(p)}><Edit className="h-4 w-4" /></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="flex items-center"><AlertTriangle className="h-6 w-6 text-red-500 mr-2" />Confirm Deletion</AlertDialogTitle>
                                                    <AlertDialogDescription>Permanently delete the product <span className="font-bold">"{p.name}"</span>? This action cannot be undone.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onDelete(p)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </td>
                                </motion.tr>
                            ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
            {products.length === 0 && <p className="text-center text-muted-foreground py-8">No products found.</p>}

            <ProductModal 
                isOpen={isModalOpen} 
                onOpenChange={setIsModalOpen} 
                product={currentProduct} 
                farmers={farmers}
                onSave={handleSave} 
            />
        </>
    );
};

export default ProductsTab;
