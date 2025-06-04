import { useState, useEffect, ChangeEvent } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBranding } from "@/contexts/BrandingContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/header";
import PageTitle from "@/components/page-title";
import { Paintbrush, Upload, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// HSL to Hex conversion for color picker
function hslToHex(hslString: string): string {
  // Parse HSL string like "hsl(308, 100%, 66%)"
  const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return hslString; // Return original if not HSL format
  
  const h = parseInt(match[1]) / 360;
  const s = parseInt(match[2]) / 100;
  const l = parseInt(match[3]) / 100;
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// WCAG color contrast utilities
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(r: number, g: number, b: number): number {
  const sRGB = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

function getAccessibleTextColor(backgroundColor: string): string {
  const whiteContrast = getContrastRatio(backgroundColor, "#ffffff");
  const blackContrast = getContrastRatio(backgroundColor, "#000000");
  
  // WCAG AA requires a contrast ratio of at least 4.5:1 for normal text
  return whiteContrast >= 4.5 ? "#ffffff" : "#000000";
}

// Schema for theme form - primary accent and background colors
const themeFormSchema = z.object({
  primary: z.string().min(1, "Primary color is required"),
  background: z.string().min(1, "Background color is required"),
});

type ThemeFormValues = z.infer<typeof themeFormSchema>;

export default function Branding() {
  const [, setLocation] = useLocation();
  const branding = useBranding();
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(branding.logoUrl);

  // Update logo preview when branding context changes
  useEffect(() => {
    setLogoPreview(branding.logoUrl);
  }, [branding.logoUrl]);
  const [activeTab, setActiveTab] = useState("theme");

  // Initialize form with YUP.RSVP defaults, regardless of user's current theme
  const form = useForm<ThemeFormValues>({
    resolver: zodResolver(themeFormSchema),
    defaultValues: {
      primary: "hsl(308, 100%, 66%)", // YUP.RSVP magenta
      background: "hsl(222, 84%, 5%)", // Dark background
    },
  });

  // If user is not premium, show restricted access message
  if (!branding.isPremium) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Header />
        <PageTitle title="Premium Feature" />
        <div className="flex flex-col items-center justify-center mt-12">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Premium Feature</CardTitle>
              <CardDescription>
                Branding customization is only available for premium users.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => setLocation("/")} className="w-full">
                Return to Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // Event handlers
  const handleThemeSubmit = async (data: ThemeFormValues) => {
    try {
      await branding.updateTheme(data);
      
      toast({
        title: "Theme updated",
        description: "Your brand theme has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error updating your theme. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Logo image must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.match(/image\/(png|jpeg|jpg|svg\+xml|gif)/)) {
      toast({
        title: "Invalid file type",
        description: "Logo must be an image (PNG, JPEG, SVG, or GIF)",
        variant: "destructive",
      });
      return;
    }

    // Create a URL for preview
    const reader = new FileReader();
    
    // Only use one event handler to avoid React hook issues
    reader.onloadend = async () => {
      if (typeof reader.result === 'string') {
        // Update the preview to give immediate feedback
        setLogoPreview(reader.result);
        
        try {
          // Then update the logo in the context and backend
          await branding.updateLogo(reader.result);
          
          // Don't reload the page - this was causing the logo to revert
          // The BrandingContext already updated the logo in state
          
          toast({
            title: "Logo updated",
            description: "Your brand logo has been updated successfully.",
          });
        } catch (error) {
          toast({
            title: "Error updating logo",
            description: "There was a problem updating your logo. Please try again.",
            variant: "destructive",
          });
        }
      }
    };
    
    reader.readAsDataURL(file);
  };

  const handleResetBranding = async () => {
    await branding.resetToDefault();
    setLogoPreview(null);
    form.reset({
      primary: "hsl(308, 100%, 66%)", // Reset to YUP.RSVP magenta
      background: "hsl(222, 84%, 5%)", // Reset to dark background
    });
    
    // Update the UI to reflect changes without reloading
    // The context state has already been updated
    
    toast({
      title: "Branding reset",
      description: "Your branding has been reset to the default YUP.RSVP magenta.",
    });
  };

  // Main premium content - only shown for premium users
  return (
    <div className="container mx-auto px-4 py-8">
      <Header />
      <PageTitle title="Branding Settings" />

      <div className="max-w-4xl mx-auto mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Customize Your Brand</h2>
          <Button
            variant="outline"
            onClick={handleResetBranding}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset to Default
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Paintbrush className="h-4 w-4" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="logo" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Logo
            </TabsTrigger>
          </TabsList>

          {/* Theme Customization */}
          <TabsContent value="theme">
            <Card>
              <CardHeader>
                <CardTitle>Theme Customization</CardTitle>
                <CardDescription>
                  Customize the color scheme and appearance of your RSVP pages.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={form.handleSubmit(handleThemeSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="primary">Primary Accent Color</Label>
                      <div className="flex gap-2 items-center mt-1">
                        <Input
                          type="color"
                          id="primary-color-picker"
                          className="w-12 h-10 p-1"
                          value={hslToHex(form.watch("primary"))}
                          onChange={(e) => {
                            form.setValue("primary", e.target.value);
                          }}
                        />
                        <Input
                          {...form.register("primary")}
                          placeholder="hsl(308, 100%, 66%)"
                          className="flex-1"
                        />
                      </div>
                      {form.formState.errors.primary && (
                        <p className="text-red-500 text-sm mt-1">
                          {form.formState.errors.primary.message}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        This bright color will be used for buttons, links, and highlights throughout your RSVP pages.
                        The default YUP.RSVP brand color is magenta (hsl(308, 100%, 66%)).
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="background">Background Color</Label>
                      <div className="flex gap-2 items-center mt-1">
                        <Input
                          type="color"
                          id="background-color-picker"
                          className="w-12 h-10 p-1"
                          value={hslToHex(form.watch("background"))}
                          onChange={(e) => {
                            form.setValue("background", e.target.value);
                          }}
                        />
                        <Input
                          {...form.register("background")}
                          placeholder="hsl(222, 84%, 5%)"
                          className="flex-1"
                        />
                      </div>
                      {form.formState.errors.background && (
                        <p className="text-red-500 text-sm mt-1">
                          {form.formState.errors.background.message}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        This darker color will be used as the main background throughout your RSVP pages.
                        The default is a dark blue-gray (hsl(222, 84%, 5%)).
                      </p>
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    style={{
                      backgroundColor: form.watch("primary"),
                      color: getAccessibleTextColor(form.watch("primary")),
                      borderColor: form.watch("primary")
                    }}
                  >
                    Save Theme
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logo Customization */}
          <TabsContent value="logo">
            <Card>
              <CardHeader>
                <CardTitle>Logo Customization</CardTitle>
                <CardDescription>
                  Upload your custom logo to replace the default Yup.RSVP logo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md">
                    {logoPreview ? (
                      <div className="mb-4">
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          className="max-h-32 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="mb-4 text-center text-gray-500">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2">No custom logo uploaded</p>
                      </div>
                    )}

                    <Label
                      htmlFor="logo-upload"
                      className="relative cursor-pointer font-medium rounded-md py-2 px-4"
                      style={{
                        backgroundColor: branding.theme.primary,
                        color: getAccessibleTextColor(branding.theme.primary),
                        borderColor: branding.theme.primary
                      }}
                    >
                      Choose Logo
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/gif"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleLogoUpload}
                      />
                    </Label>
                  </div>

                  <div className="text-sm text-gray-500">
                    <p>Recommended logo specifications:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>File formats: PNG, JPEG, SVG, or GIF</li>
                      <li>Maximum file size: 2MB</li>
                      <li>Transparent background recommended</li>
                      <li>Height: 32-64px (will be displayed at 32px)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}