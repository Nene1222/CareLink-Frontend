// app/(auth)/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/ui/AuthCard";
import axiosClient from "@/lib/axiosClient";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosClient.post("/auth/forgot-password", { email });

      if (response.data.success) {
        setIsSubmitted(true);
        toast({
          title: "OTP Sent",
          description: "Check your email for the 6-digit verification code",
          variant: "default",
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTryAnotherEmail = () => {
    setIsSubmitted(false);
    setEmail("");
  };

  if (isSubmitted) {
    return (
      <AuthCard
        title="Check Your Email"
        subtitle="We've sent a 6-digit verification code to your email"
        footer={
          <p className="text-center text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="text-sidebar-foreground hover:text-primary font-medium">
              Back to login
            </Link>
          </p>
        }
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-muted-foreground">
            If an account exists for <strong>{email}</strong>, you will receive a 6-digit OTP shortly.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/verify-password-reset?email=${encodeURIComponent(email)}`)}
              className="w-full flex justify-center py-2 px-4 rounded-lg bg-primary text-white font-medium shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
            >
              Enter Verification Code
            </button>
            
            <button
              onClick={handleTryAnotherEmail}
              className="text-sidebar-foreground hover:text-primary font-medium text-sm"
            >
              Try another email
            </button>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset Your Password"
      subtitle="Enter your email and we'll send you a verification code"
      footer={
        <p className="text-center text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="text-sidebar-foreground hover:text-primary font-medium">
            Back to login
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-sidebar-foreground">
            Email Address
          </label>
          <input
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="mt-1 block w-full px-3 py-2 bg-sidebar-accent text-sidebar-foreground rounded-lg shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 rounded-lg bg-primary text-white font-medium shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 disabled:opacity-50"
        >
          {loading ? "Sending OTP..." : "Send Verification Code"}
        </button>
      </form>
    </AuthCard>
  );
}