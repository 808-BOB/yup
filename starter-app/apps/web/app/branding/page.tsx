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
  const { user, isLoading: authLoading } = useAuth();
  const branding = useBranding();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(branding.logoUrl);

  // Local state for RSVP text to prevent page refresh on every keystroke
  const [localRSVPText, setLocalRSVPText] = useState({
    yup: branding.customRSVPText.yup,
    nope: branding.customRSVPText.nope,
    maybe: branding.customRSVPText.maybe,
  });

  // Debounce timer for RSVP text saving
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check premium status from multiple sources
  const isPremium = branding.isPremium ||
                   (user as any)?.is_premium ||
                   (user as any)?.user_metadata?.is_premium ||
                   user?.username === 'subourbon' ||
                   false;

  // Redirect non-premium users away - but only after both auth and branding are loaded
  useEffect(() => {
    // Don't redirect while still loading
    if (authLoading || branding.isLoading) {
      console.log('Still loading, not redirecting yet:', { authLoading, brandingLoading: branding.isLoading });
      return;
    }

    // If no user, redirect to login
    if (!user) {
      console.log('No user, redirecting to login');
      router.replace("/auth/login");
      return;
    }

    // Check premium status after everything is loaded
    if (!isPremium) {
      console.log('Branding page: User is not premium, redirecting to upgrade');
      console.log('User details:', {
        username: user.username,
        brandingIsPremium: branding.isPremium,
        userIsPremium: (user as any)?.is_premium,
        metadataIsPremium: (user as any)?.user_metadata?.is_premium
      });
      router.replace("/upgrade");
    }
  }, [user, isPremium, authLoading, branding.isLoading, router, branding.isPremium]);

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

  // Show loading state while auth or branding is loading
  if (authLoading || branding.isLoading) {
    return (
      <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col page-container">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center text-gray-400">Loading branding settings...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if no user
  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col page-container">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center text-gray-400">Please log in to access branding settings.</p>
        </div>
      </div>
    );
  }

  // Show premium requirement if not premium
  if (!isPremium) {
    return (
      <div className="w-full max-w-md mx-auto px-8 pb-8 min-h-screen flex flex-col page-container">
        <div className="sticky top-0 z-50 page-container pt-8">
          <Header />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-red-500">Premium subscription required.</p>
            <Button onClick={() => router.push("/admin")} variant="outline">
              Get Premium Access
            </Button>
          </div>
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

  // Save RSVP text immediately (for manual save buttons if needed)
  const saveRSVPText = async () => {
    try {
      await branding.updateCustomRSVPText(localRSVPText);
      toast({
        title: "RSVP text updated",
        description: "All RSVP text has been saved.",
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
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Auth session check:', { session: !!session, error: sessionError });

      if (sessionError || !session) {
        throw new Error('Authentication required for file upload');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop() || 'png';
      const timestamp = Date.now();
      const fileName = `${user.id}/logo-${timestamp}.${fileExt}`;

      console.log('Uploading to path:', fileName);

      // Upload to Supabase Storage directly (no need to check bucket existence)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('brand-logos')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: '3600'
        });

      console.log('Upload result:', { uploadData, uploadError });

      if (uploadError) {
        console.error('Upload error details:', uploadError);

        // Provide more specific error messages based on the error
        if (uploadError.message?.includes('new row violates row-level security policy')) {
          throw new Error('Permission denied: You may not have upload permissions. Please contact support.');
        } else if (uploadError.message?.includes('bucket')) {
          throw new Error('Storage bucket error: Please ensure the brand-logos bucket is properly configured.');
        } else {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('brand-logos')
        .getPublicUrl(fileName);

      console.log('URL data:', urlData);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      const publicUrl = urlData.publicUrl;
      console.log('Public URL generated:', publicUrl);

      // Update branding context and database
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
      } else if (error.message?.includes('Permission denied')) {
        errorMessage = error.message;
      } else if (error.message?.includes('bucket not found')) {
        errorMessage = "Storage not configured. Please contact support.";
      } else if (error.message?.includes('storage')) {
        errorMessage = "Storage service is not available. Please contact support.";
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

          <Tabs defaultValue="colors" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-gray-900 border border-gray-800">
              <TabsTrigger value="colors" className="flex items-center gap-2 data-[state=active]:bg-gray-950 data-[state=active]:text-white text-gray-400">
                <Palette className="w-4 h-4" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="logo" className="flex items-center gap-2 data-[state=active]:bg-gray-950 data-[state=active]:text-white text-gray-400">
                <Image className="w-4 h-4" />
                Logo
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2 data-[state=active]:bg-gray-950 data-[state=active]:text-white text-gray-400">
                <Type className="w-4 h-4" />
                RSVP Text
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
                  <div className="mb-6 p-4 bg-gray-950 rounded-md border border-gray-800">
                    <h3 className="text-sm font-medium mb-3 text-white">YUP.RSVP Brand Colors</h3>
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-gray-600"
                          style={{ backgroundColor: "#ec4899" }}
                        />
                        <span className="text-sm text-gray-300">Primary: #ec4899</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-gray-600"
                          style={{ backgroundColor: "#0a0a14" }}
                        />
                        <span className="text-sm text-gray-300">Secondary: #0a0a14</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-gray-600"
                          style={{ backgroundColor: "#fafafa" }}
                        />
                        <span className="text-sm text-gray-300">Tertiary: #fafafa</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await handleColorChange('primary', '#ec4899');
                        await handleColorChange('secondary', '#0a0a14');
                        await handleColorChange('tertiary', '#fafafa');
                        toast({
                          title: "Colors updated",
                          description: "Reset to YUP.RSVP brand colors.",
                        });
                      }}
                      className="border-pink-500 text-pink-400 hover:bg-pink-500/10"
                    >
                      Use YUP Brand Colors
                    </Button>
                  </div>

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

                  <div className="mt-6 p-4 bg-gray-950 rounded-md border border-gray-800">
                    <h3 className="text-sm font-medium mb-3 text-white">Your Current Colors</h3>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-gray-600"
                          style={{ backgroundColor: branding.theme.primary }}
                        />
                        <span className="text-sm text-gray-300">Primary</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-gray-600"
                          style={{ backgroundColor: branding.theme.secondary }}
                        />
                        <span className="text-sm text-gray-300">Secondary</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-gray-600"
                          style={{ backgroundColor: branding.theme.tertiary }}
                        />
                        <span className="text-sm text-gray-300">Tertiary</span>
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
                      <div className="w-64 h-32 bg-gray-950 rounded-md flex items-center justify-center border-2 border-dashed border-gray-700 transition-colors hover:border-pink-500">
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
                        className="bg-black border-white text-white placeholder:text-gray-400"
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
                        className="bg-black border-white text-white placeholder:text-gray-400"
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
                        className="bg-black border-white text-white placeholder:text-gray-400"
                      />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-950 rounded-md border border-gray-800">
                  <h3 className="text-sm font-medium mb-3 text-white">RSVP Button Preview</h3>
                                      <div className="flex flex-wrap gap-3">
                      <Button
                        size="sm"
                        className="text-white"
                        style={{
                          backgroundColor: branding.theme.primary,
                          borderColor: branding.theme.primary
                        }}
                      >
                        {localRSVPText.yup}
                      </Button>
                      <Button
                        size="sm"
                        className="text-white"
                        style={{
                          backgroundColor: branding.theme.secondary,
                          borderColor: branding.theme.secondary
                        }}
                      >
                        {localRSVPText.nope}
                      </Button>
                      <Button
                        size="sm"
                        className="text-white"
                        style={{
                          backgroundColor: branding.theme.tertiary,
                          borderColor: branding.theme.tertiary
                        }}
                      >
                        {localRSVPText.maybe}
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
