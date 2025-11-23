import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';

const CartContext = createContext();

export const useCart = () => {
    return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { toast } = useToast();
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    // Construct a unique key for the user's cart, or a guest key if not logged in
    const cartKey = useMemo(() => 
        user ? `golden_acres_cart_${user.id}` : 'golden_acres_cart_guest', 
    [user]);

    // Load cart when the user/key changes
    useEffect(() => {
        try {
            const localCart = localStorage.getItem(cartKey);
            if (localCart) {
                const parsedCart = JSON.parse(localCart);
                if (Array.isArray(parsedCart)) {
                    setCartItems(parsedCart);
                } else {
                    setCartItems([]);
                }
            } else {
                setCartItems([]);
            }
        } catch (error) {
            console.error("Failed to parse cart from localStorage", error);
            setCartItems([]);
        }
    }, [cartKey]);

    // Save cart whenever it changes
    useEffect(() => {
        if (cartKey) {
            localStorage.setItem(cartKey, JSON.stringify(cartItems));
        }
    }, [cartItems, cartKey]);
    
    const addToCart = useCallback((product, quantity = 1) => {
        if (!user) {
            toast({
                variant: 'destructive',
                title: "Please Login First",
                description: "You need to be logged in to add items to your cart.",
            });
            navigate('/login');
            return;
        }

        if (quantity <= 0) return;

        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);
            if (existingItem) {
                return prevItems.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
                );
            }
            return [...prevItems, { ...product, quantity }];
        });
        toast({
            title: "Added to Cart! 🛒",
            description: `${quantity} x ${product.name} has been added.`,
        });
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

    const handleWhatsAppCheckout = useCallback(async () => {
        if (cartItems.length === 0) {
            toast({ title: "Your cart is empty!" });
            return;
        }
        if (!user || !profile) {
            toast({ variant: 'destructive', title: "Not Logged In" });
            navigate('/login');
            return;
        }

        const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

        try {
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({ user_id: user.id, total_amount: subtotal, customer_name: profile.full_name, customer_phone: profile.phone_number, status: 'Order Placed' })
                .select()
                .single();
            if (orderError) throw orderError;
            
            const orderItemsToInsert = cartItems.map(item => ({
                order_id: orderData.id, product_id: item.id, quantity: item.quantity, price: item.price,
                product_name: item.name, farmer_name: item.farmer?.full_name || 'Golden Acres Farm'
            }));
            const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
            if (itemsError) {
                await supabase.from('orders').delete().eq('id', orderData.id); // Rollback
                throw itemsError;
            }

            let message = `*New Order from Golden Acres!* ✨\n\n*Order ID:* ${orderData.id.substring(0,8)}\n*Customer:* ${profile.full_name}\n\nI'd like to place an order for:\n\n`;
            cartItems.forEach(item => {
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
            toast({ variant: 'destructive', title: "Order Failed", description: error.message });
        }
    }, [cartItems, user, profile, toast, navigate, clearCart]);

    const value = useMemo(() => ({
        cartItems,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        handleWhatsAppCheckout,
    }), [cartItems, isCartOpen, addToCart, removeFromCart, updateQuantity, clearCart, handleWhatsAppCheckout]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};