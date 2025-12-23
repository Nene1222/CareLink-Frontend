// app/(auth)/register/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/ui/AuthCard";
import axiosClient from "@/lib/axiosClient";
import { Calendar } from "@/components/ui/calendar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    phoneNumber: "",
    address: "",
    gender: "prefer-not-to-say",
    agreeToTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<Date>();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      setFormData(prev => ({
        ...prev,
        dateOfBirth: selectedDate.toISOString().split('T')[0],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Simple client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    // Validate date of birth
    if (!formData.dateOfBirth) {
      setError("Date of birth is required");
      return;
    }

    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 0 || age > 120) {
      setError("Please enter a valid date of birth");
      return;
    }

    if (!formData.agreeToTerms) {
      setError("You must agree to the terms and privacy policy");
      return;
    }

    setLoading(true);
    try {
      // Call your API to register
      const response = await axiosClient.post("/auth/register", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        dateOfBirth: formData.dateOfBirth,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        gender: formData.gender,
      });

      console.log("Registration successful:", response.data);

      // Redirect to OTP verification page with email
      if (response.data.success) {
        router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create Patient Account"
      subtitle="Join CareLink and manage your healthcare journey"
      footer={
        <p className="text-center text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-sidebar-foreground hover:text-sidebar-primary font-medium">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-1">
              First Name *
            </label>
            <input
              name="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First name"
              className="w-full px-3 py-2 bg-sidebar-accent text-sidebar-foreground rounded-lg shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-1">
              Last Name *
            </label>
            <input
              name="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last name"
              className="w-full px-3 py-2 bg-sidebar-accent text-sidebar-foreground rounded-lg shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-sidebar-foreground mb-1">
            Email Address *
          </label>
          <input
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            className="w-full px-3 py-2 bg-sidebar-accent text-sidebar-foreground rounded-lg shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-1">
              Date of Birth *
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-sidebar-accent",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <input
              type="hidden"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-1">
              Gender
            </label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleSelectChange("gender", value)}
            >
              <SelectTrigger className="w-full bg-sidebar-accent">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-sidebar-foreground mb-1">
            Phone Number
          </label>
          <input
            name="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="Enter phone number"
            className="w-full px-3 py-2 bg-sidebar-accent text-sidebar-foreground rounded-lg shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-sidebar-foreground mb-1">
            Address
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter your address"
            rows={2}
            className="w-full px-3 py-2 bg-sidebar-accent text-sidebar-foreground rounded-lg shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-sidebar-foreground mb-1">
            Password *
          </label>
          <input
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password"
            className="w-full px-3 py-2 bg-sidebar-accent text-sidebar-foreground rounded-lg shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Must be at least 8 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-sidebar-foreground mb-1">
            Confirm Password *
          </label>
          <input
            name="confirmPassword"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            className="w-full px-3 py-2 bg-sidebar-accent text-sidebar-foreground rounded-lg shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>

        <div className="flex items-start">
          <input
            name="agreeToTerms"
            type="checkbox"
            required
            checked={formData.agreeToTerms}
            onChange={handleChange}
            className="h-4 w-4 text-primary focus:ring-primary border-muted-foreground rounded mt-1"
          />
          <label className="ml-2 block text-sm text-sidebar-foreground">
            I agree to the{" "}
            <Link href="/terms" className="text-primary hover:text-primary/80">Terms and Conditions</Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:text-primary/80">Privacy Policy</Link>
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 rounded-lg bg-primary text-white font-medium shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Account...
            </>
          ) : "Create Patient Account"}
        </button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            By creating an account, you'll receive a unique patient code (e.g., P001) for easy identification.
          </p>
        </div>
      </form>
    </AuthCard>
  );
}