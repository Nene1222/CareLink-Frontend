"use client"

import { useState, useEffect } from "react"
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
import { Mail, Phone, Calendar, Plus, Search, Edit2, Trash2, Loader2 } from "lucide-react"
import axiosClient from "@/lib/axiosClient"
import { toast } from "sonner" // or use your preferred toast library

interface Patient {
  id: string
  name: string
  email: string
  phone: string
  dob: string
  status: "active" | "inactive"
  lastVisit: string
}

interface PatientFormData {
  name: string
  email: string
  phone: string
  dob: string
  status: "active" | "inactive"
  address?: string
  gender?: "male" | "female" | "other" | "prefer-not-to-say"
  password?: string
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [formData, setFormData] = useState<PatientFormData>({
    name: "",
    email: "",
    phone: "",
    dob: "",
    status: "active",
    address: "",
    gender: "prefer-not-to-say",
  })

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients()
    fetchStats()
  }, [])

  // Fetch patients from API
  const fetchPatients = async () => {
    try {
      setLoading(true)
      const response = await axiosClient.get('/patients')
      if (response.data.success) {
        setPatients(response.data.patients)
      }
    } catch (error: any) {
      console.error('Error fetching patients:', error)
      toast.error(error.response?.data?.error || 'Failed to load patients')
    } finally {
      setLoading(false)
    }
  }

  // Fetch stats from API
  const fetchStats = async () => {
    try {
      const response = await axiosClient.get('/patients/stats')
      if (response.data.success) {
        setStats(response.data.stats)
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error)
    }
  }

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  })

  // Filter patients locally
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.includes(searchQuery)
    const matchesStatus = statusFilter === "all" || patient.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleSavePatient = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error("Name is required")
      return
    }
    if (!formData.email.trim()) {
      toast.error("Email is required")
      return
    }
    if (!formData.phone.trim()) {
      toast.error("Phone number is required")
      return
    }
    if (!formData.dob) {
      toast.error("Date of birth is required")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address")
      return
    }

    setSaving(true)
    try {
      if (selectedPatient) {
        // Edit existing patient
        const response = await axiosClient.put(`/patients/${selectedPatient.id}`, {
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phone,
          dateOfBirth: formData.dob,
          status: formData.status,
          address: formData.address,
          gender: formData.gender
        })
        
        if (response.data.success) {
          // Update local state
          setPatients(patients.map(p => 
            p.id === selectedPatient.id ? response.data.patient : p
          ))
          toast.success("Patient updated successfully")
        }
      } else {
        // Add new patient
        const response = await axiosClient.post('/patients', {
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phone,
          dateOfBirth: formData.dob,
          status: formData.status,
          address: formData.address,
          gender: formData.gender,
          // Optional: Generate a random password or let admin set one
          password: formData.password || `Patient@${Date.now().toString().slice(-6)}`
        })
        
        if (response.data.success) {
          // Add to local state
          setPatients([...patients, response.data.patient])
          toast.success("Patient created successfully")
          
          // Refresh stats
          fetchStats()
        }
      }
      resetForm()
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error('Error saving patient:', error)
      toast.error(error.response?.data?.error || 'Failed to save patient')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePatient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) return

    setDeletingId(id)
    try {
      const response = await axiosClient.delete(`/patients/${id}`)
      if (response.data.success) {
        // Remove from local state
        setPatients(patients.filter(p => p.id !== id))
        toast.success("Patient deleted successfully")
        
        // Refresh stats
        fetchStats()
      }
    } catch (error: any) {
      console.error('Error deleting patient:', error)
      toast.error(error.response?.data?.error || 'Failed to delete patient')
    } finally {
      setDeletingId(null)
    }
  }

  const openEditDialog = (patient: Patient) => {
    setSelectedPatient(patient)
    setFormData({
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      dob: patient.dob,
      status: patient.status,
      address: "",
      gender: "prefer-not-to-say"
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setSelectedPatient(null)
    setFormData({
      name: "",
      email: "",
      phone: "",
      dob: "",
      status: "active",
      address: "",
      gender: "prefer-not-to-say"
    })
  }

  // Handle search with debounce (optional)
  useEffect(() => {
    const timer = setTimeout(() => {
      // You can implement server-side search here if needed
      // fetchPatientsWithSearch(searchQuery, statusFilter)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, statusFilter])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#5B6EF5]" />
          <p className="text-muted-foreground">Loading patients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Patient Management" subtitle="View and manage patient records" />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactive Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Patient Directory</CardTitle>
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
                  Register Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{selectedPatient ? "Edit Patient" : "Register New Patient"}</DialogTitle>
                  <DialogDescription>
                    {selectedPatient ? "Update patient information" : "Fill in the details to register a new patient"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="p-name">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="p-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="p-email">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="p-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="p-phone">
                        Phone <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="p-phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1-555-0000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="p-dob">
                        Date of Birth <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="p-dob"
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="p-address">Address</Label>
                      <Input
                        id="p-address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Enter address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="p-gender">Gender</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value: any) => setFormData({ ...formData, gender: value })}
                      >
                        <SelectTrigger>
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
                  {!selectedPatient && (
                    <div className="space-y-2">
                      <Label htmlFor="p-password">Initial Password (Optional)</Label>
                      <Input
                        id="p-password"
                        type="password"
                        value={formData.password || ""}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Leave empty for auto-generated password"
                      />
                      <p className="text-xs text-muted-foreground">
                        If left empty, a random password will be generated
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="p-status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
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
                  <Button 
                    onClick={handleSavePatient} 
                    className="w-full bg-[#5B6EF5] hover:bg-[#4A5DE4]"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {selectedPatient ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      `${selectedPatient ? "Update" : "Register"} Patient`
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex flex-col sm:flex-row sm:items-start justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{patient.name}</h3>
                          <p className="text-xs text-muted-foreground">ID: {patient.id}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground ml-13">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {patient.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {patient.phone || "No phone number"}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          DOB: {new Date(patient.dob).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 mt-4 sm:mt-0">
                      <div className="text-right">
                        <Badge variant={patient.status === "active" ? "default" : "secondary"}>
                          {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-2">
                          Last visit: {new Date(patient.lastVisit).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openEditDialog(patient)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDeletePatient(patient.id)}
                          disabled={deletingId === patient.id}
                        >
                          {deletingId === patient.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No patients found</p>
                  {searchQuery && (
                    <p className="text-sm mt-2">
                      No results for "{searchQuery}"
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {/* Pagination (optional) */}
            {filteredPatients.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredPatients.length} of {patients.length} patients
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}