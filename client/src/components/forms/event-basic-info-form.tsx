import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

interface EventBasicInfoFormProps {
  form: UseFormReturn<any>;
  onImageUpload: (url: string) => void;
}

export function EventBasicInfoForm({ form, onImageUpload }: EventBasicInfoFormProps) {
  const handleImageUpload = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      onImageUpload(url);
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-white">Event Title *</Label>
          <Input
            id="title"
            {...form.register("title")}
            className="bg-slate-700 border-slate-600 text-white"
            placeholder="Enter event title"
          />
          {form.formState.errors.title && (
            <p className="text-red-400 text-sm mt-1">
              {form.formState.errors.title.message as string}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="description" className="text-white">Description</Label>
          <Textarea
            id="description"
            {...form.register("description")}
            className="bg-slate-700 border-slate-600 text-white"
            placeholder="Event description (optional)"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="location" className="text-white">Location *</Label>
          <Input
            id="location"
            {...form.register("location")}
            className="bg-slate-700 border-slate-600 text-white"
            placeholder="Event location"
          />
          {form.formState.errors.location && (
            <p className="text-red-400 text-sm mt-1">
              {form.formState.errors.location.message as string}
            </p>
          )}
        </div>

        <div>
          <Label className="text-white">Event Image</Label>
          <div className="space-y-2">
            {form.watch("imageUrl") && (
              <img
                src={form.watch("imageUrl")}
                alt="Event preview"
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleImageUpload}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              <Camera className="w-4 h-4 mr-2" />
              {form.watch("imageUrl") ? "Replace Image" : "Upload Image"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}