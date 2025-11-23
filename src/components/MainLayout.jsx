import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ShoppingCart from '@/components/ShoppingCart';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -20,
  }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5
};

const MainLayout = ({ children }) => {
  const location = useLocation();
  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          className="flex-grow"
          variants={pageVariants}
          initial="initial"
          animate="in"
          exit="out"
          transition={pageTransition}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <Footer />
      <ShoppingCart />
    </div>
  );
};

export default MainLayout;