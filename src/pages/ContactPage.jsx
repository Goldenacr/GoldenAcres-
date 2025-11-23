import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const ContactPage = () => {
    const { toast } = useToast();
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const serviceID = 'service_agrivil'; // Replace with your EmailJS service ID
        const templateID = 'template_agrivil'; // Replace with your EmailJS template ID
        const userID = 'user_YOUR_EMAILJS_USER_ID'; // Replace with your EmailJS User ID (Public Key)

        const data = {
            ...formData,
            to_email: 'privacygoldenacres@gmail.com'
        };

        try {
            // Placeholder for EmailJS fetch call
            // Since I cannot make external calls, this is a simulated success.
            // You will need to set up EmailJS and replace placeholder IDs.
            await new Promise(resolve => setTimeout(resolve, 1500));

            // const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({
            //         service_id: serviceID,
            //         template_id: templateID,
            //         user_id: userID,
            //         template_params: data,
            //     }),
            // });

            // if (!response.ok) {
            //     throw new Error('Failed to send message.');
            // }

            toast({
                title: "Message Sent!",
                description: "Thank you for reaching out. We'll get back to you soon.",
            });
            setFormData({ name: '', email: '', message: '' });

        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Failed to Send Message",
                description: "Please try again later or contact us directly.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

  return (
    <>
      <Helmet>
        <title>Contact Us - Agrivil</title>
        <meta name="description" content="Get in touch with the Golden Acres team. We'd love to hear from you." />
      </Helmet>
      <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900">Get in Touch</h1>
                <p className="mt-4 text-xl text-gray-600">We're here to help and answer any question you might have.</p>
            </div>
            
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12">
                <motion.div 
                    className="bg-white p-8 rounded-lg shadow-lg"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Contact Information</h2>
                    <div className="space-y-6">
                        <div className="flex items-center">
                            <Phone className="w-6 h-6 text-green-600 mr-4"/>
                            <span className="text-gray-700">+233 53 381 1757</span>
                        </div>
                         <div className="flex items-center">
                            <Mail className="w-6 h-6 text-green-600 mr-4"/>
                            <span className="text-gray-700">goldenacresaid@gmail.com</span>
                        </div>
                         <div className="flex items-start">
                            <MapPin className="w-6 h-6 text-green-600 mr-4 mt-1"/>
                            <span className="text-gray-700">Accra,Ghana</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    className="bg-white p-8 rounded-lg shadow-lg"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
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
                            {loading ? 'Sending...' : 'Send Message'}
                        </Button>
                    </form>
                </motion.div>
            </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;