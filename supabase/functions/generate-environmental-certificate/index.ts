import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import jsPDF from "https://esm.sh/jspdf@2.5.1"
import QRCode from "https://esm.sh/qrcode@1.5.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Skipped logo as base64 (embedded)
const SKIPPED_LOGO_BASE64 = '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';

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

    // Fetch buyer and seller profiles separately
    const { data: buyerProfile } = await supabase
      .from('profiles')
      .select('display_name, username, company_name, business_logo_url, location, verified, identity_verified, created_at')
      .eq('user_id', transaction.buyer_id)
      .single();

    const { data: sellerProfile } = await supabase
      .from('profiles')
      .select('display_name, username, company_name, business_logo_url, location, verified, identity_verified, created_at')
      .eq('user_id', transaction.seller_id)
      .single();

    // Add profiles to transaction object
    const transactionWithProfiles = {
      ...transaction,
      buyer: buyerProfile,
      seller: sellerProfile
    };

    if (!transactionWithProfiles.listings?.environmental_assessment_enabled) {
      return new Response(
        JSON.stringify({ error: 'Environmental assessment not enabled for this listing' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const methodology = transactionWithProfiles.listings.certificate_methodology || {};
    const materialWeight = methodology.weight || transactionWithProfiles.listings.weight || 0;
    const carbonSaved = transactionWithProfiles.listings.carbon_saved || 0;
    const categoryName = transactionWithProfiles.listings.categories?.name || 'Construction Material';
    
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
      const recipient = recipientType === 'buyer' ? transactionWithProfiles.buyer : transactionWithProfiles.seller;
      const otherParty = recipientType === 'buyer' ? transactionWithProfiles.seller : transactionWithProfiles.buyer;
      const recipientLogo = recipientType === 'buyer' ? buyerLogo : sellerLogo;
      const otherPartyLogo = recipientType === 'buyer' ? sellerLogo : buyerLogo;
      
      // Add decorative border
      doc.setDrawColor(76, 175, 80);
      doc.setLineWidth(2);
      doc.rect(5, 5, 200, 287);
      
      // Add subtle watermark
      if (SKIPPED_LOGO_BASE64) {
        doc.addImage(SKIPPED_LOGO_BASE64, 'JPEG', 60, 130, 90, 30, undefined, 'NONE', 0);
        doc.setGState(new doc.GState({ opacity: 0.05 }));
        doc.addImage(SKIPPED_LOGO_BASE64, 'JPEG', 60, 130, 90, 30);
        doc.setGState(new doc.GState({ opacity: 1 }));
      }
      
      // Header with logos
      if (SKIPPED_LOGO_BASE64) {
        doc.addImage(SKIPPED_LOGO_BASE64, 'JPEG', 15, 12, 45, 15);
      }
      
      if (recipientLogo) {
        doc.addImage(recipientLogo, 'JPEG', 165, 12, 25, 25);
      }
      
      // Title
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(27, 94, 32);
      doc.text('ENVIRONMENTAL IMPACT', 105, 35, { align: 'center' });
      doc.text('CERTIFICATE', 105, 43, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Reused Construction Materials', 105, 51, { align: 'center' });
      
      // Certificate reference with border
      doc.setFillColor(76, 175, 80);
      doc.rect(15, 57, 180, 10, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`Certificate Reference: ${certificateReference}`, 105, 63, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      
      // Issue Date
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Issued: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, 105, 72, { align: 'center' });
      
      // Two-column layout for parties
      const leftCol = 20;
      const rightCol = 110;
      let yPos = 85;
      
      // Recipient column (left)
      doc.setFillColor(232, 245, 233);
      doc.rect(15, yPos - 5, 85, 50, 'F');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(27, 94, 32);
      doc.text(`ISSUED TO: ${recipientType.toUpperCase()}`, leftCol, yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(recipient.display_name || recipient.username || 'N/A', leftCol, yPos);
      
      if (recipient.company_name) {
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(`Company: ${recipient.company_name}`, leftCol, yPos);
      }
      
      if (recipient.location) {
        yPos += 5;
        doc.setFontSize(9);
        doc.text(`📍 ${recipient.location}`, leftCol, yPos);
      }
      
      if (recipient.verified || recipient.identity_verified) {
        yPos += 5;
        doc.setTextColor(0, 128, 0);
        doc.text(`✓ Verified ${recipient.identity_verified ? 'Identity' : 'Account'}`, leftCol, yPos);
        doc.setTextColor(0, 0, 0);
      }
      
      // Other party column (right) with logo
      yPos = 85;
      doc.setFillColor(245, 245, 245);
      doc.rect(105, yPos - 5, 85, 50, 'F');
      
      if (otherPartyLogo) {
        doc.addImage(otherPartyLogo, 'JPEG', rightCol, yPos - 3, 15, 15);
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text(`${recipientType === 'buyer' ? 'SELLER' : 'BUYER'}:`, rightCol + (otherPartyLogo ? 18 : 0), yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(otherParty.display_name || otherParty.username || 'N/A', rightCol, yPos);
      
      if (otherParty.company_name) {
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(otherParty.company_name, rightCol, yPos);
      }
      
      // Environmental Impact - Large prominent box
      yPos = 145;
      doc.setDrawColor(76, 175, 80);
      doc.setFillColor(232, 245, 233);
      doc.setLineWidth(3);
      doc.rect(15, yPos, 180, 55, 'FD');
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(27, 94, 32);
      doc.text('ENVIRONMENTAL IMPACT', 105, yPos + 12, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Impact metrics in two columns
      const impactLeftCol = 25;
      const impactRightCol = 115;
      let impactYPos = yPos + 25;
      
      doc.text(`🌱 Landfill Diverted:`, impactLeftCol, impactYPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`${materialWeight.toFixed(1)} kg`, impactLeftCol + 5, impactYPos + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`💨 Carbon Saved:`, impactRightCol, impactYPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`${carbonSaved.toFixed(1)} kg CO₂e`, impactRightCol + 5, impactYPos + 6);
      
      // Comparison metrics
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(80, 80, 80);
      const treesEquivalent = (carbonSaved / 21).toFixed(1);
      doc.text(`≈ ${treesEquivalent} trees planted for 1 year`, 105, yPos + 48, { align: 'center' });
      
      // Transaction Details
      yPos = 210;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('TRANSACTION DETAILS', 20, yPos);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos + 2, 190, yPos + 2);
      
      yPos += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date(transactionWithProfiles.completed_at).toLocaleDateString('en-GB')}`, 20, yPos);
      yPos += 5;
      doc.text(`Material: ${transactionWithProfiles.listings.title}`, 20, yPos);
      yPos += 5;
      doc.text(`Category: ${categoryName}`, 20, yPos);
      yPos += 5;
      doc.text(`Quantity: ${transactionWithProfiles.listings.quantity} units`, 20, yPos);
      yPos += 5;
      doc.text(`Transaction Value: £${transaction.amount.toFixed(2)}`, 20, yPos);
      
      // Methodology
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('CALCULATION METHODOLOGY', 20, yPos);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos + 1, 190, yPos + 1);
      
      yPos += 6;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Material: ${methodology.materialType || 'Construction Material'}`, 20, yPos);
      yPos += 4;
      doc.text(`Carbon Factor: ICE Database v3.0 (University of Bath)`, 20, yPos);
      yPos += 4;
      doc.text(`Method: ${methodology.calculationMethod === 'provided_weight' ? 'Provided weight ✓' : 'Estimated'}`, 20, yPos);
      yPos += 4;
      doc.text(`Confidence: ${transactionWithProfiles.listings.calculation_confidence || 'Medium'}`, 20, yPos);
      
      // QR Code and seal
      doc.addImage(qrCodeUrl, 'PNG', 165, 215, 25, 25);
      
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text('Scan to verify', 177.5, 242, { align: 'center' });
      
      // Certificate seal
      doc.setDrawColor(0, 128, 0);
      doc.setFillColor(232, 245, 233);
      doc.setLineWidth(2);
      doc.circle(177.5, 225, 10, 'FD');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 128, 0);
      doc.text('VERIFIED', 177.5, 224, { align: 'center' });
      doc.text('SKIPPED', 177.5, 228, { align: 'center' });
      
      // Footer
      yPos = 260;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const disclaimerText = doc.splitTextToSize(
        'Calculations based on industry-standard embodied carbon factors from the ICE Database. ' +
        'Values represent estimated impact of reusing materials versus new production. ' +
        'Actual values may vary based on specific circumstances.',
        170
      );
      doc.text(disclaimerText, 20, yPos);
      
      yPos = 277;
      doc.setFontSize(8);
      doc.text('SKIPPED - Sustainable Construction Materials Marketplace', 105, yPos, { align: 'center' });
      doc.text('skipped.co.uk', 105, yPos + 4, { align: 'center' });
      
      return doc.output('arraybuffer');
    };

    // Generate both certificates
    const buyerPDF = generatePDF('buyer');
    const sellerPDF = generatePDF('seller');
    
    // Upload PDFs to storage
    const buyerPath = `${transactionWithProfiles.buyer_id}-${transactionWithProfiles.seller_id}/buyer-${certificateReference}.pdf`;
    const sellerPath = `${transactionWithProfiles.buyer_id}-${transactionWithProfiles.seller_id}/seller-${certificateReference}.pdf`;
    
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
        listing_id: transactionWithProfiles.listing_id,
        certificate_reference: certificateReference,
        buyer_id: transactionWithProfiles.buyer_id,
        seller_id: transactionWithProfiles.seller_id,
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
