import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Settings } from "lucide-react";

interface EventSettingsFormProps {
  form: UseFormReturn<any>;
}

export function EventSettingsForm({ form }: EventSettingsFormProps) {
  return (
    <>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Settings className="w-5 h-5 mr-2 text-[#84793d]" />
            Guest Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="allowGuestRsvp"
              checked={form.watch("allowGuestRsvp")}
              onCheckedChange={(checked) => form.setValue("allowGuestRsvp", checked)}
            />
            <Label htmlFor="allowGuestRsvp" className="text-white">Allow guest RSVPs</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="allowPlusOne"
              checked={form.watch("allowPlusOne")}
              onCheckedChange={(checked) => form.setValue("allowPlusOne", checked)}
            />
            <Label htmlFor="allowPlusOne" className="text-white">Allow plus ones</Label>
          </div>

          {form.watch("allowPlusOne") && (
            <div>
              <Label htmlFor="maxGuestsPerRsvp" className="text-white">Max guests per RSVP</Label>
              <Input
                id="maxGuestsPerRsvp"
                type="number"
                min="1"
                max="10"
                {...form.register("maxGuestsPerRsvp")}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          )}

          <div>
            <Label htmlFor="maxAttendees" className="text-white">Event capacity (optional)</Label>
            <Input
              id="maxAttendees"
              type="number"
              min="1"
              {...form.register("maxAttendees")}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="Leave empty for unlimited"
            />
            <p className="text-slate-400 text-sm mt-1">
              When capacity is reached, new responses will join a waitlist
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Privacy Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="showRsvpsToInvitees"
              checked={form.watch("showRsvpsToInvitees")}
              onCheckedChange={(checked) => form.setValue("showRsvpsToInvitees", checked)}
            />
            <Label htmlFor="showRsvpsToInvitees" className="text-white">Show RSVPs to invitees</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="showRsvpsAfterThreshold"
              checked={form.watch("showRsvpsAfterThreshold")}
              onCheckedChange={(checked) => form.setValue("showRsvpsAfterThreshold", checked)}
            />
            <Label htmlFor="showRsvpsAfterThreshold" className="text-white">Only show RSVPs after threshold</Label>
          </div>

          {form.watch("showRsvpsAfterThreshold") && (
            <div>
              <Label className="text-white">RSVP visibility threshold: {form.watch("rsvpVisibilityThreshold") || 5}</Label>
              <Slider
                value={[form.watch("rsvpVisibilityThreshold") || 5]}
                onValueChange={(values) => form.setValue("rsvpVisibilityThreshold", values[0])}
                max={20}
                min={1}
                step={1}
                className="py-4"
              />
              <p className="text-slate-400 text-sm">
                RSVPs will only be visible once this many people have responded
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Custom Response Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="customYesText" className="text-white">Custom "Yes" text (optional)</Label>
            <Input
              id="customYesText"
              {...form.register("customYesText")}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="e.g., 'I'll be there!'"
            />
          </div>

          <div>
            <Label htmlFor="customNoText" className="text-white">Custom "No" text (optional)</Label>
            <Input
              id="customNoText"
              {...form.register("customNoText")}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="e.g., 'Can't make it'"
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}