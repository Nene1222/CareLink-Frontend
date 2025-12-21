// app/(auth)/login/page.tsx - UPDATED
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/ui/AuthCard";
import axiosClient from "@/lib/axiosClient";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call login API
      const response = await axiosClient.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      console.log("Login successful:", response.data);

      const { token, user } = response.data;
      
      // Store basic user info
      localStorage.setItem("user_token", token);
      localStorage.setItem("user_id", user.id);
      localStorage.setItem("user_email", user.email);
      localStorage.setItem("user_name", user.username);
      localStorage.setItem("user_role", user.role);
      
      // NOW: Fetch permissions from permissions API
      try {
        const permResponse = await axiosClient.get(`/permissions?role=${user.role}`);
        console.log("Permissions API response:", permResponse.data);
        
        // Store the ENTIRE permissions response (has role, hasAllAccess, permissions array)
        localStorage.setItem("user_permissions", JSON.stringify(permResponse.data));
      } catch (permError) {
        console.error("Error fetching permissions:", permError);
        // If permissions API fails, use roleData from login
        if (user.roleData?.permissions) {
          localStorage.setItem("user_permissions", JSON.stringify({
            role: user.role,
            hasAllAccess: user.role === "admin",
            permissions: user.roleData.permissions
          }));
        }
      }

      // Show success toast
      toast({
        title: "Login Successful",
        description: "Welcome back to CareLink!",
        variant: "default",
      });

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/");
      }, 1000);

    } catch (err: any) {
      console.error("Login error:", err);
      
      // Show error toast
      toast({
        title: "Login Failed",
        description: err.response?.data?.error || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Rest of your component remains the same...
  return (
    <AuthCard
      title="Welcome Back"
      subtitle="Sign in to your CareLink account"
      footer={
        <p className="text-center text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="text-sidebar-foreground hover:text-primary font-medium">
            Sign up
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-sidebar-foreground">Email Address</label>
          <input
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            className="mt-1 block w-full px-3 py-2 bg-sidebar-accent text-sidebar-foreground rounded-lg shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            disabled={loading}
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-sidebar-foreground">Password</label>
          <input
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className="mt-1 block w-full px-3 py-2 bg-sidebar-accent text-sidebar-foreground rounded-lg shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            disabled={loading}
          />
        </div>

        {/* Remember me + forgot password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 text-primary focus:ring-primary border-muted-foreground rounded"
              disabled={loading}
            />
            <label className="ml-2 block text-sm text-sidebar-foreground">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link 
              href="/forgot-password" 
              className="text-primary hover:text-primary/80"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 rounded-lg bg-primary text-white font-medium shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthCard>
  );
}