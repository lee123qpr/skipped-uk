import { CheckCircle2, Truck, AlertTriangle, Clock, Package, CreditCard } from "lucide-react";

export type TransactionStatus = 
  | "pending_payment"
  | "paid" 
  | "dispatched" 
  | "delivered" 
  | "completed" 
  | "disputed"
  | "disputed_pending_review"
  | "refunded";

export interface StatusConfig {
  label: string;
  variant: "default" | "destructive" | "outline" | "secondary";
  className?: string;
  icon: any;
  description: string;
}

export const TRANSACTION_STATUS_CONFIG: Record<TransactionStatus, StatusConfig> = {
  pending_payment: {
    label: "Awaiting Payment",
    variant: "secondary",
    className: "",
    icon: CreditCard,
    description: "Checkout created - awaiting buyer payment"
  },
  paid: {
    label: "Payment in Escrow",
    variant: "default",
    className: "bg-blue-500 hover:bg-blue-600 text-white",
    icon: Package,
    description: "Payment held securely - awaiting seller dispatch"
  },
  dispatched: {
    label: "Item Dispatched",
    variant: "default",
    className: "bg-purple-500 hover:bg-purple-600 text-white",
    icon: Truck,
    description: "Item shipped - awaiting buyer confirmation"
  },
  delivered: {
    label: "Delivery Confirmed",
    variant: "default",
    className: "bg-green-600 hover:bg-green-700 text-white",
    icon: CheckCircle2,
    description: "Delivery confirmed - awaiting feedback"
  },
  completed: {
    label: "Completed",
    variant: "default",
    className: "bg-green-600 hover:bg-green-700 text-white",
    icon: CheckCircle2,
    description: "Transaction successfully completed"
  },
  disputed: {
    label: "Disputed",
    variant: "destructive",
    className: "",
    icon: AlertTriangle,
    description: "Transaction under dispute"
  },
  disputed_pending_review: {
    label: "Dispute - Under Review",
    variant: "destructive",
    className: "bg-red-600 hover:bg-red-700 text-white",
    icon: AlertTriangle,
    description: "Dispute submitted - awaiting admin review"
  },
  refunded: {
    label: "Refunded",
    variant: "destructive",
    className: "",
    icon: AlertTriangle,
    description: "Payment refunded to buyer"
  }
};

export const getStatusConfig = (status: string): StatusConfig => {
  const normalised = status === "pending" ? "pending_payment" : status;
  return TRANSACTION_STATUS_CONFIG[normalised as TransactionStatus] || {
    label: normalised,
    variant: "outline",
    icon: Clock,
    description: "Unknown status"
  };
};

export const canSellerDispatch = (status: string): boolean => {
  return status === "paid";
};

export const canBuyerConfirmDelivery = (status: string): boolean => {
  return status === "dispatched";
};

export const canRaiseDispute = (status: string): boolean => {
  return status === "dispatched" && !status.includes("disputed");
};

export const isTransactionActive = (status: string): boolean => {
  return ["paid", "dispatched", "delivered"].includes(status);
};
