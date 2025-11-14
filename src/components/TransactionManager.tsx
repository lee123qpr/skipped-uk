import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, 
  Clock,
  Star,
  Download,
  AlertTriangle
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { TransactionTimeline } from "./TransactionTimeline";
import ErrorBoundary from "./ErrorBoundary";
import { DisputeDialog } from "./DisputeDialog";
import { getStatusConfig, canSellerDispatch, canBuyerConfirmDelivery, canRaiseDispute } from "@/utils/transactionStatus";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const stripePromise = loadStripe("pk_test_51QqxZjCZoEP5gSXQv8c5gj7jnQUqGqQCQDGQChzw3vTMrIxXpjIWhJUW4mEDRe0gQRNXGWCNB7NZ5Qr1hWRQkb5P00hIjXSHVl");

interface Transaction {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  buyer_protection_fee?: number | null;
  delivery_cost?: number | null;
  delivery_method?: string | null;
  status: string;
  stripe_payment_intent_id: string | null;
  created_at: string;
  paid_at: string | null;
  dispatch_confirmed_at: string | null;
  delivery_confirmed_at: string | null;
  completed_at: string | null;
  disputed_at: string | null;
  dispute_reason: string | null;
  listings?: {
    title: string;
    images: string[];
    environmental_assessment_enabled?: boolean;
  };
}

interface TransactionManagerProps {
  transaction: Transaction;
  userRole: "buyer" | "seller";
  onUpdate: () => void;
}

export const TransactionManager = ({ 
  transaction, 
  userRole,
  onUpdate 
}: TransactionManagerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [showConfirmDeliveryDialog, setShowConfirmDeliveryDialog] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [certificate, setCertificate] = useState<{ buyer_certificate_url: string | null; seller_certificate_url: string | null } | null>(null);
  const { toast } = useToast();

  // Defensive logic to handle legacy transactions with NULL delivery data
  const getActualItemPrice = () => {
    // If delivery_cost is null and we have buyer_protection_fee, reverse-calculate
    if ((transaction.delivery_cost === null || transaction.delivery_cost === undefined) && transaction.buyer_protection_fee) {
      // Buyer protection is 5% of true item price
      const calculatedItemPrice = transaction.buyer_protection_fee / 0.05;
      return calculatedItemPrice;
    }
    return transaction.amount;
  };

  const actualItemPrice = getActualItemPrice();
  const actualDeliveryCost = transaction.delivery_cost ?? 0;
  const actualBuyerProtection = transaction.buyer_protection_fee || 0;
  const actualTotal = actualItemPrice + actualBuyerProtection + actualDeliveryCost;
  const hasLegacyData = transaction.delivery_cost === null || transaction.delivery_cost === undefined;
  
  const statusConfig = getStatusConfig(transaction.status);
  const StatusIcon = statusConfig.icon;

  // Fetch certificate if transaction is completed and environmental assessment is enabled
  useEffect(() => {
    const fetchCertificate = async () => {
      if (transaction.status === "completed" && transaction.listings?.environmental_assessment_enabled) {
        const { data } = await supabase
          .from("environmental_certificates")
          .select("buyer_certificate_url, seller_certificate_url")
          .eq("transaction_id", transaction.id)
          .maybeSingle();
        
        if (data) {
          setCertificate(data);
        }
      }
    };

    fetchCertificate();
  }, [transaction.status, transaction.id, transaction.listings?.environmental_assessment_enabled]);

  const handleConfirmDispatch = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("confirm-dispatch", {
        body: { transactionId: transaction.id },
      });

      if (error) throw error;

      toast({
        title: "Dispatch Confirmed",
        description: "Buyer has been notified that item has been sent.",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!confirmationChecked) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm that you have received the item with no issues.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setShowConfirmDeliveryDialog(false);
    setConfirmationChecked(false);

    try {
      const { error } = await supabase.functions.invoke("confirm-delivery", {
        body: { transactionId: transaction.id },
      });

      if (error) {
        // Check if it's already completed
        if (error.message?.includes("must be dispatched")) {
          // Refresh to get latest status
          onUpdate();
          toast({
            title: "Already Confirmed",
            description: "This delivery has already been confirmed. Refreshing...",
          });
          return;
        }
        throw error;
      }

      // Check if listing has environmental assessment enabled
      if (transaction.listings?.environmental_assessment_enabled) {
        // Generate certificates
        const { error: certError } = await supabase.functions.invoke("generate-environmental-certificate", {
          body: { transactionId: transaction.id },
        });

        if (certError) {
          // Don't fail the delivery confirmation if certificate generation fails
        }
      }

      toast({
        title: "Delivery Confirmed",
        description: transaction.listings?.environmental_assessment_enabled 
          ? "Funds have been released! Your environmental certificate is being generated."
          : "Funds have been released to the seller!",
      });

      // Force immediate UI update by calling onUpdate multiple times with small delays
      // This ensures the parent component refetches the updated transaction status
      onUpdate();
      setTimeout(() => onUpdate(), 500);
      setTimeout(() => onUpdate(), 1500);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get the other user's ID for the dispute dialog
  const otherUserId = userRole === "buyer" ? transaction.seller_id : transaction.buyer_id;

  const getStatusBadge = () => {
    return <Badge variant={statusConfig.variant} className={statusConfig.className}>{statusConfig.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            Transaction Status
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning banner for legacy transactions */}
        {hasLegacyData && transaction.status !== 'completed' && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Transaction Data Notice</AlertTitle>
            <AlertDescription>
              This transaction was created before our updated system. The cost breakdown shown is calculated based on available data.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
            {userRole === "buyer" && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Item Price:</span>
                  <span className="font-semibold">£{actualItemPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Buyer Protection (5%):</span>
                  <span className="font-semibold">£{actualBuyerProtection.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {transaction.delivery_method === 'delivery' ? 'Delivery:' : 'Collection:'}
                  </span>
                  <span className="font-semibold">
                    {actualDeliveryCost > 0 ? `£${actualDeliveryCost.toFixed(2)}` : 'Free'}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-sm font-bold">
                  <span>Total Paid:</span>
                  <span>£{actualTotal.toFixed(2)}</span>
                </div>
              </>
            )}
        </div>

        {/* Buyer Actions */}
        {userRole === "buyer" && (
          <div className="space-y-2">
            {canBuyerConfirmDelivery(transaction.status) && !transaction.status.includes('disputed') && !transaction.delivery_confirmed_at && (
              <>
                <Button 
                  onClick={() => setShowConfirmDeliveryDialog(true)}
                  disabled={isLoading}
                  className="w-full"
                >
                  Confirm Received - No Issues
                </Button>
                <Button 
                  onClick={() => setShowDisputeDialog(true)}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  Raise Dispute
                </Button>
              </>
            )}

            {/* Show dispute status message */}
            {transaction.status.includes('disputed') && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                  ⚠️ Dispute Submitted
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  Your dispute is under admin review. Both parties will be notified of the outcome within 24-48 hours. Funds remain in escrow during the review.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Seller Actions */}
        {userRole === "seller" && (
          <div className="space-y-2">
            {transaction.status === "paid" && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md mb-2">
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                  💰 Payment Received in Escrow (£{transaction.amount.toFixed(2)})
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Funds are held securely. Mark as dispatched once you've sent the item.
                </p>
              </div>
            )}
            
            {transaction.status === "paid" && !transaction.dispatch_confirmed_at && (
              <Button 
                onClick={handleConfirmDispatch}
                disabled={isLoading}
                className="w-full"
              >
                📦 {isLoading ? "Confirming..." : "Mark as Dispatched"}
              </Button>
            )}

            {transaction.status === "dispatched" && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  ⏳ Awaiting buyer confirmation. Funds will be released to you when buyer confirms receipt.
                </p>
              </div>
            )}

            {/* Show dispute status message for seller */}
            {transaction.status.includes('disputed') && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                  ⚠️ Dispute Raised
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  A dispute has been raised by the buyer. An admin will review the case within 24-48 hours. Funds remain in escrow during the review.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Completed Transaction - Review Prompt */}
        {transaction.status === "completed" && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                  ✅ Transaction Complete!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mb-2">
                  {userRole === "buyer" 
                    ? "Thank you for your purchase! Help other buyers by leaving a review for the seller."
                    : "Funds have been released to your account. Please leave feedback for the buyer."
                  }
                </p>
              </div>
            </div>
            
            {/* Environmental Certificate Download */}
            {certificate && (
              <Button
                onClick={() => {
                  const url = userRole === "buyer" ? certificate.buyer_certificate_url : certificate.seller_certificate_url;
                  if (url) {
                    window.open(url, '_blank');
                  }
                }}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Environmental Certificate
              </Button>
            )}
            
            <Button
              onClick={() => {
                // Navigate to Settings page where UnifiedReviews is displayed
                window.location.href = "/settings";
              }}
              className="w-full"
              size="sm"
            >
              <Star className="h-4 w-4 mr-2" />
              Leave a Review
            </Button>
          </div>
        )}

        {/* Timeline */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-4">Transaction Timeline</h4>
          <TransactionTimeline transaction={transaction} userRole={userRole} />
        </div>
      </CardContent>

      {/* Confirm Delivery Dialog */}
      <AlertDialog open={showConfirmDeliveryDialog} onOpenChange={setShowConfirmDeliveryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Item Received
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  ⚠️ This action will release £{transaction.amount.toFixed(2)} to the seller
                </p>
              </div>
              
              <p className="text-sm">
                By confirming delivery, you're stating that:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>You have received the item</li>
                <li>The item matches the description</li>
                <li>You have no issues or disputes</li>
              </ul>

              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground mb-2">
                  💡 <strong>Auto-confirmation:</strong> You have 2 days to confirm delivery. If you don't take action within this time, the delivery will be automatically confirmed and funds will be released to the seller.
                </p>
                <p className="text-xs text-muted-foreground">
                  📋 <strong>What happens next:</strong> Once confirmed, the seller receives their payment and the transaction is marked as complete. You'll be able to leave a review.
                </p>
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox 
                  id="confirm-checkbox" 
                  checked={confirmationChecked}
                  onCheckedChange={(checked) => setConfirmationChecked(checked as boolean)}
                />
                <Label 
                  htmlFor="confirm-checkbox" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I confirm I have received the item with no issues
                </Label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmationChecked(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelivery}
              disabled={!confirmationChecked || isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? "Confirming..." : "Confirm & Release Funds"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dispute Dialog */}
      <DisputeDialog
        open={showDisputeDialog}
        onOpenChange={setShowDisputeDialog}
        transactionId={transaction.id}
        userRole={userRole}
        otherUserId={otherUserId}
        onSuccess={onUpdate}
      />
    </Card>
  );
};
