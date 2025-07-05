"use client";

import { useBranding } from "@/contexts/BrandingContext";
import { useAuth } from "@/utils/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { ColorPicker } from "@/ui/color-picker";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, RotateCcw, Palette, Type, Image } from "lucide-react";
import { supabase } from "@/utils/supabase";
import Header from "@/dash/header";

export default function BrandingPage() {
  const { user, isLoading } = useAuth();
  const branding = useBranding();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(branding.logoUrl);

  // Redirect non-premium users away
  useEffect(() => {
    if (!isLoading && (!user || !branding.isPremium)) {
      router.replace("/upgrade");
    }
  }, [user, branding.isPremium, isLoading, router]);

  // Update preview when branding changes
  useEffect(() => {
    setPreviewLogo(branding.logoUrl);
  }, [branding.logoUrl]);

  if (isLoading) return null;

  if (!branding.isPremium) {
    return <p className="p-8 text-center text-red-500">Premium subscription required.</p>;
  }

  const handleColorChange = async (colorType: 'primary' | 'secondary' | 'tertiary', color: string) => {
    try {
      await branding.updateTheme({ [colorType]: color });
      toast({
        title: "Color updated",
        description: `${colorType.charAt(0).toUpperCase() + colorType.slice(1)} color has been saved.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update color. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRSVPTextChange = async (textType: 'yup' | 'nope' | 'maybe', text: string) => {
    try {
      await branding.updateCustomRSVPText({ [textType]: text });
      toast({
        title: "RSVP text updated",
        description: `${textType.charAt(0).toUpperCase() + textType.slice(1)} text has been saved.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update RSVP text. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('brand-logos')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('brand-logos')
        .getPublicUrl(fileName);

      await branding.updateLogo(publicUrl);
      setPreviewLogo(publicUrl);

      toast({
        title: "Logo uploaded",
        description: "Your logo has been successfully uploaded and saved.",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetBranding = async () => {
    try {
      await branding.resetToDefault();
      setPreviewLogo(null);
      toast({
        title: "Branding reset",
        description: "All branding settings have been reset to defaults.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset branding. Please try again.",
        variant: "destructive",
      });
    }
  };

    return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold md:text-3xl lg:text-4xl tracking-tight text-foreground">
                Branding Settings
              </h1>
              <p className="text-muted-foreground">
                Customize your brand colors, logo, and RSVP text
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleResetBranding}
              className="flex items-center gap-2 shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Default
            </Button>
          </div>

          <Tabs defaultValue="colors" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-muted">
              <TabsTrigger value="colors" className="flex items-center gap-2 data-[state=active]:bg-background">
                <Palette className="w-4 h-4" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="logo" className="flex items-center gap-2 data-[state=active]:bg-background">
                <Image className="w-4 h-4" />
                Logo
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2 data-[state=active]:bg-background">
                <Type className="w-4 h-4" />
                RSVP Text
              </TabsTrigger>
            </TabsList>

                      <TabsContent value="colors" className="space-y-6">
              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold md:text-2xl tracking-tight">
                    <Palette className="w-5 h-5 text-primary" />
                    Brand Colors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ColorPicker
                      label="Primary Color"
                      value={branding.theme.primary}
                      onChange={(color) => handleColorChange('primary', color)}
                    />
                    <ColorPicker
                      label="Secondary Color"
                      value={branding.theme.secondary}
                      onChange={(color) => handleColorChange('secondary', color)}
                    />
                    <ColorPicker
                      label="Tertiary Color"
                      value={branding.theme.tertiary}
                      onChange={(color) => handleColorChange('tertiary', color)}
                    />
                  </div>

                  <div className="mt-6 p-4 bg-muted rounded-md border border-border">
                    <h3 className="text-sm font-medium mb-3 text-foreground">Color Preview</h3>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-border"
                          style={{ backgroundColor: branding.theme.primary }}
                        />
                        <span className="text-sm text-muted-foreground">Primary</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-border"
                          style={{ backgroundColor: branding.theme.secondary }}
                        />
                        <span className="text-sm text-muted-foreground">Secondary</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-border"
                          style={{ backgroundColor: branding.theme.tertiary }}
                        />
                        <span className="text-sm text-muted-foreground">Tertiary</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

                      <TabsContent value="logo" className="space-y-6">
              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold md:text-2xl tracking-tight">
                    <Image className="w-5 h-5 text-primary" />
                    Brand Logo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    {previewLogo ? (
                      <div className="relative">
                        <img
                          src={previewLogo}
                          alt="Brand Logo"
                          className="max-w-xs max-h-32 object-contain bg-muted rounded-md p-4 border border-border"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPreviewLogo(null);
                            branding.updateLogo('');
                          }}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        >
                          ×
                        </Button>
                      </div>
                    ) : (
                      <div className="w-64 h-32 bg-muted rounded-md flex items-center justify-center border-2 border-dashed border-border transition-colors hover:border-primary/50">
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No logo uploaded</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {isUploading ? 'Uploading...' : 'Upload Logo'}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </div>

                    <p className="text-sm text-muted-foreground text-center">
                      Recommended: PNG or SVG format, max 5MB
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          <TabsContent value="text" className="space-y-6">
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl font-semibold md:text-2xl tracking-tight">
                  <Type className="w-5 h-5 text-primary" />
                  Custom RSVP Text
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="yup-text" className="text-sm font-medium text-foreground">
                      Positive Response
                    </Label>
                                          <Input
                        id="yup-text"
                        value={branding.customRSVPText.yup}
                        onChange={(e) => handleRSVPTextChange('yup', e.target.value)}
                        placeholder="Yup"
                        maxLength={20}
                        className="bg-black border-white text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nope-text" className="text-sm font-medium text-foreground">
                        Negative Response
                      </Label>
                      <Input
                        id="nope-text"
                        value={branding.customRSVPText.nope}
                        onChange={(e) => handleRSVPTextChange('nope', e.target.value)}
                        placeholder="Nope"
                        maxLength={20}
                        className="bg-black border-white text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maybe-text" className="text-sm font-medium text-foreground">
                        Maybe Response
                      </Label>
                      <Input
                        id="maybe-text"
                        value={branding.customRSVPText.maybe}
                        onChange={(e) => handleRSVPTextChange('maybe', e.target.value)}
                        placeholder="Maybe"
                        maxLength={20}
                        className="bg-black border-white text-white placeholder:text-gray-400"
                      />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-md border border-border">
                  <h3 className="text-sm font-medium mb-3 text-foreground">RSVP Button Preview</h3>
                                      <div className="flex flex-wrap gap-3">
                      <Button
                        size="sm"
                        className="text-white"
                        style={{
                          backgroundColor: branding.theme.primary,
                          borderColor: branding.theme.primary
                        }}
                      >
                        {branding.customRSVPText.yup}
                      </Button>
                      <Button
                        size="sm"
                        className="text-white"
                        style={{
                          backgroundColor: branding.theme.secondary,
                          borderColor: branding.theme.secondary
                        }}
                      >
                        {branding.customRSVPText.nope}
                      </Button>
                      <Button
                        size="sm"
                        className="text-white"
                        style={{
                          backgroundColor: branding.theme.tertiary,
                          borderColor: branding.theme.tertiary
                        }}
                      >
                        {branding.customRSVPText.maybe}
                      </Button>
                    </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
}
