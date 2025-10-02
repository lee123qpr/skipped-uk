import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Dispute {
  id: string;
  transaction_id: string;
  listing_id: string;
  raised_by_id: string;
  against_id: string;
  dispute_type: string;
  status: string;
  reason: string;
  description: string;
  requested_amount: number;
  created_at: string;
  transactions: {
    amount: number;
    status: string;
  };
}

interface AdminDisputesProps {
  onDisputeResolved: () => void;
}

export function AdminDisputes({ onDisputeResolved }: AdminDisputesProps) {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resolutionType, setResolutionType] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const { data, error } = await supabase
        .from("disputes")
        .select(`
          *,
          transactions!disputes_transaction_id_fkey (
            amount,
            status
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDisputes(data || []);
    } catch (error) {
      console.error("Failed to fetch disputes:", error);
      toast.error("Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveClick = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setResolutionType("");
    setApprovedAmount("");
    setAdminNotes("");
    setDialogOpen(true);
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute || !resolutionType) {
      toast.error("Please select a resolution type");
      return;
    }

    if (resolutionType === "partial_refund" && (!approvedAmount || Number(approvedAmount) <= 0)) {
      toast.error("Please enter a valid refund amount");
      return;
    }

    setResolving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("admin-resolve-dispute", {
        body: {
          disputeId: selectedDispute.id,
          resolutionType,
          approvedAmount: resolutionType === "partial_refund" ? Number(approvedAmount) : null,
          adminNotes,
          returnRequired: resolutionType === "return_required",
        },
      });

      if (error) throw error;

      toast.success("Dispute resolved successfully");
      setDialogOpen(false);
      await fetchDisputes();
      onDisputeResolved();
    } catch (error: any) {
      console.error("Failed to resolve dispute:", error);
      toast.error(error.message || "Failed to resolve dispute");
    } finally {
      setResolving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "under_review":
        return <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" /> Under Review</Badge>;
      case "resolved":
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" /> Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div>Loading disputes...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Dispute Management</h2>

      {disputes.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No disputes found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <Card key={dispute.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">Dispute #{dispute.id.slice(0, 8)}</h3>
                    {getStatusBadge(dispute.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(dispute.created_at), "PPp")}
                  </p>
                </div>
                {dispute.status === "pending" && (
                  <Button onClick={() => handleResolveClick(dispute)}>
                    Review Dispute
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Type</Label>
                  <p className="font-medium">{dispute.dispute_type.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Amount</Label>
                  <p className="font-medium">£{dispute.requested_amount}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <Label className="text-sm text-muted-foreground">Reason</Label>
                  <p>{dispute.reason}</p>
                </div>
                {dispute.description && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Description</Label>
                    <p className="text-sm">{dispute.description}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/listing/${dispute.listing_id}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Listing
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Review the dispute details and select an appropriate resolution
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Dispute Type</Label>
                    <p className="font-medium">{selectedDispute.dispute_type.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Requested Amount</Label>
                    <p className="font-medium">£{selectedDispute.requested_amount}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Reason</Label>
                  <p>{selectedDispute.reason}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Resolution Type *</Label>
                <Select value={resolutionType} onValueChange={setResolutionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select resolution type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_refund">Full Refund</SelectItem>
                    <SelectItem value="partial_refund">Partial Refund</SelectItem>
                    <SelectItem value="return_required">Return Required</SelectItem>
                    <SelectItem value="no_refund">No Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {resolutionType === "partial_refund" && (
                <div className="space-y-2">
                  <Label>Approved Refund Amount *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    max={selectedDispute.requested_amount}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea
                  placeholder="Add notes about your decision..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={resolving}>
                  Cancel
                </Button>
                <Button onClick={handleResolveDispute} disabled={resolving}>
                  {resolving ? "Resolving..." : "Resolve Dispute"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}