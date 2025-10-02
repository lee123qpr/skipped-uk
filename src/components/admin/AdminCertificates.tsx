import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FileText, Save, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function AdminCertificates() {
  const [certificateTemplate, setCertificateTemplate] = useState({
    headerText: "Environmental Impact Certificate",
    footerText: "This certificate confirms the positive environmental impact of this transaction",
    methodology: "Our calculations use industry-standard embodied carbon factors and material density data",
    disclaimer: "This certificate is generated based on declared material specifications and industry-standard carbon factors"
  });

  const [previewMode, setPreviewMode] = useState(false);

  const handleSaveTemplate = async () => {
    try {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          setting_key: 'certificate_template',
          setting_value: certificateTemplate,
          description: 'Template configuration for environmental impact certificates',
          updated_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast.success("Certificate template saved successfully");
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error("Failed to save template: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Certificate Template</h2>
          <p className="text-muted-foreground">
            Customize the environmental impact certificate template
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setPreviewMode(!previewMode)}
        >
          <Eye className="h-4 w-4 mr-2" />
          {previewMode ? "Edit Mode" : "Preview"}
        </Button>
      </div>

      {previewMode ? (
        <Card>
          <CardHeader className="text-center border-b bg-muted/50">
            <CardTitle className="text-2xl">{certificateTemplate.headerText}</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="border rounded-lg p-4 bg-muted/20">
              <h3 className="font-semibold mb-2">Methodology</h3>
              <p className="text-sm text-muted-foreground">{certificateTemplate.methodology}</p>
            </div>
            <div className="border rounded-lg p-4 bg-muted/20">
              <h3 className="font-semibold mb-2">Certificate Footer</h3>
              <p className="text-sm text-muted-foreground">{certificateTemplate.footerText}</p>
            </div>
            <div className="border rounded-lg p-4 bg-muted/20">
              <h3 className="font-semibold mb-2">Disclaimer</h3>
              <p className="text-xs text-muted-foreground italic">{certificateTemplate.disclaimer}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Template Configuration
            </CardTitle>
            <CardDescription>
              Customize the text and disclaimers that appear on environmental certificates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="headerText">Certificate Header</Label>
              <Input
                id="headerText"
                value={certificateTemplate.headerText}
                onChange={(e) => setCertificateTemplate({
                  ...certificateTemplate,
                  headerText: e.target.value
                })}
                placeholder="Main certificate title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="methodology">Methodology Description</Label>
              <Textarea
                id="methodology"
                value={certificateTemplate.methodology}
                onChange={(e) => setCertificateTemplate({
                  ...certificateTemplate,
                  methodology: e.target.value
                })}
                placeholder="Explain the calculation methodology"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="footerText">Certificate Footer</Label>
              <Textarea
                id="footerText"
                value={certificateTemplate.footerText}
                onChange={(e) => setCertificateTemplate({
                  ...certificateTemplate,
                  footerText: e.target.value
                })}
                placeholder="Closing statement for the certificate"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="disclaimer">Disclaimer Text</Label>
              <Textarea
                id="disclaimer"
                value={certificateTemplate.disclaimer}
                onChange={(e) => setCertificateTemplate({
                  ...certificateTemplate,
                  disclaimer: e.target.value
                })}
                placeholder="Legal disclaimer and limitations"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                onClick={handleSaveTemplate}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Certificate Information</CardTitle>
          <CardDescription>
            Environmental certificates are automatically generated for completed transactions when enabled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
              <div>
                <p className="font-medium">Automatic Generation</p>
                <p className="text-muted-foreground">Certificates are created when transactions are completed and environmental assessment is enabled on the listing</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
              <div>
                <p className="font-medium">PDF Format</p>
                <p className="text-muted-foreground">Certificates are generated as PDF documents and stored securely in Supabase Storage</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
              <div>
                <p className="font-medium">Dual Copies</p>
                <p className="text-muted-foreground">Both buyer and seller receive individual certificates with their transaction details</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
