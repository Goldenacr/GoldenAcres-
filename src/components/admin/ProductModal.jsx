
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/customSupabaseClient';
import ImageUpload from '@/components/admin/ImageUpload';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ProductModal = ({ isOpen, onOpenChange, product, farmers, onSave }) => {
    const { toast } = useToast();
    const { profile } = useAuth();
    const [form, setForm] = useState({ name: '', description: '', price: '', unit: '', farmer_id: '' });
    const [inStock, setInStock] = useState(true);
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Check if current user is an admin
    const isAdmin = profile?.role === 'admin';

    useEffect(() => {
        if (product) {
            setForm({ 
                name: product.name, 
                description: product.description || '', 
                price: product.price, 
                unit: product.unit || '', 
                farmer_id: product.farmer_id || (isAdmin ? '' : profile?.id) 
            });
            setInStock(product.stock > 0);
        } else {
            setForm({ 
                name: '', 
                description: '', 
                price: '', 
                unit: '', 
                farmer_id: isAdmin ? '' : (profile?.id || '') 
            });
            setInStock(true);
        }
        setImageFile(null);
    }, [product, isOpen, profile, isAdmin]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (val) => {
        setForm(prev => ({...prev, farmer_id: val}));
    };

    const uploadFile = async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('product_images').upload(fileName, file);
        if (uploadError) {
            throw uploadError;
        }
        const { data } = supabase.storage.from('product_images').getPublicUrl(fileName);
        return data.publicUrl;
    };

    const handleSubmit = async () => {
        // Validation
        if (!form.name || !form.price || !form.unit) {
             toast({ variant: 'destructive', title: 'Missing Fields', description: 'Name, Price, and Unit are required.' });
             return;
        }

        const finalFarmerId = isAdmin ? form.farmer_id : profile?.id;
        if (!finalFarmerId) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Farmer identification is missing. Please select a farmer.' });
            return;
        }

        setLoading(true);
        try {
            let imageUrl = product?.image_url;
            
            if (imageFile) {
                try {
                    imageUrl = await uploadFile(imageFile);
                } catch (uploadError) {
                    toast({ variant: 'destructive', title: 'Image Upload Failed', description: uploadError.message });
                    setLoading(false);
                    return;
                }
            }
            
            const productData = { 
                name: form.name,
                description: form.description,
                price: parseFloat(form.price),
                unit: form.unit,
                farmer_id: finalFarmerId,
                image_url: imageUrl, 
                stock: inStock ? (product?.stock > 0 ? product.stock : 10) : 0 
            };

            const { error } = product
              ? await supabase.from('products').update(productData).eq('id', product.id)
              : await supabase.from('products').insert(productData);

            if (error) throw error;

            toast({ title: `Product ${product ? 'updated' : 'created'} successfully!` });
            onSave(); // This closes modal and refreshes data
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to save product', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                    <DialogDescription>
                        Fill in the details below. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4">
                    {/* Explicitly using vertical stacking for labels and inputs to prevent overlap */}
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Product Name *</Label>
                        <Input 
                            id="name" 
                            name="name" 
                            placeholder="e.g. Organic Tomatoes" 
                            value={form.name} 
                            onChange={handleChange}
                            className="bg-white border-gray-200"
                        />
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="description" className="text-sm font-medium leading-none">Description</Label>
                        <Textarea 
                            id="description" 
                            name="description" 
                            placeholder="Describe your product..." 
                            value={form.description} 
                            onChange={handleChange} 
                            className="bg-white border-gray-200"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="price" className="text-sm font-medium leading-none">Price (GHS) *</Label>
                            <Input 
                                id="price" 
                                name="price" 
                                placeholder="0.00" 
                                type="number" 
                                step="0.01" 
                                value={form.price} 
                                onChange={handleChange}
                                className="bg-white border-gray-200" 
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="unit" className="text-sm font-medium leading-none">Unit *</Label>
                            <Input 
                                id="unit" 
                                name="unit" 
                                placeholder="e.g. kg, basket" 
                                value={form.unit} 
                                onChange={handleChange} 
                                className="bg-white border-gray-200"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 border p-3 rounded-md bg-gray-50">
                        <Checkbox id="inStock" checked={inStock} onCheckedChange={setInStock} />
                        <Label htmlFor="inStock" className="cursor-pointer">
                            Product is In Stock
                        </Label>
                    </div>
                    
                    {isAdmin && (
                        <div className="grid gap-2">
                            <Label>Farmer *</Label>
                            <Select onValueChange={handleSelectChange} value={form.farmer_id}>
                                <SelectTrigger className="w-full bg-white border-gray-200">
                                    <SelectValue placeholder="Select a Farmer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {farmers.map(f => (
                                        <SelectItem key={f.id} value={f.id}>
                                            {f.full_name || f.email || 'Unnamed Farmer'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label>Product Image</Label>
                        <ImageUpload imageFile={imageFile} onFileChange={setImageFile} existingImageUrl={product?.image_url} />
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2 border-t mt-auto">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? 'Saving...' : 'Save Product'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ProductModal;
