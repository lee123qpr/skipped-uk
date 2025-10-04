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
import { AlertCircle, CheckCircle, Clock, ExternalLink, ImageIcon, User, Package, Calendar, Camera, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface DisputeEvidence {
  id: string;
  dispute_id?: string;
  evidence_type: string;
  file_url: string;
  description: string;
  uploaded_by_id: string;
  created_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  verified: boolean;
  company_name: string | null;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  images: string[];
  description: string;
}

interface Transaction {
  id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  dispatch_confirmed_at: string | null;
  delivery_confirmed_at: string | null;
  created_at: string;
}

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
  transactions: Transaction;
  dispute_evidence?: DisputeEvidence[];
  listings: Listing;
  raised_by_profile: Profile;
  against_profile: Profile;
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
  
  // Phase 2: Filters & Search
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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
            id,
            amount,
            status,
            paid_at,
            dispatch_confirmed_at,
            delivery_confirmed_at,
            created_at
          ),
          dispute_evidence (
            id,
            evidence_type,
            file_url,
            description,
            uploaded_by_id,
            created_at
          ),
          listings!disputes_listing_id_fkey (
            id,
            title,
            price,
            images,
            description
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately for raised_by and against users
      if (data && data.length > 0) {
        const userIds = [...new Set([...data.map(d => d.raised_by_id), ...data.map(d => d.against_id)])];
        
        const { data: profilesData } = await supabase
          .from("public_profiles")
          .select("*")
          .in("user_id", userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

        const disputesWithProfiles = data.map(dispute => ({
          ...dispute,
          raised_by_profile: profilesMap.get(dispute.raised_by_id) || {
            id: "",
            user_id: dispute.raised_by_id,
            display_name: null,
            username: null,
            avatar_url: null,
            verified: false,
            company_name: null
          },
          against_profile: profilesMap.get(dispute.against_id) || {
            id: "",
            user_id: dispute.against_id,
            display_name: null,
            username: null,
            avatar_url: null,
            verified: false,
            company_name: null
          }
        }));

        setDisputes(disputesWithProfiles);
      } else {
        setDisputes([]);
      }
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

  // Phase 2: Filter and search logic
  const filteredDisputes = disputes.filter(dispute => {
    // Status filter
    if (statusFilter && dispute.status !== statusFilter) return false;
    
    // Type filter
    if (typeFilter && dispute.dispute_type !== typeFilter) return false;
    
    // Date filter
    if (dateFilter) {
      const disputeDate = new Date(dispute.created_at);
      const now = new Date();
      
      if (dateFilter === 'today') {
        if (disputeDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (disputeDate < weekAgo) return false;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (disputeDate < monthAgo) return false;
      }
    }
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesId = dispute.id.toLowerCase().includes(query);
      const matchesRaisedBy = (dispute.raised_by_profile.display_name?.toLowerCase().includes(query) || 
                               dispute.raised_by_profile.username?.toLowerCase().includes(query));
      const matchesAgainst = (dispute.against_profile.display_name?.toLowerCase().includes(query) || 
                              dispute.against_profile.username?.toLowerCase().includes(query));
      
      if (!matchesId && !matchesRaisedBy && !matchesAgainst) return false;
    }
    
    return true;
  });

  if (loading) {
    return <div>Loading disputes...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Dispute Management</h2>
      
      {/* Phase 2: Filters & Search */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4" />
          <h3 className="font-medium">Filters & Search</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Dispute Type</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="not_as_described">Not As Described</SelectItem>
                <SelectItem value="not_received">Not Received</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
                <SelectItem value="wrong_item">Wrong Item</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ID or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
        {(statusFilter || typeFilter || dateFilter || searchQuery) && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredDisputes.length} of {disputes.length} disputes
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("");
                setTypeFilter("");
                setDateFilter("");
                setSearchQuery("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </Card>

      {filteredDisputes.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {disputes.length === 0 ? "No disputes found" : "No disputes match your filters"}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDisputes.map((dispute) => (
            <Card key={dispute.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">Dispute #{dispute.id.slice(0, 8)}</h3>
                    {getStatusBadge(dispute.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(dispute.created_at), "PPp")} ({formatDistanceToNow(new Date(dispute.created_at), { addSuffix: true })})
                  </p>
                </div>
                {dispute.status === "pending" && (
                  <Button onClick={() => handleResolveClick(dispute)}>
                    Review Dispute
                  </Button>
                )}
              </div>

              {/* Buyer & Seller Info */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={dispute.raised_by_profile.avatar_url || undefined} />
                    <AvatarFallback>
                      {dispute.raised_by_profile.display_name?.[0] || dispute.raised_by_profile.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">Raised By</Badge>
                      {dispute.raised_by_profile.verified && <Badge variant="secondary" className="text-xs">✓</Badge>}
                    </div>
                    <p className="font-medium truncate">
                      {dispute.raised_by_profile.display_name || dispute.raised_by_profile.username || "Anonymous"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={dispute.against_profile.avatar_url || undefined} />
                    <AvatarFallback>
                      {dispute.against_profile.display_name?.[0] || dispute.against_profile.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Against</Badge>
                      {dispute.against_profile.verified && <Badge variant="secondary" className="text-xs">✓</Badge>}
                    </div>
                    <p className="font-medium truncate">
                      {dispute.against_profile.display_name || dispute.against_profile.username || "Anonymous"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Listing Info */}
              <div className="flex gap-3 mb-4 p-3 bg-muted rounded-lg">
                {dispute.listings.images[0] && (
                  <img
                    src={dispute.listings.images[0]}
                    alt={dispute.listings.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-xs text-muted-foreground">Listing</Label>
                  </div>
                  <p className="font-medium truncate">{dispute.listings.title}</p>
                  <p className="text-sm text-muted-foreground">£{dispute.transactions.amount}</p>
                </div>
              </div>

              {/* Transaction Timeline */}
              {dispute.transactions.paid_at && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-xs text-muted-foreground">Transaction Timeline</Label>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Paid:</span>
                      <span className="text-muted-foreground">{format(new Date(dispute.transactions.paid_at), "PPp")}</span>
                    </div>
                    {dispute.transactions.dispatch_confirmed_at && (
                      <div className="flex justify-between">
                        <span>Dispatched:</span>
                        <span className="text-muted-foreground">{format(new Date(dispute.transactions.dispatch_confirmed_at), "PPp")}</span>
                      </div>
                    )}
                    {dispute.transactions.delivery_confirmed_at && (
                      <div className="flex justify-between">
                        <span>Delivered:</span>
                        <span className="text-muted-foreground">{format(new Date(dispute.transactions.delivery_confirmed_at), "PPp")}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium">
                      <span>Days since payment:</span>
                      <span>{Math.floor((Date.now() - new Date(dispute.transactions.paid_at).getTime()) / (1000 * 60 * 60 * 24))}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Type</Label>
                  <p className="font-medium">{dispute.dispute_type.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Requested Amount</Label>
                  <p className="font-medium">£{dispute.requested_amount}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-muted-foreground">Reason</Label>
                  <p>{dispute.reason}</p>
                </div>
                {dispute.description && (
                  <div>
                    <Label className="text-sm text-muted-foreground">User Explanation</Label>
                    <p className="text-sm whitespace-pre-wrap bg-background p-3 rounded-md border">{dispute.description}</p>
                  </div>
                )}
                {dispute.dispute_evidence && dispute.dispute_evidence.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground flex items-center gap-1">
                      <ImageIcon className="h-4 w-4" />
                      Evidence Photos ({dispute.dispute_evidence.length})
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {dispute.dispute_evidence.map((evidence) => (
                        <div key={evidence.id} className="relative group">
                          <img
                            src={evidence.file_url}
                            alt="Evidence"
                            className="w-full h-24 object-cover rounded-md border cursor-pointer hover:opacity-75 transition-opacity"
                            onClick={() => window.open(evidence.file_url, "_blank")}
                          />
                          {evidence.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {evidence.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resolve Dispute #{selectedDispute?.id.slice(0, 8)}</DialogTitle>
            <DialogDescription>
              Review all details and select an appropriate resolution
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-6">
              {/* Buyer & Seller Profiles Side by Side */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedDispute.raised_by_profile.avatar_url || undefined} />
                      <AvatarFallback>
                        {selectedDispute.raised_by_profile.display_name?.[0] || selectedDispute.raised_by_profile.username?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Badge variant="destructive" className="mb-1">Raised By</Badge>
                      <p className="font-semibold">
                        {selectedDispute.raised_by_profile.display_name || selectedDispute.raised_by_profile.username || "Anonymous"}
                      </p>
                      {selectedDispute.raised_by_profile.company_name && (
                        <p className="text-sm text-muted-foreground">{selectedDispute.raised_by_profile.company_name}</p>
                      )}
                    </div>
                    {selectedDispute.raised_by_profile.verified && (
                      <Badge variant="secondary">Verified</Badge>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedDispute.against_profile.avatar_url || undefined} />
                      <AvatarFallback>
                        {selectedDispute.against_profile.display_name?.[0] || selectedDispute.against_profile.username?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-1">Against</Badge>
                      <p className="font-semibold">
                        {selectedDispute.against_profile.display_name || selectedDispute.against_profile.username || "Anonymous"}
                      </p>
                      {selectedDispute.against_profile.company_name && (
                        <p className="text-sm text-muted-foreground">{selectedDispute.against_profile.company_name}</p>
                      )}
                    </div>
                    {selectedDispute.against_profile.verified && (
                      <Badge variant="secondary">Verified</Badge>
                    )}
                  </div>
                </Card>
              </div>

              <Separator />

              {/* Listing Details */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Listing Details
                </h4>
                <Card className="p-4">
                  <div className="flex gap-4">
                    {selectedDispute.listings.images[0] && (
                      <img
                        src={selectedDispute.listings.images[0]}
                        alt={selectedDispute.listings.title}
                        className="w-24 h-24 object-cover rounded border"
                      />
                    )}
                    <div className="flex-1">
                      <h5 className="font-medium mb-1">{selectedDispute.listings.title}</h5>
                      <p className="text-lg font-bold text-primary mb-2">£{selectedDispute.listings.price}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{selectedDispute.listings.description}</p>
                    </div>
                  </div>
                  {selectedDispute.listings.images.length > 1 && (
                    <div className="mt-3 pt-3 border-t">
                      <Label className="text-xs text-muted-foreground mb-2 block">Original Listing Photos</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {selectedDispute.listings.images.slice(0, 4).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Listing ${idx + 1}`}
                            className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-75 transition-opacity"
                            onClick={() => window.open(img, "_blank")}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Transaction Timeline */}
              {selectedDispute.transactions.paid_at && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Transaction Timeline
                  </h4>
                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Transaction Amount:</span>
                        <span className="font-medium">£{selectedDispute.transactions.amount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="outline">{selectedDispute.transactions.status}</Badge>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Payment Date:</span>
                        <span>{format(new Date(selectedDispute.transactions.paid_at), "PPp")}</span>
                      </div>
                      {selectedDispute.transactions.dispatch_confirmed_at && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Dispatch Date:</span>
                          <span>{format(new Date(selectedDispute.transactions.dispatch_confirmed_at), "PPp")}</span>
                        </div>
                      )}
                      {selectedDispute.transactions.delivery_confirmed_at && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Delivery Date:</span>
                          <span>{format(new Date(selectedDispute.transactions.delivery_confirmed_at), "PPp")}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-sm font-medium">
                        <span>Days Since Payment:</span>
                        <span className="text-primary">{Math.floor((Date.now() - new Date(selectedDispute.transactions.paid_at).getTime()) / (1000 * 60 * 60 * 24))} days</span>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              <Separator />

              {/* Dispute Details */}
              <div>
                <h4 className="font-semibold mb-3">Dispute Information</h4>
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Dispute Type</Label>
                      <p className="font-medium">{selectedDispute.dispute_type.replace(/_/g, " ")}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Requested Amount</Label>
                      <p className="font-medium text-destructive">£{selectedDispute.requested_amount}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Reason</Label>
                    <p className="text-sm">{selectedDispute.reason}</p>
                  </div>
                  {selectedDispute.description && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Detailed Explanation</Label>
                      <p className="text-sm whitespace-pre-wrap bg-background p-3 rounded border">{selectedDispute.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Evidence Comparison - Phase 2: Better Display */}
              {selectedDispute.dispute_evidence && selectedDispute.dispute_evidence.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Evidence Photos ({selectedDispute.dispute_evidence.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedDispute.dispute_evidence.map((evidence, idx) => (
                      <Card key={evidence.id} className="p-3 space-y-2">
                        <div className="relative group">
                          <img
                            src={evidence.file_url}
                            alt={evidence.description || `Evidence ${idx + 1}`}
                            className="w-full h-40 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(evidence.file_url, "_blank")}
                          />
                          <div className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground text-xs px-2 py-1 rounded font-medium">
                            Evidence {idx + 1}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium">
                            {evidence.description || 'No description provided'}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(evidence.created_at), 'dd MMM yyyy HH:mm')}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Original Listing Photos - Phase 2: Comparison View */}
              {selectedDispute.listings?.images && selectedDispute.listings.images.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Original Listing Photos ({selectedDispute.listings.images.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedDispute.listings.images.map((image, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="relative group">
                          <img
                            src={image}
                            alt={`Listing ${idx + 1}`}
                            className="w-full h-40 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(image, "_blank")}
                          />
                          <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded font-medium">
                            Original {idx + 1}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Resolution Options */}
              <div className="space-y-4">
                <h4 className="font-semibold">Resolution Decision</h4>
                
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

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={resolving}>
                    Cancel
                  </Button>
                  <Button onClick={handleResolveDispute} disabled={resolving}>
                    {resolving ? "Resolving..." : "Resolve Dispute"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}