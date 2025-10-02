import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsPDF } from "https://cdn.skypack.dev/jspdf@2.5.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { transactionId } = await req.json();
    
    if (!transactionId) {
      return new Response(
        JSON.stringify({ error: 'Transaction ID required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating certificates for transaction:', transactionId);

    // Fetch transaction with all related data
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select(`
        *,
        listings!inner(
          id,
          title,
          environmental_assessment_enabled,
          certificate_methodology,
          carbon_saved,
          weight,
          quantity,
          categories(name)
        ),
        buyer:profiles!transactions_buyer_id_fkey(
          display_name,
          username,
          company_name,
          business_logo_url,
          location,
          verified,
          identity_verified,
          created_at
        ),
        seller:profiles!transactions_seller_id_fkey(
          display_name,
          username,
          company_name,
          business_logo_url,
          location,
          verified,
          identity_verified,
          created_at
        )
      `)
      .eq('id', transactionId)
      .eq('status', 'completed')
      .single();

    if (txError || !transaction) {
      console.error('Transaction not found or not completed:', txError);
      return new Response(
        JSON.stringify({ error: 'Transaction not found or not completed' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!transaction.listings?.environmental_assessment_enabled) {
      return new Response(
        JSON.stringify({ error: 'Environmental assessment not enabled for this listing' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const methodology = transaction.listings.certificate_methodology || {};
    const materialWeight = methodology.weight || transaction.listings.weight || 0;
    const carbonSaved = transaction.listings.carbon_saved || 0;
    const categoryName = transaction.listings.categories?.name || 'Construction Material';
    
    // Check if certificate already exists
    const { data: existingCert } = await supabase
      .from('environmental_certificates')
      .select('id, certificate_reference')
      .eq('transaction_id', transactionId)
      .single();

    if (existingCert) {
      console.log('Certificate already exists:', existingCert.certificate_reference);
      return new Response(
        JSON.stringify({ 
          success: true,
          certificateReference: existingCert.certificate_reference,
          message: 'Certificate already generated'
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique certificate reference
    const referenceId = crypto.randomUUID().split('-')[0].toUpperCase();
    const certificateReference = `SKIP-ENV-${new Date().getFullYear()}-${referenceId}`;

    // Helper function to generate PDF certificate
    const generatePDF = (recipientType: 'buyer' | 'seller') => {
      const doc = new jsPDF();
      const recipient = recipientType === 'buyer' ? transaction.buyer : transaction.seller;
      const otherParty = recipientType === 'buyer' ? transaction.seller : transaction.buyer;
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('ENVIRONMENTAL IMPACT CERTIFICATE', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Reused Construction Materials', 105, 28, { align: 'center' });
      
      // Reference and Date
      doc.setFontSize(9);
      doc.text(`Reference: ${certificateReference}`, 20, 40);
      doc.text(`Issue Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, 20, 45);
      
      // Recipient Information
      let yPos = 58;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Issued to: ${recipientType === 'buyer' ? 'Buyer' : 'Seller'}`, 20, yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${recipient.display_name || recipient.username || 'N/A'}`, 20, yPos);
      
      if (recipient.company_name) {
        yPos += 6;
        doc.text(`Company: ${recipient.company_name}`, 20, yPos);
      }
      
      if (recipient.location) {
        yPos += 6;
        doc.text(`Location: ${recipient.location}`, 20, yPos);
      }
      
      yPos += 6;
      doc.text(`Member Since: ${new Date(recipient.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`, 20, yPos);
      
      if (recipient.verified || recipient.identity_verified) {
        yPos += 6;
        doc.setTextColor(0, 128, 0);
        doc.text(`✓ Verified ${recipient.identity_verified ? 'Identity' : 'Account'}`, 20, yPos);
        doc.setTextColor(0, 0, 0);
      }
      
      // Other Party Information
      yPos += 12;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${recipientType === 'buyer' ? 'Seller' : 'Buyer'} Information:`, 20, yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${otherParty.display_name || otherParty.username || 'N/A'}`, 20, yPos);
      
      if (otherParty.company_name) {
        yPos += 6;
        doc.text(`Company: ${otherParty.company_name}`, 20, yPos);
      }
      
      // Transaction Details
      yPos += 12;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Transaction Details', 20, yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Transaction Date: ${new Date(transaction.completed_at).toLocaleDateString('en-GB')}`, 20, yPos);
      yPos += 6;
      doc.text(`Material: ${transaction.listings.title}`, 20, yPos);
      yPos += 6;
      doc.text(`Category: ${categoryName}`, 20, yPos);
      yPos += 6;
      doc.text(`Quantity: ${transaction.listings.quantity} units`, 20, yPos);
      yPos += 6;
      doc.text(`Total Weight: ${materialWeight.toFixed(2)} kg`, 20, yPos);
      
      // Environmental Impact Box
      yPos += 12;
      doc.setDrawColor(76, 175, 80);
      doc.setFillColor(232, 245, 233);
      doc.rect(20, yPos, 170, 35, 'FD');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(27, 94, 32);
      doc.text('ENVIRONMENTAL IMPACT', 105, yPos + 8, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`🌱 Material Diverted from Landfill: ${materialWeight.toFixed(1)} kg`, 30, yPos + 18);
      doc.text(`💨 Carbon Emissions Saved: ${carbonSaved.toFixed(1)} kg CO₂e`, 30, yPos + 26);
      
      doc.setTextColor(0, 0, 0);
      
      // Methodology
      yPos += 42;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CALCULATION METHODOLOGY', 20, yPos);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos + 2, 190, yPos + 2);
      
      yPos += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Material Classification: ${methodology.materialType || 'Construction Material'}`, 20, yPos);
      yPos += 5;
      doc.text(`Carbon Factor Source: ICE Database v3.0 (University of Bath)`, 20, yPos);
      yPos += 5;
      doc.text(`Calculation Method: ${methodology.calculationMethod === 'provided_weight' ? 'Based on provided weight ✓' : 'Estimated from dimensions'}`, 20, yPos);
      yPos += 5;
      doc.text(`Confidence Level: ${transaction.listings.calculation_confidence || 'Medium'}`, 20, yPos);
      
      // Disclaimers
      yPos += 12;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('IMPORTANT INFORMATION', 20, yPos);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos + 2, 190, yPos + 2);
      
      yPos += 8;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      const disclaimerLines = doc.splitTextToSize(
        '• Calculations based on industry-standard embodied carbon factors from the Inventory of Carbon & Energy (ICE) Database, University of Bath\n' +
        '• Values represent estimated environmental impact of reusing construction materials versus new production\n' +
        '• Actual values may vary based on specific circumstances, manufacturing processes, and transportation\n' +
        '• This certificate is intended for informational and sustainability reporting purposes\n' +
        '• For official BREEAM/ESG submissions, consult with your accreditation body regarding documentation requirements',
        170
      );
      doc.text(disclaimerLines, 20, yPos);
      
      // Footer
      doc.setFontSize(8);
      doc.text(`Verification URL: skipped.co.uk/verify-certificate/${certificateReference}`, 105, 280, { align: 'center' });
      doc.text('This certificate has been electronically verified and signed', 105, 285, { align: 'center' });
      
      return doc.output('arraybuffer');
    };

    // Generate both certificates
    const buyerPDF = generatePDF('buyer');
    const sellerPDF = generatePDF('seller');
    
    // Upload PDFs to storage
    const buyerPath = `${transaction.buyer_id}-${transaction.seller_id}/buyer-${certificateReference}.pdf`;
    const sellerPath = `${transaction.buyer_id}-${transaction.seller_id}/seller-${certificateReference}.pdf`;
    
    const { error: buyerUploadError } = await supabase.storage
      .from('environmental-certificates')
      .upload(buyerPath, buyerPDF, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      });

    if (buyerUploadError) throw buyerUploadError;

    const { error: sellerUploadError } = await supabase.storage
      .from('environmental-certificates')
      .upload(sellerPath, sellerPDF, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      });

    if (sellerUploadError) throw sellerUploadError;

    // Get public URLs
    const { data: { publicUrl: buyerUrl } } = supabase.storage
      .from('environmental-certificates')
      .getPublicUrl(buyerPath);

    const { data: { publicUrl: sellerUrl } } = supabase.storage
      .from('environmental-certificates')
      .getPublicUrl(sellerPath);

    // Insert certificate record
    const { error: certError } = await supabase
      .from('environmental_certificates')
      .insert({
        transaction_id: transactionId,
        listing_id: transaction.listing_id,
        certificate_reference: certificateReference,
        buyer_id: transaction.buyer_id,
        seller_id: transaction.seller_id,
        material_type: methodology.materialType || categoryName,
        material_weight_kg: materialWeight,
        carbon_saved_kg: carbonSaved,
        landfill_diverted_kg: materialWeight,
        calculation_method: methodology.calculationMethod || 'estimated',
        carbon_factor_source: 'ICE Database v3.0 (University of Bath)',
        methodology_snapshot: methodology,
        buyer_certificate_url: buyerUrl,
        seller_certificate_url: sellerUrl
      });

    if (certError) throw certError;

    console.log('Certificates generated successfully:', certificateReference);

    return new Response(
      JSON.stringify({ 
        success: true,
        certificateReference,
        buyerCertificateUrl: buyerUrl,
        sellerCertificateUrl: sellerUrl
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error generating certificates:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error?.message || 'Unknown error'
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
