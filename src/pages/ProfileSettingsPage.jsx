import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Save, Edit2, Phone, Cake, VenetianMask, MapPin, Truck, Navigation, Building, Mail, Shield, Warehouse, Sprout } from 'lucide-react';
import AvatarSelection from '@/components/settings/AvatarSelection';
import ProfileEditDialog from '@/components/settings/ProfileEditDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';

const ProfileItem = ({ icon, label, value, action }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between p-4 border-t first:border-t-0"
    >
        <div className="flex items-center gap-4">
            {React.cloneElement(icon, { className: "h-5 w-5 text-muted-foreground" })}
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium text-sm break-all">{value || 'Not set'}</p>
            </div>
        </div>
        {action && (
            <Button variant="ghost" size="icon" onClick={action} aria-label={`Edit ${label}`}>
                <Edit2 className="h-4 w-4 text-muted-foreground" />
            </Button>
        )}
    </motion.div>
);


const ProfileSettingsPage = () => {
    const { user, profile, fetchProfile } = useAuth();
    const { toast } = useToast();
    
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentField, setCurrentField] = useState(null);

    const [fullName, setFullName] = useState('');
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [nameLoading, setNameLoading] = useState(false);
    const [preferredHubName, setPreferredHubName] = useState('');

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            
            if (profile.preferred_delivery_method === 'Pickup' && profile.preferred_hub) {
                const fetchHubName = async () => {
                    const { data, error } = await supabase
                        .from('pickup_hubs')
                        .select('name')
                        .eq('id', profile.preferred_hub)
                        .single();
                    
                    if (data) {
                        setPreferredHubName(data.name);
                    } else if(error) {
                        console.error("Error fetching hub name:", error.message);
                        setPreferredHubName('Invalid Hub ID');
                    }
                };
                fetchHubName();
            } else {
                setPreferredHubName('');
            }
        }
    }, [profile]);
    
    const openEditModal = (field) => {
        setCurrentField(field);
        setIsEditModalOpen(true);
    };

    const handleAvatarSave = async (imageFile, presetUrl) => {
        if (!user) return;
        setAvatarLoading(true);
        let avatarUrl = profile?.avatar_url;

        try {
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, imageFile, {
                        cacheControl: '3600',
                        upsert: true,
                    });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
                avatarUrl = urlData.publicUrl;
            } else if (presetUrl && presetUrl !== profile.avatar_url) {
                avatarUrl = presetUrl;
            } else if (!presetUrl && !imageFile) {
                 setAvatarLoading(false);
                 return;
            }

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: avatarUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            await fetchProfile(user.id);
            toast({ title: 'Avatar updated successfully!' });
        } catch (error) {
            console.error("Avatar save error:", error);
            toast({ variant: 'destructive', title: 'Failed to update avatar', description: error.message });
        } finally {
            setAvatarLoading(false);
        }
    };
    
    const handleNameSave = async () => {
        if (!fullName || fullName === profile.full_name) return;
        setNameLoading(true);
        const { error } = await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', user.id);

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to update name', description: error.message });
        } else {
            await fetchProfile(user.id);
            toast({ title: 'Name updated successfully!' });
        }
        setNameLoading(false);
    };

    if (!profile) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const fields = {
        phone_number: { label: 'Mobile', name: 'phone_number', type: 'tel' },
        gender: { label: 'Gender', name: 'gender', type: 'select', options: [{value: 'male', label: 'Male'}, {value: 'female', label: 'Female'}] },
        date_of_birth: { label: 'Birthday', name: 'date_of_birth', type: 'date' },
        region: { label: 'Region', name: 'region', type: 'text' },
        city_town: { label: 'City/Town', name: 'city_town', type: 'text' },
        nearest_landmark: { label: 'Nearest Landmark', name: 'nearest_landmark', type: 'text' },
        delivery_address: { label: 'Delivery Address', name: 'delivery_address', type: 'text' },
        preferred_delivery_method: { label: 'Delivery Method', name: 'preferred_delivery_method', type: 'select', options: [{value: 'Delivery', label: 'Home Delivery'}, {value: 'Pickup', label: 'Pickup Hub'}] },
        preferred_hub: { label: 'Preferred Hub', name: 'preferred_hub', type: 'text' },
        // Farmer fields
        national_id: { label: 'National ID', name: 'national_id', type: 'text' },
        farm_type: { label: 'Farm Type', name: 'farm_type', type: 'text' },
        farm_size: { label: 'Farm Size (Acres)', name: 'farm_size', type: 'text' },
        farm_address: { label: 'Farm Address', name: 'farm_address', type: 'text' },
        gps_location: { label: 'GPS Location', name: 'gps_location', type: 'text' },
        main_products: { label: 'Main Products', name: 'main_products', type: 'text' },
    };

    const isNameChanged = fullName !== (profile.full_name || '');

    return (
        <AnimatePresence>
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-8 pb-12"
        >
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                <p className="text-muted-foreground">Manage your personal information and account settings.</p>
            </div>

            <Card className="overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 bg-muted/20 p-6">
                    <div className="relative">
                        <Avatar className="h-20 w-20 border-2 border-background shadow-sm cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
                            <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                            <AvatarFallback className="text-2xl">{profile.full_name?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <Button size="icon" variant="outline" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full" onClick={() => setIsAvatarModalOpen(true)}>
                            {avatarLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit2 className="h-4 w-4" />}
                        </Button>
                    </div>
                    <div className="flex-grow w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                            <div className="flex-grow max-w-md">
                                <label htmlFor="fullName" className="text-xs text-muted-foreground block mb-1">Full Name (Editable)</label>
                                <div className="flex gap-2">
                                    <Input 
                                        id="fullName" 
                                        value={fullName} 
                                        onChange={e => setFullName(e.target.value)}
                                        className="text-xl font-semibold h-10 border-2 border-transparent hover:border-gray-200 focus:border-primary transition-all px-2 bg-transparent"
                                    />
                                    {isNameChanged && (
                                        <Button size="icon" onClick={handleNameSave} disabled={nameLoading}>
                                            {nameLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><Mail className="h-3 w-3"/> {user.email}</p>
                        {profile.country && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3"/> {profile.country}</p>}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Personal Details</div>
                    <ProfileItem icon={<Phone />} label="Mobile" value={profile.phone_number} action={() => openEditModal(fields.phone_number)} />
                    <ProfileItem icon={<VenetianMask />} label="Gender" value={profile.gender} action={() => openEditModal(fields.gender)} />
                    <ProfileItem icon={<Cake />} label="Birthday" value={profile.date_of_birth} action={() => openEditModal(fields.date_of_birth)} />
                    
                    <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t">Location</div>
                    <ProfileItem icon={<MapPin />} label="Region" value={profile.region} action={() => openEditModal(fields.region)} />
                    <ProfileItem icon={<Building />} label="City/Town" value={profile.city_town} action={() => openEditModal(fields.city_town)} />
                    <ProfileItem icon={<Navigation />} label="Nearest Landmark" value={profile.nearest_landmark} action={() => openEditModal(fields.nearest_landmark)} />

                    <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t">Delivery Preferences</div>
                    <ProfileItem icon={<Truck />} label="Delivery Method" value={profile.preferred_delivery_method} action={() => openEditModal(fields.preferred_delivery_method)} />
                    {profile.preferred_delivery_method === 'Delivery' &&
                        <ProfileItem icon={<MapPin />} label="Delivery Address" value={profile.delivery_address} action={() => openEditModal(fields.delivery_address)} />
                    }
                    {profile.preferred_delivery_method === 'Pickup' && preferredHubName && (
                        <ProfileItem icon={<Building />} label="Preferred Hub" value={preferredHubName} action={() => openEditModal(fields.preferred_hub)} />
                    )}

                    {profile.role === 'farmer' && (
                        <>
                            <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t">Farmer Information</div>
                            <ProfileItem icon={<Shield />} label="National ID" value={profile.national_id} action={() => openEditModal(fields.national_id)} />
                            <ProfileItem icon={<Sprout />} label="Farm Type" value={profile.farm_type} action={() => openEditModal(fields.farm_type)} />
                            <ProfileItem icon={<Warehouse />} label="Farm Size" value={`${profile.farm_size} Acres`} action={() => openEditModal(fields.farm_size)} />
                            <ProfileItem icon={<MapPin />} label="Farm Address" value={profile.farm_address} action={() => openEditModal(fields.farm_address)} />
                            <ProfileItem icon={<Navigation />} label="GPS Location" value={profile.gps_location} action={() => openEditModal(fields.gps_location)} />
                            <ProfileItem icon={<Sprout />} label="Main Products" value={profile.main_products} action={() => openEditModal(fields.main_products)} />
                        </>
                    )}
                </CardContent>
            </Card>

            <AvatarSelection
                isOpen={isAvatarModalOpen}
                onOpenChange={setIsAvatarModalOpen}
                onSave={handleAvatarSave}
                currentAvatar={profile.avatar_url}
            />
            {currentField && (
              <ProfileEditDialog
                  isOpen={isEditModalOpen}
                  onOpenChange={setIsEditModalOpen}
                  field={currentField}
                  currentValue={profile[currentField.name]}
              />
            )}
        </motion.div>
        </AnimatePresence>
    );
};

export default ProfileSettingsPage;