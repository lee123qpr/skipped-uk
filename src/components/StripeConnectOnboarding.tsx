import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle, CreditCard, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ConnectStatus {
  connected: boolean;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  accountId?: string;
}

const StripeConnectOnboarding = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('check-connect-status');

      if (error) throw error;

      setStatus(data);
    } catch (error) {
      console.error('Error fetching Connect status:', error);
      toast({
        title: 'Error',
        description: 'Failed to check payment setup status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user]);

  const handleConnectAccount = async () => {
    if (!user) return;

    try {
      setActionLoading(true);
      const { data, error } = await supabase.functions.invoke('create-connect-account');

      if (error) throw error;

      // Redirect to Stripe onboarding
      if (data?.url) {
        window.open(data.url, '_blank');
        
        toast({
          title: 'Opening Stripe setup',
          description: 'Complete the setup to start receiving payments',
        });

        // Refresh status after a few seconds
        setTimeout(() => {
          fetchStatus();
        }, 3000);
      }
    } catch (error) {
      console.error('Error creating Connect account:', error);
      toast({
        title: 'Error',
        description: 'Failed to initiate payment setup',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Setup
            </CardTitle>
            <CardDescription>
              Connect your Stripe account to receive payments from buyers
            </CardDescription>
          </div>
          {status?.onboardingComplete && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!status?.connected && (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Payment setup required</AlertTitle>
              <AlertDescription>
                To receive payments from buyers, you need to connect your Stripe account. 
                This is a secure, one-time setup that takes about 5 minutes.
              </AlertDescription>
            </Alert>
            
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-medium">What you'll need:</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Business details (or personal if sole trader)</li>
                <li>Bank account information for payouts</li>
                <li>Valid identification</li>
              </ul>
            </div>

            <Button 
              onClick={handleConnectAccount}
              disabled={actionLoading}
              className="w-full"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect Stripe Account
                </>
              )}
            </Button>
          </>
        )}

        {status?.connected && !status?.onboardingComplete && (
          <>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Setup incomplete</AlertTitle>
              <AlertDescription>
                Your Stripe account setup is not complete. You won't be able to receive payments until you finish the setup.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Charges:</span>
                {status.chargesEnabled ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700">Enabled</Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700">Disabled</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Payouts:</span>
                {status.payoutsEnabled ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700">Enabled</Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700">Disabled</Badge>
                )}
              </div>
            </div>

            <Button 
              onClick={handleConnectAccount}
              disabled={actionLoading}
              variant="destructive"
              className="w-full"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Complete Stripe Setup
                </>
              )}
            </Button>
          </>
        )}

        {status?.onboardingComplete && (
          <>
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Ready to receive payments</AlertTitle>
              <AlertDescription className="text-green-700">
                Your Stripe account is fully set up and ready to receive payments from buyers.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Account ID:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">{status.accountId}</code>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Charges:</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">Enabled</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Payouts:</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">Enabled</Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button 
                onClick={handleConnectAccount}
                variant="outline"
                className="w-full"
                disabled={actionLoading}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Stripe Account
              </Button>
            </div>
          </>
        )}

        <div className="pt-4 border-t">
          <Button 
            onClick={fetchStatus}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StripeConnectOnboarding;
