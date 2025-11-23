
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StarRating from '@/components/StarRating';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, MessageSquarePlus, Sparkles, Image as ImageIcon, X, UploadCloud, Reply, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Recursive Review Item Component
const ReviewItem = ({ review, onReply, currentUser, depth = 0 }) => {
    const [showReplies, setShowReplies] = useState(false);
    const isAdmin = review.user?.role === 'admin';
    
    // Limit indentation depth to prevent squishing on mobile
    const effectiveDepth = Math.min(depth, 3);
    const hasReplies = review.replies && review.replies.length > 0;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "group relative",
                depth > 0 ? "mt-3" : "bg-white p-6 rounded-2xl border hover:shadow-md transition-shadow mb-4"
            )}
            style={{ marginLeft: depth > 0 ? `${effectiveDepth * 1.5}rem` : 0 }}
        >
            <div className={cn(
                "flex items-start justify-between mb-3",
                depth > 0 && "pl-4 border-l-2 border-gray-100"
            )}>
                <div className="flex items-center gap-3">
                    <Avatar className={cn("border-2 border-white shadow-sm", depth > 0 ? "h-8 w-8" : "h-10 w-10")}>
                        <AvatarImage src={review.user?.avatar_url} />
                        <AvatarFallback className={cn(
                            "text-white",
                            isAdmin ? "bg-orange-600" : "bg-gradient-to-br from-blue-500 to-indigo-600"
                        )}>
                            {review.user?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <h5 className="font-semibold text-gray-900 text-sm">
                                {isAdmin ? "Golden Acres Team" : (review.user?.full_name || 'Anonymous User')}
                            </h5>
                            {isAdmin && (
                                <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-orange-200">
                                    <ShieldCheck className="w-3 h-3" />
                                    Official
                                </div>
                            )}
                        </div>
                        <span className="text-xs text-gray-500 block">
                            {review.created_at && !isNaN(new Date(review.created_at)) 
                                ? formatDistanceToNow(new Date(review.created_at), { addSuffix: true })
                                : 'Just now'}
                        </span>
                    </div>
                </div>
                {depth === 0 && (
                     <div className="bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                        <StarRating rating={review.rating} readonly size="sm" />
                    </div>
                )}
            </div>

            <div className={cn(
                depth > 0 && "pl-14" // Align text with avatar for replies
            )}>
                <p className={cn("text-gray-700 leading-relaxed whitespace-pre-wrap", depth > 0 ? "text-sm" : "text-base")}>
                    {review.comment}
                </p>
                
                {review.image_url && (
                    <div className="mt-3">
                        <img 
                            src={review.image_url} 
                            alt="Review attachment" 
                            className="h-32 w-auto rounded-xl border object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(review.image_url, '_blank')}
                        />
                    </div>
                )}

                <div className="mt-2 flex items-center gap-3">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-gray-500 hover:text-orange-600 px-2 -ml-2"
                        onClick={() => onReply(review)}
                    >
                        <Reply className="w-4 h-4 mr-1.5" /> Reply
                    </Button>

                    {hasReplies && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-blue-600 hover:text-blue-700 px-2"
                            onClick={() => setShowReplies(!showReplies)}
                        >
                            {showReplies ? (
                                <><ChevronUp className="w-4 h-4 mr-1" /> Hide Replies</>
                            ) : (
                                <><ChevronDown className="w-4 h-4 mr-1" /> View {review.replies.length} {review.replies.length === 1 ? 'Reply' : 'Replies'}</>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Recursive rendering of replies */}
            <AnimatePresence>
                {hasReplies && showReplies && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 mt-2 overflow-hidden"
                    >
                        {review.replies.map((reply) => (
                            <ReviewItem 
                                key={reply.id} 
                                review={reply} 
                                depth={depth + 1} 
                                onReply={onReply}
                                currentUser={currentUser}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const ProductReviews = ({ productId }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    
    // Form State
    const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
    const [reviewImage, setReviewImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    
    // Reply State
    const [replyingTo, setReplyingTo] = useState(null);

    // Helper to build tree from flat list
    const buildReviewTree = (flatReviews) => {
        const map = {};
        const roots = [];

        // 1. Create map of all items with initialized replies array
        flatReviews.forEach(review => {
            map[review.id] = { ...review, replies: [] };
        });

        // 2. Link children to parents
        flatReviews.forEach(review => {
            if (review.parent_id && map[review.parent_id]) {
                map[review.parent_id].replies.push(map[review.id]);
            } else if (!review.parent_id) {
                roots.push(map[review.id]);
            }
        });

        // 3. Sort replies by date (Oldest first for conversation flow)
        Object.values(map).forEach(item => {
            item.replies.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        });

        // 4. Sort roots by date (Newest first)
        roots.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return roots;
    };

    // Helper to add a new review to the existing tree state immutably
    const insertReviewIntoTree = (tree, newReviewItem) => {
        // If it's a root review, just prepend
        if (!newReviewItem.parent_id) {
            return [newReviewItem, ...tree];
        }

        // Recursive function to find parent and add child
        const updateNode = (nodes) => {
            return nodes.map(node => {
                if (node.id === newReviewItem.parent_id) {
                    // Return parent with new child
                    return {
                        ...node,
                        replies: [...(node.replies || []), newReviewItem]
                    };
                }
                if (node.replies && node.replies.length > 0) {
                    return {
                        ...node,
                        replies: updateNode(node.replies)
                    };
                }
                return node;
            });
        };

        return updateNode(tree);
    };

    const fetchReviews = useCallback(async (backgroundRefresh = false) => {
        if (!productId) return;
        if (!backgroundRefresh) setLoading(true);
        
        try {
            // 1. Fetch Reviews ONLY first (avoids join errors if FK is missing)
            const { data: reviewsData, error: reviewsError } = await supabase
                .from('product_reviews')
                .select('*')
                .eq('product_id', productId)
                .order('created_at', { ascending: true });

            if (reviewsError) throw reviewsError;

            // 2. Manually fetch user profiles for these reviews
            // This is robust against missing Foreign Keys in the database
            if (reviewsData && reviewsData.length > 0) {
                const userIds = [...new Set(reviewsData.map(r => r.user_id).filter(Boolean))];
                
                let profilesMap = {};
                
                if (userIds.length > 0) {
                    const { data: profilesData, error: profilesError } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, role')
                        .in('id', userIds);
                        
                    if (!profilesError && profilesData) {
                        profilesData.forEach(p => profilesMap[p.id] = p);
                    }
                }

                // 3. Merge reviews with profiles
                const combinedReviews = reviewsData.map(review => ({
                    ...review,
                    user: profilesMap[review.user_id] || { 
                        full_name: 'Anonymous User',
                        avatar_url: null,
                        role: 'customer'
                    }
                }));

                const tree = buildReviewTree(combinedReviews);
                setReviews(tree);
            } else {
                setReviews([]);
            }

        } catch (error) {
            console.error('Error fetching reviews:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load reviews.' });
        } finally {
            if (!backgroundRefresh) setLoading(false);
        }
    }, [productId, toast]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({ variant: 'destructive', title: 'File too large', description: 'Image must be less than 5MB' });
                return;
            }
            setReviewImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setReviewImage(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
    };

    const handleReplyClick = (review) => {
        if (!user) {
            toast({ title: "Login Required", description: "Please login to reply", variant: "destructive" });
            return;
        }
        setReplyingTo(review);
        setShowForm(true);
        setNewReview({ rating: 0, comment: '' });
        
        setTimeout(() => {
            const formElement = document.getElementById('review-form-container');
            if(formElement) formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    const handleCancelReply = () => {
        setReplyingTo(null);
        setShowForm(false);
        setNewReview({ rating: 0, comment: '' });
        removeImage();
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!user) {
            toast({ variant: 'destructive', title: 'Please login', description: 'You must be logged in to leave a review.' });
            return;
        }
        
        if (!replyingTo && newReview.rating === 0) {
            toast({ variant: 'destructive', title: 'Rating required', description: 'Please select a star rating.' });
            return;
        }

        if (!newReview.comment.trim()) {
            toast({ variant: 'destructive', title: 'Comment required', description: 'Please write something.' });
            return;
        }

        setSubmitting(true);
        let imageUrl = null;

        try {
            if (reviewImage) {
                const fileExt = reviewImage.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('review_images')
                    .upload(filePath, reviewImage);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('review_images')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
            }

            const payload = {
                user_id: user.id,
                product_id: productId,
                rating: replyingTo ? 0 : newReview.rating,
                comment: newReview.comment,
                image_url: imageUrl,
                parent_id: replyingTo ? replyingTo.id : null
            };

            const { data: insertedData, error } = await supabase
                .from('product_reviews')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;

            // Fetch fresh profile data for optimistic update to ensure role is correct
            const { data: profileData } = await supabase
                .from('profiles')
                .select('role, full_name, avatar_url')
                .eq('id', user.id)
                .single();

            // Optimistic Update Construction
            const optimisticReview = {
                ...insertedData,
                user: {
                    id: user.id,
                    full_name: profileData?.full_name || user.user_metadata?.full_name || 'Me',
                    avatar_url: profileData?.avatar_url || user.user_metadata?.avatar_url,
                    role: profileData?.role || user.user_metadata?.role || 'customer'
                },
                replies: []
            };

            // Manually update state immediately
            setReviews(prevReviews => insertReviewIntoTree(prevReviews, optimisticReview));

            // We also re-fetch to ensure consistency with server timestamps and triggers
            fetchReviews(true);

            toast({ title: 'Success', description: replyingTo ? 'Reply posted successfully!' : 'Your review has been posted!' });
            
            // Reset Form
            setNewReview({ rating: 0, comment: '' });
            removeImage();
            setShowForm(false);
            setReplyingTo(null);

        } catch (error) {
            console.error('Review submission error:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to post review' });
        } finally {
            setSubmitting(false);
        }
    };

    const averageRating = reviews.length > 0 
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
        : 0;

    return (
        <div className="mt-16 pt-8 border-t border-gray-200" id="reviews-section">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
                <div>
                    <h3 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        Product Reviews
                        <span className="text-lg font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {reviews.length}
                        </span>
                    </h3>
                    <div className="flex items-center mt-2 gap-4">
                         <div className="flex items-center gap-2">
                            <span className="text-4xl font-bold text-gray-900">{averageRating}</span>
                             <div className="flex flex-col">
                                <StarRating rating={Math.round(averageRating)} readonly size="sm" />
                                <span className="text-sm text-muted-foreground">Average Rating</span>
                             </div>
                         </div>
                    </div>
                </div>

                {!showForm && (
                    <motion.div 
                        whileHover={{ scale: 1.02 }} 
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button 
                            onClick={() => {
                                if(!user) {
                                    toast({ title: "Login Required", description: "Please login to write a review", variant: "destructive" });
                                    return;
                                }
                                setShowForm(true);
                            }}
                            size="lg" 
                            className="w-full md:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg text-lg px-8 py-6 rounded-xl transition-all duration-300"
                        >
                            <MessageSquarePlus className="mr-2 h-6 w-6" />
                            Write a Review
                        </Button>
                    </motion.div>
                )}
            </div>

            {/* Review/Reply Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        id="review-form-container"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden scroll-mt-32"
                    >
                        <div className={cn(
                            "p-8 rounded-2xl border shadow-sm mb-12 relative",
                            replyingTo ? "bg-blue-50 border-blue-100" : "bg-gradient-to-br from-orange-50 to-red-50 border-orange-100"
                        )}>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleCancelReply} 
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                            >
                                <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>

                            <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                {replyingTo ? (
                                    <><Reply className="text-blue-500" /> Replying to {replyingTo.user?.full_name || 'User'}</>
                                ) : (
                                    <><Sparkles className="text-orange-500" /> Share your experience</>
                                )}
                            </h4>
                            
                            <form onSubmit={handleSubmitReview} className="space-y-6">
                                {!replyingTo && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700">How would you rate this product?</label>
                                        <div className="bg-white p-4 rounded-xl border inline-block shadow-sm">
                                            <StarRating 
                                                rating={newReview.rating} 
                                                onRatingChange={(r) => setNewReview(prev => ({ ...prev, rating: r }))} 
                                                size="lg"
                                            />
                                        </div>
                                    </div>
                                )}
                                
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">
                                        {replyingTo ? 'Your Reply' : 'Your Review'}
                                    </label>
                                    <Textarea 
                                        placeholder={replyingTo ? "Write a helpful reply..." : "What did you like or dislike? How was the quality?"}
                                        value={newReview.comment}
                                        onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                                        className="bg-white min-h-[120px] text-lg p-4 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">Attach an Image (Optional)</label>
                                    
                                    {!imagePreview ? (
                                        <div 
                                            className="border-2 border-dashed border-orange-200 rounded-xl p-6 flex flex-col items-center justify-center bg-white/50 cursor-pointer hover:bg-white transition-colors"
                                            onClick={() => document.getElementById('review-image-upload').click()}
                                        >
                                            <UploadCloud className="h-10 w-10 text-orange-400 mb-2" />
                                            <p className="text-sm text-gray-600 font-medium">Click to upload a photo</p>
                                            <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB</p>
                                            <input 
                                                id="review-image-upload" 
                                                type="file" 
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageChange}
                                            />
                                        </div>
                                    ) : (
                                        <div className="relative inline-block">
                                            <img 
                                                src={imagePreview} 
                                                alt="Review preview" 
                                                className="h-32 w-32 object-cover rounded-xl border-2 border-orange-200 shadow-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <Button type="submit" disabled={submitting} className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-2 h-12 text-lg flex-1 md:flex-none">
                                        {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (replyingTo ? 'Post Reply' : 'Post Review')}
                                    </Button>
                                    {replyingTo && (
                                         <Button type="button" variant="outline" onClick={handleCancelReply} className="h-12 text-lg">
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reviews List */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-10 w-10 animate-spin text-gray-300" /></div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <div className="bg-white p-4 rounded-full inline-block shadow-sm mb-4">
                        <MessageSquarePlus className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">No reviews yet</h3>
                    <p className="text-muted-foreground mt-2">Be the first to share your thoughts on this product!</p>
                    {!showForm && (
                         <Button variant="link" onClick={() => setShowForm(true)} className="text-orange-600 mt-2">
                            Write the first review
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {reviews.map((review) => (
                        <ReviewItem 
                            key={review.id} 
                            review={review} 
                            onReply={handleReplyClick} 
                            currentUser={user} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductReviews;
