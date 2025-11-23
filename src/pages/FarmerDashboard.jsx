import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { PlusCircle, Home, Loader2, Info, ShieldCheck, MessageCircle, Search, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/customSupabaseClient';
import ProductsTab from '@/components/admin/ProductsTab';
import { useDebounce } from '@/hooks/useDebounce';

const FarmerDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [farmers, setFarmers] = useState([]); // Needed for product modal dropdown
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchFarmerData = useCallback(async () => {
    if (!profile || profile.role !== 'farmer') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [productsRes, farmersRes] = await Promise.all([
          supabase
              .from('products')
              .select(`*, farmer:profiles(full_name, id)`)
              .eq('farmer_id', profile.id),
          supabase
              .from('profiles')
              .select('id, full_name')
              .eq('role', 'farmer')
      ]);

      if (productsRes.error) throw productsRes.error;
      setProducts(productsRes.data);

      if (farmersRes.error) throw farmersRes.error;
      setFarmers(farmersRes.data);

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to fetch data',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  useEffect(() => {
    fetchFarmerData();
  }, [fetchFarmerData]);

  const handleLogout = async () => {
      await signOut();
      navigate('/');
  };

  const handleProductSave = () => {
    toast({ title: "Product saved successfully!" });
    fetchFarmerData();
  };

  const handleProductDelete = async (product) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', product.id);
      if (error) throw error;
      toast({ title: "Product deleted successfully." });
      fetchFarmerData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to delete product', description: error.message });
    }
  };

  const filteredProducts = useMemo(() => {
    if (!debouncedSearchTerm) return products;
    return products.filter(p => p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
  }, [products, debouncedSearchTerm]);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profile && profile.role !== 'farmer') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-gray-600">You do not have permission to view the farmer dashboard.</p>
        <Link to="/" className="mt-6">
          <Button>Go to Homepage</Button>
        </Link>
      </div>
    );
  }

  const isVerified = profile?.is_verified;

  const AddProductButton = () => {
    if (!isVerified) {
      const whatsAppNumber = "233557488116";
      const shortUserId = user?.id ? user.id.split('-')[0] : 'N/A';
      const prefilledMessage = `Hello Golden Acres, I would like to verify my farmer account.\n\nMy Name: ${profile?.full_name || 'N/A'}\nUser ID: ${shortUserId}`;
      const encodedMessage = encodeURIComponent(prefilledMessage);
      const whatsAppUrl = `https://wa.me/${whatsAppNumber}?text=${encodedMessage}`;

      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white">
              <PlusCircle className="h-4 w-4 mr-2" /> Add Product
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-md bg-gray-50 border-none shadow-2xl rounded-2xl p-0">
             <div className="p-8 text-center">
                <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                    className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 mb-6 shadow-lg"
                >
                    <ShieldCheck className="h-12 w-12 text-white" />
                </motion.div>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold text-gray-800">
                        Account Verification Required
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-600 mt-2 text-base">
                        To add products and start selling, your account needs to be verified by our team.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <p className="text-sm text-gray-500 mt-4">
                    Click the button below to send us a verification request on WhatsApp.
                </p>
                
                <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer" className="inline-block w-full mt-6">
                    <Button noHover className="w-full bg-green-500 hover:bg-green-600 text-white text-base py-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <MessageCircle className="h-5 w-5 mr-3" />
                        Verify via WhatsApp
                    </Button>
                </a>
            </div>

            <AlertDialogFooter className="bg-gray-100 p-4 rounded-b-2xl">
              <AlertDialogCancel asChild>
                <Button variant="ghost" className="w-full">Close</Button>
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    } else {
      return null;
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4"
      >
        <h1 className="text-3xl font-bold text-gray-800">
          Your Products
        </h1>
        <div className="flex items-center gap-2">
            <AnimatePresence>
              {!isVerified && <AddProductButton />}
            </AnimatePresence>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to="/" className="flex items-center">
                <Home className="h-4 w-4 mr-2" /> Home
              </Link>
            </Button>
            <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
                <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {isVerified ? (
            <>
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by product name..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <ProductsTab 
                    products={filteredProducts} 
                    farmers={farmers} 
                    onAdd={handleProductSave} 
                    onEdit={handleProductSave} 
                    onDelete={handleProductDelete} 
                    isFarmerView={true}
                />
            </>
        ) : (
            <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg mt-4">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0}} 
                animate={{ scale: 1, opacity: 1}} 
                transition={{delay: 0.3}}
                className="flex justify-center mb-4"
              >
                <Info className="h-12 w-12 text-gray-400" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-700">Verification Pending</h3>
              <p className="text-lg text-gray-600 mt-2">Your product management dashboard will appear here once your account is verified.</p>
              <p className="text-gray-500 mt-2">Thank you for your patience!</p>
            </div>
        )}
      </motion.div>
    </div>
  );
};

export default FarmerDashboard;