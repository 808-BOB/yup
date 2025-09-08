"use client";

import { Button } from "@/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MakeAdmin() {
  const { toast } = useToast();
  const router = useRouter();

  const makeAdmin = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to become an admin.",
          variant: "destructive",
        });
        return;
      }

      // Update the user's admin status in the public.users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_admin: true })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success!",
        description: "You are now an admin. Please refresh the page.",
      });

      // Refresh the page to update the UI
      router.refresh();
    } catch (error) {
      console.error('Error making admin:', error);
      toast({
        title: "Error",
        description: "Failed to set admin status. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      onClick={makeAdmin}
      className="w-full bg-primary hover:bg-primary/90 text-white"
    >
      Make Me Admin
    </Button>
  );
} 