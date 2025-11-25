
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';
import { Home } from 'lucide-react';
import countryData from '@/lib/countryData.json';

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        <path d="M1 1h22v22H1z" fill="none" />
    </svg>
);

const FormSection = ({ title, description, children, delay }) => (
    <motion.div 
        className="space-y-4 p-6 border rounded-lg bg-white/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
    >
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        {description && <p className="text-sm text-gray-600">{description}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </motion.div>
);

const RegisterPage = () => {
    const [role, setRole] = useState('customer');
    const [loading, setLoading] = useState(false);
    const { signInWithGoogle } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    
    // Phone & Country
    const [countryCode, setCountryCode] = useState('+233'); // Default Ghana
    const [countryName, setCountryName] = useState('Ghana');
    const [phoneNumber, setPhoneNumber] = useState('');

    const [gender, setGender] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [region, setRegion] = useState('');
    const [cityTown, setCityTown] = useState('');
    const [nearestLandmark, setNearestLandmark] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [preferredDeliveryMethod, setPreferredDeliveryMethod] = useState('');
    const [preferredHub, setPreferredHub] = useState('');
    const [nationalId, setNationalId] = useState('');
    const [residentialAddress, setResidentialAddress] = useState('');
    const [district, setDistrict] = useState('');
    const [farmType, setFarmType] = useState('');
    const [farmSize, setFarmSize] = useState('');
    const [gpsLocation, setGpsLocation] = useState('');
    const [farmingExperience, setFarmingExperience] = useState('');
    const [farmAddress, setFarmAddress] = useState('');
    const [businessRegistrationStatus, setBusinessRegistrationStatus] = useState('');
    const [fdaCertificationStatus, setFdaCertificationStatus] = useState('');
    const [mainProducts, setMainProducts] = useState('');

    const handleCountryChange = (value) => {
        const country = countryData.find(c => c.dial_code === value);
        setCountryCode(value);
        if (country) setCountryName(country.name);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Strict Validation
        const commonFields = [
            { val: fullName, name: "Full Name" },
            { val: email, name: "Email" },
            { val: password, name: "Password" },
            { val: phoneNumber, name: "Phone Number" },
            { val: countryCode, name: "Country Code" },
            { val: gender, name: "Gender" },
            { val: dateOfBirth, name: "Date of Birth" },
            { val: region, name: "Region" },
            { val: cityTown, name: "City/Town" },
            { val: nearestLandmark, name: "Nearest Landmark" },
            { val: deliveryAddress, name: "Delivery Address" }
        ];

        const farmerFields = [
            { val: nationalId, name: "National ID" },
            { val: residentialAddress, name: "Residential Address" },
            { val: district, name: "District" },
            { val: farmAddress, name: "Farm Address" },
            { val: farmType, name: "Farm Type" },
            { val: farmSize, name: "Farm Size" },
            { val: gpsLocation, name: "GPS Location" },
            { val: farmingExperience, name: "Farming Experience" },
            { val: businessRegistrationStatus, name: "Business Registration" },
            { val: fdaCertificationStatus, name: "FDA Certification" },
            { val: mainProducts, name: "Main Products" }
        ];

        // Check common fields
        for (const field of commonFields) {
            if (!field.val || field.val.trim() === '') {
                toast({ variant: "destructive", title: "Missing Information", description: `${field.name} is required.` });
                setLoading(false);
                return;
            }
        }

        // Check customer specific fields
        if (role === 'customer') {
            if (!preferredDeliveryMethod || preferredDeliveryMethod.trim() === '') {
                toast({ variant: "destructive", title: "Missing Information", description: "Preferred Delivery Method is required." });
                setLoading(false);
                return;
            }
            if (preferredDeliveryMethod === 'hub' && (!preferredHub || preferredHub.trim() === '')) {
                 toast({ variant: "destructive", title: "Missing Information", description: "Please select a Preferred Hub." });
                 setLoading(false);
                 return;
            }
        }


        // Check farmer specific fields
        if (role === 'farmer') {
            for (const field of farmerFields) {
                if (!field.val || field.val.trim() === '') {
                    toast({ variant: "destructive", title: "Missing Information", description: `${field.name} is required for farmers.` });
                    setLoading(false);
                    return;
                }
            }
        }

        const fullPhoneNumber = `${countryCode}${phoneNumber}`;

        const { data: existingUser } = await supabase.from('profiles').select('full_name').eq('full_name', fullName).single();
        if (existingUser) {
            toast({ variant: "destructive", title: "Username already taken", description: "Please choose a different full name." });
            setLoading(false); return;
        }

        // Important: Use snake_case keys here to match database schema/trigger
        const metadata = { 
            full_name: fullName, 
            role, 
            phone_number: fullPhoneNumber, 
            country: countryName,
            gender, 
            date_of_birth: dateOfBirth, 
            region, 
            city_town: cityTown, 
            nearest_landmark: nearestLandmark, 
            delivery_address: deliveryAddress
        };

        if (role === 'customer') { 
            Object.assign(metadata, { 
                preferred_delivery_method: preferredDeliveryMethod,
                preferred_hub: preferredHub
            }); 
        } else { 
            // Preferred Delivery Method is no longer mandatory for farmers, so it's not strictly included here
            // However, we include it if it was selected, otherwise it remains undefined.
            if (preferredDeliveryMethod) {
                Object.assign(metadata, { preferred_delivery_method: preferredDeliveryMethod });
            }
            Object.assign(metadata, { 
                national_id: nationalId, 
                residential_address: residentialAddress, 
                district, 
                farm_type: farmType, 
                farm_size: farmSize, 
                gps_location: gpsLocation, 
                farming_experience: farmingExperience, 
                farm_address: farmAddress, 
                business_registration_status: businessRegistrationStatus, 
                fda_certification_status: fdaCertificationStatus, 
                main_products: mainProducts 
            }); 
        }

        // We use supabase.auth.signUp directly here instead of the wrapper context 
        // to guarantee that the metadata options are passed correctly.
        const { error } = await supabase.auth.signUp({
            email, 
            password, 
            options: { data: metadata }
        });

        if (error) { 
            toast({ variant: "destructive", title: "Registration Failed", description: error.message }); 
        } else { 
            toast({ title: "Registration Successful!", description: "Please check your email to verify your account." }); 
            navigate('/'); 
        }
        setLoading(false);
    };
    
    const handleGoogleSignIn = async () => {
        setLoading(true);
        await signInWithGoogle();
        setLoading(false);
    };

    return (
        <>
            <Helmet>
                <title>Register - Golden Acres</title>
                <meta name="description" content="Create an account with Golden Acres." />
            </Helmet>
            <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] bg-transparent px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full max-w-4xl p-8 space-y-6 bg-card/90 backdrop-blur-sm rounded-2xl shadow-2xl border"
                >
                    <div className="text-center flex justify-between items-center mb-4">
                        <div></div>
                        <h1 className="text-3xl font-bold text-gray-900">Join Golden Acres</h1>
                        <Button asChild variant="outline"><Link to="/"><Home className="h-4 w-4 mr-2" />Home</Link></Button>
                    </div>
                    <p className="mt-2 text-gray-600 text-center">Connecting You Directly to Farmers Across Ghana</p>
                    <p className="text-center text-sm font-medium text-red-500 mb-4">* All mandatory fields are marked with an asterisk</p>

                    <form className="space-y-6" onSubmit={handleRegister}>
                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
                            <Label htmlFor="role">I am registering as a... <span className="text-red-500">*</span></Label>
                             <Select onValueChange={setRole} defaultValue={role} disabled={loading} required>
                                <SelectTrigger className="bg-white"><SelectValue placeholder="Select your role" /></SelectTrigger>
                                <SelectContent><SelectItem value="customer">Customer</SelectItem><SelectItem value="farmer">Farmer</SelectItem></SelectContent>
                            </Select>
                        </motion.div>

                        <FormSection title="1. Personal Information" delay={0.1}>
                            <div><Label>Full Name <span className="text-red-500">*</span></Label><Input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="John Doe" /></div>
                            
                            <div>
                                <Label>Phone Number <span className="text-red-500">*</span></Label>
                                <div className="flex gap-2">
                                    <Select onValueChange={handleCountryChange} defaultValue="+233" value={countryCode}>
                                        <SelectTrigger className="w-[110px]">
                                            <SelectValue placeholder="Code" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {countryData.map((c) => (
                                                <SelectItem key={c.code} value={c.dial_code}>
                                                    {c.dial_code} ({c.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required placeholder="550000000" className="flex-1"/>
                                </div>
                            </div>

                            <div><Label>Email Address <span className="text-red-500">*</span></Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" /></div>
                            <div><Label>Password <span className="text-red-500">*</span></Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" /></div>
                            <div><Label>Gender <span className="text-red-500">*</span></Label><Select onValueChange={setGender} value={gender} required><SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select></div>
                            <div><Label>Date of Birth <span className="text-red-500">*</span></Label><Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} required /></div>
                        </FormSection>

                        <FormSection title="2. Address & Location" delay={0.2}>
                            <div><Label>Region <span className="text-red-500">*</span></Label><Input value={region} onChange={e => setRegion(e.target.value)} required placeholder="e.g., Greater Accra" /></div>
                            <div><Label>City/Town <span className="text-red-500">*</span></Label><Input value={cityTown} onChange={e => setCityTown(e.target.value)} required placeholder="e.g., Accra" /></div>
                            <div><Label>Nearest Landmark <span className="text-red-500">*</span></Label><Input value={nearestLandmark} onChange={e => setNearestLandmark(e.target.value)} required placeholder="e.g., Accra Mall" /></div>
                            <div><Label>Delivery Address <span className="text-red-500">*</span></Label><Input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} required placeholder="House No, Street Name" /></div>
                        </FormSection>
                        
                        <AnimatePresence mode="wait">
                        {role === 'customer' && (
                            <motion.div key="customer" initial={{opacity:0, height: 0}} animate={{opacity:1, height: 'auto'}} exit={{opacity:0, height: 0}} transition={{duration: 0.4, ease: 'easeInOut'}}>
                                <FormSection title="3. Account Preferences" delay={0}>
                                    <div><Label>Preferred Delivery Method <span className="text-red-500">*</span></Label><Select onValueChange={setPreferredDeliveryMethod} value={preferredDeliveryMethod} required={role === 'customer'}><SelectTrigger><SelectValue placeholder="Select Delivery Method" /></SelectTrigger><SelectContent><SelectItem value="home">Direct to Home</SelectItem><SelectItem value="hub">Hub Pickup</SelectItem></SelectContent></Select></div>
                                    <div><Label>Preferred Hub (Optional for Home Delivery, Required for Hub Pickup)</Label><Select onValueChange={setPreferredHub} value={preferredHub}><SelectTrigger><SelectValue placeholder="Select Hub" /></SelectTrigger><SelectContent><SelectItem value="madina">Madina</SelectItem><SelectItem value="bolgatanga">Bolgatanga</SelectItem><SelectItem value="ahafo">Ahafo Ano North</SelectItem><SelectItem value="lawra">Lawra</SelectItem><SelectItem value="savannah">Northern Savannah</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
                                </FormSection>
                            </motion.div>
                        )}

                        {role === 'farmer' && (
                            <motion.div key="farmer" initial={{opacity:0, height: 0}} animate={{opacity:1, height: 'auto'}} exit={{opacity:0, height: 0}} transition={{duration: 0.4, ease: 'easeInOut'}}>
                                <FormSection title="Farmer Details" delay={0}>
                                    <div><Label>National ID (Ghana Card) <span className="text-red-500">*</span></Label><Input value={nationalId} onChange={e => setNationalId(e.target.value)} required placeholder="GHA-000000000-0" /></div>
                                    <div><Label>Residential Address <span className="text-red-500">*</span></Label><Input value={residentialAddress} onChange={e => setResidentialAddress(e.target.value)} required /></div>
                                    <div><Label>District <span className="text-red-500">*</span></Label><Input value={district} onChange={e => setDistrict(e.target.value)} required /></div>
                                    <div><Label>Farm Address <span className="text-red-500">*</span></Label><Input value={farmAddress} onChange={e => setFarmAddress(e.target.value)} required /></div>
                                    <div><Label>Farm Type <span className="text-red-500">*</span></Label><Input value={farmType} onChange={e => setFarmType(e.target.value)} required placeholder="e.g., Crop, Livestock, Mixed" /></div>
                                    <div><Label>Farm Size (in acres) <span className="text-red-500">*</span></Label><Input value={farmSize} onChange={e => setFarmSize(e.target.value)} required /></div>
                                    <div><Label>GPS Location of Farm <span className="text-red-500">*</span></Label><Input value={gpsLocation} onChange={e => setGpsLocation(e.target.value)} required placeholder="e.g., 5.6037° N, 0.1870° W" /></div>
                                    <div><Label>Years of Farming Experience <span className="text-red-500">*</span></Label><Input type="number" value={farmingExperience} onChange={e => setFarmingExperience(e.target.value)} required /></div>
                                    <div><Label>Business Registration Status <span className="text-red-500">*</span></Label><Select onValueChange={setBusinessRegistrationStatus} value={businessRegistrationStatus} required><SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger><SelectContent><SelectItem value="registered">Registered</SelectItem><SelectItem value="not_registered">Not Registered</SelectItem></SelectContent></Select></div>
                                    <div><Label>FDA Certification Status <span className="text-red-500">*</span></Label><Select onValueChange={setFdaCertificationStatus} value={fdaCertificationStatus} required><SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger><SelectContent><SelectItem value="certi
