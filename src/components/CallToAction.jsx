import React from 'react';
import { motion } from 'framer-motion';

const CallToAction = () => {
  return (
    <motion.p
      className='text-md text-white max-w-lg mx-auto'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.8 }}
    >
      Let's turn your ideas into reality.
    </motion.p>
  );
};

export default CallToAction;