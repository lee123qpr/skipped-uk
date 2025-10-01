import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, 
  Truck, 
  AlertTriangle, 
  Clock,
  Package
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe("pk_test_51QqxZjCZoEP5gSXQv8c5gj7jnQUqGqQCQDGQChzw3vTMrIxXpjIWhJUW4mEDRe0gQRNXGWCNB7NZ5Qr1hWRQkb5P00hIjXSHVl");

interface Transaction {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  status: string;
  stripe_payment_intent_id: string | null;
  dispatch_confirmed_at: string | null;
  delivery_confirmed_at: string | null;
  dispute_reason: string | null;
  listings?: {
    title: string;
    images: string[];
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
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment-intent", {
        body: { 
          transactionId: transaction.id,
          amount: transaction.amount,
          buyerProtectionFee: transaction.amount * 0.05, // 5% buyer protection
          returnUrl: window.location.origin,
        },
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      if (data?.checkoutUrl) {
        // Use same-tab navigation to avoid iOS popup blockers
        window.location.href = data.checkoutUrl as string;
        toast({
          title: "Redirecting to payment",
          description: "Taking you to Stripe Checkout...",
        });
      }

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("confirm-delivery", {
        body: { transactionId: transaction.id },
      });

      if (error) throw error;

      toast({
        title: "Delivery Confirmed",
        description: "Funds have been released to the seller!",
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

  const handleRaiseDispute = async () => {
    if (!disputeReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the dispute",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("raise-dispute", {
        body: { 
          transactionId: transaction.id,
          reason: disputeReason
        },
      });

      if (error) throw error;

      toast({
        title: "Dispute Raised",
        description: "Your payment has been refunded.",
      });

      setShowDisputeForm(false);
      setDisputeReason("");
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

  const getStatusBadge = () => {
    const statusConfig: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary"; className?: string }> = {
      pending_payment: { label: "Awaiting Payment", variant: "outline", className: "border-amber-500 text-amber-700 dark:text-amber-400" },
      paid: { label: "Paid - Awaiting Dispatch", variant: "default", className: "bg-blue-500 hover:bg-blue-600 text-white" },
      dispatched: { label: "Item Dispatched", variant: "default", className: "bg-purple-500 hover:bg-purple-600 text-white" },
      delivered: { label: "Delivered", variant: "default", className: "bg-green-600 hover:bg-green-700 text-white" },
      completed: { label: "Completed", variant: "default", className: "bg-green-600 hover:bg-green-700 text-white" },
      disputed: { label: "Disputed", variant: "destructive" },
      refunded: { label: "Refunded", variant: "destructive" },
    };

    const config = statusConfig[transaction.status] || { label: transaction.status, variant: "outline" };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const getStatusIcon = () => {
    switch (transaction.status) {
      case "pending_payment":
        return <Clock className="h-5 w-5 text-muted-foreground" />;
      case "paid":
        return <Package className="h-5 w-5 text-blue-500" />;
      case "dispatched":
        return <Truck className="h-5 w-5 text-primary" />;
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "disputed":
      case "refunded":
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Transaction Status
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-semibold">£{transaction.amount.toFixed(2)}</span>
          </div>
          {userRole === "buyer" && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Buyer Protection:</span>
                <span className="font-semibold">£{(transaction.amount * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="font-medium">Total:</span>
                <span className="font-bold">£{(transaction.amount * 1.05).toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        {/* Buyer Actions */}
        {userRole === "buyer" && (
          <div className="space-y-2">
            {(transaction.status === "pending" || transaction.status === "pending_payment") && (
              <Button 
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full"
              >
                Buy Now
              </Button>
            )}

            {transaction.status === "dispatched" && !showDisputeForm && (
              <>
                <Button 
                  onClick={handleConfirmDelivery}
                  disabled={isLoading}
                  className="w-full"
                >
                  Confirm Received - No Issues
                </Button>
                <Button 
                  onClick={() => setShowDisputeForm(true)}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  Raise Dispute
                </Button>
              </>
            )}

            {showDisputeForm && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Describe the issue..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleRaiseDispute}
                    disabled={isLoading}
                    variant="destructive"
                    className="flex-1"
                  >
                    Submit Dispute
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowDisputeForm(false);
                      setDisputeReason("");
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Seller Actions */}
        {userRole === "seller" && (
          <div className="space-y-2">
            {transaction.status === "paid" && (
              <Button 
                onClick={handleConfirmDispatch}
                disabled={isLoading}
                className="w-full"
              >
                Mark as Shipped
              </Button>
            )}

            {transaction.status === "dispatched" && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  Awaiting buyer confirmation. Funds will be released when buyer confirms receipt.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-medium">Transaction Timeline</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            {transaction.dispatch_confirmed_at && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Dispatched: {new Date(transaction.dispatch_confirmed_at).toLocaleDateString()}
              </div>
            )}
            {transaction.delivery_confirmed_at && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Delivered: {new Date(transaction.delivery_confirmed_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
