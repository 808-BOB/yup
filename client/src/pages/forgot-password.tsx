import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import YupLogo from "@assets/Yup-logo.png";
import { Mail, Phone, ArrowLeft } from "lucide-react";

const forgotPasswordSchema = z.object({
  contact: z.string().min(1, "Please enter your phone number or email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [contactType, setContactType] = useState<"email" | "phone">("email");

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      contact: "",
    },
  });

  // Determine if the input looks like email or phone
  const detectContactType = (value: string) => {
    if (value.includes("@")) {
      setContactType("email");
    } else if (/^\+?[\d\s\-\(\)]{10,}$/.test(value)) {
      setContactType("phone");
    }
  };

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/auth/forgot-password", {
        contact: data.contact,
        type: contactType,
      });

      setResetSent(true);
      toast({
        title: "Reset Link Sent",
        description: `Password reset instructions have been sent to your ${contactType === "email" ? "email" : "phone"}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset. Please check your contact information.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (resetSent) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-950">
        <div className="max-w-md mx-auto w-full px-4 pt-[80px] pb-10">
          <div className="text-center mb-8">
            <Link href="/">
              <img src={YupLogo} alt="Yup.RSVP" className="h-10 mx-auto mb-2" />
            </Link>
            <h2 className="mt-6 text-xl font-semibold text-gray-200">
              Reset Instructions Sent
            </h2>
          </div>

          <Card className="bg-gray-900 border border-gray-800">
            <CardHeader className="text-center">
              <CardTitle className="text-lg text-gray-200">Check Your {contactType === "email" ? "Email" : "Phone"}</CardTitle>
              <CardDescription className="text-gray-400">
                {contactType === "email" 
                  ? "We've sent password reset instructions to your email address."
                  : "We've sent a password reset code to your phone number."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500 text-center">
                {contactType === "email" 
                  ? "Please check your email and click the reset link to create a new password."
                  : "Please check your text messages for a reset code."
                }
              </p>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => {
                    setResetSent(false);
                    form.reset();
                  }}
                  variant="outline"
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Try Different Contact Method
                </Button>
                
                <Button
                  onClick={() => setLocation("/login")}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Back to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <div className="max-w-md mx-auto w-full px-4 pt-[80px] pb-10">
        <div className="text-center mb-8">
          <Link href="/">
            <img src={YupLogo} alt="Yup.RSVP" className="h-10 mx-auto mb-2" />
          </Link>
          <h2 className="mt-6 text-xl font-semibold text-gray-200">
            Reset Your Password
          </h2>
          <p className="mt-2 text-gray-400 text-sm">
            Enter your phone number or email address and we'll send you reset instructions
          </p>
        </div>

        <Card className="bg-gray-900 border border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-gray-200 flex items-center gap-2">
              {contactType === "email" ? <Mail className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
              Reset Password
            </CardTitle>
            <CardDescription className="text-gray-400">
              We'll send reset instructions to your {contactType === "email" ? "email" : "phone"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">
                        Phone Number or Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your phone number or email"
                          className="bg-transparent border border-gray-700 focus:border-primary rounded-none h-12"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            detectContactType(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-primary" />
                      <p className="text-xs text-gray-500 mt-1">
                        {contactType === "email" 
                          ? "We'll send a reset link to your email"
                          : "We'll send a reset code via text message"
                        }
                      </p>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 rounded-none h-12 uppercase tracking-wider"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : `Send Reset ${contactType === "email" ? "Link" : "Code"}`}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <Link href="/login">
                <Button variant="link" className="text-gray-400 hover:text-gray-300 flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}