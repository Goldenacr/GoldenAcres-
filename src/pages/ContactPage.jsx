import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Home, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

const ContactPage = () => {
    const { toast } = useToast();
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setLoading(false);
        toast({
            title: "Message Sent!",
            description: "Thank you for reaching out. We'll get back to you soon.",
        });
        setFormData({ name: '', email: '', message: '' });
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const staggerContainer = {
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { staggerChildren: 0.2 } },
    };

    const fadeInUp = {
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
    };

  return (
    <>
      <Helmet>
        <title>Contact Us - Golden Acres</title>
        <meta name="description" content="Get in touch with the Golden Acres team. We'd love to hear from you." />
      </Helmet>
      <motion.div 
        className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="max-w-7xl mx-auto">
            <motion.div variants={fadeInUp} initial="hidden" animate="show" className="text-center flex justify-between items-center mb-8">
                <div></div>
                <h1 className="text-4xl font-bold text-gray-900">Get in Touch</h1>
                <Button asChild variant="outline">
                    <Link to="/">
                        <Home className="h-4 w-4 mr-2" />
                        Home
                    </Link>
                </Button>
            </motion.div>
            <motion.p variants={fadeInUp} initial="hidden" animate="show" transition={{delay: 0.1}} className="mt-4 text-xl text-gray-600 text-center">We're here to help and answer any question you might have.</motion.p>
            
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12">
                <motion.div 
                    className="bg-white p-8 rounded-lg shadow-lg"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.3 }}
                >
                    <motion.h2 variants={fadeInUp} className="text-2xl font-bold text-gray-800 mb-6">Contact Information</motion.h2>
                    <div className="space-y-6">
                        <motion.div variants={fadeInUp} className="flex items-center">
                            <Phone className="w-6 h-6 text-green-600 mr-4"/>
                            <span className="text-gray-700">+256 777 123 456</span>
                        </motion.div>
                         <motion.div variants={fadeInUp} className="flex items-center">
                            <Mail className="w-6 h-6 text-green-600 mr-4"/>
                            <span className="text-gray-700">info@agrivil.ug</span>
                        </motion.div>
                         <motion.div variants={fadeInUp} className="flex items-start">
                            <MapPin className="w-6 h-6 text-green-600 mr-4 mt-1"/>
                            <span className="text-gray-700">123 Green Way, Kampala, Uganda</span>
                        </motion.div>
                    </div>
                </motion.div>

                <motion.div 
                    className="bg-white p-8 rounded-lg shadow-lg"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                >
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Send us a Message</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" type="text" placeholder="Your Name" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
                        </div>
                        <div>
                            <Label htmlFor="message">Message</Label>
                            <Textarea id="message" placeholder="Your message..." rows={5} value={formData.message} onChange={handleChange} required />
                        </div>
                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            {loading ? 'Sending...' : 'Send Message'}
                        </Button>
                    </form>
                </motion.div>
            </div>
        </div>
      </motion.div>
    </>
  );
};

export default ContactPage;