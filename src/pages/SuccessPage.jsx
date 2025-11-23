import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft, Home, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SuccessPage = () => {
  const location = useLocation();
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    // Try to get orderId from state (if navigated from checkout)
    if (location.state?.orderId) {
      setOrderId(location.state.orderId);
    } 
    // Fallback: try to get from URL query params (e.g. /success?orderId=...)
    else {
      const searchParams = new URLSearchParams(location.search);
      const id = searchParams.get('orderId');
      if (id) setOrderId(id);
    }
  }, [location]);

  return (
    <>
      <Helmet>
        <title>Payment Successful - Golden Acres</title>
        <meta name="description" content="Your order has been placed successfully." />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl text-center max-w-lg w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
          >
            <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-6" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-bold text-gray-800 mb-4"
          >
            Payment Successful!
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-gray-600 text-lg mb-8"
          >
            Thank you for your order. We've received your payment and your items will be on their way shortly.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col gap-3"
          >
            {/* Prominent Tracking Button */}
            <Button asChild size="lg" className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-md text-lg h-14">
                <Link to={orderId ? `/track-order/${orderId}` : "/my-orders"}>
                    <PackageSearch className="mr-2 h-6 w-6" />
                    {orderId ? "Track Your Order" : "Track My Orders"}
                </Link>
            </Button>

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <Button asChild variant="outline" className="flex-1">
                    <Link to="/marketplace">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Continue Shopping
                    </Link>
                </Button>
                <Button asChild variant="ghost" className="flex-1">
                    <Link to="/">
                        <Home className="mr-2 h-4 w-4" />
                        Back Home
                    </Link>
                </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default SuccessPage;