
import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, ArrowLeft, Loader2, Home, Warehouse, Lock, CreditCard, MessageCircle, Truck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const CheckoutPage = () => {
    const { cartItems, removeFromCart, updateQuantity, handleWhatsAppCheckout, handlePaystackCheckout } = useCart();
    const { user, profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [deliveryMethod, setDeliveryMethod] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [selectedHub, setSelectedHub] = useState('');
    const [hubs, setHubs] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pickupAvailable, setPickupAvailable] = useState(true);
    const [hubCheckLoading, setHubCheckLoading] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            toast({ variant: 'destructive', title: 'Please log in to proceed to checkout.' });
            navigate('/login');
        }
        if (profile?.delivery_address) {
            setDeliveryAddress(profile.delivery_address);
        }
        if(profile?.preferred_delivery_method) {
            setDeliveryMethod(profile.preferred_delivery_method);
        }
        if(profile?.preferred_hub) {
            setSelectedHub(profile.preferred_hub)
        }

        const checkHubsAvailability = async () => {
            setHubCheckLoading(true);
            const { data: allHubs, error } = await supabase.from('pickup_hubs').select('*');
            
            if (!error && allHubs) {
                // If profile has region, verify if hubs exist in that region
                if (profile?.region) {
                    const userRegion = profile.region.trim().toLowerCase();
                    const regionalHubs = allHubs.filter(h => h.region && h.region.trim().toLowerCase() === userRegion);
                    
                    if (regionalHubs.length > 0) {
                        setHubs(regionalHubs);
                        setPickupAvailable(true);
                    } else {
                        setHubs([]);
                        setPickupAvailable(false);
                        // Force switch to Delivery if Pickup was selected
                        if (deliveryMethod === 'Pickup') {
                            setDeliveryMethod('Delivery');
                        }
                    }
                } else {
                    // No region in profile, allow all hubs or force update profile
                    setHubs(allHubs);
                    setPickupAvailable(true);
                }
            }
            setHubCheckLoading(false);
        };

        if (profile) {
            checkHubsAvailability();
        }
        
        // Load Paystack script dynamically
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        document.body.appendChild(script);
        
        return () => {
            if(document.body.contains(script)){
                document.body.removeChild(script);
            }
        }
    }, [user, profile, authLoading, navigate, toast]);

    // Force Home Delivery if pickup becomes unavailable (second safety check)
    useEffect(() => {
        if (!pickupAvailable && deliveryMethod === 'Pickup') {
            setDeliveryMethod('Delivery');
        }
    }, [pickupAvailable, deliveryMethod]);

    const subtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0), [cartItems]);
    
    // Delivery fee is removed from calculation as requested (Set to 0)
    const deliveryFee = 0; 
    const total = subtotal + deliveryFee;
    
    const isInternational = profile?.country && profile.country !== 'Ghana';

    const handleCheckout = async (method) => {
        if (!deliveryMethod) {
            toast({ variant: 'destructive', title: "Delivery method required", description: "Please select a delivery or pickup option."});
            return;
        }
        if (deliveryMethod === 'Delivery' && !deliveryAddress) {
            toast({ variant: 'destructive', title: "Address required", description: "Please enter your delivery address."});
            return;
        }
        if (deliveryMethod === 'Pickup' && !selectedHub) {
            toast({ variant: 'destructive', title: "Pickup hub required", description: "Please select a pickup hub."});
            return;
        }
        
        setIsSubmitting(true);
        const deliveryDetails = {
            method: deliveryMethod,
            address: deliveryMethod === 'Delivery' ? deliveryAddress : null,
            hub_id: deliveryMethod === 'Pickup' ? selectedHub : null
        };

        if (method === 'whatsapp') {
             await handleWhatsAppCheckout(deliveryDetails);
        } else {
             await handlePaystackCheckout(deliveryDetails);
        }
        
        setIsSubmitting(false);
    };

    if (authLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    if (cartItems.length === 0 && !isSubmitting) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <ShoppingCart className="h-24 w-24 text-gray-300 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Your Cart is Empty</h2>
                <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
                <Button asChild><Link to="/marketplace">Start Shopping</Link></Button>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Checkout - Agribridge</title>
                <meta name="description" content="Complete your purchase from Agribridge." />
            </Helmet>
            <div className="bg-gray-50/50 dark:bg-gray-950 min-h-screen transition-colors duration-300">
                <div className="container mx-auto px-4 py-8 md:py-16">
                    <Link to="/marketplace" className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary mb-6 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Marketplace
                    </Link>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-6 w-6" /> Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="divide-y dark:divide-gray-800">
                                    <AnimatePresence>
                                        {cartItems.map((item, index) => (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="flex items-start py-4"
                                            >
                                                <img src={item.image_url} alt={item.name} className="w-20 h-20 object-cover rounded-md mr-4 border dark:border-gray-800" />
                                                <div className="flex-grow">
                                                    <p className="font-semibold">{item.name}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">GHS {Number(item.price).toFixed(2)} / {item.unit}</p>
                                                    <div className="flex items-center mt-2">
                                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</Button>
                                                        <span className="px-4 text-center w-12 font-medium">{item.quantity}</span>
                                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold">GHS {(item.price * item.quantity).toFixed(2)}</p>
                                                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 h-8 w-8 mt-2" onClick={() => removeFromCart(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Truck className="h-6 w-6"/> Delivery Method</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Button 
                                            variant="outline"
                                            className={cn(
                                                "h-auto py-6 flex flex-col gap-2 relative overflow-hidden transition-all duration-200 border-2",
                                                deliveryMethod === 'Delivery' 
                                                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary" 
                                                    : "border-border hover:border-primary/50 text-gray-600 dark:text-gray-300"
                                            )}
                                            onClick={() => setDeliveryMethod('Delivery')}
                                        >
                                            <Home className="h-8 w-8" />
                                            <span className="text-lg font-semibold">Home Delivery</span>
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            className={cn(
                                                "h-auto py-6 flex flex-col gap-2 relative overflow-hidden transition-all duration-200 border-2",
                                                deliveryMethod === 'Pickup' 
                                                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary" 
                                                    : "border-border hover:border-primary/50 text-gray-600 dark:text-gray-300",
                                                !pickupAvailable && "opacity-50 cursor-not-allowed bg-gray-100 hover:bg-gray-100 border-gray-200"
                                            )}
                                            onClick={() => pickupAvailable && setDeliveryMethod('Pickup')}
                                            disabled={!pickupAvailable}
                                        >
                                            <Warehouse className="h-8 w-8" />
                                            <span className="text-lg font-semibold">Pickup from Hub</span>
                                            <span className="text-sm opacity-90 font-medium">{pickupAvailable ? 'Free' : 'Unavailable'}</span>
                                        </Button>
                                    </div>

                                    {!pickupAvailable && (
                                        <Alert variant="warning" className="bg-yellow-50 border-yellow-200 my-4 pl-12">
                                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                                            <AlertTitle className="text-yellow-800 mb-1">Pickup Not Available</AlertTitle>
                                            <AlertDescription className="text-yellow-700 leading-relaxed">
                                                No pickup hubs available in your region yet. Pickup will be available soon.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <AnimatePresence mode="wait">
                                        {deliveryMethod === 'Delivery' ? (
                                            <motion.div 
                                                key="delivery"
                                                initial={{ opacity: 0, y: 10 }} 
                                                animate={{ opacity: 1, y: 0 }} 
                                                exit={{ opacity: 0, y: -10 }} 
                                                transition={{ duration: 0.2 }}
                                                className="space-y-2 mt-2"
                                            >
                                                <Label htmlFor="address">Delivery Address</Label>
                                                <Textarea id="address" placeholder="Enter your full street address, landmark, and city" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
                                            </motion.div>
                                        ) : deliveryMethod === 'Pickup' && pickupAvailable ? (
                                            <motion.div 
                                                key="pickup"
                                                initial={{ opacity: 0, y: 10 }} 
                                                animate={{ opacity: 1, y: 0 }} 
                                                exit={{ opacity: 0, y: -10 }} 
                                                transition={{ duration: 0.2 }}
                                                className="space-y-2 mt-2"
                                            >
                                                <Label htmlFor="hub">Select Pickup Hub</Label>
                                                <Select value={selectedHub} onValueChange={setSelectedHub}>
                                                    <SelectTrigger><SelectValue placeholder="Choose a pickup hub..." /></SelectTrigger>
                                                    <SelectContent>
                                                        {hubs.map(hub => <SelectItem key={hub.id} value={hub.id}>{hub.name} - {hub.address}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </motion.div>
                                        ) : null}
                                    </AnimatePresence>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Choose How to Checkout</CardTitle>
                                    <CardDescription>Select one of the options below to complete your order.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Option 1: WhatsApp */}
                                        <div 
                                            className="p-6 border rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 transition-all group relative"
                                            onClick={() => handleCheckout('whatsapp')}
                                        >
                                            <div className="flex flex-col h-full justify-between">
                                                <div className="flex justify-between items-start mb-4">
                                                     <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                                                        <MessageCircle className="h-6 w-6 text-green-600" />
                                                     </div>
                                                     <div className="h-5 w-5 rounded-full border-2 border-gray-300 group-hover:border-green-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Send to WhatsApp</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Forward your order details directly to our orders team for manual confirmation.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Option 2: Pay Now */}
                                        <div 
                                            className="p-6 border rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group relative"
                                            onClick={() => handleCheckout('paystack')}
                                        >
                                           <div className="flex flex-col h-full justify-between">
                                                <div className="flex justify-between items-start mb-4">
                                                     <div className="bg-primary/10 p-3 rounded-full">
                                                        <CreditCard className="h-6 w-6 text-primary" />
                                                     </div>
                                                     <div className="h-5 w-5 rounded-full border-2 border-gray-300 group-hover:border-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Pay Now</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {isInternational 
                                                            ? "Secure checkout via Visa / Mastercard." 
                                                            : "Secure checkout via Mobile Money or Card."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-1">
                            <Card className="sticky top-24">
                                <CardHeader>
                                    <CardTitle>Order Total</CardTitle>
                                    <CardDescription>Final charges for your order.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between"><span>Subtotal</span><span className="font-medium">GHS {subtotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Delivery</span>
                                        <span className="italic">Additional charges may apply</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between text-xl font-bold"><span>Total</span><span>GHS {total.toFixed(2)}</span></div>
                                </CardContent>
                                <CardFooter>
                                     <p className="text-xs text-center text-gray-500 dark:text-gray-400 w-full">
                                        Select a checkout option on the left to proceed.
                                    </p>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CheckoutPage;
