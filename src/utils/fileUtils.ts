// File validation utilities

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

export const compressImage = (file: File, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions (max width/height: 1920px)
      const maxSize = 1920;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
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