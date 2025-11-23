import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom'; // Added Link
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart, Home } from 'lucide-react'; // Added Home icon

const CheckoutPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { cartItems, handleWhatsAppCheckout, loading: cartLoading } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout - Golden Acres</title>
        <meta name="description" content="Complete your purchase with Golden Acres." />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8 flex justify-between items-center">
          <div></div> {/* Spacer for left alignment */}
          <h1 className="text-4xl font-bold text-gray-800">Checkout</h1>
          <Button asChild variant="outline">
              <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Home
              </Link>
          </Button>
        </div>
        <p className="text-lg text-gray-600 mt-2 text-center">Review your order and complete your purchase.</p>

        <div className="bg-card/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border">
          <h2 className="text-2xl font-semibold mb-6 border-b pb-4">Order Summary</h2>
          
          <div className="space-y-4 mb-6">
            {cartItems.length > 0 ? (
              cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} x GHS {Number(item.price).toLocaleString()}
                    </p>
                  </div>
                  <p className="font-semibold">GHS {(item.quantity * item.price).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">Your cart is empty.</p>
            )}
          </div>

          {cartItems.length > 0 && (
            <>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <p className="text-gray-600">Subtotal</p>
                  <p>GHS {subtotal.toLocaleString()}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-600">Delivery Fee</p>
                  <p>Calculated at next step</p>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                  <p>Total</p>
                  <p>GHS {subtotal.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-8">
                <Button 
                  onClick={handleWhatsAppCheckout} 
                  className="w-full bg-primary hover:bg-primary/90" 
                  size="lg"
                  disabled={cartLoading}
                >
                  {cartLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="mr-2 h-5 w-5" />
                  )}
                  {cartLoading ? 'Processing...' : 'Complete Order via WhatsApp'}
                </Button>
                <p className="text-xs text-center text-gray-500 mt-2">
                  You will be redirected to WhatsApp to finalize your order with our team.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;