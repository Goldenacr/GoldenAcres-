import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Lock, Mail, Phone, MapPin, Truck, Warehouse, Info, ChevronDown, CheckCircle, Sprout, Building, UserCheck, UserPlus, BadgeInfo as InfoIcon, ShieldCheck, Home, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import countryData from '@/lib/countryData.json';

const regions = countryData.regions || [];

const baseSchema = z.object({
  role: z.enum(['customer', 'farmer']),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
  full_name: z.string().min(3, { message: "Full name is required" }),
  phone_number: z.string().min(9, { message: "Valid phone number is required" }),
  gender: z.string().min(1, { message: "Please select a gender" }),
  date_of_birth: z.string().refine(val => new Date(val).toString() !== 'Invalid Date', { message: 'Please enter a valid date' }),
  region: z.string().min(1, { message: "Please select a region" }),
  city_town: z.string().min(2, { message: "City or town is required" }),
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
});

const formSchema = z.discriminatedUnion("role", [
  baseSchema.merge(customerSchema).extend({ role: z.literal("customer") }),
  baseSchema.merge(farmerSchema).extend({ role: z.literal("farmer") })
]).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine(data => {
    if (data.role === 'customer' && data.preferred_delivery_method === 'Pickup' && !data.preferred_hub) {
        return false;
    }
    return true;
}, {
    message: "Please select a pickup hub",
    path: ["preferred_hub"],
});

const FloatingLabelInput = ({ name, label, type, register, errors, showPassword, onTogglePassword, ...props }) => {
    const { watch } = useForm();
    const value = watch(name);
    return (
        <div className="relative floating-input">
            <Input
                id={name}
                type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
                {...register(name)}
                className={`h-12 ${value ? 'has-value' : ''} ${type === 'password' ? 'pr-10' : ''}`}
                {...props}
            />
            <Label htmlFor={name}>{label}</Label>
            {type === 'password' && (
                <button
                    type="button"
                    onClick={onTogglePassword}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground z-10"
                >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
            )}
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


export default function RegisterPage() {
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const methods = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: { role: 'customer', email: '', password: '', confirmPassword: '', full_name: '', phone_number: '', gender: '', date_of_birth: '', region: '', city_town: '', delivery_address: '', preferred_delivery_method: '', preferred_hub: '', national_id: '', farm_type: '', farm_size: '', farm_address: '', main_products: '' }
    });

    const { register, handleSubmit, watch, setValue, formState: { errors } } = methods;
    const role = watch('role');
    const selectedRegion = watch('region');
    const deliveryMethod = watch('preferred_delivery_method');
    const selectedHubId = watch('preferred_hub');
    const [hubs, setHubs] = useState([]);
    const [loadingHubs, setLoadingHubs] = useState(false);
    
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
            const { email, password, ...metaData } = data;
            const { error } = await signUp(email, password, metaData);
            if (error) throw error;
            toast({ title: "Registration successful!", description: "Please check your email to verify your account." });
            navigate('/login');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Registration Failed', description: error.message });
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
                            {deliveryMethod === 'Delivery' && <motion.div key="delivery-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 bg-blue-50 text-blue-800 border-l-4 border-blue-400 rounded-r-lg flex items-start gap-3 text-sm"><InfoIcon className="w-5 h-5 flex-shrink-0 mt-0.5"/><span>Home delivery may incur additional charges.</span></motion.div>}
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
                <title>Register - Golden Acres</title>
                <meta name="description" content="Create an account to start shopping for fresh farm produce." />
            </Helmet>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-block mb-4">
                          <img src="https://horizons-cdn.hostinger.com/1ff2a2eb-9cef-439f-b1c4-73368cb28fdf/dee3e90e0fad3a78c5aad3fa165b27b3.jpg" alt="Golden Acres Logo" className="h-24 w-24 rounded-full mx-auto shadow-md" />
                        </Link>
                         <h1 className="text-4xl font-bold tracking-tight">Create an Account</h1>
                         <p className="text-muted-foreground mt-2">Join our community of fresh produce lovers.</p>
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
                                <CardHeader><CardTitle className="flex items-center text-xl"><ShieldCheck className="mr-3 text-primary" /> Account Details</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                      <FloatingLabelInput name="email" label="Email Address" type="email" register={register} errors={errors} />
                                      <FloatingLabelInput name="password" label="Password" type="password" register={register} errors={errors} showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} />
                                      <FloatingLabelInput name="confirmPassword" label="Confirm Password" type="password" register={register} errors={errors} showPassword={showConfirmPassword} onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)} />
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardHeader><CardTitle className="flex items-center text-xl"><UserPlus className="mr-3 text-primary" /> Personal Information</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FloatingLabelInput name="full_name" label="Full Name" register={register} errors={errors} />
                                    <FloatingLabelInput name="phone_number" label="Phone Number" type="tel" register={register} errors={errors} />
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
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle className="flex items-center text-xl"><MapPin className="mr-3 text-primary" /> Location Information</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                      <RegionSelector value={selectedRegion} onSelect={(region) => setValue('region', region, { shouldValidate: true })} error={errors.region} />
                                      {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region.message}</p>}
                                    </div>
                                    <FloatingLabelInput name="city_town" label="City / Town" register={register} errors={errors} />
                                </CardContent>
                            </Card>

                            {role === 'customer' ? renderCustomerFields() : renderFarmerFields()}

                            <Button type="submit" size="lg" className="w-full text-lg" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Create Account'}
                            </Button>
                        </form>
                    </FormProvider>
                    <p className="text-center text-sm text-gray-600 mt-8">
                        Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link>
                    </p>
                </div>
            </div>
        </>
    );
}