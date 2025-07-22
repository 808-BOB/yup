"use client";

import { useBranding } from "@/contexts/BrandingContext";
import { useAuth } from "@/utils/auth-context";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { Badge } from "@/ui/badge";
import { ColorPicker } from "@/ui/color-picker";
import { useToast } from "@/hooks/use-toast";
import Upload from "lucide-react/dist/esm/icons/upload";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import Palette from "lucide-react/dist/esm/icons/palette";
import Type from "lucide-react/dist/esm/icons/type";
import Image from "lucide-react/dist/esm/icons/image";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Check from "lucide-react/dist/esm/icons/check";
import Users from "lucide-react/dist/esm/icons/users";
import X from "lucide-react/dist/esm/icons/x";
import Share2 from "lucide-react/dist/esm/icons/share-2";
import Eye from "lucide-react/dist/esm/icons/eye";
import { getSupabaseClient } from "@/utils/supabase";
import Header from "@/dash/header";

export default function BrandingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const branding = useBranding();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(branding.logoUrl);
  const [activeTab, setActiveTab] = useState('colors');

  // Local state for RSVP text to prevent page refresh on every keystroke
  const [localRSVPText, setLocalRSVPText] = useState({
    yup: branding.customRSVPText.yup,
    nope: branding.customRSVPText.nope,
    maybe: branding.customRSVPText.maybe,
  });

  // Debounce timer for RSVP text saving
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update preview when branding changes
  useEffect(() => {
    setPreviewLogo(branding.logoUrl);
  }, [branding.logoUrl]);

  // Update local RSVP text when branding context changes
  useEffect(() => {
    setLocalRSVPText({
      yup: branding.customRSVPText.yup,
      nope: branding.customRSVPText.nope,
      maybe: branding.customRSVPText.maybe,
    });
  }, [branding.customRSVPText]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Show loading state while branding is loading
  if (authLoading || branding.isLoading) {
    return (
      <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col page-container">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center text-gray-400">Loading branding settings...</p>
        </div>
      </div>
    );
  }

  const handleColorChange = async (colorType: 'primary' | 'secondary' | 'tertiary', color: string) => {
    try {
      await branding.updateTheme({ [colorType]: color });
      // Don't show toast for every color change - only show if there's an error
    } catch (error) {
      console.error('Error updating color:', error);
      toast({
        title: "Error",
        description: "Failed to update color. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle RSVP text change with local state (no immediate save)
  const handleRSVPTextInputChange = (textType: 'yup' | 'nope' | 'maybe', text: string) => {
    // Update local state immediately for responsive UI
    setLocalRSVPText(prev => ({
      ...prev,
      [textType]: text
    }));

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer to save after 1 second of no typing
    debounceTimerRef.current = setTimeout(async () => {
      try {
        await branding.updateCustomRSVPText({ [textType]: text });
        console.log(`RSVP ${textType} text saved:`, text);
        // Don't show toast for every save to avoid spam
      } catch (error) {
        console.error('Error updating RSVP text:', error);
        toast({
          title: "Error",
          description: "Failed to update RSVP text. Please try again.",
          variant: "destructive",
        });
        // Revert local state on error
        setLocalRSVPText(prev => ({
          ...prev,
          [textType]: branding.customRSVPText[textType]
        }));
      }
    }, 1000);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG, PNG, WebP, or SVG image.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    console.log('Starting logo upload for user:', user.id);
    console.log('File details:', { name: file.name, size: file.size, type: file.type });

    try {
      // Get current session for authorization using centralized client
      const supabase = getSupabaseClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication required for file upload');
      }

      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading via API endpoint...');

      // Upload via our API endpoint
      const response = await fetch(`/api/users/${user.id}/branding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      console.log('API response status:', response.status);

      // Parse response as JSON
      const result = await response.json();
      console.log('API response:', result);

      if (!response.ok) {
        // Handle specific error codes
        if (result.code === 'BUCKET_NOT_FOUND') {
          throw new Error('Storage not configured. Please contact support or set up the brand-logos bucket.');
        } else if (result.code === 'RLS_VIOLATION') {
          throw new Error('Permission denied. You may not have upload permissions.');
        } else {
          throw new Error(result.message || 'Upload failed');
        }
      }

      if (!result.success || !result.logoUrl) {
        throw new Error('Upload failed: No logo URL returned');
      }

      const publicUrl = result.logoUrl;
      console.log('Upload successful, public URL:', publicUrl);

      // Update branding context (this will also update the database)
      console.log('Updating branding context...');
      await branding.updateLogo(publicUrl);
      setPreviewLogo(publicUrl);

      toast({
        title: "Logo uploaded",
        description: "Your logo has been successfully uploaded and saved.",
      });

    } catch (error: any) {
      console.error('Error uploading logo:', error);

      // Provide specific error messages
      let errorMessage = "Failed to upload logo. Please try again.";

      if (error.message?.includes('Authentication')) {
        errorMessage = "Please log in again to upload images.";
      } else if (error.message?.includes('Storage not configured')) {
        errorMessage = error.message;
      } else if (error.message?.includes('Permission denied')) {
        errorMessage = error.message;
      } else if (error.message?.includes('bucket')) {
        errorMessage = "Image storage is not properly configured. Please contact support.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Debug function to test storage access
  const testStorageAccess = async () => {
    try {
      console.log('Testing storage access...');
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', !!session);

      // Test direct Supabase client access
      const { data: buckets, error } = await supabase.storage.listBuckets();
      console.log('Buckets:', buckets, 'Error:', error);

      // Try to list files in brand-logos bucket
      const { data: files, error: listError } = await supabase.storage
        .from('brand-logos')
        .list('', { limit: 5 });
      console.log('Files in brand-logos:', files, 'Error:', listError);

      // Test direct upload to brand-logos bucket
      if (session?.access_token && user) {
        console.log('Testing direct upload...');

        // Create a tiny 1x1 pixel PNG for testing
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(0, 0, 1, 1);
        }

        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob || new Blob());
          }, 'image/png');
        });

        const testFile = new File([blob], 'test.png', { type: 'image/png' });
        const testFileName = `${user.id}/test-${Date.now()}.png`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('brand-logos')
          .upload(testFileName, testFile, { upsert: true });

        console.log('Direct upload result:', { uploadData, uploadError });

        if (uploadData && !uploadError) {
          console.log('Upload successful! Cleaning up...');
          await supabase.storage.from('brand-logos').remove([testFileName]);
        }
      }

      // Test via API endpoint
      if (session?.access_token) {
        console.log('Testing via API endpoint...');
        const response = await fetch('/api/storage/test-brand-logos', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        const apiResult = await response.json();
        console.log('API test result:', apiResult);
      }

      toast({
        title: "Storage test complete",
        description: `Found ${buckets?.length || 0} buckets. Check console for details.`,
      });
    } catch (error) {
      console.error('Storage test error:', error);
      toast({
        title: "Storage test failed",
        description: "Check console for details",
        variant: "destructive",
      });
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

  // Helper function to ensure text contrast
  const getContrastingTextColor = (backgroundColor: string) => {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white for dark backgrounds, black for light backgrounds
    return luminance < 0.5 ? '#ffffff' : '#000000';
  };

  // Helper function to add text shadow for better readability
  const getTextShadowStyle = (backgroundColor: string) => {
    const textColor = getContrastingTextColor(backgroundColor);
    const shadowColor = textColor === '#ffffff' ? '#000000' : '#ffffff';
    return {
      color: textColor,
      textShadow: `1px 1px 2px ${shadowColor}80, -1px -1px 2px ${shadowColor}40`
    };
  };

    return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold md:text-3xl lg:text-4xl tracking-tight text-white">
                Branding Settings
              </h1>
              <p className="text-gray-400">
                Customize your brand colors, logo, and RSVP text
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={testStorageAccess}
                className="flex items-center gap-2 shrink-0 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Test Storage
              </Button>
              <Button
                variant="outline"
                onClick={handleResetBranding}
                className="flex items-center gap-2 shrink-0 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Default
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 border border-gray-800 bg-gray-900">
              <TabsTrigger 
                value="colors" 
                className="flex items-center gap-2 border-0"
                style={{
                  backgroundColor: activeTab === 'colors' ? branding.theme.primary : 'transparent',
                  color: activeTab === 'colors' ? getContrastingTextColor(branding.theme.primary) : '#9ca3af'
                }}
              >
                <Palette className="w-4 h-4" />
                Colors
              </TabsTrigger>
              <TabsTrigger 
                value="logo" 
                className="flex items-center gap-2 border-0"
                style={{
                  backgroundColor: activeTab === 'logo' ? branding.theme.primary : 'transparent',
                  color: activeTab === 'logo' ? getContrastingTextColor(branding.theme.primary) : '#9ca3af'
                }}
              >
                <Image className="w-4 h-4" />
                Logo
              </TabsTrigger>
              <TabsTrigger 
                value="text" 
                className="flex items-center gap-2 border-0"
                style={{
                  backgroundColor: activeTab === 'text' ? branding.theme.primary : 'transparent',
                  color: activeTab === 'text' ? getContrastingTextColor(branding.theme.primary) : '#9ca3af'
                }}
              >
                <Type className="w-4 h-4" />
                RSVP Text
              </TabsTrigger>
              <TabsTrigger 
                value="preview" 
                className="flex items-center gap-2 border-0"
                style={{
                  backgroundColor: activeTab === 'preview' ? branding.theme.primary : 'transparent',
                  color: activeTab === 'preview' ? getContrastingTextColor(branding.theme.primary) : '#9ca3af'
                }}
              >
                <Eye className="w-4 h-4" />
                Live Preview
              </TabsTrigger>
            </TabsList>

                      <TabsContent value="colors" className="space-y-6">
              <Card className="bg-gray-900 border-gray-800 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold md:text-2xl tracking-tight text-white">
                    <Palette className="w-5 h-5" style={{ color: branding.theme.primary }} />
                    Brand Colors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await handleColorChange('primary', '#FF00FF');
                        await handleColorChange('secondary', '#1a1a1a');
                        await handleColorChange('tertiary', '#f0f0f0');
                        toast({
                          title: "Colors updated",
                          description: "YUP brand colors applied everywhere (app + invitations).",
                        });
                      }}
                      className="border-[#FF00FF] text-[#FF00FF] hover:bg-[#FF00FF]/10"
                    >
                      ↻ Use YUP Colors (Everywhere)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await handleColorChange('primary', '#FF00FF');
                        toast({
                          title: "Colors updated", 
                          description: "YUP brand colors applied to invitations only. App keeps your custom theme.",
                        });
                      }}
                      className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                    >
                      ↻ Use YUP Colors (Invitations Only)
                    </Button>
                  </div>

                  {/* Color Pickers - Simplified */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="space-y-2">
                      <ColorPicker
                        label="Primary Color"
                        value={branding.theme.primary}
                        onChange={(color) => handleColorChange('primary', color)}
                        primaryColor={branding.theme.primary}
                        secondaryColor={branding.theme.secondary}
                      />
                      <p className="text-xs text-gray-500">Buttons & accents</p>
                    </div>
                    <div className="space-y-2">
                      <ColorPicker
                        label="Secondary Color"
                        value={branding.theme.secondary}
                        onChange={(color) => handleColorChange('secondary', color)}
                        primaryColor={branding.theme.primary}
                        secondaryColor={branding.theme.secondary}
                      />
                      <p className="text-xs text-gray-500">Background</p>
                    </div>
                    <div className="space-y-2">
                      <ColorPicker
                        label="Tertiary Color"
                        value={branding.theme.tertiary}
                        onChange={(color) => handleColorChange('tertiary', color)}
                        primaryColor={branding.theme.primary}
                        secondaryColor={branding.theme.secondary}
                      />
                      <p className="text-xs text-gray-500">Text & content</p>
                    </div>
                  </div>

                  {/* Simplified Preview */}
                  <div className="p-4 rounded-lg border bg-gray-950" style={{ 
                    borderColor: branding.theme.primary + '40'
                  }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">
                        Live Preview
                      </h3>
                      {previewLogo && (
                        <img
                          src={previewLogo}
                          alt="Brand Logo"
                          className="h-8 w-auto object-contain"
                        />
                      )}
                    </div>
                    
                    {/* RSVP Buttons Preview */}
                    <div className="flex gap-2 mb-4">
                      <Button
                        size="sm"
                        className="flex-1 text-xs"
                        style={{ 
                          backgroundColor: branding.theme.primary,
                          color: getContrastingTextColor(branding.theme.primary),
                          border: 'none'
                        }}
                      >
                        {localRSVPText.yup}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs border-gray-600 text-gray-300 hover:bg-gray-800"
                        style={{ 
                          borderColor: branding.theme.primary + '60',
                          backgroundColor: 'transparent',
                          color: '#d1d5db'
                        }}
                      >
                        {localRSVPText.maybe}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs border-gray-600 text-gray-300 hover:bg-gray-800"
                        style={{ 
                          borderColor: branding.theme.primary + '60',
                          backgroundColor: 'transparent',
                          color: '#d1d5db'
                        }}
                      >
                        {localRSVPText.nope}
                      </Button>
                    </div>
                    
                    {/* Color Reference with better contrast */}
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="text-center">
                        <div 
                          className="w-6 h-6 rounded mx-auto mb-1 border-2 border-white shadow-md" 
                          style={{ backgroundColor: branding.theme.primary }}
                        ></div>
                        <span className="text-gray-300">Primary</span>
                      </div>
                      <div className="text-center">
                        <div 
                          className="w-6 h-6 rounded mx-auto mb-1 border-2 border-white shadow-md" 
                          style={{ backgroundColor: branding.theme.secondary }}
                        ></div>
                        <span className="text-gray-300">Background</span>
                      </div>
                      <div className="text-center">
                        <div 
                          className="w-6 h-6 rounded mx-auto mb-1 border-2 border-white shadow-md" 
                          style={{ backgroundColor: branding.theme.tertiary }}
                        ></div>
                        <span className="text-gray-300">Text</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

                      <TabsContent value="logo" className="space-y-6">
              <Card className="bg-gray-900 border-gray-800 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold md:text-2xl tracking-tight text-white">
                    <Image className="w-5 h-5" style={{ color: branding.theme.primary }} />
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
                          className="max-w-xs max-h-32 object-contain bg-gray-950 rounded-md p-4 border border-gray-700"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPreviewLogo(null);
                            branding.updateLogo('');
                          }}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 border-gray-600 text-gray-300 hover:bg-gray-800"
                        >
                          ×
                        </Button>
                      </div>
                    ) : (
                      <div className="w-64 h-32 bg-gray-950 rounded-md flex items-center justify-center border-2 border-dashed border-gray-700 transition-colors hover:border-[#FF00FF]">
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-400">No logo uploaded</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-2 text-white"
                        style={{ backgroundColor: branding.theme.primary }}
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

                    <p className="text-sm text-gray-400 text-center">
                      Recommended: PNG or SVG format, max 5MB
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          <TabsContent value="text" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl font-semibold md:text-2xl tracking-tight text-white">
                  <Type className="w-5 h-5" style={{ color: branding.theme.primary }} />
                  Custom RSVP Text
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="yup-text" className="text-sm font-medium text-white">
                      Positive Response
                    </Label>
                                          <Input
                        id="yup-text"
                        value={localRSVPText.yup}
                        onChange={(e) => handleRSVPTextInputChange('yup', e.target.value)}
                        placeholder="Yup"
                        maxLength={20}
                        className="border-0"
                        style={{
                          backgroundColor: branding.theme.primary,
                          color: getContrastingTextColor(branding.theme.primary),
                          borderColor: branding.theme.primary
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nope-text" className="text-sm font-medium text-white">
                        Negative Response
                      </Label>
                      <Input
                        id="nope-text"
                        value={localRSVPText.nope}
                        onChange={(e) => handleRSVPTextInputChange('nope', e.target.value)}
                        placeholder="Nope"
                        maxLength={20}
                        className="border-0"
                        style={{
                          backgroundColor: branding.theme.primary,
                          color: getContrastingTextColor(branding.theme.primary),
                          borderColor: branding.theme.primary
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maybe-text" className="text-sm font-medium text-white">
                        Maybe Response
                      </Label>
                      <Input
                        id="maybe-text"
                        value={localRSVPText.maybe}
                        onChange={(e) => handleRSVPTextInputChange('maybe', e.target.value)}
                        placeholder="Maybe"
                        maxLength={20}
                        className="border-0"
                        style={{
                          backgroundColor: branding.theme.primary,
                          color: getContrastingTextColor(branding.theme.primary),
                          borderColor: branding.theme.primary
                        }}
                      />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-950 rounded-md border border-gray-800">
                  <h3 className="text-sm font-medium mb-3 text-white">RSVP Button Preview</h3>
                                      <div className="flex flex-wrap gap-3">
                      <Button
                        size="sm"
                        style={{
                          backgroundColor: branding.theme.primary,
                          borderColor: branding.theme.primary,
                          color: getContrastingTextColor(branding.theme.primary)
                        }}
                      >
                        {localRSVPText.yup}
                      </Button>
                      <Button
                        size="sm"
                        style={{
                          backgroundColor: branding.theme.secondary,
                          borderColor: branding.theme.secondary,
                          color: getContrastingTextColor(branding.theme.secondary)
                        }}
                      >
                        {localRSVPText.nope}
                      </Button>
                      <Button
                        size="sm"
                        style={{
                          backgroundColor: branding.theme.tertiary,
                          borderColor: branding.theme.tertiary,
                          color: getContrastingTextColor(branding.theme.tertiary)
                        }}
                      >
                        {localRSVPText.maybe}
                      </Button>
                    </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl font-semibold md:text-2xl tracking-tight text-white">
                  <Eye className="w-5 h-5" style={{ color: branding.theme.primary }} />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Full Event Invitation Preview */}
                <div 
                  className="rounded-lg p-6 max-w-sm mx-auto border-2 shadow-xl"
                  style={{ 
                    backgroundColor: branding.theme.secondary,
                    borderColor: branding.theme.primary
                  }}
                >
                  {/* Header with Logo */}
                  <div className="text-center mb-6">
                    {previewLogo ? (
                      <img
                        src={previewLogo}
                        alt="Brand Logo"
                        className="h-16 w-auto object-contain mx-auto mb-4"
                      />
                    ) : (
                      <div className="h-16 flex items-center justify-center mb-4">
                        <span 
                          className="text-2xl font-bold"
                          style={{ ...getTextShadowStyle(branding.theme.secondary) }}
                        >
                          Your Logo
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Event Info */}
                  <div className="space-y-4 mb-6">
                    <h2 
                      className="text-xl font-bold text-center"
                      style={{ ...getTextShadowStyle(branding.theme.secondary) }}
                    >
                      You're Invited!
                    </h2>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" style={{ color: branding.theme.primary }} />
                        <span style={{ ...getTextShadowStyle(branding.theme.secondary) }}>
                          Saturday, Dec 25, 2024
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" style={{ color: branding.theme.primary }} />
                        <span style={{ ...getTextShadowStyle(branding.theme.secondary) }}>
                          123 Party Street
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" style={{ color: branding.theme.primary }} />
                        <span style={{ ...getTextShadowStyle(branding.theme.secondary) }}>
                          15 people invited
                        </span>
                      </div>
                    </div>

                    <p 
                      className="text-sm text-center leading-relaxed"
                      style={{ ...getTextShadowStyle(branding.theme.secondary) }}
                    >
                      Join us for an amazing celebration! Food, drinks, and great company await.
                    </p>
                  </div>

                  {/* RSVP Buttons */}
                  <div className="space-y-3">
                    <p 
                      className="text-sm font-medium text-center"
                      style={{ ...getTextShadowStyle(branding.theme.secondary) }}
                    >
                      Will you be there?
                    </p>
                    
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 font-medium"
                        style={{ 
                          backgroundColor: branding.theme.primary,
                          color: getContrastingTextColor(branding.theme.primary),
                          border: 'none'
                        }}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        {localRSVPText.yup}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 font-medium"
                        style={{ 
                          borderColor: branding.theme.primary,
                          ...getTextShadowStyle(branding.theme.secondary),
                          backgroundColor: 'transparent'
                        }}
                      >
                        {localRSVPText.maybe}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 font-medium"
                        style={{ 
                          borderColor: branding.theme.primary,
                          ...getTextShadowStyle(branding.theme.secondary),
                          backgroundColor: 'transparent'
                        }}
                      >
                        <X className="w-4 h-4 mr-1" />
                        {localRSVPText.nope}
                      </Button>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-6 pt-4 border-t border-opacity-20" style={{ borderColor: branding.theme.primary }}>
                    <div className="flex items-center justify-center gap-2 text-xs">
                      <Share2 className="w-3 h-3" style={{ color: branding.theme.primary }} />
                      <span style={{ ...getTextShadowStyle(branding.theme.secondary) }}>
                        Powered by YUP.RSVP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Color Palette Reference */}
                <div className="mt-8 p-4 bg-gray-950 rounded-lg border border-gray-800">
                  <h3 className="text-sm font-medium mb-4 text-white text-center">Color Palette</h3>
                  <div className="flex justify-center gap-6">
                    <div className="text-center">
                      <div 
                        className="w-12 h-12 rounded-lg mx-auto mb-2 border-2 border-white shadow-lg" 
                        style={{ backgroundColor: branding.theme.primary }}
                      ></div>
                      <span className="text-xs text-gray-300">Primary</span>
                      <div className="text-xs text-gray-400 font-mono">{branding.theme.primary}</div>
                    </div>
                    <div className="text-center">
                      <div 
                        className="w-12 h-12 rounded-lg mx-auto mb-2 border-2 border-white shadow-lg" 
                        style={{ backgroundColor: branding.theme.secondary }}
                      ></div>
                      <span className="text-xs text-gray-300">Background</span>
                      <div className="text-xs text-gray-400 font-mono">{branding.theme.secondary}</div>
                    </div>
                    <div className="text-center">
                      <div 
                        className="w-12 h-12 rounded-lg mx-auto mb-2 border-2 border-white shadow-lg" 
                        style={{ backgroundColor: branding.theme.tertiary }}
                      ></div>
                      <span className="text-xs text-gray-300">Text</span>
                      <div className="text-xs text-gray-400 font-mono">{branding.theme.tertiary}</div>
                    </div>
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
