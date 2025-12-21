// (auth)/layout.tsx
import { ReactNode } from "react";
import type { Metadata } from "next";
import { ImageSlideshow } from "@/components/ui/ImageSlideshow";
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";

// ❗ Do NOT import globals.css here (should be only in root layout)

export const metadata: Metadata = {
  title: "CareLink - Clinic Management",
  description: "Comprehensive clinic management system for appointments, attendance, and inventory",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function AuthRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex">
        {/* Left Section */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <ImageSlideshow />
        </div>

        {/* Right Section */}
        <div className="flex-1 flex flex-col justify-center bg-white">
          <div className="mx-auto w-full max-w-sm lg:max-w-md xl:max-w-lg">
            {children}
          </div>
          <Toaster />
        </div>
      </body>
    </html>
  );
}
