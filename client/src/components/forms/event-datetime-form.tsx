import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

interface EventDateTimeFormProps {
  form: UseFormReturn<any>;
}

export function EventDateTimeForm({ form }: EventDateTimeFormProps) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-[#84793d]" />
          Date & Time
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date" className="text-white">Start Date *</Label>
            <Input
              id="date"
              type="date"
              {...form.register("date")}
              className="bg-slate-700 border-slate-600 text-white"
            />
            {form.formState.errors.date && (
              <p className="text-red-400 text-sm mt-1">
                {form.formState.errors.date.message as string}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="time" className="text-white">Start Time *</Label>
            <Input
              id="time"
              type="time"
              {...form.register("time")}
              className="bg-slate-700 border-slate-600 text-white"
            />
            {form.formState.errors.time && (
              <p className="text-red-400 text-sm mt-1">
                {form.formState.errors.time.message as string}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="endDate" className="text-white">End Date</Label>
            <Input
              id="endDate"
              type="date"
              {...form.register("endDate")}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="endTime" className="text-white">End Time</Label>
            <Input
              id="endTime"
              type="time"
              {...form.register("endTime")}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}