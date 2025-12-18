
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

const presetAvatars = [
    'https://avatar.iran.liara.run/public/boy',
    'https://avatar.iran.liara.run/public/girl',
    'https://avatar.iran.liara.run/public/45',
    'https://avatar.iran.liara.run/public/95',
    'https://avatar.iran.liara.run/public/76',
];

const AvatarSelection = ({ isOpen, onOpenChange, onSave, currentAvatar }) => {
    const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = React.useRef(null);

    useEffect(() => {
        setSelectedAvatar(currentAvatar);
        setImageFile(null);
        setPreviewUrl(null);
    }, [isOpen, currentAvatar]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
                setSelectedAvatar(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        await onSave(imageFile, imageFile ? null : selectedAvatar);
        setLoading(false);
        onOpenChange(false);
    };

    const triggerFileSelect = () => fileInputRef.current.click();

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Choose Your Avatar</DialogTitle>
                    <DialogDescription>Select a preset avatar or upload your own image.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    <div className="flex justify-center">
                         <Avatar className="h-24 w-24 ring-2 ring-primary ring-offset-2 ring-offset-background">
                            <AvatarImage src={selectedAvatar} />
                            <AvatarFallback>AV</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                        {presetAvatars.map((url, index) => (
                            <motion.div
                                key={url}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Avatar
                                    className={`h-16 w-16 cursor-pointer ring-2 ring-offset-2 ring-offset-background transition-all ${selectedAvatar === url ? 'ring-primary' : 'ring-transparent'}`}
                                    onClick={() => { setSelectedAvatar(url); setImageFile(null); setPreviewUrl(null); }}
                                >
                                    <AvatarImage src={url} />
                                    <AvatarFallback>AV</AvatarFallback>
                                </Avatar>
                            </motion.div>
                        ))}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    <Button variant="outline" className="w-full" onClick={triggerFileSelect}>
                        <Upload className="mr-2 h-4 w-4" />
                        {imageFile ? `Selected: ${imageFile.name}` : 'Upload Custom Image'}
                    </Button>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Avatar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AvatarSelection;
