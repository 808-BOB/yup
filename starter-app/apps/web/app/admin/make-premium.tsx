"use client";

import { Button } from "@/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MakePremium() {
  const { toast } = useToast();
  const router = useRouter();

  const makePremium = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to upgrade.",
          variant: "destructive",
        });
        return;
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({ is_premium: true })
        .eq("id", user.id);
      if (updateError) throw updateError;

      toast({
        title: "Success!",
        description: "Your account is now premium. Refresh to access branding.",
      });
      router.refresh();
    } catch (err) {
      console.error("Error upgrading to premium:", err);
      toast({
        title: "Error",
        description: "Failed to set premium status. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button onClick={makePremium} className="w-full bg-primary hover:bg-primary/90 text-white">
      Upgrade to Premium
    </Button>
  );
}
