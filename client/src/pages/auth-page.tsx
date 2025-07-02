import { useState, useEffect } from "react";
import { useLocation, Link as RouterLink } from "wouter";
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
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import YupLogo from "@assets/Yup-logo.png";
import { FcGoogle } from "react-icons/fc";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    displayName: z.string().min(1, "Display name is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [location, setLocation] = useLocation();
  const { login, signup, user, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is already logged in, redirect to my-events
  useEffect(() => {
    if (user) {
      setLocation("/my-events");
    }
  }, [user, setLocation]);

  // Check URL for mode parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    if (mode === "signup") {
      setActiveTab("signup");
    } else if (mode === "login") {
      setActiveTab("login");
    }
  }, [location]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      displayName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleLogin = async (data: LoginFormValues) => {
    setIsSubmitting(true);

    try {
      await login(data.username, data.password);
      toast({
        title: "Success",
        description: "You have been logged in successfully.",
      });
      setLocation("/my-events");
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid username or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (data: SignupFormValues) => {
    setIsSubmitting(true);

    try {
      await signup(data.username, data.displayName, data.password);
      toast({
        title: "Success",
        description: "Account created successfully. You are now logged in.",
      });
      setLocation("/my-events");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create account. Username may already be taken.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const LoginForm = () => (
    <Form {...loginForm}>
      <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
        <FormField
          control={loginForm.control}
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
          control={loginForm.control}
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
  );

  const SignupForm = () => (
    <Form {...signupForm}>
      <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-6">
        <FormField
          control={signupForm.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">
                Username
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Choose a username"
                  className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-primary" />
            </FormItem>
          )}
        />

        <FormField
          control={signupForm.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">
                Display Name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Your name as shown to others"
                  className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-primary" />
            </FormItem>
          )}
        />

        <FormField
          control={signupForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">
                Password
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Create a password"
                  className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-primary" />
            </FormItem>
          )}
        />

        <FormField
          control={signupForm.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">
                Confirm Password
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Confirm your password"
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
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
    </Form>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <div className="max-w-md mx-auto w-full px-4 pt-[80px] pb-16">
        <div className="text-center mb-8">
          <RouterLink href="/">
            <img src={YupLogo} alt="Yup.RSVP" className="h-10 mx-auto mb-2 cursor-pointer" />
          </RouterLink>
        </div>

        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "login" | "signup")}>
          <TabsList className="grid w-full grid-cols-2 h-14 mb-6">
            <TabsTrigger value="login" className="h-full text-base">Login</TabsTrigger>
            <TabsTrigger value="signup" className="h-full text-base">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <h2 className="text-xl font-semibold text-gray-200 mb-6 text-center">
              Sign in to your account
            </h2>
            <LoginForm />
            <div className="mt-6 text-center">
              <p className="text-gray-400 mb-4">Or continue with</p>
              <Button
                variant="outline"
                className="border border-gray-700 rounded-none h-12 hover:bg-gray-800 flex items-center justify-center gap-2 mx-auto"
                onClick={async () => {
                  try {
                    await loginWithGoogle();
                    setLocation('/my-events');
                  } catch (e) {
                    toast({ title: 'Google sign-in failed', variant: 'destructive' });
                  }
                }}>
                <FcGoogle className="h-5 w-5" />
                <span>Google</span>
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="signup">
            <h2 className="text-xl font-semibold text-gray-200 mb-6 text-center">
              Create your account
            </h2>
            <SignupForm />
          </TabsContent>
        </Tabs>

        <div className="text-center mt-8 space-y-4">
          <p className="text-gray-400 text-sm">
            {activeTab === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => setActiveTab("signup")}
                  className="text-primary hover:text-primary/80"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setActiveTab("login")}
                  className="text-primary hover:text-primary/80"
                >
                  Log in
                </button>
              </>
            )}
          </p>
          <div>
            <RouterLink href="/">
              <Button variant="link" className="text-gray-400 hover:text-gray-300">
                ← Back to Home
              </Button>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  );
}