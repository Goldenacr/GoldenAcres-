import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Target, Eye, Heart, Award } from 'lucide-react';

const AboutPage = () => {

  const staggeredFadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.5 }
  };
  
  return (
    <>
      <Helmet>
        <title>About Us - Golden Acres</title>
        <meta name="description" content="Learn about Golden Acres' mission to connect farmers with markets and transform agriculture in Ghana." />
      </Helmet>

      <motion.div 
        className="bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-green-600/80 to-yellow-500/80 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          />
          <motion.img 
            className="absolute inset-0 w-full h-full object-cover" 
            alt="Agricultural landscape" 
            src="https://images.unsplash.com/photo-1610798264694-1c2d2af785c6" 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          />
          
          <div className="relative z-20 text-center text-white px-4">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-5xl font-bold mb-4"
            >
              About Golden Acres
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="text-xl"
            >
              Transforming agriculture through technology and connection
            </motion.p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
                <motion.p {...staggeredFadeIn} transition={{ delay: 0.1, duration: 0.6 }} className="text-lg text-gray-600 mb-4">
                  Golden Acres was founded with a simple yet powerful vision: to create a direct connection between farmers and consumers, eliminating unnecessary middlemen and ensuring fair prices for all.
                </motion.p>
                <motion.p {...staggeredFadeIn} transition={{ delay: 0.2, duration: 0.6 }} className="text-lg text-gray-600 mb-4">
                  We recognized that farmers often struggle to access markets while consumers seek fresh, quality produce. By leveraging technology, we've built a platform that benefits everyone in the agricultural value chain.
                </motion.p>
                <motion.p {...staggeredFadeIn} transition={{ delay: 0.3, duration: 0.6 }} className="text-lg text-gray-600">
                  Today, we're proud to serve hundreds of farmers and thousands of customers across Ghana, delivering fresh produce and creating sustainable livelihoods.
                </motion.p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full h-[400px] rounded-lg shadow-xl overflow-hidden"
              >
                <motion.img 
                  className="w-full h-full object-cover" 
                  alt="Golden Acres team" 
                  src="https://images.unsplash.com/photo-1637622124152-33adfabcc923"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.4 }}
                />
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}
                className="bg-white p-8 rounded-lg shadow-lg"
              >
                <Target className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                <p className="text-gray-600">
                  To empower farmers by providing direct market access, fair pricing, and reliable logistics, while ensuring consumers receive fresh, quality produce at competitive prices.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}
                className="bg-white p-8 rounded-lg shadow-lg"
              >
                <Eye className="w-12 h-12 text-yellow-500 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                <p className="text-gray-600">
                  To become the leading agricultural marketplace in West Africa, transforming how food moves from farm to table and creating prosperity for farming communities.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2 {...staggeredFadeIn} className="text-4xl font-bold text-center text-gray-900 mb-12">Our Values</motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div {...staggeredFadeIn} transition={{ delay: 0.1 }} className="text-center">
                <Heart className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Integrity</h3>
                <p className="text-gray-600">
                  We operate with transparency and honesty in all our dealings with farmers and customers.
                </p>
              </motion.div>

              <motion.div {...staggeredFadeIn} transition={{ delay: 0.2 }} className="text-center">
                <Award className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Quality</h3>
                <p className="text-gray-600">
                  We ensure only the freshest, highest-quality produce reaches our customers.
                </p>
              </motion.div>

              <motion.div {...staggeredFadeIn} transition={{ delay: 0.3 }} className="text-center">
                <Target className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Impact</h3>
                <p className="text-gray-600">
                  We're committed to creating positive change in farming communities across Ghana.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </motion.div>
    </>
  );
};

export default AboutPage;