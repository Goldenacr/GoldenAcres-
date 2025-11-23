import React from 'react';
import { motion } from 'framer-motion';

const HeroImage = () => {
  return (
    <motion.div 
      className='flex justify-center items-center'
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, ease: [0.6, 0.01, -0.05, 0.9] }}
    >
      <motion.img 
        src='https://horizons-cdn.hostinger.com/1ff2a2eb-9cef-439f-b1c4-73368cb28fdf/dee3e90e0fad3a78c5aad3fa165b27b3.jpg' 
        alt='Golden Acres Logo' 
        whileHover={{ scale: 1.05, filter: "brightness(1.1)" }}
        transition={{ duration: 0.4 }}
      />
    </motion.div>
  );
};

export default HeroImage;