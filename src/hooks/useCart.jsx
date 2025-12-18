
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';

const CartContext = createContext();

export const useCart = () => {
    return useContext(CartContext);
};

const incrementProductCartCount = async (productId) => {
    try {
        await supabase.rpc('increment_times_in_cart', { p_product_id: productId });
    } catch (error) {
        console.error("Failed to increment cart count:", error);
    }
};

const incrementProductSoldCount = async (productId, quantity) => {
    try {
        await supabase.rpc('increment_product_sold_count', { p_product_id: productId, p_quantity: quantity });
    } catch (error) {
        console.error("Failed to increment sold count:", error);
    }
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { toast } = useToast();
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    const cartKey = useMemo(() => user ? `agribridge_cart_${user.id}` : 'agribridge_cart_guest', [user]);

    useEffect(() => {
        try {
            const localCart = localStorage.getItem(cartKey);
            if (localCart) {
                const parsedCart = JSON.parse(localCart);
                setCartItems(Array.isArray(parsedCart) ? parsedCart : []);
            } else {
                setCartItems([]);
            }
        } catch (error) {
            console.error("Failed to parse cart from localStorage", error);
            setCartItems([]);
        }
    }, [cartKey]);

    useEffect(() => {
        if (cartKey) {
            localStorage.setItem(cartKey, JSON.stringify(cartItems));
        }
    }, [cartItems, cartKey]);
    
    const addToCart = useCallback((product, quantity = 1) => {
        if (!user) {
            toast({ variant: 'destructive', title: "Please Login First", description: "You need to be logged in to add items to your cart." });
            navigate('/login');
            return;
        }

        if (product && (product.nativeEvent || product instanceof Event || (product.target && product.type))) {
             console.error("Attempted to add Event object to cart");
             return;
        }

        if (quantity <= 0) return;

        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);
            if (existingItem) {
                return prevItems.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
                );
            } else {
                incrementProductCartCount(product.id);
                return [...prevItems, { ...product, quantity }];
            }
        });
        toast({ title: "Added to Cart! 🛒", description: `${quantity} x ${product.name} has been added.` });
    }, [user, navigate, toast]);

    const removeFromCart = useCallback((productId) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    }, []);

    const updateQuantity = useCallback((productId, quantity) => {
        if (quantity < 1) {
            removeFromCart(productId);
            return;
        }
        setCartItems(prevItems =>
            prevItems.map(item => (item.id === productId ? { ...item, quantity } : item))
        );
    }, [removeFromCart]);

    const clearCart = useCallback(() => {
        setCartItems([]);
        localStorage.removeItem(cartKey);
    }, [cartKey]);

    const validateCartItems = async (items) => {
        if (!items || items.length === 0) return [];

        const productIds = items.map(item => item.id);
        const { data: existingProducts, error } = await supabase
            .from('products')
            .select('id')
            .in('id', productIds);

        if (error) {
            console.error("Error validating products:", error);
            throw new Error("Could not validate products.");
        }

        const existingIds = new Set(existingProducts.map(p => p.id));
        const validItems = items.filter(item => existingIds.has(item.id));
        const invalidItems = items.filter(item => !existingIds.has(item.id));

        if (invalidItems.length > 0) {
            console.warn("Found invalid items in cart (likely deleted products):", invalidItems);
        }

        return { validItems, invalidItems };
    };

    const handleWhatsAppCheckout = useCallback(async (deliveryDetails) => {
        if (!deliveryDetails || deliveryDetails.nativeEvent || deliveryDetails.constructor?.name === 'SyntheticBaseEvent' || (deliveryDetails.target && deliveryDetails.type)) {
             setIsCartOpen(false);
             navigate('/checkout');
             return;
        }

        if (cartItems.length === 0) {
            toast({ title: "Your cart is empty!" });
            return;
        }
        if (!user || !profile) {
            toast({ variant: 'destructive', title: "Not Logged In" });
            navigate('/login');
            return;
        }

        try {
            const { validItems, invalidItems } = await validateCartItems(cartItems);

            if (invalidItems.length > 0) {
                setCartItems(validItems);
                toast({ 
                    variant: 'destructive', 
                    title: "Cart Updated", 
                    description: `${invalidItems.length} item(s) were removed because they are no longer available.` 
                });
                if (validItems.length === 0) return;
            }

            const subtotal = validItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({ 
                    user_id: user.id, 
                    total_amount: subtotal, 
                    customer_name: profile.full_name, 
                    customer_phone: profile.phone_number, 
                    status: 'Order Placed',
                    delivery_info: deliveryDetails 
                })
                .select().single();
            if (orderError) throw orderError;
            
            const orderItemsToInsert = validItems.map(item => ({
                order_id: orderData.id, product_id: item.id, quantity: item.quantity, price: item.price,
                product_name: item.name, farmer_name: item.farmer?.full_name || 'Agribridge Farm'
            }));
            const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
            if (itemsError) {
                await supabase.from('orders').delete().eq('id', orderData.id);
                throw itemsError;
            }

            for (const item of validItems) {
                await incrementProductSoldCount(item.id, item.quantity);
            }

            let message = `*New Order from Agribridge!* ✨\n\n*Order ID:* ${orderData.id.substring(0,8)}\n*Customer:* ${profile.full_name}\n\nI'd like to place an order for:\n\n`;
            validItems.forEach(item => {
                const farmerName = item.farmer?.full_name ? ` (from ${item.farmer.full_name})` : '';
                message += `*${item.name}*${farmerName} (x${item.quantity}) - GHS ${(item.price * item.quantity).toLocaleString()}\n`;
            });
            message += `\n*Total: GHS ${subtotal.toLocaleString()}*`;
            
            const whatsappUrl = `https://wa.me/+233533811757?text=${encodeURIComponent(message)}`;
            
            toast({ title: "Order Placed!", description: "Redirecting to WhatsApp to confirm." });
            clearCart();
            setIsCartOpen(false);
            window.open(whatsappUrl, '_blank');
            navigate('/my-orders');

        } catch (error) {
            console.error("Checkout Error:", error);
            toast({ variant: 'destructive', title: "Order Failed", description: "There was an error processing your order. Please try again." });
        }
    }, [cartItems, user, profile, toast, navigate, setIsCartOpen, clearCart]);

    const handlePaystackCheckout = useCallback(async (deliveryDetails, specificChannel = null) => {
        if (!deliveryDetails || deliveryDetails.nativeEvent || deliveryDetails.constructor?.name === 'SyntheticBaseEvent' || (deliveryDetails.target && deliveryDetails.type)) {
             setIsCartOpen(false);
             navigate('/checkout');
             return;
        }

         if (cartItems.length === 0) {
            toast({ title: "Your cart is empty!" });
            return;
        }
        if (!user || !profile) {
            toast({ variant: 'destructive', title: "Not Logged In" });
            navigate('/login');
            return;
        }

        if (typeof window.PaystackPop === 'undefined') {
             toast({ variant: 'destructive', title: "Connection Error", description: "Payment gateway not loaded. Please refresh the page and try again." });
             return;
        }

        const customerEmail = user.email || profile.email;

        if (!customerEmail) {
            toast({ variant: 'destructive', title: "Missing Information", description: "We need your email address to process the payment." });
            return;
        }

        // Determine available channels
        let paymentChannels = ['card', 'mobile_money']; 
        
        // If a specific channel is requested (e.g., user clicked "Mobile Money"), prioritize it
        if (specificChannel) {
            paymentChannels = [specificChannel];
        }

        // Validate international restrictions
        if (profile?.country && profile.country !== 'Ghana') {
            if (specificChannel === 'mobile_money') {
                 toast({ variant: 'destructive', title: "Unavailable", description: "Mobile Money payment is only available for customers in Ghana." });
                 return;
            }
            paymentChannels = ['card']; 
        }

        try {
            const { validItems, invalidItems } = await validateCartItems(cartItems);

            if (invalidItems.length > 0) {
                setCartItems(validItems);
                toast({ 
                    variant: 'destructive', 
                    title: "Cart Updated", 
                    description: `${invalidItems.length} item(s) were removed because they are no longer available.` 
                });
                if (validItems.length === 0) return; 
            }

            const subtotal = validItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
            
            // Delivery fee is removed from calculation as requested (Set to 0)
            const deliveryFee = 0; 
            const totalAmount = subtotal + deliveryFee;

             const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({ 
                    user_id: user.id, 
                    total_amount: totalAmount, 
                    customer_name: profile.full_name, 
                    customer_phone: profile.phone_number, 
                    status: 'Order Placed',
                    delivery_info: deliveryDetails 
                })
                .select().single();
            
            if (orderError) throw orderError;
            
             const orderItemsToInsert = validItems.map(item => ({
                order_id: orderData.id, 
                product_id: item.id, 
                quantity: item.quantity, 
                price: item.price,
                product_name: item.name, 
                farmer_name: item.farmer?.full_name || 'Agribridge Farm'
            }));
            
            const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
             if (itemsError) {
                await supabase.from('orders').delete().eq('id', orderData.id);
                
                if (itemsError.code === '23503') {
                     throw new Error("One or more products in your cart are no longer available.");
                }
                throw itemsError;
            }

            const paystackConfig = {
                key: 'pk_live_6d7188a58160330b96bc001c2c9424cf8a476633', 
                email: customerEmail,
                amount: Math.round(totalAmount * 100), 
                currency: 'GHS',
                ref: orderData.id, 
                channels: paymentChannels, 
                metadata: {
                    custom_fields: [
                        { display_name: "Customer Name", variable_name: "customer_name", value: profile.full_name || '' },
                        { display_name: "Phone Number", variable_name: "phone_number", value: profile.phone_number || '' },
                        { display_name: "Payment Method", variable_name: "payment_method", value: specificChannel === 'mobile_money' ? 'Mobile Money' : 'Card/Other' }
                    ]
                },
                onClose: function() {
                     toast({ title: "Payment Cancelled", description: "You closed the payment window." });
                },
                callback: function(response) {
                    if (response.status === 'success') {
                         toast({ title: "Payment Successful! 🎉", description: "Your order has been confirmed." });
                         clearCart();
                         setIsCartOpen(false);
                         navigate('/my-orders');
                    } else {
                         toast({ variant: 'destructive', title: "Payment Failed", description: "Please try again." });
                    }
                }
            };
            
            const handler = window.PaystackPop.setup(paystackConfig);
            handler.openIframe();

        } catch (error) {
             console.error("Paystack Checkout Error:", error);
             toast({ variant: 'destructive', title: "Checkout Error", description: error.message || "There was a problem initializing payment." });
        }
    }, [cartItems, user, profile, toast, navigate, clearCart, setIsCartOpen]);

    const value = useMemo(() => ({
        cartItems, isCartOpen, setIsCartOpen, addToCart, removeFromCart, updateQuantity, clearCart, handleWhatsAppCheckout, handlePaystackCheckout
    }), [cartItems, isCartOpen, addToCart, removeFromCart, updateQuantity, clearCart, handleWhatsAppCheckout, handlePaystackCheckout]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
        
