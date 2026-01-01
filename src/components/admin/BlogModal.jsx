
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Upload, Link as LinkIcon, FileVideo, X } from 'lucide-react';

const BlogModal = ({ isOpen, onOpenChange, post, onSave }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [activeVideoTab, setActiveVideoTab] = useState("url"); // "url" or "upload"
    
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            title: '',
            category: 'Agriculture',
            content: '',
            excerpt: '',
            image_url: '',
            video_url: ''
        }
    });

    const currentVideoUrl = watch('video_url');

    useEffect(() => {
        if (isOpen) {
            if (post) {
                reset({
                    title: post.title,
                    category: post.category || 'Agriculture',
                    content: post.content || '',
                    excerpt: post.excerpt || '',
                    image_url: post.image_url || '',
                    video_url: post.video_url || ''
                });
                // Detect if existing video is a stored file or external URL
                if (post.video_url && post.video_url.includes('blog_videos')) {
                    setActiveVideoTab("upload");
                } else {
                    setActiveVideoTab("url");
                }
            } else {
                reset({
                    title: '',
                    category: 'Agriculture',
                    content: '',
                    excerpt: '',
                    image_url: '',
                    video_url: ''
                });
                setActiveVideoTab("url");
            }
            setImageFile(null);
            setVideoFile(null);
        }
    }, [isOpen, post, reset]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) setImageFile(file);
    };

    const handleVideoFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (limit to 50MB for example)
            if (file.size > 50 * 1024 * 1024) {
                toast({ variant: "destructive", title: "File too large", description: "Video must be under 50MB" });
                return;
            }
            setVideoFile(file);
            // Clear URL input when file is selected to avoid confusion
            setValue('video_url', '');
        }
    };

    const uploadFile = async (file, bucket) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const onSubmit = async (data) => {
        if (!user) return;
        setLoading(true);
        try {
            let finalImageUrl = data.image_url;
            let finalVideoUrl = data.video_url;

            // Handle Image Upload
            if (imageFile) {
                finalImageUrl = await uploadFile(imageFile, 'review_images'); // Reusing existing bucket or create 'blog_images'
            }

            // Handle Video Upload if in upload tab and file selected
            if (activeVideoTab === 'upload' && videoFile) {
                finalVideoUrl = await uploadFile(videoFile, 'blog_videos');
            }

            const blogData = {
                title: data.title,
                category: data.category,
                content: data.content,
                excerpt: data.excerpt,
                image_url: finalImageUrl,
                video_url: finalVideoUrl,
                author_id: user.id,
                updated_at: new Date()
            };

            let error;
            if (post) {
                const { error: updateError } = await supabase
                    .from('blog_posts')
                    .update(blogData)
                    .eq('id', post.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('blog_posts')
                    .insert([{ ...blogData, created_at: new Date() }]);
                error = insertError;
            }

            if (error) throw error;

            toast({ title: post ? "Post updated!" : "Post created!" });
            onSave();
        } catch (error) {
            console.error('Error saving post:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{post ? 'Edit Blog Post' : 'Create New Blog Post'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" {...register('title', { required: 'Title is required' })} />
                            {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select 
                                onValueChange={(val) => setValue('category', val)} 
                                defaultValue={watch('category')}
                            >
                                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Agriculture">Agriculture</SelectItem>
                                    <SelectItem value="Technology">Technology</SelectItem>
                                    <SelectItem value="Farming Tips">Farming Tips</SelectItem>
                                    <SelectItem value="Market News">Market News</SelectItem>
                                    <SelectItem value="Success Stories">Success Stories</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Cover Image</Label>
                        <div className="flex items-center gap-4">
                            <Input type="file" accept="image/*" onChange={handleImageChange} className="cursor-pointer" />
                            {watch('image_url') && !imageFile && (
                                <div className="h-10 w-10 relative flex-shrink-0">
                                    <img src={watch('image_url')} alt="Preview" className="h-full w-full object-cover rounded" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 border rounded-md p-4 bg-gray-50/50">
                        <Label className="mb-2 block">Video Content (Optional)</Label>
                        <Tabs defaultValue="url" value={activeVideoTab} onValueChange={setActiveVideoTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="url"><LinkIcon className="w-4 h-4 mr-2"/> External URL</TabsTrigger>
                                <TabsTrigger value="upload"><FileVideo className="w-4 h-4 mr-2"/> Upload Video</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="url" className="space-y-2">
                                <Label htmlFor="video_url" className="text-xs text-muted-foreground">Paste a YouTube, Vimeo, or other video link</Label>
                                <Input 
                                    id="video_url" 
                                    placeholder="https://www.youtube.com/watch?v=..." 
                                    {...register('video_url')} 
                                    disabled={activeVideoTab !== 'url'}
                                />
                            </TabsContent>
                            
                            <TabsContent value="upload" className="space-y-2">
                                <Label htmlFor="video_file" className="text-xs text-muted-foreground">Upload a video file (MP4, WebM - Max 50MB)</Label>
                                <Input 
                                    id="video_file" 
                                    type="file" 
                                    accept="video/*" 
                                    onChange={handleVideoFileChange}
                                    className="cursor-pointer"
                                />
                                {activeVideoTab === 'upload' && !videoFile && currentVideoUrl && currentVideoUrl.includes('blog_videos') && (
                                     <div className="text-xs text-green-600 flex items-center mt-1">
                                        <FileVideo className="w-3 h-3 mr-1"/> Current video file loaded
                                     </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="excerpt">Short Excerpt</Label>
                        <Textarea id="excerpt" rows={2} {...register('excerpt')} placeholder="Brief summary of the post..." />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content">Full Content</Label>
                        <Textarea id="content" rows={8} {...register('content', { required: 'Content is required' })} placeholder="Write your blog post here..." />
                        {errors.content && <p className="text-red-500 text-xs">{errors.content.message}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Post'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default BlogModal;
      
