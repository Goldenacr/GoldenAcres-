
import React from 'react';
import { UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ImageUpload = ({ imageFile, onFileChange, existingImageUrl }) => {
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileChange(e.target.files[0]);
        }
    };
    
    const imageUrl = imageFile ? URL.createObjectURL(imageFile) : existingImageUrl;

    return (
        <div className="space-y-2">
            {imageUrl ? (
                <div className="relative group">
                    <img src={imageUrl} alt="Preview" className="w-full h-40 object-cover rounded-lg border" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="destructive" size="icon" onClick={() => onFileChange(null)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div 
                    className="flex justify-center items-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => document.getElementById('file-upload').click()}
                >
                    <div className="text-center">
                        <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Click to upload or drag & drop</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP</p>
                    </div>
                    <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
