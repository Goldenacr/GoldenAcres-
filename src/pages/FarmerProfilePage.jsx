
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Calendar, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import ProductsList from '@/components/ProductsList';

const FarmerProfilePage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { toast } = useToast();
    const [farmer, setFarmer] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followLoading, setFollowLoading] = useState(false);

    const fetchFarmerData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch Farmer Profile
            const { data: farmerData, error: farmerError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .eq('role', 'farmer')
                .single();

            if (farmerError) throw farmerError;
            setFarmer(farmerData);

            // Fetch Farmer's Products
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('*, farmer:profiles(full_name, is_verified)')
                .eq('farmer_id', id);

            if (productsError) throw productsError;
            setProducts(productsData);

            // Fetch Follower Count
            const { count, error: countError } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('farmer_id', id);
            
            if (countError) throw countError;
            setFollowerCount(count || 0);

            // Check if current user is following
            if (user) {
                const { data: followData, error: followCheckError } = await supabase
                    .from('follows')
                    .select('*')
                    .eq('farmer_id', id)
                    .eq('follower_id', user.id)
                    .maybeSingle();
                
                if (!followCheckError) {
                    setIsFollowing(!!followData);
                }
            }

        } catch (error) {
            console.error("Error fetching farmer data:", error);
            // Don't show error toast immediately to avoid spam if just navigating
        } finally {
            setLoading(false);
        }
    }, [id, user]);

    useEffect(() => {
        fetchFarmerData();
    }, [fetchFarmerData]);

    const handleFollowToggle = async () => {
        if (!user) {
            toast({ title: 'Please login', description: 'You need to be logged in to follow farmers.' });
            return;
        }
        if (user.id === id) {
            toast({ title: "You can't follow yourself!" });
            return;
        }

        setFollowLoading(true);
        try {
            if (isFollowing) {
                // Unfollow
                const { error } = await supabase
                    .from('follows')
                    .delete()
                    .eq('farmer_id', id)
                    .eq('follower_id', user.id);
                if (error) throw error;
                setIsFollowing(false);
                setFollowerCount(prev => Math.max(0, prev - 1));
                toast({ title: 'Unfollowed', description: `You are no longer following ${farmer.full_name}.` });
            } else {
                // Follow
                const { error } = await supabase
                    .from('follows')
                    .insert({ farmer_id: id, follower_id: user.id });
                if (error) throw error;
                setIsFollowing(true);
                setFollowerCount(prev => prev + 1);
                toast({ title: 'Followed!', description: `You are now following ${farmer.full_name}.` });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Action failed', description: error.message });
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!farmer) {
        return <div className="text-center py-20 text-xl">Farmer not found or verification pending.</div>;
    }
    
    const displayName = (farmer.full_name && farmer.full_name !== 'N/A') ? farmer.full_name : 'Golden Acres Farmer';

    return (
        <>
            <Helmet>
                <title>{`${displayName} - Farmer Profile`}</title>
            </Helmet>
            
            {/* Profile Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-8 md:py-12">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
                        <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                            <AvatarImage src={farmer.avatar_url} alt={displayName} />
                            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                {displayName.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center md:justify-start gap-2">
                                    {displayName}
                                    {farmer.is_verified && <VerifiedBadge className="h-6 w-6" />}
                                </h1>
                                <p className="text-lg text-muted-foreground mt-1">{farmer.farm_type || 'Mixed Farming'} • {farmer.farm_size || 'N/A'} Acres</p>
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {farmer.city_town || farmer.region || 'Location N/A'}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Joined {new Date(farmer.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="flex items-center justify-center md:justify-start gap-6 pt-2">
                                <div className="text-center md:text-left">
                                    <span className="block text-2xl font-bold text-gray-900">{followerCount}</span>
                                    <span className="text-sm text-muted-foreground">Followers</span>
                                </div>
                                <div className="text-center md:text-left">
                                    <span className="block text-2xl font-bold text-gray-900">{products.length}</span>
                                    <span className="text-sm text-muted-foreground">Products</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 md:mt-0">
                            <Button 
                                onClick={handleFollowToggle} 
                                disabled={followLoading}
                                variant={isFollowing ? "outline" : "default"}
                                className="min-w-[140px]"
                            >
                                {isFollowing ? (
                                    <>
                                        <UserCheck className="mr-2 h-4 w-4" /> Following
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="mr-2 h-4 w-4" /> Follow
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Section */}
            <div className="container mx-auto px-4 py-12">
                <h2 className="text-2xl font-bold mb-8">Products from {displayName}</h2>
                {products.length > 0 ? (
                    <ProductsList products={products} />
                ) : (
                    <p className="text-center text-muted-foreground py-12 bg-gray-50 rounded-lg">
                        This farmer hasn't listed any products yet.
                    </p>
                )}
            </div>
        </>
    );
};

export default FarmerProfilePage;
        
