
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Star, MessageSquare, Reply, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ReviewsTab = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [submittingReply, setSubmittingReply] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const { toast } = useToast();

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const { data: reviewsData, error: reviewsError } = await supabase
                .from('product_reviews')
                .select(`
                    *,
                    product:products(name)
                `)
                .order('created_at', { ascending: false });
            
            if (reviewsError) throw reviewsError;

            if (!reviewsData || reviewsData.length === 0) {
                setReviews([]);
                setLoading(false);
                return;
            }

            const userIds = [...new Set(reviewsData.map(r => r.user_id).filter(Boolean))];
            
            let profilesMap = {};
            if (userIds.length > 0) {
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', userIds);
                
                if (profilesError) {
                    console.warn("Could not fetch profiles:", profilesError);
                } else if (profilesData) {
                    profilesData.forEach(profile => {
                        profilesMap[profile.id] = profile;
                    });
                }
            }

            const combinedReviews = reviewsData.map(review => ({
                ...review,
                user: profilesMap[review.user_id] || { full_name: 'Unknown User' }
            }));

            setReviews(combinedReviews);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            toast({ variant: 'destructive', title: 'Error fetching reviews', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleDelete = async (id) => {
        try {
            const { error } = await supabase.from('product_reviews').delete().eq('id', id);
            if (error) throw error;

            toast({ title: 'Review deleted' });
            setReviews(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    const handleReplySubmit = async () => {
        if (!replyText.trim()) {
            toast({ variant: "destructive", title: "Error", description: "Reply cannot be empty" });
            return;
        }

        setSubmittingReply(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase
                .from('product_reviews')
                .insert({
                    user_id: user.id,
                    product_id: replyingTo.product_id,
                    parent_id: replyingTo.id,
                    comment: replyText,
                    rating: 0
                });

            if (error) throw error;

            toast({ title: "Reply sent successfully" });
            setDialogOpen(false);
            setReplyText("");
            setReplyingTo(null);
            fetchReviews();
        } catch (error) {
            console.error("Error submitting reply:", error);
            toast({ variant: "destructive", title: "Failed to reply", description: error.message });
        } finally {
            setSubmittingReply(false);
        }
    };

    const openReplyDialog = (review) => {
        setReplyingTo(review);
        setReplyText("");
        setDialogOpen(true);
    };

    if (loading) return <div className="py-12 text-center text-muted-foreground">Loading reviews...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-xl font-semibold">Product Reviews</h3>
                <span className="text-sm text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                    {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
                </span>
            </div>
            
            <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 text-left font-medium text-muted-foreground w-[20%]">Product</th>
                                <th className="p-4 text-left font-medium text-muted-foreground w-[15%]">Reviewer</th>
                                <th className="p-4 text-left font-medium text-muted-foreground w-[10%]">Rating</th>
                                <th className="p-4 text-left font-medium text-muted-foreground w-[30%]">Comment</th>
                                <th className="p-4 text-left font-medium text-muted-foreground w-[10%]">Date</th>
                                <th className="p-4 text-right font-medium text-muted-foreground w-[15%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {reviews.map((review, index) => (
                                <motion.tr
                                    key={review.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.03 }}
                                    className={cn("bg-white hover:bg-gray-50/50 transition-colors", review.parent_id && "bg-gray-50/50")}
                                >
                                    <td className="p-4 font-medium text-gray-900">
                                        {review.parent_id && <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded mr-2 text-gray-600">Reply</span>}
                                        {review.product?.name || <span className="text-muted-foreground italic">Product Deleted</span>}
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        {review.user?.full_name || <span className="text-muted-foreground italic">Anonymous</span>}
                                    </td>
                                    <td className="p-4">
                                        {!review.parent_id ? (
                                            <div className="flex items-center gap-1.5 bg-yellow-50 w-fit px-2.5 py-1 rounded-full border border-yellow-100">
                                                <span className="font-bold text-yellow-700">{review.rating}</span>
                                                <Star className="h-3.5 w-3.5 text-yellow-500 fill-current" />
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-start gap-2">
                                            <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                                            <span className="text-gray-600 italic line-clamp-2">
                                                "{review.comment || 'No written comment'}"
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground whitespace-nowrap">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        {!review.parent_id && (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 rounded-full"
                                                onClick={() => openReplyDialog(review)}
                                            >
                                                <Reply className="h-4 w-4" />
                                            </Button>
                                        )}
                                        
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600 rounded-full">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Review?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to delete this review? This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(review.id)} className="bg-destructive hover:bg-destructive/90">
                                                        Delete Review
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reply to Review</DialogTitle>
                        <DialogDescription>
                            Replying as <span className="font-semibold text-orange-600">Agribridge Team</span>. Your reply will be marked as official.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="p-3 bg-gray-50 rounded-lg border text-sm text-gray-600 italic">
                            "{replyingTo?.comment}"
                        </div>
                        <div className="space-y-2">
                            <Textarea
                                placeholder="Type your reply here..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleReplySubmit} disabled={submittingReply} className="bg-orange-600 hover:bg-orange-700">
                            {submittingReply ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Reply className="mr-2 h-4 w-4" />}
                            Send Reply
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {reviews.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed">
                    <div className="bg-white p-4 rounded-full inline-block shadow-sm mb-4">
                        <Star className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No reviews yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mt-1">
                        Product reviews from your customers will appear here once they start submitting feedback.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ReviewsTab;
