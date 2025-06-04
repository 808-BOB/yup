import React, { useState } from "react";
import { useLocation } from "wouter";
import PageTitle from "@/components/page-title";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Copy, Menu, X, Palette, Type, Star, Puzzle } from "lucide-react";

// Style Guide Dashboard
export default function StyleGuide() {
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("colors");
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // Function to copy color value to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(text);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <PageTitle title="Style Guide" />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Style Guide</h1>
        <p className="text-muted-foreground">
          A comprehensive guide to the design elements and components used throughout the application.
        </p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors" className="flex items-center justify-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Colors</span>
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center justify-center gap-2">
            <Type className="h-4 w-4" />
            <span className="hidden sm:inline">Typography</span>
          </TabsTrigger>
          <TabsTrigger value="icons" className="flex items-center justify-center gap-2">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Icons</span>
          </TabsTrigger>
          <TabsTrigger value="components" className="flex items-center justify-center gap-2">
            <Puzzle className="h-4 w-4" />
            <span className="hidden sm:inline">Components</span>
          </TabsTrigger>
        </TabsList>

        {/* Colors Section */}
        <TabsContent value="colors" className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">Color Palette</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Primary Colors */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Primary</CardTitle>
                <CardDescription>Main brand colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-col space-y-2">
                  <div 
                    className="h-20 bg-primary rounded flex justify-end items-start p-2 cursor-pointer"
                    onClick={() => copyToClipboard("#84793d")}
                  >
                    {copiedColor === "#84793d" ? (
                      <Check className="text-white h-5 w-5" />
                    ) : (
                      <Copy className="text-white h-5 w-5" />
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Primary</span>
                    <span className="text-sm text-muted-foreground">#84793d</span>
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <div 
                    className="h-20 bg-primary-foreground text-primary rounded flex justify-end items-start p-2 cursor-pointer"
                    onClick={() => copyToClipboard("#ffffff")}
                  >
                    {copiedColor === "#ffffff" ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Primary Foreground</span>
                    <span className="text-sm text-muted-foreground">#ffffff</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Background & Foreground */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Background</CardTitle>
                <CardDescription>Background & foreground colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-col space-y-2">
                  <div 
                    className="h-20 bg-background border rounded flex justify-end items-start p-2 cursor-pointer"
                    onClick={() => copyToClipboard("#ffffff")}
                  >
                    {copiedColor === "#ffffff" ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Background</span>
                    <span className="text-sm text-muted-foreground">#ffffff</span>
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <div 
                    className="h-20 bg-foreground rounded flex justify-end items-start p-2 cursor-pointer"
                    onClick={() => copyToClipboard("#020817")}
                  >
                    {copiedColor === "#020817" ? (
                      <Check className="text-white h-5 w-5" />
                    ) : (
                      <Copy className="text-white h-5 w-5" />
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Foreground</span>
                    <span className="text-sm text-muted-foreground">#020817</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accent Colors */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Accent</CardTitle>
                <CardDescription>Accent and muted colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-col space-y-2">
                  <div 
                    className="h-20 bg-accent rounded flex justify-end items-start p-2 cursor-pointer"
                    onClick={() => copyToClipboard("#f8fafc")}
                  >
                    {copiedColor === "#f8fafc" ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Accent</span>
                    <span className="text-sm text-muted-foreground">#f8fafc</span>
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <div 
                    className="h-20 bg-muted rounded flex justify-end items-start p-2 cursor-pointer"
                    onClick={() => copyToClipboard("#f1f5f9")}
                  >
                    {copiedColor === "#f1f5f9" ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Muted</span>
                    <span className="text-sm text-muted-foreground">#f1f5f9</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Classes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Custom Classes</CardTitle>
                <CardDescription>App-specific color classes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-col space-y-2">
                  <div 
                    className="h-20 btn-primary flex items-center justify-center cursor-pointer"
                    onClick={() => copyToClipboard(".btn-primary")}
                  >
                    <span>btn-primary</span>
                    {copiedColor === ".btn-primary" ? (
                      <Check className="ml-2 h-4 w-4" />
                    ) : (
                      <Copy className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <div 
                    className="h-20 btn-secondary flex items-center justify-center cursor-pointer"
                    onClick={() => copyToClipboard(".btn-secondary")}
                  >
                    <span>btn-secondary</span>
                    {copiedColor === ".btn-secondary" ? (
                      <Check className="ml-2 h-4 w-4" />
                    ) : (
                      <Copy className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RSVP Buttons */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>RSVP Buttons</CardTitle>
                <CardDescription>Yup/Nope specific styles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-col space-y-2">
                  <div 
                    className="h-20 btn-yup flex items-center justify-center cursor-pointer"
                    onClick={() => copyToClipboard(".btn-yup")}
                  >
                    <span>btn-yup</span>
                    {copiedColor === ".btn-yup" ? (
                      <Check className="ml-2 h-4 w-4" />
                    ) : (
                      <Copy className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <div 
                    className="h-20 btn-nope flex items-center justify-center cursor-pointer"
                    onClick={() => copyToClipboard(".btn-nope")}
                  >
                    <span>btn-nope</span>
                    {copiedColor === ".btn-nope" ? (
                      <Check className="ml-2 h-4 w-4" />
                    ) : (
                      <Copy className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Typography Section */}
        <TabsContent value="typography" className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">Typography</h2>

          <Card>
            <CardHeader>
              <CardTitle>Headings</CardTitle>
              <CardDescription>Font styles for headings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">Heading 1</h1>
                <p className="text-sm text-muted-foreground">text-4xl font-bold tracking-tight</p>
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">Heading 2</h2>
                <p className="text-sm text-muted-foreground">text-3xl font-bold tracking-tight</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Heading 3</h3>
                <p className="text-sm text-muted-foreground">text-2xl font-bold tracking-tight</p>
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">Heading 4</h4>
                <p className="text-sm text-muted-foreground">text-xl font-bold tracking-tight</p>
              </div>
              <div>
                <h5 className="text-lg font-bold mb-2">Heading 5</h5>
                <p className="text-sm text-muted-foreground">text-lg font-bold tracking-tight</p>
              </div>
              <div>
                <h6 className="text-base font-bold mb-2">Heading 6</h6>
                <p className="text-sm text-muted-foreground">text-base font-bold tracking-tight</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Body Text</CardTitle>
              <CardDescription>Font styles for body content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-lg mb-2">Large Paragraph</p>
                <p className="text-sm text-muted-foreground">text-lg tracking-tight</p>
              </div>
              <div>
                <p className="text-base mb-2">Regular Paragraph - This is a standard paragraph with regular text size. The application uses Inconsolata for its monospaced appearance giving it a modern tech feel.</p>
                <p className="text-sm text-muted-foreground">text-base tracking-tight</p>
              </div>
              <div>
                <p className="text-sm mb-2">Small Text</p>
                <p className="text-sm text-muted-foreground">text-sm</p>
              </div>
              <div>
                <p className="text-xs mb-2">Extra Small Text</p>
                <p className="text-sm text-muted-foreground">text-xs</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Text Styles</CardTitle>
              <CardDescription>Special text styles used in the app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="custom-heading mb-2">CUSTOM HEADING</p>
                <p className="text-sm text-muted-foreground">custom-heading (text-primary font-bold uppercase tracking-wider)</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">Muted Text</p>
                <p className="text-sm text-muted-foreground">text-muted-foreground</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Icons Section */}
        <TabsContent value="icons" className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">Icons</h2>

          <Card>
            <CardHeader>
              <CardTitle>Lucide Icons</CardTitle>
              <CardDescription>Commonly used icons from lucide-react</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="flex flex-col items-center justify-center p-4 border rounded">
                  <Check className="h-8 w-8 mb-2" />
                  <span className="text-sm text-center">Check</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 border rounded">
                  <X className="h-8 w-8 mb-2" />
                  <span className="text-sm text-center">X</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 border rounded">
                  <Menu className="h-8 w-8 mb-2" />
                  <span className="text-sm text-center">Menu</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 border rounded">
                  <Copy className="h-8 w-8 mb-2" />
                  <span className="text-sm text-center">Copy</span>
                </div>
                {/* Add more icons as needed */}
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  For more icons, visit the{" "}
                  <a 
                    href="https://lucide.dev/icons/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Lucide Icons documentation
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components Section */}
        <TabsContent value="components" className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">Components</h2>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="buttons">
              <AccordionTrigger>Buttons</AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold">Default Variants</h4>
                        <div className="flex flex-wrap gap-4">
                          <Button variant="default">Default</Button>
                          <Button variant="destructive">Destructive</Button>
                          <Button variant="outline">Outline</Button>
                          <Button variant="secondary">Secondary</Button>
                          <Button variant="ghost">Ghost</Button>
                          <Button variant="link">Link</Button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold">Sizes</h4>
                        <div className="flex flex-wrap gap-4 items-center">
                          <Button size="sm">Small</Button>
                          <Button size="default">Default</Button>
                          <Button size="lg">Large</Button>
                          <Button size="icon"><Copy className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 space-y-4">
                      <h4 className="text-lg font-semibold">Custom Button Styles</h4>
                      <div className="flex flex-wrap gap-4">
                        <button className="btn-primary px-4 py-2">btn-primary</button>
                        <button className="btn-secondary px-4 py-2">btn-secondary</button>
                        <button className="btn-yup px-4 py-2"><span>btn-yup</span></button>
                        <button className="btn-nope px-4 py-2">btn-nope</button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cards">
              <AccordionTrigger>Cards</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Card Title</CardTitle>
                      <CardDescription>Card description goes here</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>This is the content of the card.</p>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Components:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li><code>Card</code></li>
                      <li><code>CardHeader</code></li>
                      <li><code>CardTitle</code></li>
                      <li><code>CardDescription</code></li>
                      <li><code>CardContent</code></li>
                      <li><code>CardFooter</code></li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="accordion">
              <AccordionTrigger>Accordion</AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6">
                    <p className="mb-4 text-sm text-muted-foreground">
                      The Accordion component is being demonstrated right now as you expand this section.
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Components:</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><code>Accordion</code></li>
                        <li><code>AccordionItem</code></li>
                        <li><code>AccordionTrigger</code></li>
                        <li><code>AccordionContent</code></li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tabs">
              <AccordionTrigger>Tabs</AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6">
                    <p className="mb-4 text-sm text-muted-foreground">
                      The Tabs component is being used for the main navigation of this style guide.
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Components:</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><code>Tabs</code></li>
                        <li><code>TabsList</code></li>
                        <li><code>TabsTrigger</code></li>
                        <li><code>TabsContent</code></li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex justify-center gap-4">
        <Button variant="outline" onClick={() => setLocation("/")}>
          Return to Home
        </Button>
        <Button 
          variant="default"
          onClick={() => {
            const styleData = {
              colors: {
                primary: 'hsl(var(--primary))',
                primaryForeground: 'hsl(var(--primary-foreground))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                accent: 'hsl(var(--accent))',
                muted: 'hsl(var(--muted))',
              },
              customClasses: {
                btnPrimary: 'btn-primary',
                btnSecondary: 'btn-secondary',
                btnYup: 'btn-yup',
                btnNope: 'btn-nope',
              },
              typography: {
                fontFamily: 'Inconsolata',
                headings: {
                  h1: 'text-4xl font-bold tracking-tight',
                  h2: 'text-3xl font-bold tracking-tight',
                  h3: 'text-2xl font-bold tracking-tight',
                  h4: 'text-xl font-bold tracking-tight',
                  h5: 'text-lg font-bold tracking-tight',
                  h6: 'text-base font-bold tracking-tight',
                },
                body: {
                  large: 'text-lg',
                  regular: 'text-base',
                  small: 'text-sm',
                  extraSmall: 'text-xs',
                },
              },
            };

            const blob = new Blob([JSON.stringify(styleData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'yup-style-guide.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
        >
          Download Style Guide
        </Button>
      </div>
    </div>
  );
}