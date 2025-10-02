import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Leaf, Recycle, TrendingUp, Package } from "lucide-react";

export function AdminEnvironmental() {
  const { data: environmentalData, isLoading } = useQuery({
    queryKey: ['admin-environmental'],
    queryFn: async () => {
      // Get completed transactions with environmental data
      const { data: completedTransactions, error: txError } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          listing_id,
          listings (
            carbon_saved,
            weight,
            environmental_assessment_enabled
          )
        `)
        .in('status', ['completed', 'pending', 'paid', 'awaiting_dispatch', 'dispatched', 'in_transit', 'delivered']);

      if (txError) throw txError;

      // Get all listings with environmental data
      const { data: allListings, error: listingsError } = await supabase
        .from('listings')
        .select('carbon_saved, weight, environmental_assessment_enabled');

      if (listingsError) throw listingsError;

      // Calculate totals from transactions
      let totalCarbonSavedTransactions = 0;
      let totalWasteDivertedTransactions = 0;
      let transactionsWithEnvironmental = 0;

      completedTransactions?.forEach(tx => {
        const listing = tx.listings as any;
        if (listing?.environmental_assessment_enabled && listing?.carbon_saved) {
          totalCarbonSavedTransactions += Number(listing.carbon_saved);
          totalWasteDivertedTransactions += Number(listing.weight || 0);
          transactionsWithEnvironmental++;
        }
      });

      // Calculate totals from all listings
      let totalCarbonSavedListings = 0;
      let totalWasteDivertedListings = 0;
      let listingsWithEnvironmental = 0;

      allListings?.forEach(listing => {
        if (listing.environmental_assessment_enabled && listing.carbon_saved) {
          totalCarbonSavedListings += Number(listing.carbon_saved);
          totalWasteDivertedListings += Number(listing.weight || 0);
          listingsWithEnvironmental++;
        }
      });

      // Get certificates count
      const { count: certificatesCount } = await supabase
        .from('environmental_certificates')
        .select('*', { count: 'exact', head: true });

      return {
        transactions: {
          totalCarbonSaved: totalCarbonSavedTransactions,
          totalWasteDiverted: totalWasteDivertedTransactions,
          count: transactionsWithEnvironmental,
        },
        listings: {
          totalCarbonSaved: totalCarbonSavedListings,
          totalWasteDiverted: totalWasteDivertedListings,
          count: listingsWithEnvironmental,
        },
        certificatesIssued: certificatesCount || 0,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Environmental Impact</h2>
        <p className="text-muted-foreground">
          Track carbon savings and waste diversion across the platform
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              CO₂ Saved (Transactions)
            </CardTitle>
            <Leaf className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {environmentalData?.transactions.totalCarbonSaved.toFixed(2)} kg
            </div>
            <p className="text-xs text-muted-foreground">
              From {environmentalData?.transactions.count} completed purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Waste Diverted (Transactions)
            </CardTitle>
            <Recycle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {environmentalData?.transactions.totalWasteDiverted.toFixed(2)} kg
            </div>
            <p className="text-xs text-muted-foreground">
              Prevented from landfill
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              CO₂ Potential (All Listings)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {environmentalData?.listings.totalCarbonSaved.toFixed(2)} kg
            </div>
            <p className="text-xs text-muted-foreground">
              From {environmentalData?.listings.count} active listings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Certificates Issued
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {environmentalData?.certificatesIssued}
            </div>
            <p className="text-xs text-muted-foreground">
              Environmental impact certificates
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Transactions Impact</CardTitle>
            <CardDescription>
              Environmental savings from completed purchases
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Carbon Saved</span>
                <span className="text-sm text-muted-foreground">
                  {environmentalData?.transactions.totalCarbonSaved.toFixed(2)} kg CO₂
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Waste Diverted</span>
                <span className="text-sm text-muted-foreground">
                  {environmentalData?.transactions.totalWasteDiverted.toFixed(2)} kg
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tracked Transactions</span>
                <span className="text-sm text-muted-foreground">
                  {environmentalData?.transactions.count}
                </span>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                These figures represent actual environmental impact from completed and in-progress transactions
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Listings Potential</CardTitle>
            <CardDescription>
              Total environmental potential from all listings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Potential CO₂ Savings</span>
                <span className="text-sm text-muted-foreground">
                  {environmentalData?.listings.totalCarbonSaved.toFixed(2)} kg CO₂
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Potential Waste Diversion</span>
                <span className="text-sm text-muted-foreground">
                  {environmentalData?.listings.totalWasteDiverted.toFixed(2)} kg
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Assessed Listings</span>
                <span className="text-sm text-muted-foreground">
                  {environmentalData?.listings.count}
                </span>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                These figures show the maximum possible impact if all listed items are sold
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Environmental Methodology</CardTitle>
          <CardDescription>
            How we calculate environmental impact
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
              <div>
                <p className="font-medium">Carbon Calculations</p>
                <p className="text-muted-foreground">Based on industry-standard embodied carbon factors for construction materials</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
              <div>
                <p className="font-medium">Waste Diversion</p>
                <p className="text-muted-foreground">Calculated from material weight and density data</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
              <div>
                <p className="font-medium">Certificate Generation</p>
                <p className="text-muted-foreground">Automatically generated for completed transactions with environmental assessment enabled</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
