import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import YupLogo from "@assets/Yup-logo.png";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, loginWithGoogle, loginWithApple } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<'google' | 'apple' | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    console.log("Login attempt with username:", data.username);

    try {
      await login(data.username, data.password);
      console.log("Login successful");
      toast({
        title: "Success",
        description: "You have been logged in successfully.",
      });
      setLocation("/my-events");
    } catch (error) {
      console.error("Login error details:", error);
      toast({
        title: "Error",
        description: "Invalid username or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <div className="max-w-md mx-auto w-full px-4 pt-[120px]">
        <div className="text-center mb-8">
          <Link href="/">
            <img src={YupLogo} alt="Yup.RSVP" className="h-10 mx-auto mb-2" />
          </Link>
          <h2 className="mt-6 text-xl font-semibold text-gray-200">
            Sign in to your account
          </h2>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">
                    Username
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your username"
                      className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-primary" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">
                    Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-primary" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 rounded-none h-12 uppercase tracking-wider"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 mb-4">Or continue with</p>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Button
              type="button"
              variant="outline"
              className="border border-gray-700 rounded-none h-12 hover:bg-gray-800 flex items-center justify-center gap-2"
              onClick={async () => {
                try {
                  setIsSocialLoading('google');
                  await loginWithGoogle();
                  setLocation("/my-events");
                  toast({
                    title: "Success",
                    description: "Signed in with Google.",
                  });
                } catch (error: any) {
                  toast({
                    title: "Authentication Error",
                    description: error.message || "Failed to sign in with Google.",
                    variant: "destructive",
                  });
                  console.error("Google sign-in error details:", error);
                } finally {
                  setIsSocialLoading(null);
                }
              }}
              disabled={isSocialLoading !== null}
            >
              {isSocialLoading === 'google' ? (
                <span className="animate-spin">↻</span>
              ) : (
                <FcGoogle className="h-5 w-5" />
              )}
              <span>Google</span>
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="border border-gray-700 rounded-none h-12 hover:bg-gray-800 flex items-center justify-center gap-2"
              onClick={async () => {
                try {
                  setIsSocialLoading('apple');
                  await loginWithApple();
                  setLocation("/my-events");
                  toast({
                    title: "Success",
                    description: "Signed in with Apple.",
                  });
                } catch (error: any) {
                  toast({
                    title: "Authentication Error",
                    description: error.message || "Failed to sign in with Apple.",
                    variant: "destructive", 
                  });
                  console.error("Apple sign-in error details:", error);
                } finally {
                  setIsSocialLoading(null);
                }
              }}
              disabled={isSocialLoading !== null}
            >
              {isSocialLoading === 'apple' ? (
                <span className="animate-spin">↻</span>
              ) : (
                <FaApple className="h-5 w-5" />
              )}
              <span>Apple</span>
            </Button>
          </div>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Don't have an account?{" "}
            <span
              onClick={() => setLocation("/signup")}
              className="text-primary hover:text-primary/80 cursor-pointer"
            >
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
