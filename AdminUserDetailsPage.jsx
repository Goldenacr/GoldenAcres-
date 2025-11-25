
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, User, Truck, Tractor, Ruler, Hash, Briefcase, BadgeCheck, Map as MapIcon, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

// Improved formatter to handle "null" strings, actual nulls, and undefined gracefully
const formatValue = (val, suffix = '') => {
    if (val === null || val === undefined || val === 'null' || val === '' || (typeof val === 'string' && val.trim() === '')) {
        return 'N/A';
    }
    return `${val} ${suffix}`;
};

const DetailRow = ({ icon: Icon, label, value, suffix = '' }) => (
    <div className="flex items-start py-3 group hover:bg-gray-50 rounded-md px-2 transition-colors">
        <div className="flex-shrink-0 mt-0.5">
            {Icon && <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />}
        </div>
        <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-base font-medium text-gray-900 mt-1">{formatValue(value, suffix)}</p>
        </div>
    </div>
);

const SectionHeader = ({ title }) => (
    <div className="pb-2 mb-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
);

const AdminUserDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserDetails = async () => {
            if (!id) return;
            
            setLoading(true);
            try {
                console.log('Fetching details for user:', id);
                const { data, error } = await supabase.rpc('get_user_full_details', { target_user_id: id });

                if (error) {
                    console.error('RPC Error:', error);
                    throw error;
                }
                
                // Sanity check to ensure we have a user object even if empty
                if (!data) {
                    console.warn('No data returned for user:', id);
                    throw new Error("User details not found.");
                }
                
                console.log('Received user data:', data);
                setUser(data);
            } catch (error) {
                console.error("Error details:", error);
                toast({
                    variant: 'destructive',
                    title: 'Error fetching user details',
                    description: error.message || "Failed to load user information.",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchUserDetails();
    }, [id, toast]);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-96 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading user details...</p>
            </div>
        );
    }
    
    if (!user || Object.keys(user).length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-12 w-12 text-gray-400" />
                </div>
                <p className="text-xl font-medium text-gray-900">User not found</p>
                <p className="text-gray-500 max-w-md text-center">The user you are looking for does not exist or has been deleted.</p>
                <Button variant="outline" onClick={() => navigate('/admin-dashboard/users')}>Back to Users</Button>
            </div>
        );
    }

    const isFarmer = user.role === 'farmer';
    const userInitials = user.full_name && user.full_name !== 'null' 
        ? user.full_name.charAt(0).toUpperCase() 
        : (user.email ? user.email.charAt(0).toUpperCase() : 'U');

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin-dashboard/users')} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Users
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Profile Card */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="lg:col-span-1 space-y-6"
                >
                    <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col items-center text-center">
                        <Avatar className="h-32 w-32 mb-4 border-4 border-gray-100 shadow-inner">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">{formatValue(user.full_name)}</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            ID: {user.id ? user.id.substring(0, 8) : 'N/A'}...
                        </p>
                        
                        <Badge variant={isFarmer ? 'default' : 'secondary'} className={`mb-4 px-4 py-1 ${isFarmer ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                            {user.role ? user.role.toUpperCase() : 'USER'}
                        </Badge>

                        <div className="w-full pt-4 border-t space-y-3 text-left">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Joined:</span>
                                <span className="font-medium">
                                    {user.user_created_at ? new Date(user.user_created_at).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Status:</span>
                                <span className="font-medium text-green-600 flex items-center">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span> Active
                                </span>
                            </div>
                            {isFarmer && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Verified:</span>
                                    <Badge variant="outline" className={`font-medium ${user.is_verified ? 'text-green-600 border-green-200 bg-green-50' : 'text-yellow-600 border-yellow-200 bg-yellow-50'}`}>
                                        {user.is_verified ? 'Verified' : 'Pending'}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Right Column: Details */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="lg:col-span-2 space-y-6"
                >
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <SectionHeader title="Registration Information" />
                        
                        <div className="mb-8">
                            <h4 className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider flex items-center gap-2">
                                <User className="h-4 w-4" /> Personal & Contact
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                                <DetailRow icon={User} label="Full Name" value={user.full_name} />
                                <DetailRow icon={Mail} label="Email Address" value={user.email} />
                                <DetailRow icon={Phone} label="Phone Number" value={user.phone_number} />
                                <DetailRow icon={MapIcon} label="Country" value={user.country} />
                                <DetailRow icon={User} label="Gender" value={user.gender} />
                                <DetailRow icon={Calendar} label="Date of Birth" value={user.date_of_birth} />
                            </div>
                        </div>

                        <Separator className="my-6" />

                        <div className="mb-8">
                            <h4 className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider flex items-center gap-2">
                                <MapPin className="h-4 w-4" /> Location & Delivery
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                                <DetailRow icon={MapPin} label="Region" value={user.region} />
                                <DetailRow icon={MapPin} label="City/Town" value={user.city_town} />
                                <DetailRow icon={MapPin} label="Nearest Landmark" value={user.nearest_landmark} />
                                <DetailRow icon={MapPin} label="Delivery Address" value={user.delivery_address} />
                                <DetailRow 
                                    icon={Truck} 
                                    label="Preferred Delivery Method" 
                                    value={user.preferred_delivery_method === 'hub' 
                                        ? `Hub Pickup (${formatValue(user.preferred_hub)})` 
                                        : (user.preferred_delivery_method === 'home' ? 'Home Delivery' : formatValue(user.preferred_delivery_method))} 
                                />
                            </div>
                        </div>

                        {isFarmer && (
                            <>
                                <Separator className="my-6" />
                                <div>
                                    <h4 className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider flex items-center gap-2">
                                        <Tractor className="h-4 w-4" /> Farmer Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                                        <DetailRow icon={Hash} label="National ID" value={user.national_id} />
                                        <DetailRow icon={MapPin} label="Farm Location (GPS)" value={user.gps_location} />
                                        <DetailRow icon={MapPin} label="Farm Address" value={user.farm_address} />
                                        <DetailRow icon={Tractor} label="Farm Type" value={user.farm_type} />
                                        <DetailRow icon={Ruler} label="Farm Size" value={user.farm_size} suffix="Acres" />
                                        <DetailRow icon={Briefcase} label="Main Products" value={user.main_products} />
                                        <DetailRow icon={Clock} label="Experience" value={user.farming_experience} suffix="Years" />
                                        <DetailRow 
                                            icon={BadgeCheck} 
                                            label="Business Reg. Status" 
                                            value={user.business_registration_status === 'registered' ? 'Registered' : formatValue(user.business_registration_status)} 
                                        />
                                        <DetailRow icon={BadgeCheck} label="FDA Certification" value={user.fda_certification_status} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminUserDetailsPage;
