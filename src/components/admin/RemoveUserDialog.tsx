import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RemoveUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  activeTransactions?: number;
  onSuccess: () => void;
}

export function RemoveUserDialog({
  open,
  onOpenChange,
  userId,
  userName,
  activeTransactions = 0,
  onSuccess,
}: RemoveUserDialogProps) {
  const [reason, setReason] = useState("");
  const [actionType, setActionType] = useState<"suspended" | "deleted">("suspended");
  const [confirmed, setConfirmed] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for this action");
      return;
    }

    if (!confirmed || !understood) {
      toast.error("Please confirm both checkboxes");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("admin-remove-user", {
        body: {
          targetUserId: userId,
          reason: reason.trim(),
          actionType,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success(data?.message || "User account updated successfully");
      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setReason("");
      setConfirmed(false);
      setUnderstood(false);
      setActionType("suspended");
    } catch (error) {
      console.error("Error removing user:", error);
      toast.error("Failed to update user account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Remove User Account
          </DialogTitle>
          <DialogDescription>
            You are about to remove the account for <strong>{userName}</strong>. This action requires justification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {activeTransactions > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This user has {activeTransactions} active transaction(s). Please resolve all active transactions before removing the account.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Action Type</Label>
            <RadioGroup value={actionType} onValueChange={(value) => setActionType(value as "suspended" | "deleted")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="suspended" id="suspended" />
                <Label htmlFor="suspended" className="font-normal cursor-pointer">
                  Suspend Account (reversible, user can appeal)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="deleted" id="deleted" />
                <Label htmlFor="deleted" className="font-normal cursor-pointer">
                  Mark as Deleted (permanent, hides from all public areas)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Required)</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this action is being taken (e.g., Terms of Service violation, fraudulent activity, user request)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              disabled={loading || activeTransactions > 0}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="confirmed"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                disabled={loading || activeTransactions > 0}
              />
              <Label
                htmlFor="confirmed"
                className="text-sm font-normal leading-none cursor-pointer"
              >
                I confirm this action is justified and documented
              </Label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="understood"
                checked={understood}
                onCheckedChange={(checked) => setUnderstood(checked as boolean)}
                disabled={loading || activeTransactions > 0}
              />
              <Label
                htmlFor="understood"
                className="text-sm font-normal leading-none cursor-pointer"
              >
                I understand this will {actionType === "suspended" ? "suspend" : "mark as deleted"} the account and the user will be notified
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={loading || !reason.trim() || !confirmed || !understood || activeTransactions > 0}
          >
            {loading ? "Processing..." : actionType === "suspended" ? "Suspend User" : "Mark as Deleted"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}