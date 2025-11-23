import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingCart, Users, Leaf } from 'lucide-react';

const FeatureCard = ({ icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true, amount: 0.5 }}
    whileHover={{ y: -10, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}
    className="bg-white/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border text-center"
  >
    <motion.div 
      className="inline-block p-4 bg-primary text-white rounded-full mb-4"
      whileHover={{ scale: 1.1, rotate: 15 }}
    >
      {icon}
    </motion.div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </motion.div>
);

const HomePage = () => {
  return (
    <>
      <Helmet>
        <title>Golden Acres - Fresh Farm Produce Directly to You</title>
        <meta name="description" content="Golden Acres connects you with local farmers to bring fresh, quality produce directly to your doorstep. Explore our marketplace for a farm-to-table experience." />
      </Helmet>
      <div className="space-y-24 pb-24 overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 text-center overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-green-200/30 via-yellow-200/30 to-emerald-200/30 blur-3xl"></div>
            <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.2 } },
                }}
                className="relative z-10 max-w-4xl mx-auto px-4"
            >
                <motion.h1
                    className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-4"
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
                >
                    From Our Fields to Your Table
                </motion.h1>
                <motion.p 
                    className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-8"
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
                >
                    Discover the freshest produce from Ghana's finest farmers. Golden Acres brings you closer to the source, ensuring quality, freshness, and community support.
                </motion.p>
                <motion.div 
                    className="flex justify-center gap-4"
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
                >
                    <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-lg">
                        <Link to="/marketplace">
                            Shop Now <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="bg-white/70">
                        <Link to="/about">
                            Learn More
                        </Link>
                    </Button>
                </motion.div>
            </motion.div>
             <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
        </section>

        {/* Features Section */}
        <section className="max-w-6xl mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-800">Why Choose Golden Acres?</h2>
            <p className="text-lg text-gray-600 mt-2">The best way to experience farm-fresh goodness.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Leaf size={28} />}
              title="Unbeatable Freshness"
              description="Harvested and delivered with care, our produce comes straight from the farm, ensuring maximum flavor and nutrition."
              delay={0.1}
            />
            <FeatureCard
              icon={<Users size={28} />}
              title="Support Local Farmers"
              description="Every purchase directly supports local Ghanaian farmers and their communities, fostering a sustainable agricultural future."
              delay={0.2}
            />
            <FeatureCard
              icon={<ShoppingCart size={28} />}
              title="Convenient Marketplace"
              description="Browse, select, and order with ease. Get the best of the farm delivered right to your preferred location."
              delay={0.3}
            />
          </div>
        </section>

        {/* How It Works Section */}
        <section className="max-w-6xl mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
                <h2 className="text-4xl font-bold text-gray-800">Simple, Fast, and Fresh</h2>
                <p className="text-lg text-gray-600 mt-2">Three easy steps to get fresh produce.</p>
            </motion.div>
             <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
             >
                <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }} className="p-4">
                    <div className="text-5xl font-bold text-primary/30 mb-2">1</div>
                    <h3 className="text-xl font-semibold mb-2">Browse the Marketplace</h3>
                    <p className="text-gray-600">Explore a wide variety of fresh produce from our trusted network of farmers.</p>
                </motion.div>
                 <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }} className="p-4">
                    <div className="text-5xl font-bold text-primary/30 mb-2">2</div>
                    <h3 className="text-xl font-semibold mb-2">Place Your Order</h3>
                    <p className="text-gray-600">Add items to your cart and check out in just a few clicks. It's that simple.</p>
                </motion.div>
                 <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }} className="p-4">
                    <div className="text-5xl font-bold text-primary/30 mb-2">3</div>
                    <h3 className="text-xl font-semibold mb-2">Get it Delivered</h3>
                    <p className="text-gray-600">Your order is harvested, packed, and delivered fresh to your door or a hub near you.</p>
                </motion.div>
            </motion.div>
        </section>
        
        {/* Call to Action */}
        <section className="max-w-5xl mx-auto px-4">
          <motion.div 
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-xl p-12 text-center"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <h2 className="text-4xl font-bold mb-4">Ready to Taste the Difference?</h2>
            <p className="text-xl mb-8">Join our community and experience the joy of truly fresh food.</p>
            <Button asChild size="lg" variant="secondary" className="bg-yellow-400 hover:bg-yellow-500 text-green-900">
              <Link to="/register">
                Become a Customer
              </Link>
            </Button>
          </motion.div>
        </section>
      </div>
    </>
  );
};

export default HomePage;