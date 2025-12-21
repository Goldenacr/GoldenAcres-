
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
import { Loader2, Truck, Warehouse, Info, ChevronDown, CheckCircle, Sprout, UserCheck, UserPlus, ShieldCheck, Home, Eye, EyeOff, MapPin, FileText, Globe } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import countryData from '@/lib/countryData.json';

// Schemas
const baseSchema = z.object({
  role: z.enum(['customer', 'farmer']),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
  full_name: z.string().min(3, { message: "Full name is required" }),
  phone_number: z.string().min(1, { message: "Phone number is required" }),
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
  document_type: z.string().min(1, { message: "Document type is required" }),
  national_id: z.string().min(5, { message: "ID Number is required" }),
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
}).superRefine((data, ctx) => {
    const countryInfo = countryData.countries.find(c => c.name === data.country);
    
    // Phone validation
    if (countryInfo) {
        // Strip non-digits to check length
        const phone = data.phone_number.replace(/\D/g, '');
        if (phone.length !== countryInfo.phone_length) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Phone number for ${data.country} must be ${countryInfo.phone_length} digits`,
                path: ['phone_number']
            });
        }
    }
    
    // ID Validation based on country + doc type
    if (data.role === 'farmer' && countryInfo && countryInfo.documents && data.document_type) {
        const docRules = countryInfo.documents[data.document_type];
        if (docRules && docRules.regex) {
            const regex = new RegExp(docRules.regex);
            if (!regex.test(data.national_id)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Invalid format. Expected: ${docRules.placeholder}`,
                    path: ['national_id']
                });
            }
        }
    }
});

const FloatingLabelInput = ({ name, label, type, register, errors, showPassword, onTogglePassword, onChange, prefix, ...props }) => {
    const { watch } = useForm();
    const value = watch(name);
    return (
        <div className="relative floating-input">
             {prefix && (
                <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center px-3 border border-r-0 border-input bg-muted/20 text-muted-foreground z-10 rounded-l-md min-w-[3.5rem] font-medium text-sm">
                    {prefix}
                </div>
            )}
            <Input
                id={name}
                type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
                {...register(name, { onChange })}
                className={`h-12 ${value ? 'has-value' : ''} ${type === 'password' ? 'pr-10' : ''} ${prefix ? 'pl-[4.5rem] rounded-l-none' : ''}`}
                {...props}
            />
            <Label htmlFor={name} className={prefix ? 'left-[4.5rem]' : ''}>{label}</Label>
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

const RegionSelector = ({ value, onSelect, error, regions }) => {
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
          {regions && regions.length > 0 ? (
              regions.map((region) => (
                <div key={region} onClick={() => { onSelect(region); setIsOpen(false); }} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md cursor-pointer">
                  <span>{region}</span>
                  {value === region && <CheckCircle className="h-5 w-5 text-primary" />}
                </div>
              ))
          ) : (
              <div className="p-4 text-center text-muted-foreground">No regions available for this country.</div>
          )}
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
    const [allowedFarmerCountries, setAllowedFarmerCountries] = useState([]);
    
    const methods = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: { role: 'customer', email: '', password: '', confirmPassword: '', full_name: '', phone_number: '', gender: '', date_of_birth: '', country: '', region: '', city_town: '', nearest_landmark: '', delivery_address: '', preferred_delivery_method: '', preferred_hub: '', national_id: '', document_type: 'ID Card', farm_type: '', farm_size: '', farm_address: '', main_products: '', gps_location: '', farming_experience: '' }
    });

    const { register, handleSubmit, watch, setValue, formState: { errors } } = methods;
    const role = watch('role');
    const selectedCountry = watch('country');
    const selectedRegion = watch('region');
    const deliveryMethod = watch('preferred_delivery_method');
    const selectedHubId = watch('preferred_hub');
    const selectedDocType = watch('document_type');
    const [hubs, setHubs] = useState([]);
    const [loadingHubs, setLoadingHubs] = useState(false);

    useEffect(() => {
        const fetchAllowed = async () => {
            const { data } = await supabase.from('allowed_farmer_countries').select('country_name');
            if(data) setAllowedFarmerCountries(data.map(c => c.country_name));
        };
        fetchAllowed();
    }, []);

    useEffect(() => {
        if (role === 'farmer' && selectedCountry && allowedFarmerCountries.length > 0) {
            if (!allowedFarmerCountries.includes(selectedCountry)) {
                toast({ variant: "destructive", title: "Registration Restricted", description: `Farmer registration is currently not available in ${selectedCountry}.` });
                setValue('role', 'customer');
            }
        }
    }, [role, selectedCountry, allowedFarmerCountries, setValue, toast]);

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

    // Handle ID Input Masking based on country/doc
    const handleIdInput = (e) => {
        const currentCountry = countryData.countries.find(c => c.name === selectedCountry);
        
        // Strict masking only for Ghana ID Card as previously requested
        if (selectedCountry === 'Ghana' && selectedDocType === 'ID Card') {
            let value = e.target.value.toUpperCase();
            let clean = value.replace(/[^A-Z0-9]/g, '');
            if (clean.length >= 3 && !clean.startsWith('GHA')) {
                if (!value.startsWith('G')) clean = 'GHA' + clean;
            } else if (clean.length < 3 && 'GHA'.startsWith(clean)) {
                 // let type
            } else if (clean.length < 3) {
                 clean = 'GHA' + clean;
            }

            if (clean.startsWith('GHA')) {
                let formatted = 'GHA';
                let remaining = clean.substring(3);
                if (remaining.length > 0) {
                    formatted += '-';
                    let digits = remaining.substring(0, 9);
                    formatted += digits;
                    if (remaining.length > 9) {
                       formatted += '-';
                       let lastDigit = remaining.substring(9, 10);
                       formatted += lastDigit;
                    }
                }
                value = formatted;
            }
            e.target.value = value;
            setValue('national_id', value, { shouldValidate: true });
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            // Append country code to phone number before submitting
            const countryInfo = countryData.countries.find(c => c.name === data.country);
            let finalPhone = data.phone_number;
            
            if (countryInfo) {
                // Ensure we don't double add the code if user typed it
                if (!finalPhone.startsWith(countryInfo.dial_code)) {
                     finalPhone = `${countryInfo.dial_code} ${finalPhone}`;
                }
            }

            const { email, password, ...metaData } = data;
            // Update metadata with formatted phone
            const finalMetaData = { ...metaData, phone_number: finalPhone };

            const { error } = await signUp(email, password, { data: finalMetaData });
            if (error) throw error;
            toast({ title: "Registration successful!", description: "Welcome to Agribridge! You can now log in." });
            navigate('/login');
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Registration Failed', description: error.message });
        } finally { setLoading(false); }
    };

    // Derived values for farmer fields
    const currentCountryInfo = countryData.countries.find(c => c.name === selectedCountry);
    const availableRegions = currentCountryInfo ? currentCountryInfo.regions : [];
    
    const docRules = currentCountryInfo?.documents?.[selectedDocType];
    const idLabel = docRules?.label || "ID Number";
    const idPlaceholder = docRules?.placeholder || "Enter ID Number";

    return (
        <>
            <Helmet>
                <title>Register - Agribridge</title>
                <meta name="description" content="Create an account to start shopping for fresh farm produce." />
            </Helmet>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-block mb-4">
                          <img src="https://horizons-cdn.hostinger.com/1ff2a2eb-9cef-439f-b1c4-73368cb28fdf/dee3e90e0fad3a78c5aad3fa165b27b3.jpg" alt="Agribridge Logo" className="h-24 w-24 rounded-full mx-auto shadow-md" />
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
                                      <FloatingLabelInput name="email" label="Email Address" type="email" register={register} errors={errors} placeholder="name@example.com" />
                                      <FloatingLabelInput name="password" label="Password" type="password" register={register} errors={errors} showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} placeholder="Create a password" />
                                      <FloatingLabelInput name="confirmPassword" label="Confirm Password" type="password" register={register} errors={errors} showPassword={showConfirmPassword} onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)} placeholder="Confirm your password" />
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardHeader><CardTitle className="flex items-center text-xl"><UserPlus className="mr-3 text-primary" /> Personal Information</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FloatingLabelInput name="full_name" label="Full Name" register={register} errors={errors} placeholder="John Doe" />
                                    
                                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                          <Label className="mb-2 block font-medium text-sm">Country</Label>
                                          <Select onValueChange={(val) => setValue('country', val, { shouldValidate: true })} defaultValue={selectedCountry}>
                                              <SelectTrigger className="h-12 w-full">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                   <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                   <span className="truncate">{selectedCountry || "Select Country"}</span>
                                                </div>
                                              </SelectTrigger>
                                              <SelectContent className="max-h-[300px] w-[var(--radix-select-trigger-width)]">
                                                  {countryData.countries.map((c) => (
                                                      <SelectItem key={c.code} value={c.name}>
                                                          <div className="flex items-center justify-between w-full gap-4">
                                                              <span>{c.name}</span>
                                                              <span className="text-muted-foreground text-xs">{c.dial_code}</span>
                                                          </div>
                                                      </SelectItem>
                                                  ))}
                                              </SelectContent>
                                          </Select>
                                          {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>}
                                      </div>

                                      <FloatingLabelInput 
                                          name="phone_number" 
                                          label={`Phone Number (${currentCountryInfo ? currentCountryInfo.phone_length + ' digits' : 'Required'})`} 
                                          type="tel" 
                                          register={register} 
                                          errors={errors} 
                                          placeholder="1234567890"
                                          prefix={currentCountryInfo ? currentCountryInfo.dial_code : null}
                                      />
                                    </div>
                                    
                                    <div className="relative floating-input">
                                        <Input id="date_of_birth" type="date" {...register("date_of_birth")} className="h-12 has-value" placeholder="YYYY-MM-DD" />
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
                                    <div className="md:col-span-2">
                                      <RegionSelector value={selectedRegion} onSelect={(region) => setValue('region', region, { shouldValidate: true })} error={errors.region} regions={availableRegions} />
                                      {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region.message}</p>}
                                    </div>
                                    <FloatingLabelInput name="city_town" label="City / Town" register={register} errors={errors} placeholder="Accra" />
                                    <FloatingLabelInput name="nearest_landmark" label="Nearest Landmark" register={register} errors={errors} placeholder="Near the market" />
                                </CardContent>
                            </Card>

                            {role === 'customer' ? (
                                <AnimatePresence>
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
                                        <Card>
                                            <CardHeader><CardTitle className="flex items-center text-xl"><Home className="mr-3 text-primary" /> Delivery Information</CardTitle></CardHeader>
                                            <CardContent className="space-y-6">
                                                <FloatingLabelInput name="delivery_address" label="Delivery Address" register={register} errors={errors} placeholder="House No. 123, Street Name" />
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
                            ) : (
                                <AnimatePresence>
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
                                        <Card>
                                            <CardHeader><CardTitle className="flex items-center text-xl"><Sprout className="mr-3 text-primary" /> Farm Information</CardTitle></CardHeader>
                                            <CardContent className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="md:col-span-2">
                                                        <Label className="mb-2 block font-semibold text-sm">Document Type</Label>
                                                        <Select onValueChange={(val) => { setValue('document_type', val, { shouldValidate: true }); setValue('national_id', ''); }} defaultValue="ID Card">
                                                            <SelectTrigger className="h-12"><SelectValue placeholder="Select Document Type" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="ID Card">National ID Card</SelectItem>
                                                                <SelectItem value="Passport">Passport</SelectItem>
                                                                <SelectItem value="Driver License">Driver's License</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <FloatingLabelInput 
                                                            name="national_id" 
                                                            label={idLabel} 
                                                            register={register} 
                                                            errors={errors} 
                                                            onChange={handleIdInput}
                                                            placeholder={idPlaceholder}
                                                        />
                                                    </div>
                                                </div>
                                                <FloatingLabelInput name="farm_type" label="Type of Farm" register={register} errors={errors} placeholder="Poultry, Vegetable, etc." />
                                                <FloatingLabelInput name="farm_size" label="Farm Size (in Acres)" register={register} errors={errors} placeholder="e.g. 5 acres" />
                                                <FloatingLabelInput name="farm_address" label="Farm Address" register={register} errors={errors} placeholder="Plot 45, Village Name" />
                                                <FloatingLabelInput name="main_products" label="Main Products" register={register} errors={errors} placeholder="Maize, Cassava, etc." />
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </AnimatePresence>
                            )}

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
