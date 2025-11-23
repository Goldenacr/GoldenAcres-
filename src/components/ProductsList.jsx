import React, { useEffect, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ShoppingCart, Star } from 'lucide-react';

// Individual Product Card Component in Horizontal Layout
const ProductCard = memo(({ product }) => {
    const { addToCart } = useCart();

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.stock <= 0) return;
        addToCart(product, 1);
    };

    const price = Number(product.price).toFixed(2);
    const isOutOfStock = product.stock <= 0;

    return (
        <motion.div
            layout
            className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 mb-3"
        >
            <Link to={`/marketplace/${product.id}`} className="flex flex-row h-32 sm:h-40">
                {/* Image Section - Left Side (approx 30%) */}
                <div className="relative w-[30%] sm:w-[25%] md:w-[20%] bg-gray-50 flex-shrink-0 border-r border-gray-100">
                    <motion.img
                        src={product.image_url || 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400'}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.5 }}
                    />
                     {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                             <span className="text-white font-bold text-xs tracking-wider uppercase border border-white px-2 py-1 rounded">Sold Out</span>
                        </div>
                    )}
                </div>

                {/* Content Section - Right Side (approx 70%) */}
                <div className="p-3 sm:p-4 flex flex-col justify-between flex-grow w-[70%] sm:w-[75%] md:w-[80%]">
                    <div className="flex justify-between items-start gap-2">
                         <div className="space-y-1 w-full">
                            {/* Product Name */}
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-tight line-clamp-2">
                                {product.name}
                            </h3>
                             
                             {/* Price */}
                            <div className="text-lg font-bold text-gray-900">
                                GHS {price}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-end justify-between mt-2">
                        {/* Ratings and Orders */}
                        <div className="flex flex-col gap-0.5">
                            {product.average_rating > 0 && (
                                <div className="flex items-center gap-1">
                                     <div className="flex text-orange-400">
                                         {[...Array(5)].map((_, i) => (
                                             <Star key={i} className={`w-3 h-3 ${i < Math.round(product.average_rating) ? "fill-current" : "text-gray-200"}`} />
                                         ))}
                                     </div>
                                     <span className="text-xs text-gray-500">{Number(product.average_rating).toFixed(1)}</span>
                                </div>
                            )}
                            <span className="text-xs text-gray-400">{product.total_orders || 0} orders</span>
                        </div>

                         {/* Add to Cart Action */}
                         <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-full bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-600"
                            onClick={handleAddToCart}
                            disabled={isOutOfStock}
                         >
                             <ShoppingCart className="h-4 w-4" />
                         </Button>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
});

const ProductsList = memo(() => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { id: routeId } = useParams();
    const location = useLocation();

    // Determine if we are on a specific farmer's page
    const isFarmerPage = location.pathname.startsWith('/farmer/');
    const farmerId = isFarmerPage ? routeId : null;

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            
            let query = supabase.rpc('get_products_with_stats');
            
            // Apply filter if on a farmer page
            if (farmerId) {
                query = query.eq('farmer_id', farmerId);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching products:', error);
                toast({
                    variant: "destructive",
                    title: "Failed to fetch products",
                    description: error.message,
                });
                // Fallback to simple fetch if RPC fails
                let fallbackQuery = supabase
                    .from('products')
                    .select(`*, farmer:farmer_id (full_name)`)
                    .order('created_at', { ascending: false });
                
                if (farmerId) {
                    fallbackQuery = fallbackQuery.eq('farmer_id', farmerId);
                }
                
                const { data: fallbackData } = await fallbackQuery;
                setProducts(fallbackData || []);
            } else {
                setProducts(data);
            }
            setLoading(false);
        };
        fetchProducts();
    }, [toast, farmerId]);

    if (loading) {
        return (
            <div className="text-center py-20 flex justify-center items-center flex-col">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500 mb-4" />
                <span className="text-gray-500 font-medium">Loading fresh produce...</span>
            </div>
        );
    }

    if (!products || products.length === 0) {
        return (
             <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <p className="text-xl text-gray-500 font-medium">No products available.</p>
                <p className="text-gray-400 mt-2">This farmer hasn't listed any products yet.</p>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    return (
        <motion.div
            className="flex flex-col w-full max-w-2xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </motion.div>
    );
});

export default ProductsList;