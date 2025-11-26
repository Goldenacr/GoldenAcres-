
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, Package, Loader2 } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';

const FarmerDashboard = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Product Form State - lifted here to persist during modal life
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        unit: 'kg',
        imageFile: null,
        existingImageUrl: null
    });

    useEffect(() => {
        if (user) {
            fetchProducts();
        }
    }, [user]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('farmer_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load your products." });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                description: product.description || '',
                price: product.price,
                category: product.category || '',
                stock: product.stock,
                unit: product.unit || 'kg',
                imageFile: null,
                existingImageUrl: product.image_url
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                category: '',
                stock: '',
                unit: 'kg',
                imageFile: null,
                existingImageUrl: null
            });
        }
        setIsProductModalOpen(true);
    };

    const handleFileChange = (file) => {
        // State update here does NOT reset the other form fields because formData is a single object
        // and we merge the previous state.
        setFormData(prev => ({ ...prev, imageFile: file }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent page refresh
        setIsSubmitting(true);

        try {
            let imageUrl = formData.existingImageUrl;

            if (formData.imageFile) {
                const fileExt = formData.imageFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('product_images')
                    .upload(filePath, formData.imageFile);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('product_images')
                    .getPublicUrl(filePath);

                imageUrl = urlData.publicUrl;
            }

            const productData = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                category: formData.category,
                stock: parseInt(formData.stock),
                unit: formData.unit,
                image_url: imageUrl,
                farmer_id: user.id
            };

            if (editingProduct) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', editingProduct.id);
                if (error) throw error;
                toast({ title: "Success", description: "Product updated successfully." });
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([productData]);
                if (error) throw error;
                toast({ title: "Success", description: "Product added successfully." });
            }

            setIsProductModalOpen(false);
            fetchProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            toast({ variant: "destructive", title: "Error", description: error.message || "Failed to save product." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        // Fixed: unexpected use of 'confirm' by using window.confirm
        if (!window.confirm("Are you sure you want to delete this product?")) return;

        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            toast({ title: "Deleted", description: "Product removed." });
            fetchProducts();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not delete product." });
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 min-h-screen bg-gray-50">
            <Helmet>
                <title>Farmer Dashboard - Golden Acres</title>
            </Helmet>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Farmer Dashboard</h1>
                    <p className="text-gray-600 mt-1">Manage your farm products and view orders.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" /> Add New Product
                </Button>
            </div>

            {/* Dashboard Content */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                        <Package className="mr-2 h-5 w-5 text-green-600" /> My Products
                    </h2>
                </div>
                
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <p>You haven't uploaded any products yet.</p>
                        <Button variant="link" onClick={() => handleOpenModal()} className="mt-2">Upload your first product</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {products.map(product => (
                            <motion.div 
                                key={product.id} 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="relative h-48 bg-gray-100">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/80 hover:bg-white" onClick={() => handleOpenModal(product)}>
                                            <Edit className="h-4 w-4 text-blue-600" />
                                        </Button>
                                        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDeleteProduct(product.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-lg text-gray-900">{product.name}</h3>
                                    <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-green-600 font-bold">₵{product.price} / {product.unit}</span>
                                        <span className={`text-sm ${product.stock > 0 ? 'text-gray-600' : 'text-red-500'}`}>
                                            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Product Modal */}
            <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Product Name</Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select value={formData.category} onValueChange={(val) => handleSelectChange('category', val)}>
                                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Vegetables">Vegetables</SelectItem>
                                        <SelectItem value="Fruits">Fruits</SelectItem>
                                        <SelectItem value="Grains">Grains</SelectItem>
                                        <SelectItem value="Tubers">Tubers</SelectItem>
                                        <SelectItem value="Poultry">Poultry</SelectItem>
                                        <SelectItem value="Livestock">Livestock</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Price (GHS)</Label>
                                <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stock">Stock Quantity</Label>
                                <Input id="stock" name="stock" type="number" value={formData.stock} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unit">Unit</Label>
                                <Select value={formData.unit} onValueChange={(val) => handleSelectChange('unit', val)}>
                                    <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="kg">Kilogram (kg)</SelectItem>
                                        <SelectItem value="bag">Bag</SelectItem>
                                        <SelectItem value="crate">Crate</SelectItem>
                                        <SelectItem value="tuber">Tuber</SelectItem>
                                        <SelectItem value="basket">Basket</SelectItem>
                                        <SelectItem value="piece">Piece</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={3} />
                        </div>

                        <div className="space-y-2">
                            <Label>Product Image</Label>
                            <ImageUpload 
                                imageFile={formData.imageFile} 
                                onFileChange={handleFileChange} 
                                existingImageUrl={formData.existingImageUrl} 
                            />
                        </div>

                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsProductModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingProduct ? 'Update Product' : 'Add Product'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FarmerDashboard;
      
