import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Minus, CheckCircle2, XCircle, User, ChevronRight, MapPin, Calendar } from 'lucide-react';
import ProductsList from '@/components/ProductsList';
import VerifiedBadge from '@/components/VerifiedBadge';
import ProductReviews from '@/components/ProductReviews';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ProductDetailPage = () => {
    const { id } = useParams();
    const { toast } = useToast();
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchProduct = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                farmer:profiles(id, full_name, is_verified, avatar_url, city_town, created_at, farm_type)
            `)
            .eq('id', id)
            .single();

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching product', description: error.message });
        } else {
            setProduct(data);
            fetchRelatedProducts(data.category, data.id);
        }
        setLoading(false);
    }, [id, toast]);

    const fetchRelatedProducts = async (category, currentId) => {
        if (!category) return;
        const { data, error } = await supabase
            .from('products')
            .select('*, farmer:profiles(full_name, is_verified)')
            .eq('category', category)
            .neq('id', currentId)
            .limit(4);
        
        if (!error) {
            setRelatedProducts(data);
        }
    };

    useEffect(() => {
        fetchProduct();
        setQuantity(1);
    }, [id, fetchProduct]);

    const handleAddToCart = () => {
        addToCart(product, quantity);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-[calc(100vh-8rem)]"><div className="fancy-loader"></div></div>;
    }
    if (!product) {
        return <div className="text-center py-20">Product not found.</div>;
    }

    const seaPrice = Number(product.price);
    const airPrice = (seaPrice * 1.45).toFixed(2);

    return (
        <>
            <Helmet>
                <title>{`${product.name} - Golden Acres`}</title>
                <meta name="description" content={product.description} />
            </Helmet>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {/* Product Main Section */}
                <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start mb-12">
                    {/* Image */}
                    <div className="aspect-square w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                           <img 
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                            alt={product.name} 
                            src={product.image_url || 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400'} 
                           />
                    </div>

                    {/* Details */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100 uppercase tracking-wide">
                                    {product.category || 'Produce'}
                                </span>
                                {product.stock > 0 ? (
                                    <span className="flex items-center text-sm text-green-600 font-medium"><CheckCircle2 className="h-4 w-4 mr-1.5" /> In Stock</span>
                                ) : (
                                    <span className="flex items-center text-sm text-red-600 font-medium"><XCircle className="h-4 w-4 mr-1.5" /> Out of Stock</span>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4">{product.name}</h1>
                        </div>
                        
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-3">
                            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                <span className="text-gray-600 font-medium">By Air (Express)</span>
                                <span className="text-xl font-bold text-gray-900">GHS {airPrice}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 font-medium">By Sea (Standard)</span>
                                <span className="text-2xl font-bold text-primary">GHS {seaPrice}</span>
                            </div>
                        </div>

                        <p className="text-base text-gray-600 leading-relaxed">{product.description}</p>
                        
                        <div className="flex flex-col sm:flex-row items-stretch gap-4 pt-4">
                            <div className="flex items-center border-2 border-gray-200 rounded-lg bg-white px-2">
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-500" onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></Button>
                                <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-500" onClick={() => setQuantity(q => q + 1)}><Plus className="h-4 w-4" /></Button>
                            </div>
                            <Button size="lg" className="flex-1 h-12 text-base bg-primary hover:bg-primary/90" onClick={handleAddToCart} disabled={product.stock <= 0}>
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                {product.stock > 0 ? 'Add to Cart' : 'Sold Out'}
                            </Button>
                        </div>

                        {/* Farmer Profile Card */}
                        <div 
                            className="mt-8 bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            onClick={() => navigate(`/farmer/${product.farmer?.id}`)}
                        >
                            <div className="flex items-center gap-4">
                                <Avatar className="h-14 w-14 border-2 border-gray-100">
                                    <AvatarImage src={product.farmer?.avatar_url} />
                                    <AvatarFallback className="bg-orange-100 text-orange-600 text-lg">
                                        {product.farmer?.full_name?.charAt(0) || 'F'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                                            {product.farmer?.full_name || 'Anonymous Farmer'}
                                        </h4>
                                        {product.farmer?.is_verified && <VerifiedBadge />}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                         <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {product.farmer?.city_town || 'Location Hidden'}</span>
                                         <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Joined {new Date(product.farmer?.created_at).getFullYear()}</span>
                                    </div>
                                </div>
                                <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" />
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-center text-primary font-medium">
                                View Farmer Profile & All Products
                            </div>
                        </div>

                    </div>
                </div>

                {/* Product Reviews Section */}
                <ProductReviews productId={product.id} />

                {relatedProducts.length > 0 && (
                    <div className="mt-24 border-t pt-12">
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-8">More Like This</h2>
                        <ProductsList products={relatedProducts} />
                    </div>
                )}
            </div>
        </>
    );
};

export default ProductDetailPage;