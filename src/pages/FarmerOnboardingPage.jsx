import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion } from 'framer-motion';
import countryData from '@/lib/countryData.json';
import { Home } from 'lucide-react'; // Added Home icon

const FarmerOnboardingPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    age: '',
    phoneNumber: '',
    country: 'Ghana',
    nationalId: '',
    residentialAddress: '',
    region: '',
    district: '',
    farmAddress: '',
    farmType: '',
    farmSize: '',
    gpsLocation: '',
    farmingExperience: '',
    businessRegistrationStatus: '',
    fdaCertificationStatus: '',
    mainProducts: '',
    agreedToTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const selectedCountry = countryData.countries.find(c => c.name === formData.country);

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'age':
        if (value && parseInt(value, 10) < 18) {
          error = 'You must be at least 18 years old to register.';
        }
        break;
      case 'phoneNumber':
        if (value && !/^\d{5,10}$/.test(value)) {
          error = 'Phone number must be between 5 and 10 digits.';
        }
        break;
      case 'nationalId':
        if (value && !/^GHA-\d{9}-\d$/.test(value)) {
          error = 'ID format must be GHA-000000000-0.';
        }
        break;
      default:
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleCheckboxChange = (checked) => {
    setFormData(prev => ({ ...prev, agreedToTerms: checked }));
  };

  const handleNationalIdChange = (e) => {
    let value = e.target.value.toUpperCase();
    // Basic masking logic
    if (!value.startsWith('GHA-')) {
        value = 'GHA-' + value.replace('GHA-', '');
    }
    value = value.replace(/[^A-Z0-9-]/g, '');
    
    const parts = value.split('-');
    if (parts.length > 1) {
        parts[1] = parts[1].slice(0, 9);
    }
    if (parts.length > 2) {
        parts[2] = parts[2].slice(0, 1);
        value = `${parts[0]}-${parts[1]}-${parts[2]}`;
    } else {
        value = `${parts[0]}-${parts[1] || ''}`;
    }

    setFormData(prev => ({ ...prev, nationalId: value.slice(0, 15) }));
    validateField('nationalId', value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Re-validate all fields on submit
    let hasErrors = false;
    Object.keys(formData).forEach(key => {
        validateField(key, formData[key]);
        if (errors[key]) hasErrors = true;
    });

    if (hasErrors) {
        toast({ variant: "destructive", title: "Validation Error", description: "Please fix the errors before submitting." });
        return;
    }

    if (!formData.agreedToTerms) {
      toast({ variant: "destructive", title: "Terms and Conditions", description: "You must agree to the terms to register." });
      return;
    }

    setLoading(true);

    const { error } = await signUp(formData.email, formData.password, {
      data: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        age: formData.age,
        phone_number: formData.phoneNumber,
        country: formData.country,
        national_id: formData.nationalId,
        residential_address: formData.residentialAddress,
        region: formData.region,
        district: formData.district,
        farm_address: formData.farmAddress,
        farm_type: formData.farmType,
        farm_size: formData.farmSize,
        gps_location: formData.gpsLocation,
        farming_experience: formData.farmingExperience,
        business_registration_status: formData.businessRegistrationStatus,
        fda_certification_status: formData.fdaCertificationStatus,
        main_products: formData.mainProducts,
        role: 'farmer',
      },
    });

    if (!error) {
      toast({ title: "Registration Successful", description: "Please check your email to verify your account." });
      navigate('/login');
    } else {
      toast({ variant: "destructive", title: "Registration Failed", description: error.message });
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Farmer Onboarding - Golden Acres</title>
        <meta name="description" content="Join Golden Acres as a farmer and sell your produce to a wider market." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="sm:mx-auto sm:w-full sm:max-w-2xl"
        >
          <div className="flex justify-between items-center mb-4">
            <div></div> {/* Spacer for left alignment */}
            <img className="mx-auto h-12 w-auto" alt="Golden Acres Logo" src="https://images.unsplash.com/photo-1689773132527-bcabdc88a395" />
            <Button asChild variant="outline" className="ml-auto"> {/* Adjusted positioning */}
                <Link to="/">
                    <Home className="h-4 w-4 mr-2" />
                    Home
                </Link>
            </Button>
          </div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Become a Golden Acres Farmer</h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary-dark">Sign in</Link>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl"
        >
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" name="firstName" type="text" required value={formData.firstName} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" type="text" required value={formData.lastName} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required value={formData.password} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" name="age" type="number" required value={formData.age} onChange={handleInputChange} />
                  {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select name="country" value={formData.country} onValueChange={(value) => handleSelectChange('country', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryData.countries.map((country) => (
                        <SelectItem key={country.code} value={country.name}>
                          {country.name} ({country.dial_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      {selectedCountry?.dial_code}
                    </span>
                    <Input id="phoneNumber" name="phoneNumber" type="tel" required className="rounded-l-none" value={formData.phoneNumber} onChange={handleInputChange} />
                  </div>
                  {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="nationalId">National ID Number</Label>
                  <Input id="nationalId" name="nationalId" type="text" placeholder="GHA-000000000-0" required value={formData.nationalId} onChange={handleNationalIdChange} />
                  {errors.nationalId && <p className="text-red-500 text-xs mt-1">{errors.nationalId}</p>}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="residentialAddress">Residential Address</Label>
                  <Input id="residentialAddress" name="residentialAddress" type="text" required value={formData.residentialAddress} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="region">Region</Label>
                  <Input id="region" name="region" type="text" required value={formData.region} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="district">District</Label>
                  <Input id="district" name="district" type="text" required value={formData.district} onChange={handleInputChange} />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="farmAddress">Farm Address</Label>
                  <Input id="farmAddress" name="farmAddress" type="text" required value={formData.farmAddress} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="farmType">Type of Farm</Label>
                  <Input id="farmType" name="farmType" type="text" required value={formData.farmType} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="farmSize">Size of Farm (in acres)</Label>
                  <Input id="farmSize" name="farmSize" type="text" required value={formData.farmSize} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="gpsLocation">Farm GPS Location</Label>
                  <Input id="gpsLocation" name="gpsLocation" type="text" placeholder="e.g., 5.6037° N, 0.1870° W" value={formData.gpsLocation} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="farmingExperience">Farming Experience (in years)</Label>
                  <Input id="farmingExperience" name="farmingExperience" type="number" required value={formData.farmingExperience} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="businessRegistrationStatus">Business Registration Status</Label>
                  <Select name="businessRegistrationStatus" value={formData.businessRegistrationStatus} onValueChange={(value) => handleSelectChange('businessRegistrationStatus', value)}>
                    <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="registered">Registered</SelectItem>
                      <SelectItem value="not_registered">Not Registered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fdaCertificationStatus">FDA Certification Status</Label>
                  <Select name="fdaCertificationStatus" value={formData.fdaCertificationStatus} onValueChange={(value) => handleSelectChange('fdaCertificationStatus', value)}>
                    <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="certified">Certified</SelectItem>
                      <SelectItem value="not_certified">Not Certified</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="mainProducts">Main Products You Grow</Label>
                  <Input id="mainProducts" name="mainProducts" type="text" placeholder="e.g., Tomatoes, Maize, Yams" required value={formData.mainProducts} onChange={handleInputChange} />
                </div>
              </div>

              <div className="flex items-center">
                <Checkbox id="terms" checked={formData.agreedToTerms} onCheckedChange={handleCheckboxChange} />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                  I agree to the{' '}
                  <Link to="#" className="text-primary hover:text-primary-dark">Terms and Conditions</Link>
                </label>
              </div>

              <div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Registering...' : 'Register as Farmer'}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default FarmerOnboardingPage;