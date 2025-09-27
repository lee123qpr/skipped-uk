import { useState, useCallback } from 'react';
import { Upload, X, Video, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthContext';

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
  uploading?: boolean;
  uploaded?: boolean;
  url?: string;
}

interface MediaUploadProps {
  onFilesChange: (files: MediaFile[]) => void;
  maxImages?: number;
  maxVideos?: number;
  maxImageSize?: number; // in MB
  maxVideoSize?: number; // in MB
}

const MediaUpload = ({ 
  onFilesChange, 
  maxImages = 8, 
  maxVideos = 2, 
  maxImageSize = 10,
  maxVideoSize = 50 
}: MediaUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = (file: File): string | null => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      return 'Only image and video files are allowed';
    }

    if (isImage && file.size > maxImageSize * 1024 * 1024) {
      return `Image size must be less than ${maxImageSize}MB`;
    }

    if (isVideo && file.size > maxVideoSize * 1024 * 1024) {
      return `Video size must be less than ${maxVideoSize}MB`;
    }

    const imageCount = files.filter(f => f.type === 'image').length;
    const videoCount = files.filter(f => f.type === 'video').length;

    if (isImage && imageCount >= maxImages) {
      return `Maximum ${maxImages} images allowed`;
    }

    if (isVideo && videoCount >= maxVideos) {
      return `Maximum ${maxVideos} videos allowed`;
    }

    return null;
  };

  const uploadFileToStorage = async (file: File, mediaFile: MediaFile): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    try {
      const { data, error } = await supabase.storage
        .from('listing-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('listing-media')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const processFiles = useCallback(async (fileList: FileList) => {
    const newFiles: MediaFile[] = [];

    for (const file of Array.from(fileList)) {
      const error = validateFile(file);
      if (error) {
        toast({
          title: 'File validation error',
          description: error,
          variant: 'destructive',
        });
        continue;
      }

      const mediaFile: MediaFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith('image/') ? 'image' : 'video',
        uploading: false,
        uploaded: false,
      };

      newFiles.push(mediaFile);
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);

      // Start uploading files
      for (const mediaFile of newFiles) {
        const fileIndex = updatedFiles.findIndex(f => f.id === mediaFile.id);
        
        // Update uploading state
        setFiles(prev => prev.map(f => 
          f.id === mediaFile.id ? { ...f, uploading: true } : f
        ));

        const uploadedUrl = await uploadFileToStorage(mediaFile.file, mediaFile);
        
        if (uploadedUrl) {
          setFiles(prev => {
            const updated = prev.map(f => 
              f.id === mediaFile.id 
                ? { ...f, uploading: false, uploaded: true, url: uploadedUrl }
                : f
            );
            onFilesChange(updated);
            return updated;
          });
        } else {
          setFiles(prev => {
            const updated = prev.map(f => 
              f.id === mediaFile.id 
                ? { ...f, uploading: false, uploaded: false }
                : f
            );
            onFilesChange(updated);
            return updated;
          });
          
          toast({
            title: 'Upload failed',
            description: `Failed to upload ${mediaFile.file.name}`,
            variant: 'destructive',
          });
        }
      }
    }
  }, [files, maxImages, maxVideos, maxImageSize, maxVideoSize, toast, user, onFilesChange]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = useCallback(async (id: string) => {
    const fileToRemove = files.find(f => f.id === id);
    if (fileToRemove?.url && user) {
      // Extract file path from URL and delete from storage
      try {
        const path = fileToRemove.url.split('/').slice(-2).join('/');
        await supabase.storage.from('listing-media').remove([path]);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    URL.revokeObjectURL(fileToRemove?.preview || '');
    const updatedFiles = files.filter(f => f.id !== id);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  }, [files, user, onFilesChange]);

  const reorderFiles = useCallback((fromIndex: number, toIndex: number) => {
    const newFiles = [...files];
    const [reorderedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, reorderedFile);
    setFiles(newFiles);
    onFilesChange(newFiles);
  }, [files, onFilesChange]);

  const imageCount = files.filter(f => f.type === 'image').length;
  const videoCount = files.filter(f => f.type === 'video').length;
  const canAddImages = imageCount < maxImages;
  const canAddVideos = videoCount < maxVideos;
  const canAddFiles = canAddImages || canAddVideos;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Media ({imageCount} images, {videoCount} videos)</h3>
        <div className="text-sm text-muted-foreground">
          Max {maxImages} images, {maxVideos} videos
        </div>
      </div>

      {/* Upload area */}
      {canAddFiles && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
        >
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-medium mb-2">Upload Images & Videos</h4>
          <p className="text-muted-foreground mb-4">
            Drag and drop your files here, or click to browse
          </p>
          <div className="text-sm text-muted-foreground mb-4">
            Images: max {maxImageSize}MB each • Videos: max {maxVideoSize}MB each
          </div>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="media-upload"
          />
          <Button asChild variant="outline">
            <label htmlFor="media-upload" className="cursor-pointer">
              Choose Files
            </label>
          </Button>
        </div>
      )}

      {/* Media grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {files.map((mediaFile, index) => (
            <div key={mediaFile.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                {mediaFile.type === 'image' ? (
                  <img
                    src={mediaFile.preview}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <Video className="h-8 w-8 text-muted-foreground mb-2" />
                    <div className="text-xs text-muted-foreground text-center px-2">
                      {mediaFile.file.name}
                    </div>
                  </div>
                )}
                
                {/* Overlay for uploading state */}
                {mediaFile.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-sm">Uploading...</div>
                  </div>
                )}
                
                {/* Success indicator */}
                {mediaFile.uploaded && (
                  <div className="absolute top-2 left-2">
                    <div className="bg-green-500 text-white rounded-full p-1">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
                
                {/* Main indicator */}
                {index === 0 && (
                  <div className="absolute bottom-2 left-2">
                    <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Main
                    </div>
                  </div>
                )}
                
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeFile(mediaFile.id)}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                
                {/* Type indicator */}
                <div className="absolute bottom-2 right-2">
                  {mediaFile.type === 'image' ? (
                    <ImageIcon className="h-4 w-4 text-white/80" />
                  ) : (
                    <Video className="h-4 w-4 text-white/80" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaUpload;