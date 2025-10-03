import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * Component that detects and displays offline/online status
 */
export const OfflineDetector = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [showOnlineAlert, setShowOnlineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineAlert(true);
      setShowOfflineAlert(false);
      
      // Auto-hide online alert after 3 seconds
      setTimeout(() => {
        setShowOnlineAlert(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
      setShowOnlineAlert(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      setShowOfflineAlert(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineAlert && !showOnlineAlert) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {showOfflineAlert && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>You're offline</AlertTitle>
          <AlertDescription>
            Some features may not be available. Please check your internet connection.
          </AlertDescription>
        </Alert>
      )}
      
      {showOnlineAlert && (
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <Wifi className="h-4 w-4" />
          <AlertTitle>You're back online</AlertTitle>
          <AlertDescription>
            Your connection has been restored.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
