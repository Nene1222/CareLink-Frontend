// app/staff/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Mail, 
  Phone, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  UserPlus,
  Loader2,
  X,
  Eye,
  EyeOff,
  User,
  Filter,
  Stethoscope,
  ArrowRight
} from "lucide-react"
import axiosClient from "@/lib/axiosClient"
import { useToast } from "@/hooks/use-toast"
import { debounce } from "lodash"

interface Staff {
  _id: string
  name: string
  role: string
  email: string
  phoneNumber: string
  specialization: string
  status: "active" | "inactive"
  user?: {
    _id: string
    username: string
    email: string
    role: string
    isActive: boolean
    isVerified: boolean
    contactNumber: string
  }
  createdAt: string
  updatedAt: string
}

interface Role {
  _id: string
  name: string
  description: string
  userCount: number
}

export default function StaffPage() {
  const router = useRouter()
  const [staff, setStaff] = useState<Staff[]>([])
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    email: "",
    phoneNumber: "",
    specialization: "",
    status: "active" as "active" | "inactive",
    createUser: true,
    username: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const { toast } = useToast()

  // Fetch staff and roles on mount
  useEffect(() => {
    fetchStaff()
    fetchRoles()
  }, [])

  // Apply filters whenever staff, searchQuery, statusFilter, or roleFilter changes
  useEffect(() => {
    applyFilters()
  }, [staff, searchQuery, statusFilter, roleFilter])

  const applyFilters = () => {
    let result = [...staff]

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter)
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter(s => s.role === roleFilter)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        s.role.toLowerCase().includes(query) ||
        s.specialization?.toLowerCase().includes(query) ||
        s.phoneNumber?.toLowerCase().includes(query) ||
        s.user?.username?.toLowerCase().includes(query) ||
        s.user?.email?.toLowerCase().includes(query)
      )
    }

    setFilteredStaff(result)
  }

  const fetchStaff = async () => {
    try {
      setFetching(true)
      const response = await axiosClient.get('/staff')
      
      if (response.data.success) {
        setStaff(response.data.data)
      }
    } catch (error: any) {
      console.error("Error fetching staff:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to fetch staff",
        variant: "destructive"
      })
    } finally {
      setFetching(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await axiosClient.get('/staff/roles')
      if (response.data.success) {
        setRoles(response.data.data)
      }
    } catch (error: any) {
      console.error("Error fetching roles:", error)
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive"
      })
    }
  }

  const handleSaveStaff = async () => {
    // Validation
    if (!formData.name || !formData.email || !formData.role) {
      toast({
        title: "Validation Error",
        description: "Name, email, and role are required",
        variant: "destructive"
      })
      return
    }

    // For new staff, require username and password
    if (!selectedStaff) {
      if (!formData.username || !formData.password || !formData.confirmPassword) {
        toast({
          title: "Validation Error",
          description: "Username and password are required",
          variant: "destructive"
        })
        return
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Validation Error",
          description: "Passwords do not match",
          variant: "destructive"
        })
        return
      }

      if (formData.password.length < 6) {
        toast({
          title: "Validation Error",
          description: "Password must be at least 6 characters long",
          variant: "destructive"
        })
        return
      }
    } else {
      // For updates, only validate password if provided
      if (formData.password && formData.password.length > 0) {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Validation Error",
            description: "Passwords do not match",
            variant: "destructive"
          })
          return
        }

        if (formData.password.length < 6) {
          toast({
            title: "Validation Error",
            description: "Password must be at least 6 characters long",
            variant: "destructive"
          })
          return
        }
      }
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        createUser: true
      }

      // If password is empty on update, remove it from payload
      if (selectedStaff && !formData.password) {
        delete payload.password
        delete payload.confirmPassword
      }

      if (selectedStaff) {
        // Update existing staff
        const response = await axiosClient.put(`/staff/${selectedStaff._id}`, payload)
        
        if (response.data.success) {
          setStaff(staff.map(s => 
            s._id === selectedStaff._id ? response.data.data : s
          ))
          toast({
            title: "Success",
            description: "Staff updated successfully",
            variant: "default"
          })
        }
      } else {
        // Add new staff
        const response = await axiosClient.post('/staff', payload)
        
        if (response.data.success) {
          setStaff([...staff, response.data.data])
          toast({
            title: "Success",
            description: "Staff created successfully",
            variant: "default"
          })
        }
      }
      
      resetForm()
      setIsDialogOpen(false)
      
    } catch (error: any) {
      console.error("Error saving staff:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save staff",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staff member? This action cannot be undone.")) {
      return
    }

    try {
      const response = await axiosClient.delete(`/staff/${id}`)
      
      if (response.data.success) {
        setStaff(staff.filter(s => s._id !== id))
        toast({
          title: "Success",
          description: "Staff deleted successfully",
          variant: "default"
        })
      }
    } catch (error: any) {
      console.error("Error deleting staff:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete staff",
        variant: "destructive"
      })
    }
  }

  const openEditDialog = (member: Staff) => {
    setSelectedStaff(member)
    setFormData({
      name: member.name,
      role: member.role,
      email: member.email,
      phoneNumber: member.phoneNumber || "",
      specialization: member.specialization || "",
      status: member.status,
      createUser: true,
      username: member.user?.username || member.email.split('@')[0] || "",
      password: "",
      confirmPassword: "",
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setSelectedStaff(null)
    setFormData({
      name: "",
      role: "",
      email: "",
      phoneNumber: "",
      specialization: "",
      status: "active",
      createUser: true,
      username: "",
      password: "",
      confirmPassword: "",
    })
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleSearch = useCallback(
    debounce(() => {
      applyFilters()
    }, 300),
    []
  )

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setRoleFilter("all")
  }

  const generateUsernameFromEmail = (email: string) => {
    return email.split('@')[0] || ""
  }

  const handleEmailChange = (email: string) => {
    const newFormData = { ...formData, email }
    
    // Auto-generate username from email if username is empty and it's a new staff
    if (!selectedStaff && !formData.username && email) {
      newFormData.username = generateUsernameFromEmail(email)
    }
    
    setFormData(newFormData)
  }

  const handleNavigateToDoctorPage = () => {
    if (selectedStaff && selectedStaff.role.toLowerCase() === "doctor") {
      // Navigate to doctors page with the selected doctor's ID
      router.push(`/doctors?edit=${selectedStaff._id}`)
      setIsDialogOpen(false)
    }
  }

  const stats = {
    total: staff.length,
    active: staff.filter((s) => s.status === "active").length,
    hasAccount: staff.filter((s) => s.user).length,
    doctors: staff.filter((s) => s.role.toLowerCase() === "doctor").length
  }

  // Get unique roles from staff for filtering
  const getUniqueRolesFromStaff = () => {
    const roleSet = new Set(staff.map(s => s.role).filter(Boolean))
    return Array.from(roleSet).sort()
  }

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Staff Management" subtitle="View and manage clinic staff members" />
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">With User Account</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.hasAccount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Doctors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.doctors}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Staff Directory</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Showing {filteredStaff.length} of {staff.length} staff members
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Role Filter */}
              <div className="hidden sm:block">
                <Select 
                  value={roleFilter} 
                  onValueChange={(value) => {
                    setRoleFilter(value)
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {getUniqueRolesFromStaff().map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                    {/* Also include roles from the roles API that might not have staff yet */}
                    {roles
                      .filter(role => !getUniqueRolesFromStaff().includes(role.name))
                      .map((role) => (
                        <SelectItem key={role._id} value={role.name}>
                          {role.name} (0)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                  setIsDialogOpen(open)
                  if (!open) resetForm()
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      resetForm()
                      setIsDialogOpen(true)
                    }}
                    className="bg-[#5B6EF5] hover:bg-[#4A5DE4]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedStaff ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
                    <DialogDescription>
                      {selectedStaff
                        ? "Update staff member information"
                        : "Fill in the details to add a new staff member"}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    {/* Doctor-specific banner for edit mode */}
                    {selectedStaff && selectedStaff.role.toLowerCase() === "doctor" && (
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-full">
                            <Stethoscope className="h-6 w-6 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-purple-800">Doctor Detected</h4>
                            <p className="text-sm text-purple-600">
                              This staff member is a doctor. For detailed doctor-specific settings like consultation fees, 
                              schedules, availability, and more, use the dedicated doctor management page.
                            </p>
                          </div>
                          <Button
                            onClick={handleNavigateToDoctorPage}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Go to Doctor Page
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-medium mb-4">Staff Information</h3>
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Enter full name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleEmailChange(e.target.value)}
                              placeholder="email@clinic.com"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="role">Role *</Label>
                            <Select
                              value={formData.role}
                              onValueChange={(value) => setFormData({ ...formData, role: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                {roles.map((role) => (
                                  <SelectItem key={role._id} value={role.name}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{role.name}</span>
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        {role.userCount}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="specialization">Specialization/Department</Label>
                            <Input
                              id="specialization"
                              value={formData.specialization}
                              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                              placeholder="e.g., Cardiology, Nursing"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              value={formData.phoneNumber}
                              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                              placeholder="+1-555-0000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                              value={formData.status}
                              onValueChange={(value: "active" | "inactive") => 
                                setFormData({ ...formData, status: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <User className="h-5 w-5" />
                        <h3 className="text-lg font-medium">User Account</h3>
                        <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
                          Required
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4">
                        Staff members are also system users. Please provide login credentials.
                      </p>

                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="username">Username *</Label>
                          <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="Enter username"
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            This will be used for logging into the system
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="password">
                              {selectedStaff ? "New Password (Optional)" : "Password *"}
                            </Label>
                            <div className="relative">
                              <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder={selectedStaff ? "Enter password" : "Enter password"}
                                required={!selectedStaff}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                                <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                              </Button>
                            </div>
                            {!selectedStaff && (
                              <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
                            )}
                            {selectedStaff && (
                              <p className="text-xs text-muted-foreground">Leave blank to keep current password</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                              {selectedStaff ? "Confirm New Password" : "Confirm Password *"}
                            </Label>
                            <div className="relative">
                              <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                placeholder={selectedStaff ? "Confirm new password" : "Confirm password"}
                                required={!selectedStaff}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                                <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                              </Button>
                            </div>
                          </div>
                        </div>

                        {selectedStaff?.user && (
                          <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-600" />
                              <h4 className="text-sm font-medium text-blue-800">Existing User Account</h4>
                            </div>
                            <div className="mt-2 text-sm text-blue-700 space-y-1">
                              <p>Username: {selectedStaff.user.username}</p>
                              <p>Status: {selectedStaff.user.isActive ? "Active" : "Inactive"}</p>
                              <p>Verified: {selectedStaff.user.isVerified ? "Yes" : "No"}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveStaff} 
                      className="flex-1 bg-[#5B6EF5] hover:bg-[#4A5DE4]"
                      disabled={loading}
                    >
                      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {selectedStaff ? "Update Staff" : "Add Staff"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, role, or phone..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    handleSearch()
                  }}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {/* Mobile Role Filter */}
                <div className="sm:hidden">
                  <Select 
                    value={roleFilter} 
                    onValueChange={(value) => {
                      setRoleFilter(value)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {getUniqueRolesFromStaff().map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Select 
                  value={statusFilter} 
                  onValueChange={(value: "all" | "active" | "inactive") => {
                    setStatusFilter(value)
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={fetchStaff}
                  variant="outline"
                  size="icon"
                  title="Refresh"
                >
                  <Loader2 className="h-4 w-4" />
                </Button>
                {(searchQuery || statusFilter !== 'all' || roleFilter !== 'all') && (
                  <Button 
                    onClick={clearFilters}
                    variant="outline"
                    size="icon"
                    title="Clear filters"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {(statusFilter !== 'all' || roleFilter !== 'all') && (
              <div className="flex flex-wrap gap-2 mb-4">
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Status: {statusFilter}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setStatusFilter('all')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {roleFilter !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Role: {roleFilter}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setRoleFilter('all')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
            )}

            {/* Staff List */}
            {fetching ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading staff...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStaff.map((member) => (
                  <div
                    key={member._id}
                    className="flex flex-col sm:flex-row sm:items-start justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{member.name}</h3>
                            <Badge variant={member.status === "active" ? "default" : "secondary"} className="text-xs">
                              {member.status}
                            </Badge>
                            {member.role.toLowerCase() === "doctor" && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                <Stethoscope className="h-3 w-3 mr-1" />
                                Doctor
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                          {member.specialization && (
                            <p className="text-sm text-muted-foreground">{member.specialization}</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground ml-13">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {member.email}
                        </div>
                        {member.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {member.phoneNumber}
                          </div>
                        )}
                        {member.user && (
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              User: {member.user.username}
                            </Badge>
                            <Badge 
                              variant={member.user.isActive ? "default" : "secondary"} 
                              className="text-xs"
                            >
                              {member.user.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {member.user.isVerified && (
                              <Badge variant="outline" className="text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 sm:mt-0">
                      {!member.user && (
                        <Badge 
                          variant="destructive" 
                          className="text-xs"
                        >
                          No User Account
                        </Badge>
                      )}
                      {member.role.toLowerCase() === "doctor" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
                          onClick={() => {
                            setSelectedStaff(member)
                            setIsDialogOpen(true)
                          }}
                          title="Edit Doctor"
                        >
                          <Stethoscope className="h-3 w-3" />
                          <span className="sr-only sm:not-sr-only sm:ml-2">Manage Doctor</span>
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openEditDialog(member)}
                      >
                        <Edit2 className="h-3 w-3" />
                        <span className="sr-only sm:not-sr-only sm:ml-2">Edit</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDeleteStaff(member._id)}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="sr-only sm:not-sr-only sm:ml-2">Delete</span>
                      </Button>
                    </div>
                  </div>
                ))}
                
                {filteredStaff.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No staff members found</p>
                    <p className="text-sm mt-2">
                      {searchQuery || statusFilter !== 'all' || roleFilter !== 'all' 
                        ? "Try clearing filters or using different search terms" 
                        : "Click 'Add Staff' to get started"}
                    </p>
                    {(searchQuery || statusFilter !== 'all' || roleFilter !== 'all') && (
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={clearFilters}
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}