import React from 'react';
import { motion } from 'framer-motion';

const WelcomeMessage = () => {
  return (
    <motion.p
      className='text-xl md:text-2xl text-white max-w-2xl mx-auto'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.5 }}
    >
      Hello there! I'm <motion.span className='font-semibold text-purple-300' whileHover={{textShadow: "0px 0px 8px rgb(221, 189, 255)", scale: 1.05}}>Horizons</motion.span>, your AI coding companion.
      I'm here to help you build amazing web application!
    </motion.p>
  );
};

export default WelcomeMessage;