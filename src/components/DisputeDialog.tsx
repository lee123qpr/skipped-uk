import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Upload, X, MessageSquare, Image as ImageIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const disputeSchema = z.object({
  disputeType: z.string().min(1, "Please select a dispute type"),
  description: z.string().min(20, "Please provide at least 20 characters describing the issue").max(1000),
});

type DisputeFormValues = z.infer<typeof disputeSchema>;

interface Evidence {
  file: File;
  preview: string;
  description: string;
}

interface DisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string;
  userRole: "buyer" | "seller";
  otherUserId: string;
  onSuccess: () => void;
}

const BUYER_DISPUTE_TYPES = [
  { value: "not_as_described", label: "Item Not as Described" },
  { value: "damaged_in_transit", label: "Item Damaged in Transit" },
  { value: "wrong_item", label: "Wrong Item Received" },
  { value: "not_received", label: "Item Not Received" },
  { value: "missing_parts", label: "Missing Parts or Accessories" },
  { value: "quality_issue", label: "Quality/Condition Issue" },
  { value: "other", label: "Other Issue" },
];

const SELLER_DISPUTE_TYPES = [
  { value: "buyer_damaged_item", label: "Buyer Damaged Item After Receipt" },
  { value: "false_claim", label: "False Claim by Buyer" },
  { value: "buyer_non_responsive", label: "Buyer Not Responsive" },
  { value: "other", label: "Other Issue" },
];

export const DisputeDialog = ({
  open,
  onOpenChange,
  transactionId,
  userRole,
  otherUserId,
  onSuccess,
}: DisputeDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<DisputeFormValues>({
    resolver: zodResolver(disputeSchema),
    defaultValues: {
      disputeType: "",
      description: "",
    },
  });

  const disputeTypes = userRole === "buyer" ? BUYER_DISPUTE_TYPES : SELLER_DISPUTE_TYPES;

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const newFiles: Evidence[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Please upload JPG, PNG or WEBP images.`);
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large. Maximum size is 5MB.`);
        continue;
      }

      // Check total files limit
      if (evidence.length + newFiles.length >= MAX_FILES) {
        errors.push(`Maximum ${MAX_FILES} files allowed.`);
        break;
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      newFiles.push({ file, preview, description: "" });
    }

    if (errors.length > 0) {
      toast({
        title: "Upload Issues",
        description: errors.join("\n"),
        variant: "destructive",
      });
    }

    if (newFiles.length > 0) {
      setEvidence([...evidence, ...newFiles]);
    }
  };

  const removeEvidence = (index: number) => {
    const newEvidence = [...evidence];
    URL.revokeObjectURL(newEvidence[index].preview);
    newEvidence.splice(index, 1);
    setEvidence(newEvidence);
  };

  const updateEvidenceDescription = (index: number, description: string) => {
    const newEvidence = [...evidence];
    newEvidence[index].description = description;
    setEvidence(newEvidence);
  };

  const uploadEvidenceToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${transactionId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError, data } = await supabase.storage
      .from('listing-media')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('listing-media')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const onSubmit = async (values: DisputeFormValues) => {
    if (evidence.length === 0) {
      toast({
        title: "Evidence Required",
        description: "Please upload at least one photo as evidence for your dispute.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Upload all evidence files
      const uploadedEvidence = await Promise.all(
        evidence.map(async (item) => {
          const url = await uploadEvidenceToStorage(item.file);
          return {
            type: "photo",
            url,
            description: item.description || "Evidence photo",
          };
        })
      );

      // Submit dispute
      const { error } = await supabase.functions.invoke("raise-dispute", {
        body: {
          transactionId,
          reason: values.disputeType,
          description: values.description,
          disputeType: values.disputeType,
          evidence: uploadedEvidence,
        },
      });

      if (error) throw error;

      toast({
        title: "Dispute Submitted",
        description: "Your dispute has been submitted for admin review. You'll be notified of the outcome.",
      });

      // Clean up
      evidence.forEach((item) => URL.revokeObjectURL(item.preview));
      setEvidence([]);
      form.reset();
      setShowForm(false);
      onOpenChange(false);
      onSuccess();
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

  const handleCancel = () => {
    evidence.forEach((item) => URL.revokeObjectURL(item.preview));
    setEvidence([]);
    form.reset();
    setShowForm(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        handleCancel();
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Raise a Dispute
          </DialogTitle>
          <DialogDescription>
            Follow these steps to resolve your issue
          </DialogDescription>
        </DialogHeader>

        {!showForm ? (
          <div className="space-y-4">
            {/* Pre-dispute guidance */}
            <Alert>
              <MessageSquare className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">Before raising a dispute:</p>
                <ul className="space-y-1 text-sm">
                  <li>✓ Try messaging the {userRole === "buyer" ? "seller" : "buyer"} first to resolve the issue directly</li>
                  <li>✓ Many issues can be quickly resolved through communication</li>
                  <li>✓ Give them 24-48 hours to respond before escalating</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm">
                <p className="font-semibold mb-2 text-amber-900 dark:text-amber-100">
                  What happens when you raise a dispute:
                </p>
                <ul className="space-y-1 text-amber-800 dark:text-amber-200">
                  <li>• Your payment remains in escrow (held securely)</li>
                  <li>• An admin will review your case within 24-48 hours</li>
                  <li>• You'll need to provide photo evidence</li>
                  <li>• Both parties can submit additional information</li>
                  <li>• The admin's decision is final</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  // Close dialog and navigate to messages with the other user pre-selected
                  onOpenChange(false);
                  navigate(`/dashboard?tab=messages&user=${otherUserId}`);
                }}
                variant="outline"
                className="flex-1"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Message {userRole === "buyer" ? "Seller" : "Buyer"} First
              </Button>
              <Button
                onClick={() => setShowForm(true)}
                variant="destructive"
                className="flex-1"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Continue with Dispute
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Dispute Type */}
              <FormField
                control={form.control}
                name="disputeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What's the issue? *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the type of issue" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {disputeTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide a detailed explanation of the issue. Include dates, what you expected, and what actually happened..."
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum 20 characters. Be specific and factual.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Evidence Upload */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">
                    Photo Evidence * (Required, max {MAX_FILES})
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload clear photos showing the issue. JPG, PNG or WEBP, max 5MB each.
                  </p>
                </div>

                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="evidence-upload"
                    multiple
                    accept={ACCEPTED_IMAGE_TYPES.join(",")}
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    disabled={evidence.length >= MAX_FILES}
                  />
                  <label
                    htmlFor="evidence-upload"
                    className={`cursor-pointer ${evidence.length >= MAX_FILES ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {evidence.length >= MAX_FILES ? "Maximum files reached" : "Click to upload photos"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {evidence.length} of {MAX_FILES} files uploaded
                    </p>
                  </label>
                </div>

                {/* Evidence Preview */}
                {evidence.length > 0 && (
                  <div className="space-y-3">
                    {evidence.map((item, index) => (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start gap-3">
                          <img
                            src={item.preview}
                            alt={`Evidence ${index + 1}`}
                            className="w-20 h-20 object-cover rounded"
                          />
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              placeholder="Optional: Describe what this photo shows..."
                              value={item.description}
                              onChange={(e) => updateEvidenceDescription(index, e.target.value)}
                              className="w-full px-3 py-2 text-sm border rounded-md"
                            />
                            <p className="text-xs text-muted-foreground">
                              {item.file.name} ({(item.file.size / 1024 / 1024).toFixed(2)}MB)
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEvidence(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isLoading || evidence.length === 0}
                  className="flex-1"
                >
                  {isLoading ? "Submitting..." : "Submit Dispute"}
                </Button>
              </div>

              {evidence.length === 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  At least one photo is required to submit a dispute
                </p>
              )}
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
