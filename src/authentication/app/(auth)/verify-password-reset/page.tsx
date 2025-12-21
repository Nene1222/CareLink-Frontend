// app/(auth)/verify-password-reset/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/ui/AuthCard";
import axiosClient from "@/lib/axiosClient";
import { useToast } from "@/hooks/use-toast";

export default function VerifyPasswordResetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const email = searchParams.get('email');
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!email) {
      router.push('/forgot-password');
    }
  }, [email, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.nextSibling && element.value) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && e.currentTarget.previousSibling) {
      (e.currentTarget.previousSibling as HTMLInputElement).focus();
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      const response = await axiosClient.post("/auth/forgot-password", { email });
      
      if (response.data.success) {
        toast({
          title: "OTP Sent",
          description: "New verification code sent to your email",
          variant: "default",
        });
        setCountdown(60);
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to resend OTP",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axiosClient.post("/auth/reset-password", {
        email,
        otp: otpValue,
        newPassword
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Password reset successfully! Redirecting to login...",
          variant: "default",
        });

        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <AuthCard
      title="Reset Your Password"
      subtitle={`Enter the 6-digit code sent to ${email} and your new password`}
      footer={
        <p className="text-center text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="text-sidebar-foreground hover:text-primary font-medium">
            Back to login
          </Link>
        </p>
      }
    >
      <form onSubmit={handleResetPassword} className="space-y-6">
        {/* OTP Input */}
        <div>
          <label className="block text-sm font-medium text-sidebar-foreground mb-3">
            Verification Code
          </label>
          <div className="flex justify-center space-x-2">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={data}
                onChange={e => handleOtpChange(e.target, index)}
                onKeyDown={e => handleKeyDown(e, index)}
                onFocus={e => e.target.select()}
                className="w-12 h-12 text-center text-lg font-semibold bg-sidebar-accent text-sidebar-foreground rounded-lg border border-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                disabled={loading}
              />
            ))}
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-sidebar-foreground">
            New Password
          </label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            className="mt-1 block w-full px-3 py-2 bg-sidebar-accent text-sidebar-foreground rounded-lg shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Must be at least 8 characters
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-sidebar-foreground">
            Confirm New Password
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="mt-1 block w-full px-3 py-2 bg-sidebar-accent text-sidebar-foreground rounded-lg shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            disabled={loading}
          />
        </div>

        {/* Resend OTP */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Didn't receive the code?{" "}
            {countdown > 0 ? (
              <span className="text-muted-foreground">
                Resend in {countdown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendLoading}
                className="text-primary hover:text-primary/80 font-medium disabled:opacity-50"
              >
                {resendLoading ? "Sending..." : "Resend OTP"}
              </button>
            )}
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 rounded-lg bg-primary text-white font-medium shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 disabled:opacity-50"
        >
          {loading ? "Resetting Password..." : "Reset Password"}
        </button>
      </form>
    </AuthCard>
  );
}