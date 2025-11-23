import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const BlogPostDetailPage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [post, setPost] = useState(null);
  const [authorName, setAuthorName] = useState('Golden Acres Admin');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const { data: postData, error: postError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('id', id)
          .single();

        if (postError) throw postError;
        setPost(postData);

        if (postData.author_id) {
          const { data: authorData, error: authorError } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', postData.author_id)
            .single();

          if (authorError) {
            console.warn('Could not fetch author name:', authorError.message);
          } else if (authorData) {
            setAuthorName(authorData.full_name);
          }
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Failed to load post', description: error.message });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id, toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold text-gray-700">Post not found.</h2>
        <Button asChild className="mt-4">
          <Link to="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${post.title} - Golden Acres Blog`}</title>
        <meta name="description" content={post.excerpt} />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ staggerChildren: 0.1 }}
        >
          <div className="mb-8">
            <Button asChild variant="ghost">
              <Link to="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to all posts
              </Link>
            </Button>
          </div>

          <article>
            <motion.div variants={{hidden: {opacity: 0, y: 20}, visible: {opacity: 1, y: 0}}} initial="hidden" animate="visible" transition={{delay: 0.1}}>
              <span className="text-primary font-semibold">{post.category}</span>
            </motion.div>
            <motion.h1 
              className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4"
              variants={{hidden: {opacity: 0, y: 20}, visible: {opacity: 1, y: 0}}} initial="hidden" animate="visible" transition={{ delay: 0.2 }}
            >
              {post.title}
            </motion.h1>

            <motion.div 
              className="flex items-center space-x-4 text-sm text-gray-500 mb-6"
              variants={{hidden: {opacity: 0, y: 20}, visible: {opacity: 1, y: 0}}} initial="hidden" animate="visible" transition={{ delay: 0.3 }}
            >
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1.5" />
                <span>{authorName}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1.5" />
                <span>{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </motion.div>
            
            <AnimatePresence>
            {post.image_url && (
              <motion.div 
                className="w-full h-auto max-h-[500px] object-cover rounded-2xl shadow-lg mb-8 overflow-hidden"
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                transition={{ delay: 0.4, duration: 0.7, ease: "easeInOut" }}
              >
                  <motion.img 
                    src={post.image_url} 
                    alt={post.title} 
                    className="w-full h-full object-cover"
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, duration: 1 }}
                  />
              </motion.div>
            )}
            </AnimatePresence>

            <motion.div 
              className="prose lg:prose-xl max-w-none"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            >
              <p className="text-lg italic text-gray-600 mb-8">{post.excerpt}</p>
              <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }} />
            </motion.div>
          </article>
        </motion.div>
      </div>
    </>
  );
};

export default BlogPostDetailPage;