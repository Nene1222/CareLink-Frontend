// hooks/use-logout.ts
"use client";

import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';

export function useLogout() {
  const router = useRouter();
  const { toast } = useToast();

  const logout = async () => {
    try {
      // Call logout API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Show success message
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
        variant: "default",
      });

      // Redirect to login page
      router.push('/login');

    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Failed",
        description: "There was an error logging out",
        variant: "destructive",
      });
    }
  };

  return { logout };
}