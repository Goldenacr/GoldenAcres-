import React, { useMemo, useCallback } from 'react';
import { useCart } from '@/hooks/useCart';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ShoppingCart = () => {
    const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, clearCart, handleWhatsAppCheckout } = useCart();

    const subtotal = useMemo(() => 
        cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]);

    const handleCloseCart = useCallback(() => setIsCartOpen(false), [setIsCartOpen]);

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
    };

    const cartVariants = {
        hidden: { x: '100%', transition: { type: 'spring', damping: 30, stiffness: 300 } },
        visible: { x: '0%', transition: { type: 'spring', damping: 30, stiffness: 300 } },
    };
    
    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    <motion.div
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        onClick={handleCloseCart}
                    />
                    <motion.div
                        variants={cartVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
                    >
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold">Shopping Cart</h2>
                            <Button variant="ghost" size="icon" onClick={handleCloseCart}>
                                <X className="h-6 w-6" />
                            </Button>
                        </div>

                        {cartItems.length > 0 ? (
                            <>
                                <motion.div 
                                    className="flex-1 p-6 space-y-4 overflow-y-auto"
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        visible: { transition: { staggerChildren: 0.05 } }
                                    }}
                                >
                                    <AnimatePresence>
                                    {cartItems.map(item => (
                                        <motion.div 
                                            key={item.id} 
                                            layout
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -50, transition: { duration: 0.3 } }}
                                            className="flex items-center space-x-4"
                                        >
                                            <img src={item.image_url} alt={item.name} className="w-20 h-20 rounded-md object-cover border" loading="lazy" />
                                            <div className="flex-1">
                                                <p className="font-semibold">{item.name}</p>
                                                <p className="text-sm text-gray-500">GHS {Number(item.price).toLocaleString()}</p>
                                                <div className="flex items-center space-x-2 mt-2">
                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                                                    <span className="w-8 text-center">{item.quantity}</span>
                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                                                <Trash2 className="h-5 w-5 text-red-500" />
                                            </Button>
                                        </motion.div>
                                    ))}
                                    </AnimatePresence>
                                </motion.div>

                                <motion.div 
                                    className="p-6 border-t space-y-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0, transition: { delay: cartItems.length * 0.05 + 0.2 } }}
                                >
                                    <div className="flex justify-between font-semibold text-lg">
                                        <span>Subtotal</span>
                                        <span>GHS {subtotal.toLocaleString()}</span>
                                    </div>
                                    <Button onClick={handleWhatsAppCheckout} className="w-full bg-primary hover:bg-primary/90" size="lg">
                                        Checkout
                                    </Button>
                                    <Button variant="outline" className="w-full" onClick={clearCart}>
                                        Clear Cart
                                    </Button>
                                </motion.div>
                            </>
                        ) : (
                            <motion.div 
                                className="flex-1 flex flex-col items-center justify-center p-6 text-center"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                                    <ShoppingBag className="w-24 h-24 text-gray-300 mb-4" />
                                </motion.div>
                                <h3 className="text-xl font-semibold">Your cart is empty</h3>
                                <p className="text-gray-500 mt-2 mb-6">Looks like you haven't added anything yet.</p>
                                <Button asChild onClick={handleCloseCart}>
                                    <Link to="/marketplace">Start Shopping</Link>
                                </Button>
                            </motion.div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ShoppingCart;