// File validation utilities
import imageCompression from 'browser-image-compression';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export const isValidImageType = (type: string): boolean => {
  return ACCEPTED_IMAGE_TYPES.includes(type);
};

export const isValidVideoType = (type: string): boolean => {
  return ACCEPTED_VIDEO_TYPES.includes(type);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const compressImage = async (file: File): Promise<File> => {
  try {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 2000,
      useWebWorker: true,
      fileType: 'image/webp',
    };
    
    const compressedFile = await imageCompression(file, options);
    
    // Rename file to have .webp extension
    const fileName = file.name.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    return new File([compressedFile], fileName, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Error compressing image:', error);
    return file;
  }
};

export const generateThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith('image/')) {
      // For images, just create object URL
      resolve(URL.createObjectURL(file));
    } else if (file.type.startsWith('video/')) {
      // For videos, generate thumbnail from first frame
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      video.onloadeddata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject('Failed to generate thumbnail');
          }
        });
      };
      
      video.onerror = () => reject('Error loading video');
      video.src = URL.createObjectURL(file);
      video.load();
    } else {
      reject('Unsupported file type');
    }
  });
};