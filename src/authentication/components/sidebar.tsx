"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  BarChart3,
  Menu,
  X,
  Stethoscope,
  Clock,
  FileText,
  Settings,
} from "lucide-react"

// Define all possible nav items with their required module
const allNavItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, module: "Dashboard" },
  { label: "Appointments", href: "/appointments", icon: Calendar, module: "Appointments" },
  { label: "Attendance", href: "/attendance", icon: Clock, module: "Attendance" },
  { label: "Inventory", href: "/inventory", icon: Package, module: "Inventory" },
  { label: "Staff", href: "/staff", icon: Users, module: "Staff" },
  { label: "Patients", href: "/patients", icon: Stethoscope, module: "Patients" },
  { label: "Medical Records", href: "/medical-records", icon: FileText, module: "Medical Records" },
  { label: "Reports", href: "/reports", icon: BarChart3, module: "Reports" },
  { label: "Roles & Permissions", href: "/roles", icon: Settings, module: "Roles & Permissions" },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredNavItems, setFilteredNavItems] = useState(allNavItems)
  const [userRole, setUserRole] = useState<string>("Unknown")
  const pathname = usePathname()

  useEffect(() => {
    const filterNavItems = () => {
      try {
        // Get role from localStorage - CLIENT SIDE ONLY
        const storedUserRole = localStorage.getItem("user_role") || ""
        setUserRole(storedUserRole || "Unknown")
        
        console.log("User role from localStorage:", storedUserRole)
        
        // Get permissions from localStorage
        const permissionsData = localStorage.getItem("user_permissions")
        console.log("Permissions data from localStorage:", permissionsData)
        
        if (!storedUserRole) {
          console.log("No user role found, showing basic items")
          // Default: show only dashboard and appointments
          const defaultItems = allNavItems.filter(item => 
            item.href === "/" || item.href === "/appointments"
          )
          setFilteredNavItems(defaultItems)
          return
        }

        // Admin sees everything
        if (storedUserRole === "admin") {
          console.log("Admin user, showing all items")
          setFilteredNavItems(allNavItems)
          return
        }

        if (!permissionsData) {
          console.log("No permissions data found")
          // For non-admin without permissions, show only dashboard and appointments
          const defaultItems = allNavItems.filter(item => 
            item.href === "/" || item.href === "/appointments"
          )
          setFilteredNavItems(defaultItems)
          return
        }

        try {
          const parsedData = JSON.parse(permissionsData)
          console.log("Parsed permissions data:", parsedData)
          
          // Check if we have the correct structure
          if (!parsedData.permissions || !Array.isArray(parsedData.permissions)) {
            console.log("Invalid permissions structure")
            const defaultItems = allNavItems.filter(item => 
              item.href === "/" || item.href === "/appointments"
            )
            setFilteredNavItems(defaultItems)
            return
          }

          // Filter items based on module access
          const filtered = allNavItems.filter(item => {
            // Check if this module exists in user's permissions
            const hasModule = parsedData.permissions.some((perm: any) => 
              perm.module === item.module
            )
            
            console.log(`Checking module ${item.module}: ${hasModule ? "ACCESS GRANTED" : "NO ACCESS"}`)
            return hasModule
          })

          console.log("Filtered nav items:", filtered)
          setFilteredNavItems(filtered)
          
        } catch (parseError) {
          console.error("Error parsing permissions data:", parseError)
          const defaultItems = allNavItems.filter(item => 
            item.href === "/" || item.href === "/appointments"
          )
          setFilteredNavItems(defaultItems)
        }
        
      } catch (error) {
        console.error("Error filtering nav items:", error)
        // Fallback to basic items
        const defaultItems = allNavItems.filter(item => 
          item.href === "/" || item.href === "/appointments"
        )
        setFilteredNavItems(defaultItems)
      }
    }

    filterNavItems()
    
    // Listen for storage changes (if user logs in another tab)
    const handleStorageChange = () => {
      filterNavItems()
    }
    
    window.addEventListener("storage", handleStorageChange)
    
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-40"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={`w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } fixed md:relative h-full z-30 flex flex-col`}
      >
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-sidebar-foreground">CareLink</h1>
              <p className="text-xs text-muted-foreground">Clinic Manager</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/50">
          <div className="text-xs text-muted-foreground text-center">
            <p>CareLink v1.0</p>
            <p className="mt-1">
              Role: {userRole}
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 md:hidden z-20" onClick={() => setIsOpen(false)} />}
    </>
  )
}