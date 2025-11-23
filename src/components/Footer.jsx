import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const FooterLink = ({ to, children }) => (
    <Link to={to} className="block text-gray-400 hover:text-green-400 transition-colors duration-300 relative group">
        <span>{children}</span>
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
    </Link>
);

const SocialIcon = ({ href, icon: Icon, delay }) => (
    <motion.a 
      href={href} 
      className="text-gray-400 hover:text-green-400 transition-colors duration-300"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: delay, type: 'spring', stiffness: 300 }}
      whileHover={{ scale: 1.2, rotate: 5 }}
    >
        <Icon className="w-6 h-6" />
    </motion.a>
);

const Footer = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' } }
  };

  return (
    <footer className="bg-gray-900 text-white">
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <motion.div variants={item}>
            <span className="text-2xl font-bold text-green-500">Golden Acres</span>
            <p className="mt-4 text-gray-400">
              Connecting farmers directly to markets, ensuring fresh produce and fair prices.
            </p>
          </motion.div>

          <motion.div variants={item}>
            <span className="text-lg font-semibold mb-4 block">Quick Links</span>
            <div className="space-y-2">
              <FooterLink to="/about">About Us</FooterLink>
              <FooterLink to="/marketplace">Marketplace</FooterLink>
              <FooterLink to="/farmer-onboarding">Become a Farmer</FooterLink>
              <FooterLink to="/blog">Blog</FooterLink>
            </div>
          </motion.div>

          <motion.div variants={item}>
            <span className="text-lg font-semibold mb-4 block">Contact</span>
            <div className="space-y-3 text-gray-400">
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-500" />
                <span>+256 700 000 000</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-green-500" />
                <span>info@goldenacres.com</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-500" />
                <span>Kampala, Uganda</span>
              </p>
            </div>
          </motion.div>

          <motion.div variants={item}>
            <span className="text-lg font-semibold mb-4 block">Follow Us</span>
            <div className="flex space-x-4">
              <SocialIcon href="#" icon={Facebook} delay={0} />
              <SocialIcon href="#" icon={Twitter} delay={0.1} />
              <SocialIcon href="#" icon={Instagram} delay={0.2} />
            </div>
          </motion.div>
        </div>

        <motion.div 
          className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <p>&copy; 2025 Golden Acres. All rights reserved.</p>
        </motion.div>
      </motion.div>
    </footer>
  );
};

export default Footer;