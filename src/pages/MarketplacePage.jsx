import React, { useState, useEffect, useCallback, memo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Search, Loader2, SlidersHorizontal, X, LayoutList, LayoutGrid, Star, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from "@/lib/utils";
import VerifiedBadge from '@/components/VerifiedBadge';

// Filter Overlay Component
const FilterOverlay = ({ isOpen, onClose, filters, setFilters, handleFilterChange, resetFilters, categories }) => {
    useEffect(() => {
        if (isOpen) {
            // Prevent body scrolling when overlay is open
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    
                    {/* Filter Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        // UPDATED: Use h-[100dvh] to handle mobile browser bars better than h-full
                        className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col h-[100dvh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                            <h2 className="text-xl font-bold text-gray-900">Filter Products</h2>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* UPDATED: Added overscroll-contain to prevent scroll chaining to body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 overscroll-contain">
                            {/* Price Range */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">Price Range</Label>
                                    <span className="text-sm font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                        GHS {filters.minPrice} - GHS {filters.maxPrice}
                                    </span>
                                </div>
                                <Slider
                                    min={0}
                                    max={2000}
                                    step={10}
                                    value={[filters.minPrice, filters.maxPrice]}
                                    onValueChange={(v) => {
                                        handleFilterChange('minPrice', v[0]);
                                        handleFilterChange('maxPrice', v[1]);
                                    }}
                                    className="py-2"
                                />
                            </div>

                            {/* Categories */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Category</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleFilterChange('category', 'all')}
                                        className={cn(
                                            "px-3 py-2 rounded-lg text-sm font-medium transition-all border",
                                            filters.category === 'all' 
                                                ? "bg-orange-50 border-orange-200 text-orange-700" 
                                                : "bg-white border-gray-200 text-gray-600 hover:border-orange-200 hover:bg-gray-50"
                                        )}
                                    >
                                        All Categories
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => handleFilterChange('category', cat)}
                                            className={cn(
                                                "px-3 py-2 rounded-lg text-sm font-medium transition-all border",
                                                filters.category === cat
                                                    ? "bg-orange-50 border-orange-200 text-orange-700"
                                                    : "bg-white border-gray-200 text-gray-600 hover:border-orange-200 hover:bg-gray-50"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Rating */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Minimum Rating</Label>
                                <div className="flex gap-2">
                                    {[4, 3, 2, 0].map((rating) => (
                                        <button
                                            key={rating}
                                            onClick={() => handleFilterChange('minRating', rating)}
                                            className={cn(
                                                "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border flex-1 justify-center",
                                                filters.minRating === rating
                                                    ? "bg-orange-50 border-orange-200 text-orange-700"
                                                    : "bg-white border-gray-200 text-gray-600 hover:border-orange-200 hover:bg-gray-50"
                                            )}
                                        >
                                            {rating === 0 ? "Any" : (
                                                <>
                                                    {rating}+ <Star className="w-3 h-3 fill-current" />
                                                </>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                             {/* Stock Status */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Availability</Label>
                                <div className="flex flex-col gap-2">
                                    <label className="flex items-center space-x-2 cursor-pointer group">
                                        <div className={cn(
                                            "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                            filters.stockStatus === 'all' ? "bg-orange-500 border-orange-500" : "border-gray-300 bg-white group-hover:border-orange-400"
                                        )}>
                                            {filters.stockStatus === 'all' && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <input 
                                            type="radio" 
                                            name="stock" 
                                            className="hidden" 
                                            checked={filters.stockStatus === 'all'} 
                                            onChange={() => handleFilterChange('stockStatus', 'all')} 
                                        />
                                        <span className="text-gray-700">Show All Products</span>
                                    </label>

                                    <label className="flex items-center space-x-2 cursor-pointer group">
                                        <div className={cn(
                                            "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                            filters.stockStatus === 'in_stock' ? "bg-orange-500 border-orange-500" : "border-gray-300 bg-white group-hover:border-orange-400"
                                        )}>
                                            {filters.stockStatus === 'in_stock' && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <input 
                                            type="radio" 
                                            name="stock" 
                                            className="hidden" 
                                            checked={filters.stockStatus === 'in_stock'} 
                                            onChange={() => handleFilterChange('stockStatus', 'in_stock')} 
                                        />
                                        <span className="text-gray-700">In Stock Only</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-3 flex-shrink-0">
                            <Button className="w-full text-white" size="lg" onClick={onClose}>
                                Show Results
                            </Button>
                             <Button variant="outline" className="w-full" onClick={() => { resetFilters(); onClose(); }}>
                                Reset Filters
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};


// Memoized Product Card that adapts to View Mode
const ProductCard = memo(({ product, viewMode }) => {
    const { addToCart } = useCart();
    
    const handleAddToCart = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.stock <= 0) return;
        addToCart(product, 1); 
    }, [addToCart, product]);

    const isOutOfStock = product.stock <= 0;
    const price = Number(product.price).toFixed(2);
    const isList = viewMode === 'list';

    return (
         <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
                "bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group",
                isList ? "mb-4 w-full" : "h-full flex flex-col"
            )}
        >
            <Link 
                to={`/marketplace/${product.id}`} 
                className={cn("block", isList ? "flex flex-row h-40" : "flex flex-col h-full")}
            >
                {/* Image Section */}
                <div className={cn(
                    "relative bg-gray-50 flex-shrink-0 overflow-hidden",
                    isList ? "w-[35%] sm:w-[25%] md:w-[20%] border-r border-gray-100" : "aspect-square w-full border-b border-gray-100"
                )}>
                    <img
                        src={product.image_url || 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400'}
                        alt={product.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                    />
                     {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                             <span className="text-white font-bold text-xs tracking-wider uppercase border border-white px-2 py-1 rounded">Sold Out</span>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className={cn(
                    "p-4 flex flex-col flex-grow",
                    isList ? "justify-between w-[65%] sm:w-[75%] md:w-[80%]" : "justify-between h-full"
                )}>
                    <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                            <h3 className={cn("font-bold text-gray-900 leading-tight", isList ? "text-lg line-clamp-1" : "text-base line-clamp-2")}>
                                {product.name}
                            </h3>
                        </div>
                        
                        <div className="flex items-center gap-1 mt-1">
                            <p className="text-xs text-gray-500 font-medium">
                                by {product.farmer_name || 'Local Farmer'}
                            </p>
                            {product.farmer_is_verified && <VerifiedBadge className="h-3.5 w-3.5 text-sky-500" />}
                        </div>

                         {/* Price */}
                        <div className="text-xl font-extrabold text-gray-900 mt-1">
                            GHS {price}
                        </div>
                    </div>

                    <div className={cn("flex items-end justify-between", isList ? "mt-0" : "mt-4")}>
                        {/* Ratings and Orders */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                                 <div className="flex text-orange-400">
                                     <Star className={cn("w-3.5 h-3.5", product.average_rating >= 1 ? "fill-current" : "text-gray-200")} />
                                     <span className="text-xs font-bold text-gray-700 ml-0.5">
                                         {product.average_rating > 0 ? Number(product.average_rating).toFixed(1) : "New"}
                                     </span>
                                 </div>
                            </div>
                            <span className="text-xs text-gray-400 font-medium ml-0.5">
                                {product.total_orders || 0} orders
                            </span>
                        </div>

                         {/* Add to Cart Action */}
                         <Button
                            size="icon"
                            className={cn(
                                "rounded-full transition-colors shadow-none",
                                isOutOfStock ? "bg-gray-100 text-gray-400" : "bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white"
                            )}
                            onClick={handleAddToCart}
                            disabled={isOutOfStock}
                         >
                             <ShoppingCart className="h-5 w-5" />
                         </Button>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
});

const MarketplacePage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        category: 'all',
        minPrice: 0,
        maxPrice: 2000,
        minRating: 0,
        stockStatus: 'all',
        sortBy: 'created_at-desc',
    });
    const { toast } = useToast();

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
             let { data, error } = await supabase.rpc('get_products_with_stats');
             
             if (error) {
                 console.warn("RPC failed, falling back to standard query", error);
                 const { data: fallbackData, error: fallbackError } = await supabase
                    .from('products')
                    .select('*, farmer:profiles(full_name, is_verified)');
                 
                 if (fallbackError) throw fallbackError;
                 
                 data = fallbackData.map(p => ({
                     ...p,
                     average_rating: 0,
                     total_orders: 0,
                     farmer_name: p.farmer?.full_name,
                     farmer_is_verified: p.farmer?.is_verified
                 }));
             }

             let filtered = data || [];

             if (searchTerm) {
                 const lowerTerm = searchTerm.toLowerCase();
                 filtered = filtered.filter(p => 
                    p.name?.toLowerCase().includes(lowerTerm) || 
                    p.description?.toLowerCase().includes(lowerTerm) ||
                    p.category?.toLowerCase().includes(lowerTerm)
                 );
             }

             if (filters.category !== 'all') {
                 filtered = filtered.filter(p => p.category === filters.category);
             }

             if (filters.stockStatus === 'in_stock') {
                 filtered = filtered.filter(p => p.stock > 0);
             } else if (filters.stockStatus === 'low_stock') {
                 filtered = filtered.filter(p => p.stock > 0 && p.stock < 10);
             }

             if (filters.minRating > 0) {
                 filtered = filtered.filter(p => (p.average_rating || 0) >= filters.minRating);
             }
             
             filtered = filtered.filter(p => p.price >= filters.minPrice && p.price <= filters.maxPrice);

             const [sortField, sortOrder] = filters.sortBy.split('-');
             filtered.sort((a, b) => {
                 let valA = a[sortField];
                 let valB = b[sortField];
                 if (typeof valA === 'string') valA = valA.toLowerCase();
                 if (typeof valB === 'string') valB = valB.toLowerCase();
                 if (sortField === 'created_at') {
                    valA = new Date(valA).getTime();
                    valB = new Date(valB).getTime();
                 }
                 if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                 if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                 return 0;
             });

             setProducts(filtered);

        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Failed to load products', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [searchTerm, filters, toast]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchProducts();
        }, 300);
        return () => clearTimeout(debounce);
    }, [fetchProducts]);

    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const resetFilters = useCallback(() => {
        setSearchTerm('');
        setFilters({
            category: 'all',
            minPrice: 0,
            maxPrice: 2000,
            minRating: 0,
            stockStatus: 'all',
            sortBy: 'created_at-desc',
        });
    }, []);

    const categories = ['Vegetable', 'Fruit', 'Grains', 'Tuber', 'Poultry', 'Livestock', 'Other'];

    return (
        <>
            <Helmet>
                <title>Marketplace - Golden Acres</title>
                <meta name="description" content="Browse and buy fresh produce directly from local farmers in our marketplace." />
            </Helmet>
            <div className="min-h-screen bg-gray-50/30 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Header & Search Controls - REMOVED STICKY */}
                    <motion.div 
                      className="mb-8 bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-gray-100"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                             <div className="relative flex-grow">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input 
                                    type="text"
                                    placeholder="Search for products, farmers..."
                                    className="pl-11 h-12 bg-gray-50 border-0 focus-visible:ring-2 focus-visible:ring-orange-500 rounded-xl text-base"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-12 w-12 rounded-xl border-gray-200"
                                    onClick={() => setViewMode(prev => prev === 'list' ? 'grid' : 'list')}
                                >
                                    {viewMode === 'list' ? <LayoutGrid className="h-5 w-5 text-gray-600" /> : <LayoutList className="h-5 w-5 text-gray-600" />}
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                             <Select value={filters.sortBy} onValueChange={(v) => handleFilterChange('sortBy', v)}>
                                <SelectTrigger className="h-9 text-sm border-gray-200 rounded-lg w-[160px] bg-white">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="created_at-desc">Newest Arrivals</SelectItem>
                                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                                    <SelectItem value="total_orders-desc">Best Selling</SelectItem>
                                    <SelectItem value="average_rating-desc">Highest Rated</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button 
                                variant="outline" 
                                size="sm" 
                                className={cn("h-9 border-gray-200 rounded-lg bg-white", isFilterOpen && "border-orange-500 text-orange-600 bg-orange-50")}
                                onClick={() => setIsFilterOpen(true)}
                            >
                                <SlidersHorizontal className="mr-2 h-4 w-4"/> Filters
                            </Button>
                            
                            {/* Reset Button */}
                            {(filters.minPrice > 0 || filters.category !== 'all' || filters.minRating > 0 || searchTerm) && (
                                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 text-red-500 hover:text-red-600 hover:bg-red-50">
                                    Reset Filters
                                </Button>
                            )}
                        </div>
                    </motion.div>

                    {/* Filter Overlay - Rendered at top level */}
                    <FilterOverlay 
                        isOpen={isFilterOpen} 
                        onClose={() => setIsFilterOpen(false)}
                        filters={filters}
                        setFilters={setFilters}
                        handleFilterChange={handleFilterChange}
                        resetFilters={resetFilters}
                        categories={categories}
                    />

                    {/* Product Grid/List Container */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
                            <p className="text-gray-500 font-medium">Fetching fresh products...</p>
                        </div>
                    ) : (
                        <motion.div 
                            layout 
                            className={cn(
                                "pb-20",
                                viewMode === 'grid' 
                                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
                                    : "flex flex-col max-w-3xl mx-auto gap-4"
                            )}
                        > 
                            <AnimatePresence mode="popLayout">
                                {products.map(product => (
                                    <ProductCard key={product.id} product={product} viewMode={viewMode} />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {!loading && products.length === 0 && (
                         <motion.div 
                            className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 mx-auto max-w-2xl"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                         >
                            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="h-10 w-10 text-orange-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">No products found</h2>
                            <p className="text-gray-500 mt-2 max-w-xs mx-auto">We couldn't find any products matching your filters. Try adjusting your search terms.</p>
                            <Button variant="outline" onClick={resetFilters} className="mt-6">
                                Clear All Filters
                            </Button>
                        </motion.div>
                    )}
                </div>
            </div>
        </>
    );
};

export default MarketplacePage;