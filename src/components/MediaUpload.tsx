import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, X, Video, Image as ImageIcon, GripVertical, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthContext';
import { compressImage } from '@/utils/fileUtils';

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  thumbnail?: string; // Video thumbnail
  type: 'image' | 'video';
  uploading?: boolean;
  uploaded?: boolean;
  url?: string;
  order: number; // For drag & drop ordering
}

export type { MediaFile };

interface MediaUploadProps {
  onFilesChange: (files: MediaFile[]) => void;
  maxImages?: number;
  maxVideos?: number;
  maxImageSize?: number; // in MB
  maxVideoSize?: number; // in MB
  initialFiles?: MediaFile[]; // Add initial files support for editing
}

const MediaUpload = ({ 
  onFilesChange, 
  maxImages = 8, 
  maxVideos = 2, 
  maxImageSize = 10,
  maxVideoSize = 50,
  initialFiles = []
}: MediaUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<MediaFile[]>(initialFiles);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const draggedOverIndex = useRef<number | null>(null);

  // Generate video thumbnail
  const generateVideoThumbnail = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      video.onloadedmetadata = () => {
        try {
          canvas.width = 200; // Smaller thumbnail
          canvas.height = 200;
          video.currentTime = Math.min(2, video.duration / 2); // Seek to middle or 2 seconds
        } catch (error) {
          reject(error);
        }
      };

      video.onseeked = () => {
        try {
          // Calculate aspect ratio for cropping
          const aspectRatio = video.videoWidth / video.videoHeight;
          let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
          
          if (aspectRatio > 1) {
            // Wide video - crop sides
            sw = video.videoHeight;
            sx = (video.videoWidth - sw) / 2;
          } else {
            // Tall video - crop top/bottom  
            sh = video.videoWidth;
            sy = (video.videoHeight - sh) / 2;
          }
          
          ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch (error) {
          reject(error);
        } finally {
          video.remove();
        }
      };

      video.onerror = () => {
        video.remove();
        reject(new Error('Failed to load video'));
      };

      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      video.muted = true;
    });
  }, []);

  const validateFile = (file: File): string | null => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      return 'Only image and video files are allowed';
    }

    // Allow larger files for images since we'll compress them
    if (isImage && file.size > maxImageSize * 1024 * 1024 * 2) {
      return `Image size must be less than ${maxImageSize * 2}MB (will be compressed)`;
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
      return null;
    }
  };

  const processFiles = useCallback(async (fileList: FileList) => {
    const newFiles: MediaFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const error = validateFile(file);
      if (error) {
        toast({
          title: 'File validation error',
          description: error,
          variant: 'destructive',
        });
        continue;
      }

      try {
        // Compress images before processing
        let processedFile = file;
        const isImage = file.type.startsWith('image/');
        
        if (isImage) {
          toast({
            title: 'Compressing image',
            description: `Optimising ${file.name}...`,
          });
          processedFile = await compressImage(file);
        }

        const mediaFile: MediaFile = {
          id: Math.random().toString(36).substr(2, 9),
          file: processedFile,
          preview: URL.createObjectURL(processedFile),
          type: isImage ? 'image' : 'video',
          uploading: false,
          uploaded: false,
          order: files.length + newFiles.length,
        };

        // Generate video thumbnail
        if (mediaFile.type === 'video') {
          try {
            mediaFile.thumbnail = await generateVideoThumbnail(processedFile);
          } catch (error) {
            // Continue without thumbnail - will show video icon instead
          }
        }

        newFiles.push(mediaFile);
      } catch (error: any) {
        toast({
          title: 'File processing error',
          description: `Failed to process ${file.name}`,
          variant: 'destructive',
        });
      }
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      
      // Start uploading files asynchronously
      newFiles.forEach(async (mediaFile) => {        
        // Update uploading state
        setFiles(prev => prev.map(f => 
          f.id === mediaFile.id ? { ...f, uploading: true } : f
        ));

        const uploadedUrl = await uploadFileToStorage(mediaFile.file, mediaFile);
        
        setFiles(prev => prev.map(f => 
          f.id === mediaFile.id 
            ? { ...f, uploading: false, uploaded: uploadedUrl ? true : false, url: uploadedUrl || undefined }
            : f
        ));
        
        if (!uploadedUrl) {
          toast({
            title: 'Upload failed',
            description: `Failed to upload ${mediaFile.file.name}`,
            variant: 'destructive',
          });
        }
      });
    }
  }, [files, maxImages, maxVideos, maxImageSize, maxVideoSize, toast, user, generateVideoThumbnail]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  // File upload drag and drop
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileDragOver = useCallback((e: React.DragEvent) => {
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
        // Silently fail - file cleanup is non-critical
      }
    }

    // Clean up object URLs to prevent memory leaks
    if (fileToRemove?.preview) URL.revokeObjectURL(fileToRemove.preview);
    if (fileToRemove?.thumbnail) URL.revokeObjectURL(fileToRemove.thumbnail);
    
    const updatedFiles = files.filter(f => f.id !== id).map((f, index) => ({ ...f, order: index }));
    setFiles(updatedFiles);
  }, [files, user]);

  // Drag and drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    draggedOverIndex.current = null;
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    draggedOverIndex.current = index;
  };

  const handleReorderDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleReorderDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const newFiles = [...files];
      const draggedFile = newFiles[draggedIndex];
      newFiles.splice(draggedIndex, 1);
      newFiles.splice(dropIndex, 0, draggedFile);
      
      // Update order property
      const reorderedFiles = newFiles.map((f, index) => ({ ...f, order: index }));
      setFiles(reorderedFiles);
    }
    
    setDraggedIndex(null);
    draggedOverIndex.current = null;
  };

  const imageCount = files.filter(f => f.type === 'image').length;
  const videoCount = files.filter(f => f.type === 'video').length;
  const canAddImages = imageCount < maxImages;
  const canAddVideos = videoCount < maxVideos;
  const canAddFiles = canAddImages || canAddVideos;

  // Sync files with parent when they change - this prevents setState-in-render
  useEffect(() => {
    onFilesChange(files);
  }, [files, onFilesChange]);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-base font-medium">Media ({imageCount} images, {videoCount} videos)</h3>
          {imageCount === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              ⚠️ At least 1 photo required
            </p>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          Max {maxImages} images, {maxVideos} videos
        </div>
      </div>

      {/* Compact Upload area */}
      {canAddFiles && (
        <div
          onDrop={handleFileDrop}
          onDragOver={handleFileDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
        >
          <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <h4 className="text-sm font-medium mb-1">Upload Images & Videos</h4>
          <p className="text-xs text-muted-foreground mb-2">
            Drag files here or click to browse
          </p>
          <div className="text-xs text-muted-foreground mb-3">
            Images: max {maxImageSize}MB • Videos: max {maxVideoSize}MB
          </div>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="media-upload"
          />
          <Button asChild variant="outline" size="sm">
            <label htmlFor="media-upload" className="cursor-pointer">
              Choose Files
            </label>
          </Button>
        </div>
      )}

      {/* Compact Media grid with drag & drop */}
      {files.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-2">
            Drag to reorder • First image is the main photo
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {files.map((mediaFile, index) => (
              <div
                key={mediaFile.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragOver={handleReorderDragOver}
                onDrop={(e) => handleReorderDrop(e, index)}
                className={`relative group cursor-move ${
                  draggedIndex === index ? 'opacity-50' : ''
                } ${
                  draggedOverIndex.current === index && draggedIndex !== index 
                    ? 'ring-2 ring-primary' 
                    : ''
                }`}
              >
                <div className="aspect-square rounded-md overflow-hidden border border-border bg-muted">
                  {mediaFile.type === 'image' ? (
                    <img
                      src={mediaFile.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      {mediaFile.thumbnail ? (
                        <img
                          src={mediaFile.thumbnail}
                          alt={`Video ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
                          <Video className="h-4 w-4 text-muted-foreground mb-1" />
                          <div className="text-xs text-muted-foreground text-center px-1">
                            Video
                          </div>
                        </div>
                      )}
                      {/* Play icon overlay for videos */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/50 rounded-full p-1">
                          <Play className="h-3 w-3 text-white fill-white" />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Uploading overlay */}
                  {mediaFile.uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-xs">...</div>
                    </div>
                  )}
                  
                  {/* Success indicator */}
                  {mediaFile.uploaded && (
                    <div className="absolute top-1 left-1">
                      <div className="bg-success text-success-foreground rounded-full p-0.5">
                        <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                  
                  {/* Main indicator */}
                  {index === 0 && (
                    <div className="absolute bottom-1 left-1">
                      <div className="bg-primary text-primary-foreground text-xs px-1 py-0.5 rounded text-xs">
                        Main
                      </div>
                    </div>
                  )}
                  
                  {/* Drag handle */}
                  <div className="absolute top-1 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-3 w-3 text-white/80" />
                  </div>
                  
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeFile(mediaFile.id)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;