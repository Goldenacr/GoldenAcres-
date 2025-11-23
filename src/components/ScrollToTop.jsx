import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    try {
      window.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      // Fallback for older browsers
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return (
    <motion.div
      className="fixed bottom-5 right-5 z-50"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      {/* This component is now invisible but provides the scroll-to-top functionality */}
    </motion.div>
  );
};

export default ScrollToTop;