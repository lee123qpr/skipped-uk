import { useState, useEffect } from 'react';

export interface CookiePreferences {
  essential: boolean;
  functionality: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
  version: number;
}

const STORAGE_KEY = 'skipped-cookie-consent';
const CONSENT_VERSION = 1;
const CONSENT_EXPIRY_MONTHS = 12;

const defaultPreferences: CookiePreferences = {
  essential: true,
  functionality: false,
  analytics: false,
  marketing: false,
  timestamp: Date.now(),
  version: CONSENT_VERSION,
};

export const useCookieConsent = () => {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      try {
        const parsed: CookiePreferences = JSON.parse(stored);
        
        // Check if consent has expired (12 months)
        const expiryDate = new Date(parsed.timestamp);
        expiryDate.setMonth(expiryDate.getMonth() + CONSENT_EXPIRY_MONTHS);
        
        if (Date.now() > expiryDate.getTime() || parsed.version !== CONSENT_VERSION) {
          // Expired or outdated version - show banner again
          setShowBanner(true);
          setPreferences(null);
        } else {
          // Valid consent exists
          setPreferences(parsed);
          setShowBanner(false);
        }
      } catch (e) {
        // Invalid stored data - show banner
        setShowBanner(true);
        setPreferences(null);
      }
    } else {
      // No consent stored - show banner
      setShowBanner(true);
    }
  }, []);

  const savePreferences = (newPreferences: Partial<CookiePreferences>) => {
    const updated: CookiePreferences = {
      ...defaultPreferences,
      ...newPreferences,
      essential: true, // Always true
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setPreferences(updated);
    setShowBanner(false);
  };

  const acceptAll = () => {
    savePreferences({
      functionality: true,
      analytics: true,
      marketing: true,
    });
  };

  const rejectAll = () => {
    savePreferences({
      functionality: false,
      analytics: false,
      marketing: false,
    });
  };

  const updatePreferences = (updates: Partial<CookiePreferences>) => {
    savePreferences(updates);
  };

  const resetConsent = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPreferences(null);
    setShowBanner(true);
  };

  const hasConsent = (category: keyof Omit<CookiePreferences, 'timestamp' | 'version'>) => {
    return preferences?.[category] ?? false;
  };

  return {
    preferences,
    showBanner,
    acceptAll,
    rejectAll,
    updatePreferences,
    resetConsent,
    hasConsent,
    setShowBanner,
  };
};
