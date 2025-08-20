"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FcGoogle } from "react-icons/fc";

import { useAuth } from "@/utils/auth-context";
import { useToast } from "@/hooks/use-toast";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/ui/tabs";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Toaster } from "@/ui/toaster";

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, signup, loginWithGoogle, resetPassword, user, isLoading, error: authError } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState<"login" | "signup">("login");
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);

  const [form, setForm] = React.useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = React.useState({ email: "", displayName: "", password: "", confirm: "" });

  React.useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup") setActiveTab("signup");
    


    // Handle OAuth errors from URL
    const error = searchParams.get("error");
    if (error) {
      let errorMessage = "Authentication failed";
      switch (error) {
        case "access_denied":
          errorMessage = "Access was denied. Please try again.";
          break;
        case "auth_error":
          errorMessage = "Authentication error occurred.";
          break;
        case "no_session":
          errorMessage = "No session found. Please try signing in again.";
          break;
        default:
          errorMessage = `Authentication error: ${error}`;
      }
      toast({
        title: "Sign-in Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [searchParams, toast]);

  // Show auth context errors - only show once per error and not during form submission
  React.useEffect(() => {
    if (authError && !isLoading && !isSubmitting) {
      toast({
        title: "Authentication Error",
        description: authError,
        variant: "destructive"
      });
    }
  }, [authError, isLoading, isSubmitting, toast]);

  // Handle authenticated user redirect using Next.js router
  React.useEffect(() => {
    if (user && !isLoading && !isRedirecting) {
      setIsRedirecting(true);
      const redirectTo = searchParams.get("redirect") || "/my-events";
      
      // Use Next.js router for proper navigation
      router.replace(redirectTo);
    }
  }, [user, isLoading, isRedirecting, searchParams, router]);

  // Show loading state while auth is loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show redirecting state when user is authenticated and redirecting
  if (user && isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  // If user is already authenticated but not redirecting yet, don't show the form
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Preparing redirect...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      // Don't manually redirect - let the useEffect handle it after auth state updates
    } catch (err: any) {
      // Don't show toast here as auth context will handle the error
      console.error('Login failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!signupForm.email || !signupForm.displayName || !signupForm.password || !signupForm.confirm) {
      toast({ title: "Missing fields", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    
    if (signupForm.password !== signupForm.confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    
    if (signupForm.password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    
    setSubmitting(true);
    try {
      await signup(signupForm.email, signupForm.displayName, signupForm.password);
      // No need to redirect - user will be automatically logged in
      toast({
        title: "Account created successfully!",
        description: "Welcome to Yup.RSVP! You're now signed in.",
        variant: "default"
      });
    } catch (err: any) {
      // Don't show toast here as auth context will handle the error
      console.error('Signup failed:', err);
    } finally {
      setSubmitting(false);
    }
  };



  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) {
      toast({ title: "Email required", description: "Please enter your email address", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(form.email);
      toast({
        title: "Reset link sent",
        description: "Check your email for instructions to reset your password.",
        variant: "default"
      });
      setShowForgotPassword(false);
    } catch (err: any) {
      toast({ title: "Reset failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white">
      <div className="max-w-md mx-auto w-full px-4 pt-20 pb-16">
        <div className="text-center mb-8">
          <Link href="/">
            <img src="/Yup-logo.png" alt="Yup.RSVP" className="h-10 mx-auto mb-2 cursor-pointer" />
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={(val)=>setActiveTab(val as any)}>
          <TabsList className="grid w-full grid-cols-2 h-14 mb-6 bg-gray-900 border border-gray-700 rounded-sm p-1">
            <TabsTrigger value="login" className="h-full text-base rounded-sm data-[state=active]:bg-black data-[state=active]:text-white text-gray-400">Login</TabsTrigger>
            <TabsTrigger value="signup" className="h-full text-base rounded-sm data-[state=active]:bg-black data-[state=active]:text-white text-gray-400">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <h2 className="text-xl font-semibold text-gray-200 mb-6 text-center">Sign in to your account</h2>
            

            
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="text-gray-400 uppercase text-xs tracking-wider mb-2 block">Email</label>
                <Input type="email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} placeholder="Enter your email" className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12" />
              </div>
              <div>
                <label className="text-gray-400 uppercase text-xs tracking-wider mb-2 block">Password</label>
                <Input type="password" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} placeholder="Enter your password" className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12" />
              </div>
              <Button disabled={isSubmitting} className="btn-yup w-full h-12 rounded-none uppercase">
                {isSubmitting ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            {!showForgotPassword && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowForgotPassword(true)}
                  className="text-primary hover:text-primary/80 text-sm"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {showForgotPassword && (
              <div className="mt-4 p-4 bg-gray-900 border border-gray-700 rounded-sm">
                <h3 className="text-sm font-medium text-gray-200 mb-3">Reset your password</h3>
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    placeholder="Enter your email"
                    className="bg-transparent border border-gray-600 focus:border-primary rounded-none h-10"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      size="sm"
                      className="btn-yup rounded-none"
                    >
                      {isSubmitting ? "Sending..." : "Send Reset Link"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowForgotPassword(false)}
                      className="border-gray-600 text-gray-400 rounded-none"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-gray-400 mb-4">Or continue with</p>
              <Button variant="outline" type="button" onClick={async ()=>{
                try {
                  await loginWithGoogle();
                } catch {}
              }} className="border border-gray-700 bg-black rounded-none h-12 hover:bg-gray-800 flex items-center justify-center gap-2 mx-auto text-gray-200">
                <FcGoogle className="h-5 w-5" />
                <span>Google</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="signup">
            <h2 className="text-xl font-semibold text-gray-200 mb-6 text-center">Create your account</h2>
            <form className="space-y-6" onSubmit={handleSignup}>
              <div>
                <label className="text-gray-400 uppercase text-xs tracking-wider mb-2 block">Email</label>
                <Input type="email" required value={signupForm.email} onChange={(e)=>setSignupForm({...signupForm, email:e.target.value})} placeholder="Enter your email" className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12" />
              </div>
              <div>
                <label className="text-gray-400 uppercase text-xs tracking-wider mb-2 block">Display Name</label>
                <Input required value={signupForm.displayName} onChange={(e)=>setSignupForm({...signupForm, displayName:e.target.value})} placeholder="Your name as shown to others" className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12" />
              </div>
              <div>
                <label className="text-gray-400 uppercase text-xs tracking-wider mb-2 block">Password</label>
                <Input type="password" required minLength={6} value={signupForm.password} onChange={(e)=>setSignupForm({...signupForm, password:e.target.value})} placeholder="Create a password (min 6 characters)" className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12" />
              </div>
              <div>
                <label className="text-gray-400 uppercase text-xs tracking-wider mb-2 block">Confirm Password</label>
                <Input type="password" required value={signupForm.confirm} onChange={(e)=>setSignupForm({...signupForm, confirm:e.target.value})} placeholder="Confirm your password" className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12" />
              </div>
              <Button disabled={isSubmitting} className="btn-yup w-full h-12 rounded-none uppercase">
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-gray-400 mb-4">Or continue with</p>
              <Button variant="outline" type="button" onClick={async ()=>{
                try {
                  await loginWithGoogle();
                } catch {}
              }} className="border border-gray-700 bg-black rounded-none h-12 hover:bg-gray-800 flex items-center justify-center gap-2 mx-auto text-gray-200">
                <FcGoogle className="h-5 w-5" />
                <span>Google</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-8 space-y-4 text-sm text-gray-400">
          {activeTab === "login" ? (
            <>
              Don't have an account? {" "}
              <button onClick={()=>setActiveTab("signup") } className="text-primary hover:text-primary/80">Sign up</button>
            </>
          ) : (
            <>
              Already have an account? {" "}
              <button onClick={()=>setActiveTab("login") } className="text-primary hover:text-primary/80">Log in</button>
            </>
          )}
          <div>
            <Link href="/" className="text-gray-400 hover:text-gray-300 text-sm">← Back to Home</Link>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

export default function AuthPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading... (Suspense fallback)</p>
        </div>
      </div>
    }>
      <AuthPageContent />
    </React.Suspense>
  );
}
