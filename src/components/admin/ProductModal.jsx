
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

const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
    },
  }),
};

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
                description: product.description, 
                price: product.price, 
                unit: product.unit || '', 
                // If admin, use existing farmer_id. If farmer, ensure it's their own ID.
                farmer_id: product.farmer_id || (isAdmin ? '' : profile?.id) 
            });
            setInStock(product.stock > 0);
        } else {
            setForm({ 
                name: '', 
                description: '', 
                price: '', 
                unit: '', 
                // If admin, empty start (force selection). If farmer, auto-assign their ID.
                farmer_id: isAdmin ? '' : (profile?.id || '') 
            });
            setInStock(true);
        }
        setImageFile(null);
    }, [product, isOpen, profile, isAdmin]);
    
    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectChange = (val) => {
        setForm(prev => ({...prev, farmer_id: val}));
    };

    const uploadFile = async (file, bucket) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
        if (uploadError) {
            toast({ variant: 'destructive', title: 'Image upload failed', description: uploadError.message });
            return { error: uploadError };
        }
        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return { publicUrl: data.publicUrl, error: null };
    };

    const handleSubmit = async () => {
        setLoading(true);
        let imageUrl = product?.image_url;
        if (imageFile) {
            const { publicUrl, error } = await uploadFile(imageFile, 'product_images');
            if (error) {
                setLoading(false);
                return;
            }
            imageUrl = publicUrl;
        }
        
        // Logic to ensure correct farmer_id is used
        const finalFarmerId = isAdmin ? form.farmer_id : profile?.id;

        if (!finalFarmerId) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Farmer identification is missing.' });
            setLoading(false);
            return;
        }

        const productData = { 
            ...form, 
            farmer_id: finalFarmerId,
            image_url: imageUrl, 
            stock: inStock ? (product?.stock > 0 ? product.stock : 1) : 0 
        };

        const { error } = product
          ? await supabase.from('products').update(productData).eq('id', product.id)
          : await supabase.from('products').insert(productData);

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to save product', description: error.message });
        } else {
            toast({ title: `Product ${product ? 'updated' : 'created'}` });
            onSave();
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                    <DialogDescription>
                        Fill in the details below. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                    <motion.div variants={formVariants} initial="hidden" animate="visible" custom={0}>
                      <Label htmlFor="name">Product Name</Label>
                      <Input id="name" name="name" placeholder="e.g. Organic Tomatoes" value={form.name} onChange={handleChange} />
                    </motion.div>
                    <motion.div variants={formVariants} initial="hidden" animate="visible" custom={1}>
                       <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" placeholder="Product details" value={form.description} onChange={handleChange} />
                    </motion.div>
                    <motion.div variants={formVariants} initial="hidden" animate="visible" custom={2}>
                      <Label htmlFor="price">Price (GHS)</Label>
                      <Input id="price" name="price" placeholder="e.g. 15.50" type="number" value={form.price} onChange={handleChange} />
                    </motion.div>
                    <motion.div variants={formVariants} initial="hidden" animate="visible" custom={3}>
                      <Label htmlFor="unit">Unit</Label>
                      <Input id="unit" name="unit" placeholder="e.g., kg, bunch" value={form.unit} onChange={handleChange} />
                    </motion.div>
                     <motion.div variants={formVariants} initial="hidden" animate="visible" custom={4} className="flex items-center space-x-2 pt-2">
                        <Checkbox id="inStock" checked={inStock} onCheckedChange={setInStock} />
                        <Label htmlFor="inStock" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Product is in stock
                        </Label>
                     </motion.div>
                    
                    {/* Only show Farmer Selection for Admins */}
                    {isAdmin && (
                        <motion.div variants={formVariants} initial="hidden" animate="visible" custom={5}>
                            <Label>Farmer *</Label>
                            <Select onValueChange={handleSelectChange} value={form.farmer_id}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select Farmer" /></SelectTrigger>
                                <SelectContent>{farmers.map(f => <SelectItem key={f.id} value={f.id}>{f.full_name || 'Unknown Farmer'}</SelectItem>)}</SelectContent>
                            </Select>
                        </motion.div>
                    )}

                    <motion.div variants={formVariants} initial="hidden" animate="visible" custom={6}>
                        <Label>Product Image</Label>
                        <ImageUpload imageFile={imageFile} onFileChange={setImageFile} existingImageUrl={product?.image_url} />
                    </motion.div>
                </div>
                <DialogFooter>
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
              
