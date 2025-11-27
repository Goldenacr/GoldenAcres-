
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
import { ShoppingCart, Trash2, ArrowLeft, Loader2, Home, Warehouse, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';

const CheckoutPage = () => {
    const { cartItems, removeFromCart, updateQuantity, handleWhatsAppCheckout } = useCart();
    const { user, profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [deliveryMethod, setDeliveryMethod] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [selectedHub, setSelectedHub] = useState('');
    const [hubs, setHubs] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        const fetchHubs = async () => {
            const { data, error } = await supabase.from('pickup_hubs').select('*');
            if (!error) setHubs(data);
        };
        fetchHubs();
    }, [user, profile, authLoading, navigate, toast]);

    const subtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0), [cartItems]);
    const deliveryFee = deliveryMethod === 'Delivery' ? 15.00 : 0;
    const total = subtotal + deliveryFee;

    const handleCheckout = async () => {
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
        await handleWhatsAppCheckout(deliveryDetails);
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
                <title>Checkout - Golden Acres</title>
                <meta name="description" content="Complete your purchase from Golden Acres." />
            </Helmet>
            <div className="bg-gray-50/50 min-h-screen">
                <div className="container mx-auto px-4 py-8 md:py-16">
                    <Link to="/marketplace" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-primary mb-6 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Marketplace
                    </Link>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-6 w-6" /> Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="divide-y">
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
                                                <img src={item.image_url} alt={item.name} className="w-20 h-20 object-cover rounded-md mr-4 border" />
                                                <div className="flex-grow">
                                                    <p className="font-semibold">{item.name}</p>
                                                    <p className="text-sm text-gray-500">GHS {Number(item.price).toFixed(2)} / {item.unit}</p>
                                                    <div className="flex items-center mt-2">
                                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</Button>
                                                        <span className="px-4 text-center w-12 font-medium">{item.quantity}</span>
                                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold">GHS {(item.price * item.quantity).toFixed(2)}</p>
                                                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 mt-2" onClick={() => removeFromCart(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Delivery Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Button variant={deliveryMethod === 'Delivery' ? 'default' : 'outline'} className="h-auto py-4 flex flex-col gap-2" onClick={() => setDeliveryMethod('Delivery')}>
                                            <Home className="h-6 w-6" />
                                            <span>Home Delivery</span>
                                            <span className="text-xs font-normal">(GHS 15.00)</span>
                                        </Button>
                                        <Button variant={deliveryMethod === 'Pickup' ? 'default' : 'outline'} className="h-auto py-4 flex flex-col gap-2" onClick={() => setDeliveryMethod('Pickup')}>
                                            <Warehouse className="h-6 w-6" />
                                            <span>Pickup from Hub</span>
                                            <span className="text-xs font-normal">(Free)</span>
                                        </Button>
                                    </div>
                                    <AnimatePresence>
                                        {deliveryMethod === 'Delivery' && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                                                <Label htmlFor="address">Delivery Address</Label>
                                                <Textarea id="address" placeholder="Enter your full street address, landmark, and city" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
                                            </motion.div>
                                        )}
                                        {deliveryMethod === 'Pickup' && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                                                <Label htmlFor="hub">Select Pickup Hub</Label>
                                                <Select value={selectedHub} onValueChange={setSelectedHub}>
                                                    <SelectTrigger><SelectValue placeholder="Choose a pickup hub..." /></SelectTrigger>
                                                    <SelectContent>
                                                        {hubs.map(hub => <SelectItem key={hub.id} value={hub.id}>{hub.name} - {hub.address}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
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
                                    <div className="flex justify-between"><span>Delivery Fee</span><span className="font-medium">GHS {deliveryFee.toFixed(2)}</span></div>
                                    <Separator />
                                    <div className="flex justify-between text-xl font-bold"><span>Total</span><span>GHS {total.toFixed(2)}</span></div>
                                </CardContent>
                                <CardFooter className="flex flex-col gap-3">
                                    <Button size="lg" className="w-full" onClick={handleCheckout} disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                                        {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
                                    </Button>
                                    <p className="text-xs text-center text-gray-500">You will be redirected to WhatsApp to confirm your order with our team.</p>
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
