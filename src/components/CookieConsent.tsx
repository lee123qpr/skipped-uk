import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCookieConsent } from '@/hooks/useCookieConsent';

const CookieConsent = () => {
  const {
    showBanner,
    acceptAll,
    rejectAll,
    updatePreferences,
    setShowBanner,
  } = useCookieConsent();

  const [showSettings, setShowSettings] = useState(false);
  const [functionality, setFunctionality] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  if (!showBanner) return null;

  const handleCustomize = () => {
    setShowSettings(true);
  };

  const handleSavePreferences = () => {
    updatePreferences({
      functionality,
      analytics,
      marketing,
    });
    setShowSettings(false);
  };

  const handleCloseBanner = () => {
    // Treat closing banner as "reject all" for GDPR compliance
    rejectAll();
  };

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5">
        <Card className="max-w-5xl mx-auto shadow-strong border-border">
          <CardHeader className="relative pb-3">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8"
              onClick={handleCloseBanner}
              aria-label="Close cookie banner"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-start gap-3">
              <Cookie className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <CardTitle className="text-xl">Cookie Preferences</CardTitle>
                <CardDescription className="mt-1">
                  We use cookies to enhance your browsing experience and analyse our traffic. 
                  By clicking "Accept All", you consent to our use of cookies.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-sm text-muted-foreground">
              Essential cookies are always enabled. You can customise preferences here or visit our{' '}
              <Link to="/cookie-policy" className="text-primary hover:underline font-medium">
                Cookie Policy page
              </Link>{' '}
              to manage your settings anytime.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2 pt-3">
            <Button
              variant="outline"
              onClick={rejectAll}
              className="w-full sm:w-auto"
            >
              Reject All
            </Button>
            <Button
              variant="secondary"
              onClick={handleCustomize}
              className="w-full sm:w-auto"
            >
              Customise
            </Button>
            <Button
              onClick={acceptAll}
              className="w-full sm:w-auto sm:ml-auto"
            >
              Accept All
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              Customise Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Choose which cookies you'd like to allow. Essential cookies cannot be disabled as they're necessary for the site to function.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Essential Cookies */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">Essential Cookies</Label>
                  <p className="text-sm text-muted-foreground">
                    Required for the website to function properly. These cannot be disabled.
                  </p>
                </div>
                <Switch checked disabled aria-label="Essential cookies (always enabled)" />
              </div>
            </div>

            {/* Functionality Cookies */}
            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="functionality" className="text-base font-semibold cursor-pointer">
                    Functionality Cookies
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable enhanced functionality and personalisation, such as remembering your preferences.
                  </p>
                </div>
                <Switch
                  id="functionality"
                  checked={functionality}
                  onCheckedChange={setFunctionality}
                  aria-label="Functionality cookies"
                />
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="analytics" className="text-base font-semibold cursor-pointer">
                    Analytics Cookies
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Help us understand how visitors interact with our website by collecting and reporting information anonymously.
                  </p>
                </div>
                <Switch
                  id="analytics"
                  checked={analytics}
                  onCheckedChange={setAnalytics}
                  aria-label="Analytics cookies"
                />
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="marketing" className="text-base font-semibold cursor-pointer">
                    Marketing Cookies
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Used to track visitors across websites to display relevant advertisements and marketing campaigns.
                  </p>
                </div>
                <Switch
                  id="marketing"
                  checked={marketing}
                  onCheckedChange={setMarketing}
                  aria-label="Marketing cookies"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setFunctionality(false);
                setAnalytics(false);
                setMarketing(false);
              }}
              className="w-full sm:w-auto"
            >
              Disable All Optional
            </Button>
            <Button
              onClick={handleSavePreferences}
              className="w-full sm:w-auto"
            >
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsent;
