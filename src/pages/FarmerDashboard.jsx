import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Edit, Package, Loader2, Search, CheckCircle2, XCircle, LayoutGrid, BarChart2 } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';
import { Link, useLocation } from 'react-router-dom';

const FarmerDashboard = () => {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal States
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    // Form State
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
        e.preventDefault();
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

    const initiateDelete = (product) => {
        setProductToDelete(product);
        setIsDeleteAlertOpen(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;

        try {
            const { error } = await supabase.from('products').delete().eq('id', productToDelete.id);
            if (error) throw error;
            toast({ title: "Deleted", description: "Product removed." });
            fetchProducts();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not delete product." });
        } finally {
            setIsDeleteAlertOpen(false);
            setProductToDelete(null);
        }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const NavLink = ({ to, icon, children }) => {
        const isActive = location.pathname === to;
        return (
            <Link
                to={to}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
            >
                {icon}
                {children}
            </Link>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 min-h-screen bg-white">
            <Helmet>
                <title>Farmer Dashboard - Golden Acres</title>
            </Helmet>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Farmer Dashboard</h1>
                    <p className="text-gray-600 mt-1">Manage your farm products and view orders.</p>
                </div>
                 <nav className="flex items-center gap-2 p-1 bg-gray-100/70 rounded-lg">
                    <NavLink to="/farmer-dashboard" icon={<LayoutGrid className="h-4 w-4" />}>
                        Products
                    </NavLink>
                    <NavLink to="/farmer-dashboard/revenue" icon={<BarChart2 className="h-4 w-4" />}>
                        Revenue
                    </NavLink>
                </nav>
            </div>

            {/* Search and Add */}
            <div className="flex justify-between items-center mb-6">
                <div className="relative max-w-md flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                        placeholder="Search by product name..." 
                        className="pl-10 bg-gray-50 border-gray-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                 <Button onClick={() => handleOpenModal()} className="ml-4 bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="h-4 w-4 mr-2" /> Add Product
                </Button>
            </div>

            {/* Product Table */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <Package className="mx-auto h-12 w-12 text-gray-300" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">No products found</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by adding a new product.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50">
                                <tr className="border-b border-gray-200">
                                    <th className="py-3 px-4 font-semibold text-gray-600">Product</th>
                                    <th className="py-3 px-4 font-semibold text-gray-600">Farmer</th>
                                    <th className="py-3 px-4 font-semibold text-gray-600">Price</th>
                                    <th className="py-3 px-4 font-semibold text-gray-600">Stock Status</th>
                                    <th className="py-3 px-4 font-semibold text-gray-600 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {filteredProducts.map((product) => (
                                        <motion.tr
                                            key={product.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                                        >
                                            <td className="py-4 px-4 font-bold text-gray-800">{product.name}</td>
                                            <td className="py-4 px-4 text-gray-600">{profile?.full_name || 'N/A'}</td>
                                            <td className="py-4 px-4 text-gray-600">GHS {product.price}</td>
                                            <td className="py-4 px-4">
                                                {product.stock > 0 ? (
                                                    <div className="flex items-center gap-2 text-green-600">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span>In Stock</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-red-500">
                                                        <XCircle className="h-4 w-4" />
                                                        <span>Out of Stock</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex justify-end items-center gap-4">
                                                    <button onClick={() => handleOpenModal(product)} className="text-gray-500 hover:text-blue-600" title="Edit">
                                                        <Edit className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => initiateDelete(product)} className="text-gray-500 hover:text-red-600" title="Delete">
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Custom Styled Delete Dialog */}
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent className="bg-[#2A2A2A] border-none text-white max-w-[320px] sm:max-w-[400px] rounded-3xl p-6 shadow-2xl">
                    <AlertDialogHeader className="space-y-3">
                        <AlertDialogTitle className="text-center text-xl font-normal text-white">
                            Delete Product?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-gray-300 text-base leading-relaxed">
                            Are you sure you want to delete <span className="text-white font-medium">"{productToDelete?.name}"</span>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-row justify-center gap-4 mt-6 sm:justify-center sm:space-x-0">
                        <AlertDialogCancel className="flex-1 bg-transparent border border-gray-600 text-gray-300 hover:bg-white/10 hover:text-white hover:border-gray-500 rounded-xl h-10 mt-0">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDelete} 
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none rounded-xl h-10"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Product Form Modal */}
            <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Product Name</Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g. Tomatoes" />
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
                            <Label>Product Image (Any size)</Label>
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