"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FcGoogle } from "react-icons/fc";

import { useAuth } from "@/utils/auth-context";
import { useToast } from "@/utils/use-toast";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/ui/tabs";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Toaster } from "@/ui/toaster";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, signup, loginWithGoogle, user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState<"login" | "signup">("login");
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({ username: "", password: "" });
  const [signupForm, setSignupForm] = React.useState({ username: "", displayName: "", password: "", confirm: "" });

  React.useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup") setActiveTab("signup");
  }, [searchParams]);

  if (user) {
    router.push("/events");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(form.username, form.password);
      router.push("/events");
    } catch {
      toast({ title: "Login failed", description: "Invalid credentials", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupForm.password !== signupForm.confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await signup(signupForm.username, signupForm.displayName, signupForm.password);
      router.push("/events");
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message, variant: "destructive" });
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
                <label className="text-gray-400 uppercase text-xs tracking-wider mb-2 block">Username</label>
                <Input value={form.username} onChange={(e)=>setForm({...form, username: e.target.value})} placeholder="Enter your username" className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12" />
              </div>
              <div>
                <label className="text-gray-400 uppercase text-xs tracking-wider mb-2 block">Password</label>
                <Input type="password" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} placeholder="Enter your password" className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12" />
              </div>
              <Button disabled={isSubmitting} className="btn-yup w-full h-12 rounded-none uppercase">
                {isSubmitting ? "Signing In..." : "Sign In"}
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

          <TabsContent value="signup">
            <h2 className="text-xl font-semibold text-gray-200 mb-6 text-center">Create your account</h2>
            <form className="space-y-6" onSubmit={handleSignup}>
              <div>
                <label className="text-gray-400 uppercase text-xs tracking-wider mb-2 block">Username</label>
                <Input value={signupForm.username} onChange={(e)=>setSignupForm({...signupForm, username:e.target.value})} placeholder="Choose a username" className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12" />
              </div>
              <div>
                <label className="text-gray-400 uppercase text-xs tracking-wider mb-2 block">Display Name</label>
                <Input value={signupForm.displayName} onChange={(e)=>setSignupForm({...signupForm, displayName:e.target.value})} placeholder="Your name as shown to others" className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12" />
              </div>
              <div>
                <label className="text-gray-400 uppercase text-xs tracking-wider mb-2 block">Password</label>
                <Input type="password" value={signupForm.password} onChange={(e)=>setSignupForm({...signupForm, password:e.target.value})} placeholder="Create a password" className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12" />
              </div>
              <div>
                <label className="text-gray-400 uppercase text-xs tracking-wider mb-2 block">Confirm Password</label>
                <Input type="password" value={signupForm.confirm} onChange={(e)=>setSignupForm({...signupForm, confirm:e.target.value})} placeholder="Confirm your password" className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12" />
              </div>
              <Button className="btn-yup w-full h-12 rounded-none uppercase">Create Account</Button>
            </form>
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