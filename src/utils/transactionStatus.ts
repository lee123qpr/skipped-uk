import { CheckCircle2, Truck, AlertTriangle, Clock, Package, CreditCard } from "lucide-react";

export type TransactionStatus = 
  | "pending" 
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
  pending: {
    label: "Order Created",
    variant: "outline",
    className: "border-amber-500 text-amber-700 dark:text-amber-400",
    icon: Clock,
    description: "Order created - awaiting payment"
  },
  pending_payment: {
    label: "Processing Payment",
    variant: "outline",
    className: "border-blue-500 text-blue-700 dark:text-blue-400",
    icon: CreditCard,
    description: "Payment in progress - please wait"
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
  return TRANSACTION_STATUS_CONFIG[status as TransactionStatus] || {
    label: status,
    variant: "outline",
    icon: Clock,
    description: "Unknown status"
  };
};

export const canBuyerPay = (status: string): boolean => {
  return status === "pending" || status === "pending_payment";
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
  return !["completed", "disputed", "disputed_pending_review", "refunded"].includes(status);
};
