import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Truck, Package, ShieldCheck, MapPin, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const LogisticsPage = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.5 },
    transition: { duration: 0.7, ease: "easeOut" }
  };

  return (
    <>
      <Helmet>
        <title>Logistics Services - Golden Acres</title>
        <meta name="description" content="Learn about our efficient logistics, packaging, and delivery services that connect farms to your table." />
      </Helmet>

      <motion.div 
        className="bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/80 to-yellow-500/80 z-10"></div>
          <motion.img 
            className="absolute inset-0 w-full h-full object-cover" 
            alt="Agrivil delivery truck on a road" 
            src="https://images.unsplash.com/photo-1612977879188-a89c1f82b33b"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
          <div className="relative z-20 text-center text-white px-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-5xl font-bold mb-4"
            >
              Our Logistics Network
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="text-xl max-w-2xl mx-auto"
            >
              Seamlessly connecting farms to your doorstep with care and efficiency.
            </motion.p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="text-center mb-12 flex justify-between items-center">
                <div></div>
                <h2 className="text-4xl font-bold text-gray-900">How We Deliver Freshness</h2>
                <Button asChild variant="outline">
                    <Link to="/">
                        <Home className="h-4 w-4 mr-2" />
                        Home
                    </Link>
                </Button>
            </motion.div>
            <motion.p {...fadeInUp} transition={{delay: 0.1, ...fadeInUp.transition}} className="text-xl text-gray-600 text-center -mt-8 mb-12">A reliable system built on three core pillars.</motion.p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <motion.div {...fadeInUp} transition={{delay: 0.2, ...fadeInUp.transition}} className="text-center p-8 bg-gray-50 rounded-lg shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <Truck className="w-16 h-16 mx-auto text-green-600 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Efficient Transport</h3>
                <p className="text-gray-600">
                  Our modern, refrigerated fleet ensures produce is transported from the farm to our hubs while maintaining optimal temperature and freshness.
                </p>
              </motion.div>
              <motion.div {...fadeInUp} transition={{delay: 0.3, ...fadeInUp.transition}} className="text-center p-8 bg-gray-50 rounded-lg shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <Package className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Smart Packaging</h3>
                <p className="text-gray-600">
                  We use eco-friendly and protective packaging materials to prevent spoilage, reduce waste, and preserve the quality of every item.
                </p>
              </motion.div>
              <motion.div {...fadeInUp} transition={{delay: 0.4, ...fadeInUp.transition}} className="text-center p-8 bg-gray-50 rounded-lg shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <ShieldCheck className="w-16 h-16 mx-auto text-green-600 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Last-Mile Delivery</h3>
                <p className="text-gray-600">
                  Our trained delivery partners handle the final leg of the journey, ensuring your order arrives on time and in perfect condition.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30, scale: 0.95 }}
                        whileInView={{ opacity: 1, x: 0, scale: 1 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="overflow-hidden rounded-lg shadow-xl"
                    >
                         <motion.img 
                            className="w-full h-[400px] object-cover" 
                            alt="Map showing delivery routes" 
                            src="https://images.unsplash.com/photo-1601037295085-6c17aa4e40a7"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.4 }}
                         />
                    </motion.div>
                     <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                     >
                        <MapPin className="w-12 h-12 text-green-600 mb-4" />
                        <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Coverage</h2>
                        <p className="text-lg text-gray-600 mb-4">
                            Golden Acres' logistics network is constantly expanding. We currently serve major urban centers and are actively working to bring fresh produce to more communities across Ghana.
                        </p>
                        <p className="text-lg text-gray-600">
                            Our strategically placed collection hubs ensure we can quickly gather produce from remote farms and begin the journey to your table without delay.
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>

      </motion.div>
    </>
  );
};

export default LogisticsPage;