// hooks/usePermissions.ts - FIXED
"use client"

import { useState, useEffect } from "react";

interface PermissionModule {
  module: string;
  permissions: string[];
}

interface PermissionsResponse {
  role: string;
  hasAllAccess: boolean;
  permissions: PermissionModule[];
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load permissions from localStorage on mount - CLIENT SIDE ONLY
  useEffect(() => {
    const stored = localStorage.getItem("user_permissions");
    if (stored) {
      try {
        setPermissions(JSON.parse(stored));
      } catch (err) {
        console.error("Error parsing stored permissions:", err);
      }
    }
    setLoading(false);
  }, []);

  // Rest of your functions remain the same...
  const fetchPermissions = async (role: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/permissions?role=${role}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch permissions");
      }
      
      setPermissions(data);
      // Store in localStorage
      localStorage.setItem("user_permissions", JSON.stringify(data));
      
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching permissions:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Check if user has a specific permission
  const hasPermission = (permissionId: string): boolean => {
    if (!permissions) return false;
    
    // Admin has all permissions
    if (permissions.hasAllAccess) return true;
    
    // Check if permission exists in any module
    return permissions.permissions.some(module => 
      module.permissions.includes(permissionId)
    );
  };

  // Check if user has access to a module
  const hasModuleAccess = (moduleName: string): boolean => {
    if (!permissions) return false;
    
    // Admin has access to all modules
    if (permissions.hasAllAccess) return true;
    
    return permissions.permissions.some(module => 
      module.module === moduleName
    );
  };

  // Get all permissions for a module
  const getModulePermissions = (moduleName: string): string[] => {
    if (!permissions) return [];
    
    const module = permissions.permissions.find(m => m.module === moduleName);
    return module ? module.permissions : [];
  };

  return {
    permissions,
    loading,
    error,
    fetchPermissions,
    hasPermission,
    hasModuleAccess,
    getModulePermissions
  };
}