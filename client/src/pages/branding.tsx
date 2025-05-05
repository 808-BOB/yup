import { useState, useCallback, ChangeEvent } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Header from "@/components/header";
import PageTitle from "@/components/page-title";
import { Paintbrush, Upload, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Schema for theme form - simplified to only include primary color
const themeFormSchema = z.object({
  primary: z.string().min(1, "Primary color is required"),
});

type ThemeFormValues = z.infer<typeof themeFormSchema>;

export default function Branding() {
  const [, setLocation] = useLocation();
  const branding = useBranding();
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(branding.logoUrl);
  const [activeTab, setActiveTab] = useState("theme");

  // Initialize form with current theme values - simplified to just primary color
  const form = useForm<ThemeFormValues>({
    resolver: zodResolver(themeFormSchema),
    defaultValues: {
      primary: branding.theme.primary,
    },
  });

  // Check if user is premium
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

  // Handle theme form submission
  const onThemeSubmit = async (data: ThemeFormValues) => {
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

  // Handle logo upload
  const handleLogoChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
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
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // In a real app, you would upload the file to a server here
      // For this example, we'll just use the data URL
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          branding.updateLogo(reader.result);
          toast({
            title: "Logo updated",
            description: "Your brand logo has been updated successfully.",
          });
        }
      };
    },
    [branding, toast]
  );

  const handleResetBranding = async () => {
    await branding.resetToDefault();
    setLogoPreview(null);
    form.reset({
      primary: "hsl(308, 100%, 66%)",
    });
    
    toast({
      title: "Branding reset",
      description: "Your branding has been reset to the default settings.",
    });
  };

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
                  onSubmit={form.handleSubmit(onThemeSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="primary">Primary Accent Color</Label>
                      <div className="flex gap-2 items-center mt-1">
                        <Input
                          type="color"
                          id="primary-color-picker"
                          className="w-12 h-10 p-1"
                          value={form.watch("primary")}
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
                        This color will be used as the accent color throughout your RSVP pages.
                        The default color is magenta (hsl(308, 100%, 66%)).
                      </p>
                    </div>
                  </div>

                  <Button type="submit">Save Theme</Button>
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
                      className="relative cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md py-2 px-4"
                    >
                      Choose Logo
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/gif"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleLogoChange}
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