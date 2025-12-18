import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <span className="text-2xl font-bold text-green-500">AGRIBRIDGE</span>
            <p className="mt-4 text-gray-400">
              Connecting farmers directly to markets, ensuring fresh produce and fair prices.
            </p>
          </div>

          <div>
            <span className="text-lg font-semibold mb-4 block">Quick Links</span>
            <div className="space-y-2">
              <Link to="/about" className="block text-gray-400 hover:text-green-500 transition">About Us</Link>
              <Link to="/marketplace" className="block text-gray-400 hover:text-green-500 transition">Marketplace</Link>
              <Link to="/farmer-onboarding" className="block text-gray-400 hover:text-green-500 transition">Become a Farmer</Link>
              <Link to="/blog" className="block text-gray-400 hover:text-green-500 transition">Blog</Link>
            </div>
          </div>

          <div>
            <span className="text-lg font-semibold mb-4 block">Contact</span>
            <div className="space-y-2 text-gray-400">
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                +233 53 381 1757
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                agribridge@gmail.com
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Ghana, Accra
              </p>
            </div>
          </div>

          <div>
            <span className="text-lg font-semibold mb-4 block">Follow Us</span>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-green-500 transition">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-green-500 transition">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-green-500 transition">
                <Instagram className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 AGRIBRIDGE. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
