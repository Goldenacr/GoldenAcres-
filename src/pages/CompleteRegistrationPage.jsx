
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Truck, Warehouse, Info, ChevronDown, CheckCircle, Sprout, UserCheck, UserPlus, MapPin, ShieldCheck, Home } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import countryData from '@/lib/countryData.json';

const regions = countryData.regions || [];

const baseSchema = z.object({
  role: z.enum(['customer', 'farmer']),
  phone_number: z.string().min(9, { message: "Valid phone number is required" }),
  gender: z.string().min(1, { message: "Please select a gender" }),
  date_of_birth: z.string().refine(val => new Date(val).toString() !== 'Invalid Date', { message: 'Please enter a valid date' }),
  country: z.string().min(1, { message: "Country is required" }),
  region: z.string().min(1, { message: "Please select a region" }),
  city_town: z.string().min(2, { message: "City or town is required" }),
  nearest_landmark: z.string().min(3, { message: "Nearest landmark is required" }),
});

const customerSchema = z.object({
  delivery_address: z.string().min(5, { message: "Delivery address is required" }),
  preferred_delivery_method: z.string().min(1, "Please select a delivery method"),
  preferred_hub: z.string().optional(),
});

const farmerSchema = z.object({
  national_id: z.string().min(5, { message: "National ID is required" }),
  farm_type: z.string().min(3, { message: "Farm type is required" }),
  farm_size: z.string().min(1, { message: "Farm size is required" }),
  farm_address: z.string().min(5, { message: "Farm address is required" }),
  main_products: z.string().min(3, { message: "Main products are required" }),
  gps_location: z.string().optional(),
  farming_experience: z.string().optional(),
});

const formSchema = z.discriminatedUnion("role", [
  baseSchema.merge(customerSchema).extend({ role: z.literal("customer") }),
  baseSchema.merge(farmerSchema).extend({ role: z.literal("farmer") })
]).refine(data => {
    if (data.role === 'customer' && data.preferred_delivery_method === 'Pickup' && !data.preferred_hub) {
        return false;
    }
    return true;
}, {
    message: "Please select a pickup hub",
    path: ["preferred_hub"],
});

const FloatingLabelInput = ({ name, label, type, register, errors, ...props }) => {
    const { watch } = useForm();
    const value = watch(name);
    return (
        <div className="relative floating-input">
            <Input
                id={name}
                type={type}
                {...register(name)}
                className={`h-12 ${value ? 'has-value' : ''}`}
                {...props}
            />
            <Label htmlFor={name}>{label}</Label>
            {errors[name] && <p className="text-red-500 text-xs mt-1 absolute">{errors[name].message}</p>}
        </div>
    );
};

const RegionSelector = ({ value, onSelect, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={`w-full justify-between h-12 text-base font-normal ${error ? 'border-red-500' : ''} ${value ? 'text-foreground' : 'text-muted-foreground'}`}>
          {value || "Select a Region"} <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>Select Region</DialogTitle></DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {regions.map((region) => (
            <div key={region} onClick={() => { onSelect(region); setIsOpen(false); }} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md cursor-pointer">
              <span>{region}</span>
              {value === region && <CheckCircle className="h-5 w-5 text-primary" />}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function CompleteRegistrationPage() {
    const { user, profile, fetchProfile } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [detectingLocation, setDetectingLocation] = useState(true);

    const methods = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: { 
            role: 'customer', 
            phone_number: '', 
            gender: '', 
            date_of_birth: '', 
            country: '', 
            region: '', 
            city_town: '', 
            nearest_landmark: '', 
            delivery_address: '', 
            preferred_delivery_method: '', 
            preferred_hub: '', 
            national_id: '', 
            farm_type: '', 
            farm_size: '', 
            farm_address: '', 
            main_products: '', 
            gps_location: '', 
            farming_experience: '' 
        }
    });

    const { register, handleSubmit, watch, setValue, formState: { errors } } = methods;
    const role = watch('role');
    const selectedRegion = watch('region');
    const deliveryMethod = watch('preferred_delivery_method');
    const selectedHubId = watch('preferred_hub');
    const [hubs, setHubs] = useState([]);
    const [loadingHubs, setLoadingHubs] = useState(false);

    // Initial load: populate country or auto-detect if not present
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchLocation = async () => {
            try {
                const response = await fetch('https://ipwho.is/');
                const data = await response.json();
                if (data.success) {
                    setValue('country', data.country, { shouldValidate: true });
                } else {
                    setValue('country', 'Ghana');
                }
            } catch (error) {
                setValue('country', 'Ghana');
            } finally {
                setDetectingLocation(false);
            }
        };

        if (profile) {
            // Pre-fill fields if they happen to exist partially
             if (profile.role) setValue('role', profile.role);
             if (profile.country) {
                 setValue('country', profile.country);
                 setDetectingLocation(false);
             } else {
                 fetchLocation();
             }
        } else {
            fetchLocation();
        }
    }, [user, profile, navigate, setValue]);

    useEffect(() => {
        if (role === 'customer' && deliveryMethod === 'Pickup' && selectedRegion) {
            setLoadingHubs(true);
            supabase.from('pickup_hubs').select('id, name, area, address').eq('region', selectedRegion)
                .then(({ data, error }) => {
                    if (error) { toast({ variant: 'destructive', title: "Error fetching hubs", description: error.message }); setHubs([]); } 
                    else { setHubs(data); }
                    setLoadingHubs(false);
                });
        } else { setHubs([]); }
    }, [role, selectedRegion, deliveryMethod, toast]);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            // Calculate age roughly
            const birthDate = new Date(data.date_of_birth);
            const ageDifMs = Date.now() - birthDate.getTime();
            const ageDate = new Date(ageDifMs);
            const age = Math.abs(ageDate.getUTCFullYear() - 1970);
            
            const updates = {
                ...data,
                age: age,
                // Ensure profile is marked as valid/complete conceptually if we had such a flag, 
                // but checking for phone_number presence is our flag.
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;
            
            await fetchProfile(user.id); // Refresh local profile state
            toast({ title: "Profile updated!", description: "Welcome to Agribridge." });
            navigate('/');
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const renderCustomerFields = () => (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
                 <Card>
                    <CardHeader><CardTitle className="flex items-center text-xl"><Home className="mr-3 text-primary" /> Delivery Information</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <FloatingLabelInput name="delivery_address" label="Delivery Address" register={register} errors={errors} />
                        <div>
                            <Label className="font-semibold text-sm text-foreground relative">Preferred Delivery Method</Label>
                             <div className="grid grid-cols-2 gap-3 pt-2">
                                <button type="button" onClick={() => setValue('preferred_delivery_method', 'Delivery', { shouldValidate: true })} className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all ${deliveryMethod === 'Delivery' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                                    <Truck className="w-8 h-8 mb-2 text-primary"/>
                                    <span className="font-medium text-sm">Home Delivery</span>
                                </button>
                                <button type="button" onClick={() => setValue('preferred_delivery_method', 'Pickup', { shouldValidate: true })} className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all ${deliveryMethod === 'Pickup' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                                    <Warehouse className="w-8 h-8 mb-2 text-primary"/>
                                    <span className="font-medium text-sm">Pickup Hub</span>
                                </button>
                            </div>
                            {errors.preferred_delivery_method && <p className="text-red-500 text-xs mt-1">{errors.preferred_delivery_method.message}</p>}
                        </div>

                        <AnimatePresence mode="wait">
                            {deliveryMethod === 'Delivery' && <motion.div key="delivery-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 bg-blue-50 text-blue-800 border-l-4 border-blue-400 rounded-r-lg flex items-start gap-3 text-sm"><Info className="w-5 h-5 flex-shrink-0 mt-0.5"/><span>Home delivery may incur additional charges.</span></motion.div>}
                            {deliveryMethod === 'Pickup' && (
                                <motion.div key="pickup-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                                    {loadingHubs && <div className="flex items-center justify-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin"/><span>Loading hubs...</span></div>}
                                    {!loadingHubs && hubs.length > 0 && (
                                        <div className="space-y-2">
                                            <Label className="font-semibold text-sm text-foreground relative">Select a Pickup Hub</Label>
                                            <div className="grid gap-2 max-h-48 overflow-y-auto pr-2 pt-2">
                                                {hubs.map(hub => <button key={hub.id} type="button" onClick={() => setValue('preferred_hub', hub.id, { shouldValidate: true })} className={`text-left p-3 border-2 rounded-lg transition-all ${selectedHubId === hub.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}><p className="font-medium">{hub.name}</p><p className="text-sm text-muted-foreground">{hub.area} - {hub.address}</p></button>)}
                                            </div>
                                            {errors.preferred_hub && <p className="text-red-500 text-xs mt-1">{errors.preferred_hub.message}</p>}
                                        </div>
                                    )}
                                    {!loadingHubs && hubs.length === 0 && <div className="p-3 bg-yellow-50 text-yellow-800 border-l-4 border-yellow-400 rounded-r-lg flex items-start gap-3 text-sm"><MapPin className="w-5 h-5 flex-shrink-0 mt-0.5"/><span>No pickup hubs in {selectedRegion}. Please select Home Delivery.</span></div>}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );

    const renderFarmerFields = () => (
       <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
                <Card>
                    <CardHeader><CardTitle className="flex items-center text-xl"><Sprout className="mr-3 text-primary" /> Farm Information</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <FloatingLabelInput name="national_id" label="National ID" register={register} errors={errors} />
                        <FloatingLabelInput name="farm_type" label="Type of Farm (e.g., Poultry, Vegetable)" register={register} errors={errors} />
                        <FloatingLabelInput name="farm_size" label="Farm Size (in Acres)" register={register} errors={errors} />
                        <FloatingLabelInput name="farm_address" label="Farm Address" register={register} errors={errors} />
                        <FloatingLabelInput name="main_products" label="Main Products (e.g., Maize, Chicken)" register={register} errors={errors} />
                    </CardContent>
                </Card>
            </motion.div>
       </AnimatePresence>
    );

    return (
        <>
            <Helmet>
                <title>Complete Registration - Agribridge</title>
                <meta name="description" content="Complete your profile to start using Agribridge." />
            </Helmet>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                    <div className="text-center mb-8">
                         <h1 className="text-4xl font-bold tracking-tight">Complete Your Profile</h1>
                         <p className="text-muted-foreground mt-2">We just need a few more details to finish setting up your account.</p>
                    </div>

                    <FormProvider {...methods}>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                            <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-xl relative overflow-hidden max-w-sm mx-auto">
                                <motion.div className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-background rounded-lg shadow-md" initial={false} animate={{ x: role === 'customer' ? '4px' : 'calc(100% + 4px)'}} transition={{ type: "spring", stiffness: 300, damping: 30 }}/>
                                <Button type="button" onClick={() => setValue('role', 'customer')} variant="ghost" className={`relative z-10 w-full transition-colors ${role === 'customer' ? 'text-primary' : 'text-muted-foreground'}`} noHover>
                                  <UserCheck className="mr-2 h-4 w-4" /> Customer
                                </Button>
                                <Button type="button" onClick={() => setValue('role', 'farmer')} variant="ghost" className={`relative z-10 w-full transition-colors ${role === 'farmer' ? 'text-primary' : 'text-muted-foreground'}`} noHover>
                                  <Sprout className="mr-2 h-4 w-4" /> Farmer
                                </Button>
                            </div>
                            
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center text-xl"><UserPlus className="mr-3 text-primary" /> Personal Information</CardTitle>
                                    <CardDescription>Tell us a bit about yourself.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <FloatingLabelInput name="phone_number" label="Phone Number" type="tel" register={register} errors={errors} />
                                    </div>
                                    <div className="relative floating-input">
                                        <Input id="date_of_birth" type="date" {...register("date_of_birth")} className="h-12 has-value" />
                                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                                        {errors.date_of_birth && <p className="text-red-500 text-xs mt-1 absolute">{errors.date_of_birth.message}</p>}
                                    </div>
                                    <div>
                                        <Select onValueChange={(value) => setValue('gender', value, { shouldValidate: true })}>
                                            <SelectTrigger className="h-12 text-base font-normal">
                                                <SelectValue placeholder="Select Gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle className="flex items-center text-xl"><MapPin className="mr-3 text-primary" /> Location Information</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 relative">
                                        <FloatingLabelInput name="country" label="Country" register={register} errors={errors} />
                                        {detectingLocation && <Loader2 className="absolute right-3 top-3.5 h-5 w-5 animate-spin text-muted-foreground" />}
                                    </div>
                                    <div className="md:col-span-2">
                                      <RegionSelector value={selectedRegion} onSelect={(region) => setValue('region', region, { shouldValidate: true })} error={errors.region} />
                                      {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region.message}</p>}
                                    </div>
                                    <FloatingLabelInput name="city_town" label="City / Town" register={register} errors={errors} />
                                    <FloatingLabelInput name="nearest_landmark" label="Nearest Landmark" register={register} errors={errors} />
                                </CardContent>
                            </Card>

                            {role === 'customer' ? renderCustomerFields() : renderFarmerFields()}

                            <Button type="submit" size="lg" className="w-full text-lg" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Finish Registration'}
                            </Button>
                        </form>
                    </FormProvider>
                </div>
            </div>
        </>
    );
}
