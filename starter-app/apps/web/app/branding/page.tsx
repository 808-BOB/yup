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
import { Badge } from "@/ui/badge";
import { ColorPicker } from "@/ui/color-picker";
import { useToast } from "@/hooks/use-toast";
import Upload from "lucide-react/dist/esm/icons/upload";
import Download from "lucide-react/dist/esm/icons/download";
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
      // Get current session for authorization
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
                    <div className="space-y-2">
                      <ColorPicker
                        label="Primary Color"
                        value={branding.theme.primary}
                        onChange={(color) => handleColorChange('primary', color)}
                      />
                      <p className="text-xs text-gray-400">Buttons, icons, accents</p>
                    </div>
                    <div className="space-y-2">
                      <ColorPicker
                        label="Secondary Color"
                        value={branding.theme.secondary}
                        onChange={(color) => handleColorChange('secondary', color)}
                      />
                      <p className="text-xs text-gray-400">Background color</p>
                    </div>
                    <div className="space-y-2">
                      <ColorPicker
                        label="Tertiary Color"
                        value={branding.theme.tertiary}
                        onChange={(color) => handleColorChange('tertiary', color)}
                      />
                      <p className="text-xs text-gray-400">Text and content color</p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gray-950 rounded-md border border-gray-800">
                    <h3 className="text-sm font-medium mb-3 text-white">Your Current Colors</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-gray-600"
                          style={{ backgroundColor: branding.theme.primary }}
                        />
                        <div>
                          <span className="text-sm text-gray-300 font-medium">Primary</span>
                          <p className="text-xs text-gray-500">Buttons & accents</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-gray-600"
                          style={{ backgroundColor: branding.theme.secondary }}
                        />
                        <div>
                          <span className="text-sm text-gray-300 font-medium">Secondary</span>
                          <p className="text-xs text-gray-500">Background</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-gray-600"
                          style={{ backgroundColor: branding.theme.tertiary }}
                        />
                        <div>
                          <span className="text-sm text-gray-300 font-medium">Tertiary</span>
                          <p className="text-xs text-gray-500">Text & content</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event Invitation Preview */}
                  <div className="mt-6 p-6 bg-gray-950 rounded-md border border-gray-800">
                    <h3 className="text-sm font-medium mb-4 text-white">Event Invitation Preview</h3>
                    
                    {/* Mock the exact event page layout */}
                    <div 
                      className="rounded-lg p-4 border border-gray-700"
                      style={{ backgroundColor: branding.theme.secondary }}
                    >
                      <div className="space-y-6">
                        {/* Title and action buttons */}
                        <div className="flex justify-between items-start">
                          <h1 className="text-xl font-bold" style={{ color: branding.theme.tertiary }}>Sample Event</h1>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs border-gray-500"
                              style={{ color: branding.theme.tertiary }}
                            >
                              <Share2 className="h-3 w-3 mr-1" /> Share
                            </Button>
                          </div>
                        </div>

                        {/* Sample Event Image */}
                        <div className="w-full">
                          <div 
                            className="relative rounded-lg overflow-hidden border h-32 bg-gray-800 flex items-center justify-center"
                            style={{ borderColor: `${branding.theme.primary}30` }}
                          >
                            <div className="text-center">
                              <Image className="w-6 h-6 mx-auto mb-1" style={{ color: branding.theme.primary }} />
                              <p className="text-xs opacity-60" style={{ color: branding.theme.tertiary }}>
                                Event Image
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {/* Left column - Event details */}
                          <div className="lg:col-span-2 space-y-4">
                            {/* Status badges */}
                            <div className="flex flex-wrap gap-2">
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                                style={{ 
                                  backgroundColor: `${branding.theme.primary}20`,
                                  color: branding.theme.primary,
                                  borderColor: `${branding.theme.primary}50`
                                }}
                              >
                                {localRSVPText.yup || branding.customRSVPText.yup}
                              </Badge>
                              <Badge variant="outline" className="bg-gray-800 text-gray-300 text-xs">
                                open
                              </Badge>
                            </div>

                                                         {/* RSVP Buttons */}
                             <div 
                               className="flex gap-2 p-3 rounded-lg border"
                               style={{ 
                                 backgroundColor: `${branding.theme.primary}08`,
                                 borderColor: `${branding.theme.primary}20`
                               }}
                             >
                              <Button
                                size="sm"
                                className="flex-1 text-xs"
                                style={{ 
                                  backgroundColor: branding.theme.primary,
                                  color: 'white'
                                }}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                {localRSVPText.yup || branding.customRSVPText.yup}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs hover:bg-primary/10"
                              >
                                <Users className="h-3 w-3 mr-1" />
                                {localRSVPText.maybe || branding.customRSVPText.maybe}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs hover:bg-muted/20"
                              >
                                <X className="h-3 w-3 mr-1" />
                                {localRSVPText.nope || branding.customRSVPText.nope}
                              </Button>
                            </div>

                                                         {/* Host info */}
                             <div 
                               className="flex items-center gap-3 p-3 rounded border"
                               style={{ 
                                 backgroundColor: `${branding.theme.primary}15`,
                                 borderColor: `${branding.theme.primary}30`
                               }}
                             >
                               <div className="h-12 w-12 rounded-full bg-gray-600 flex items-center justify-center">
                                 {user?.user_metadata?.profile_image_url ? (
                                   <img 
                                     src={user.user_metadata.profile_image_url} 
                                     alt="Host Profile" 
                                     className="h-12 w-12 rounded-full object-cover" 
                                   />
                                 ) : (
                                   <span className="text-sm font-medium" style={{ color: branding.theme.tertiary }}>
                                     {user?.display_name?.charAt(0) || user?.email?.charAt(0) || 'H'}
                                   </span>
                                 )}
                               </div>
                               <div>
                                 <p className="text-sm font-medium" style={{ color: branding.theme.tertiary }}>{user?.display_name || 'Host Name'}</p>
                                 <p className="text-xs opacity-70" style={{ color: branding.theme.tertiary }}>Created {new Date().toLocaleDateString()}</p>
                               </div>
                             </div>

                             {/* Date and Time */}
                             <div className="flex items-start gap-3">
                               <Calendar className="h-4 w-4 mt-1" style={{ color: branding.theme.primary }} />
                               <div>
                                 <h3 className="text-sm font-semibold mb-1" style={{ color: branding.theme.tertiary }}>When</h3>
                                 <p className="text-xs opacity-80" style={{ color: branding.theme.tertiary }}>Saturday, February 15, 2025</p>
                                 <p className="text-xs opacity-80" style={{ color: branding.theme.tertiary }}>7:00 PM - 10:00 PM</p>
                               </div>
                             </div>

                             {/* Location */}
                             <div className="flex items-start gap-3">
                               <MapPin className="h-4 w-4 mt-1" style={{ color: branding.theme.primary }} />
                               <div>
                                 <h3 className="text-sm font-semibold mb-1" style={{ color: branding.theme.tertiary }}>Where</h3>
                                 <p className="text-xs opacity-80" style={{ color: branding.theme.tertiary }}>Sample Venue</p>
                                 <p className="text-xs opacity-60" style={{ color: branding.theme.tertiary }}>123 Example Street</p>
                               </div>
                             </div>
                          </div>

                                                     {/* Right column - RSVP Settings */}
                           <div 
                             className="rounded-lg p-4 border"
                             style={{ 
                               backgroundColor: `${branding.theme.primary}10`,
                               borderColor: `${branding.theme.primary}25`
                             }}
                           >
                             <h3 className="text-sm font-semibold mb-3" style={{ color: branding.theme.tertiary }}>RSVP Settings</h3>
                             <div className="space-y-3">
                               <div className="flex justify-between items-center">
                                 <span className="text-xs opacity-80" style={{ color: branding.theme.tertiary }}>Guest RSVP</span>
                                 <Badge 
                                   variant="outline" 
                                   className="text-xs"
                                   style={{ 
                                     backgroundColor: `${branding.theme.primary}25`,
                                     color: branding.theme.primary,
                                     borderColor: `${branding.theme.primary}50`
                                   }}
                                 >
                                   Allowed
                                 </Badge>
                               </div>
                               <div className="flex justify-between items-center">
                                 <span className="text-xs opacity-80" style={{ color: branding.theme.tertiary }}>Plus One</span>
                                 <Badge 
                                   variant="outline" 
                                   className="text-xs opacity-60"
                                   style={{ 
                                     backgroundColor: `${branding.theme.tertiary}10`,
                                     color: branding.theme.tertiary,
                                     borderColor: `${branding.theme.tertiary}30`
                                   }}
                                 >
                                   Not Allowed
                                 </Badge>
                               </div>
                               <div className="flex justify-between items-center">
                                 <span className="text-xs opacity-80" style={{ color: branding.theme.tertiary }}>Max Guests</span>
                                 <span className="text-xs font-medium" style={{ color: branding.theme.primary }}>
                                   1
                                 </span>
                               </div>
                               
                               {/* Brand Logo Display */}
                               {previewLogo && (
                                 <div className="pt-4 border-t border-gray-600">
                                   <div className="text-center">
                                     <img
                                       src={previewLogo}
                                       alt="Brand Logo"
                                       className="h-32 w-auto max-w-full mx-auto object-contain rounded"
                                     />
                                   </div>
                                 </div>
                               )}
                             </div>
                           </div>
                        </div>

                                                 {/* Responses section */}
                         <div>
                           <div className="flex justify-between items-center mb-3">
                             <h3 className="text-sm font-semibold" style={{ color: branding.theme.tertiary }}>Responses</h3>
                             <div className="flex gap-3 text-xs">
                               <span style={{ color: branding.theme.primary }} className="font-medium">
                                 8 {(localRSVPText.yup || branding.customRSVPText.yup).toLowerCase()}
                               </span>
                               <span className="opacity-70" style={{ color: branding.theme.tertiary }}>
                                 2 {(localRSVPText.nope || branding.customRSVPText.nope).toLowerCase()}
                               </span>
                               <span style={{ color: `${branding.theme.primary}BB` }}>
                                 3 {(localRSVPText.maybe || branding.customRSVPText.maybe).toLowerCase()}
                               </span>
                             </div>
                           </div>
                         </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-900 rounded border border-gray-700">
                      <p className="text-xs text-gray-400 text-center mb-2">
                        <strong>Live Preview:</strong> This shows how your 3-color branding system works
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-xs text-center">
                        <div>
                          <div className="w-3 h-3 rounded mx-auto mb-1" style={{ backgroundColor: branding.theme.primary }}></div>
                          <span className="text-gray-500">Primary<br/>Buttons & Icons</span>
                        </div>
                        <div>
                          <div className="w-3 h-3 rounded mx-auto mb-1" style={{ backgroundColor: branding.theme.secondary }}></div>
                          <span className="text-gray-500">Secondary<br/>Background</span>
                        </div>
                        <div>
                          <div className="w-3 h-3 rounded mx-auto mb-1" style={{ backgroundColor: branding.theme.tertiary }}></div>
                          <span className="text-gray-500">Tertiary<br/>Text & Content</span>
                        </div>
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
