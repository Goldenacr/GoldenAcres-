import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, Home } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }
        
        setPosts(data);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Failed to load blog posts', description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [toast]);
  
  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Blog - Golden Acres</title>
        <meta name="description" content="Read the latest news, articles, and insights on agriculture, technology, and community from Golden Acres." />
      </Helmet>
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-12 flex justify-between items-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
                <div></div>
                <h1 className="text-5xl font-bold text-gray-900">Golden Acres Blog</h1>
                <Button asChild variant="outline">
                    <Link to="/">
                        <Home className="h-4 w-4 mr-2" />
                        Home
                    </Link>
                </Button>
            </motion.div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              </div>
            ) : posts.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                  {posts.map((post) => (
                      <motion.div 
                          key={post.id}
                          className="bg-card/90 backdrop-blur-sm rounded-xl shadow-xl border overflow-hidden group"
                          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                          transition={{ duration: 0.5 }}
                          whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}
                      >
                          <Link to={`/blog/${post.id}`}>
                              <div className="h-56 bg-gray-200 overflow-hidden">
                                  <motion.img 
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                    alt={post.title} 
                                    src={post.image_url || 'https://images.unsplash.com/photo-1595872018818-97555653a011'}
                                    loading="lazy"
                                    whileHover={{scale: 1.1}}
                                    transition={{duration: 0.4}}
                                  />
                              </div>
                              <div className="p-6">
                                  <p className="text-sm text-primary font-semibold mb-2">{post.category}</p>
                                  <h2 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-primary transition-colors">{post.title}</h2>
                                  <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                                  <div className="flex justify-between items-center text-sm text-gray-500 mt-auto pt-4 border-t">
                                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                      <motion.span 
                                        className="flex items-center font-semibold text-primary"
                                        initial={{ x: 0 }}
                                        whileHover={{ x: 5 }}
                                        transition={{type: 'spring', stiffness: 400}}
                                      >
                                          Read More <ArrowRight className="w-4 h-4 ml-1" />
                                      </motion.span>
                                  </div>
                              </div>
                          </Link>
                      </motion.div>
                  ))}
              </motion.div>
            ) : (
              <motion.div 
                className="text-center py-16 bg-card/80 backdrop-blur-sm rounded-xl border"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <h2 className="text-2xl font-semibold text-gray-700">No Blog Posts Yet</h2>
                <p className="text-gray-500 mt-2">Check back later for news and updates!</p>
              </motion.div>
            )}
        </div>
      </div>
    </>
  );
};

export default BlogPage;