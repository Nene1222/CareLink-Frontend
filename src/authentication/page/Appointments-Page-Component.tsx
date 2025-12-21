// app/dashboard/appointments/components/appointments-page-component.tsx
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
import { Textarea } from "@/components/ui/textarea"
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Plus,
  Search,
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Stethoscope,
  Phone,
  Mail,
  Trash2,
  Edit,
  X,
  CheckCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import axiosClient from "@/lib/axiosClient"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

interface Appointment {
  _id: string
  patientId: string
  patientName: string
  staffId: string
  doctorName: string
  specialization: string
  date: string
  time: string
  room: string
  reason: string
  notes?: string
  status: "scheduled" | "completed" | "cancelled" | "no-show"
  createdAt: string
  updatedAt: string
  doctorEmail?: string
  doctorPhone?: string
}

interface Doctor {
  _id: string
  doctorCode: string
  specialization: string
  consultationFee: number
  rating: number
  totalPatients: number
  staff?: {
    _id: string
    name: string
    email: string
    phoneNumber: string
    specialization: string
  }
  user?: {
    _id: string
    username: string
    email: string
    role: string
    isActive: boolean
    isVerified: boolean
  }
  isAvailable?: boolean
  availableDays?: string[]
  availableHours?: {
    start: string
    end: string
  }
}

interface Patient {
  _id: string
  id: string
  name: string
  email: string
  phone: string
  dob: string
  gender: string
  address?: string
  emergencyContact?: object
  medicalHistory: any[]
  lastVisit?: string
  status: "active" | "inactive"
  userId: string
}

interface AppointmentStats {
  total: number
  today: number
  upcoming: number
  byStatus: {
    scheduled: number
    completed: number
    cancelled: number
    "no-show": number
  }
}

// Mock fallback data
const mockFallbackDoctors = [
  {
    _id: "doc-1",
    doctorCode: "DOC001",
    specialization: "Cardiology",
    consultationFee: 150,
    rating: 4.8,
    totalPatients: 120,
    staff: {
      _id: "staff-1",
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@hospital.com",
      phoneNumber: "+1-555-0101",
      specialization: "Cardiology"
    },
    isAvailable: true,
    availableDays: ["Monday", "Wednesday", "Friday"],
    availableHours: {
      start: "09:00",
      end: "17:00"
    }
  },
  {
    _id: "doc-2",
    doctorCode: "DOC002",
    specialization: "Dermatology",
    consultationFee: 120,
    rating: 4.6,
    totalPatients: 85,
    staff: {
      _id: "staff-2",
      name: "Dr. Michael Chen",
      email: "michael.chen@hospital.com",
      phoneNumber: "+1-555-0102",
      specialization: "Dermatology"
    },
    isAvailable: true,
    availableDays: ["Tuesday", "Thursday", "Saturday"],
    availableHours: {
      start: "10:00",
      end: "18:00"
    }
  }
]

const mockFallbackPatients = [
  {
    _id: "patient-1",
    id: "PAT001",
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "+1-555-0201",
    dob: "1985-03-15",
    gender: "Male",
    address: "123 Main St, New York, NY",
    status: "active",
    userId: "user-100"
  },
  {
    _id: "patient-2",
    id: "PAT002",
    name: "Maria Garcia",
    email: "maria.garcia@email.com",
    phone: "+1-555-0203",
    dob: "1990-07-22",
    gender: "Female",
    address: "456 Oak Ave, Los Angeles, CA",
    status: "active",
    userId: "user-101"
  }
]

const mockFallbackAppointments = [
  {
    _id: "appt-1",
    patientId: "PAT001",
    patientName: "John Smith",
    staffId: "staff-1",
    doctorName: "Dr. Sarah Johnson",
    specialization: "Cardiology",
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: "10:00 AM",
    room: "Room 101",
    reason: "Regular heart checkup",
    notes: "Patient has history of hypertension",
    status: "scheduled",
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-01-10T09:00:00Z"
  }
]

const rooms = ["Room 101", "Room 102", "Room 203", "Room 105", "Room 204"]
const timeSlots = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
]

export default function AppointmentsPageComponent() {
  const { toast } = useToast()
  
  const [isMounted, setIsMounted] = useState(false)
  
  const [appointments, setAppointments] = useState<Appointment[]>(mockFallbackAppointments)
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>(mockFallbackAppointments)
  const [doctors, setDoctors] = useState<Doctor[]>(mockFallbackDoctors)
  const [patients, setPatients] = useState<Patient[]>(mockFallbackPatients)
  const [stats, setStats] = useState<AppointmentStats>({
    total: 1,
    today: 0,
    upcoming: 1,
    byStatus: {
      scheduled: 1,
      completed: 0,
      cancelled: 0,
      "no-show": 0
    }
  })
  
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    doctorId: "",
    staffId: "",
    doctorName: "",
    specialization: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
    room: "",
    reason: "",
    notes: "",
  })

  useEffect(() => {
    setIsMounted(true)
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredAppointments(appointments)
    } else {
      const filtered = appointments.filter((apt) => {
        const searchLower = searchQuery.toLowerCase()
        return (
          (apt.patientName?.toLowerCase() || "").includes(searchLower) ||
          (apt.doctorName?.toLowerCase() || "").includes(searchLower) ||
          (apt.patientId?.toLowerCase() || "").includes(searchLower) ||
          (apt.reason?.toLowerCase() || "").includes(searchLower)
        )
      })
      setFilteredAppointments(filtered)
    }
  }, [searchQuery, appointments])

  useEffect(() => {
    if (isMounted && viewMode === "calendar") {
      fetchCalendarAppointments()
    }
  }, [isMounted, selectedDate, viewMode])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      await Promise.all([
        fetchAppointments(),
        fetchStats(),
        fetchDoctors(),
        fetchPatients()
      ])
      
    } catch (error) {
      console.error("Error fetching initial data:", error)
      setError("Failed to load data. Using demo data.")
      toast({
        title: "Info",
        description: "Using demo data. API connection failed.",
        variant: "default",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchDoctors = async () => {
    try {
      const response = await axiosClient.get("/doctors")
      
      if (response.data?.success) {
        const doctorsData = response.data.data || response.data.doctors || []
        // Ensure doctors have required structure
        const validatedDoctors = doctorsData.map((doctor: any) => ({
          ...doctor,
          staff: doctor.staff || { 
            _id: doctor._id || "staff-unknown",
            name: doctor.name || "Unknown Doctor",
            email: doctor.email || "",
            phoneNumber: doctor.phoneNumber || "",
            specialization: doctor.specialization || "General"
          }
        }))
        setDoctors(validatedDoctors.length > 0 ? validatedDoctors : mockFallbackDoctors)
      } else {
        setDoctors(mockFallbackDoctors)
      }
    } catch (error: any) {
      console.error("Error fetching doctors:", error)
      setDoctors(mockFallbackDoctors)
    }
  }

  const fetchPatients = async () => {
    try {
      const response = await axiosClient.get("/patients")
      
      if (response.data?.success) {
        const patientsData = response.data.patients || response.data.data || []
        setPatients(patientsData.length > 0 ? patientsData : mockFallbackPatients)
      } else {
        setPatients(mockFallbackPatients)
      }
    } catch (error: any) {
      console.error("Error fetching patients:", error)
      setPatients(mockFallbackPatients)
    }
  }

  const fetchAppointments = async () => {
    try {
      const response = await axiosClient.get("/appointments")
      
      if (response.data?.success) {
        const appointmentsData = response.data.data || response.data.appointments || []
        setAppointments(appointmentsData.length > 0 ? appointmentsData : mockFallbackAppointments)
        setFilteredAppointments(appointmentsData.length > 0 ? appointmentsData : mockFallbackAppointments)
      } else {
        setAppointments(mockFallbackAppointments)
        setFilteredAppointments(mockFallbackAppointments)
      }
    } catch (error: any) {
      console.error("Error fetching appointments:", error)
      setAppointments(mockFallbackAppointments)
      setFilteredAppointments(mockFallbackAppointments)
    }
  }

  const fetchCalendarAppointments = async () => {
    try {
      setCalendarLoading(true)
      const dateStr = selectedDate.toISOString().split("T")[0]
      
      const response = await axiosClient.get("/appointments", {
        params: { date: dateStr }
      })
      
      if (response.data?.success) {
        const appointmentsData = response.data.data || response.data.appointments || []
        setAppointments(appointmentsData)
        setFilteredAppointments(appointmentsData)
      } else {
        setAppointments([])
        setFilteredAppointments([])
      }
    } catch (error: any) {
      console.error("Error fetching calendar appointments:", error)
      setAppointments([])
      setFilteredAppointments([])
    } finally {
      setCalendarLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await axiosClient.get("/appointments/stats")
      
      if (response.data?.success) {
        setStats(response.data.data || response.data.stats || {
          total: 1,
          today: 0,
          upcoming: 1,
          byStatus: { scheduled: 1, completed: 0, cancelled: 0, "no-show": 0 }
        })
      } else {
        setStats({
          total: 1,
          today: 0,
          upcoming: 1,
          byStatus: { scheduled: 1, completed: 0, cancelled: 0, "no-show": 0 }
        })
      }
    } catch (error: any) {
      console.error("Error fetching stats:", error)
      setStats({
        total: 1,
        today: 0,
        upcoming: 1,
        byStatus: { scheduled: 1, completed: 0, cancelled: 0, "no-show": 0 }
      })
    }
  }

  const getAppointmentForSlot = (room: string, time: string, date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return appointments.find((apt) => apt.room === room && apt.time === time && apt.date === dateStr)
  }

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const openBookingDialog = (room: string, time: string) => {
    resetForm()
    setFormData((prev) => ({
      ...prev,
      room,
      time,
      date: selectedDate.toISOString().split("T")[0],
    }))
    setIsDialogOpen(true)
  }

  const handleCreateAppointment = async () => {
    try {
      setFormLoading(true)
      
      if (!formData.staffId || !formData.date || !formData.time || !formData.room || !formData.reason || !formData.patientId) {
        toast({
          title: "Validation Error",
          description: "Please fill all required fields",
          variant: "destructive",
        })
        return
      }

      const appointmentData: any = {
        patientId: formData.patientId,
        patientName: formData.patientName,
        staffId: formData.staffId,
        doctorName: formData.doctorName,
        specialization: formData.specialization,
        date: formData.date,
        time: formData.time,
        room: formData.room,
        reason: formData.reason,
        notes: formData.notes || "",
        status: "scheduled"
      }

      // Use mock response in demo mode
      if (doctors === mockFallbackDoctors) {
        const newAppointment: Appointment = {
          _id: `appt-${Date.now()}`,
          ...appointmentData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        setAppointments([newAppointment, ...appointments])
        setFilteredAppointments([newAppointment, ...appointments])
        
        toast({
          title: "Success (Demo Mode)",
          description: "Appointment created successfully (demo)",
          variant: "default",
        })
      } else {
        const response = await axiosClient.post("/appointments", appointmentData)

        if (response.data?.success) {
          toast({
            title: "Success",
            description: "Appointment created successfully",
            variant: "default",
          })
          fetchAppointments()
          fetchStats()
        } else {
          toast({
            title: "Error",
            description: response.data?.error || "Failed to create appointment",
            variant: "destructive",
          })
        }
      }
      
      setIsDialogOpen(false)
      resetForm()
      
    } catch (error: any) {
      console.error("Error creating appointment:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create appointment",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      patientId: "",
      patientName: "",
      doctorId: "",
      staffId: "",
      doctorName: "",
      specialization: "",
      date: new Date().toISOString().split("T")[0],
      time: "",
      room: "",
      reason: "",
      notes: "",
    })
    setSelectedAppointment(null)
  }

  const openEditDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    
    const patient = patients.find(p => 
      p._id === appointment.patientId || 
      p.id === appointment.patientId
    )
    
    const doctor = doctors.find(d => d.staff?._id === appointment.staffId)
    
    setFormData({
      patientId: patient?._id || patient?.id || appointment.patientId,
      patientName: patient?.name || appointment.patientName || "Patient",
      doctorId: doctor?._id || "",
      staffId: appointment.staffId,
      doctorName: appointment.doctorName || "Doctor",
      specialization: appointment.specialization || "",
      date: appointment.date,
      time: appointment.time,
      room: appointment.room,
      reason: appointment.reason,
      notes: appointment.notes || "",
    })
    setIsDialogOpen(true)
  }

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return
    
    try {
      setFormLoading(true)
      
      if (!formData.staffId || !formData.date || !formData.time || !formData.room || !formData.reason || !formData.patientId) {
        toast({
          title: "Validation Error",
          description: "Please fill all required fields",
          variant: "destructive",
        })
        return
      }

      const appointmentData: any = {
        patientId: formData.patientId,
        patientName: formData.patientName,
        staffId: formData.staffId,
        doctorName: formData.doctorName,
        specialization: formData.specialization,
        date: formData.date,
        time: formData.time,
        room: formData.room,
        reason: formData.reason,
        notes: formData.notes,
      }

      if (doctors === mockFallbackDoctors) {
        const updatedAppointments = appointments.map(apt => 
          apt._id === selectedAppointment._id 
            ? { ...apt, ...appointmentData, updatedAt: new Date().toISOString() }
            : apt
        )
        
        setAppointments(updatedAppointments)
        setFilteredAppointments(updatedAppointments)
        
        toast({
          title: "Success (Demo Mode)",
          description: "Appointment updated successfully (demo)",
          variant: "default",
        })
      } else {
        const response = await axiosClient.put(`/appointments/${selectedAppointment._id}`, appointmentData)

        if (response.data?.success) {
          toast({
            title: "Success",
            description: "Appointment updated successfully",
            variant: "default",
          })
          fetchAppointments()
          fetchStats()
        } else {
          toast({
            title: "Error",
            description: response.data?.error || "Failed to update appointment",
            variant: "destructive",
          })
        }
      }
      
      setIsDialogOpen(false)
      resetForm()
      
    } catch (error: any) {
      console.error("Error updating appointment:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update appointment",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteAppointment = async (id: string) => {
    const message = "Are you sure you want to delete this appointment?"
    
    if (!confirm(message)) return
    
    try {
      if (doctors === mockFallbackDoctors) {
        const updatedAppointments = appointments.filter(apt => apt._id !== id)
        setAppointments(updatedAppointments)
        setFilteredAppointments(updatedAppointments)
        
        toast({
          title: "Success (Demo Mode)",
          description: "Appointment deleted successfully (demo)",
          variant: "default",
        })
      } else {
        const response = await axiosClient.delete(`/appointments/${id}`)
        
        if (response.data?.success) {
          toast({
            title: "Success",
            description: "Appointment deleted successfully",
            variant: "default",
          })
          fetchAppointments()
          fetchStats()
        } else {
          toast({
            title: "Error",
            description: response.data?.error || "Failed to delete appointment",
            variant: "destructive",
          })
        }
      }
    } catch (error: any) {
      console.error("Error deleting appointment:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete appointment",
        variant: "destructive",
      })
    }
  }

  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find(p => p._id === patientId || p.id === patientId)
    if (patient) {
      setFormData(prev => ({
        ...prev,
        patientId,
        patientName: patient.name || "Patient",
        reason: prev.reason || `Consultation for ${patient.name}`
      }))
    }
  }

  const handleDoctorSelect = (doctorId: string) => {
    const doctor = doctors.find(d => d._id === doctorId)
    if (doctor) {
      setFormData(prev => ({
        ...prev,
        doctorId: doctor._id,
        staffId: doctor.staff?._id || "",
        doctorName: doctor.staff?.name || "Doctor",
        specialization: doctor.specialization || "General"
      }))
    }
  }

  const handleStatusUpdate = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      if (doctors === mockFallbackDoctors) {
        const updatedAppointments = appointments.map(apt => 
          apt._id === appointmentId 
            ? { ...apt, status: newStatus, updatedAt: new Date().toISOString() }
            : apt
        )
        
        setAppointments(updatedAppointments)
        setFilteredAppointments(updatedAppointments)
        
        toast({
          title: "Success (Demo Mode)",
          description: `Appointment marked as ${newStatus} (demo)`,
          variant: "default",
        })
      } else {
        const response = await axiosClient.patch(`/appointments/${appointmentId}/status`, {
          status: newStatus
        })
        
        if (response.data?.success) {
          toast({
            title: "Success",
            description: `Appointment marked as ${newStatus}`,
            variant: "default",
          })
          fetchAppointments()
          fetchStats()
        } else {
          toast({
            title: "Error",
            description: response.data?.error || "Failed to update status",
            variant: "destructive",
          })
        }
      }
    } catch (error: any) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const handleViewModeChange = (mode: "list" | "calendar") => {
    setViewMode(mode)
    if (mode === "list") {
      fetchAppointments()
    } else {
      fetchCalendarAppointments()
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "scheduled": return "default"
      case "completed": return "secondary"
      case "cancelled": return "destructive"
      case "no-show": return "outline"
      default: return "default"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled": return <Calendar className="h-3 w-3 mr-1" />
      case "completed": return <CheckCircle className="h-3 w-3 mr-1" />
      case "cancelled": return <X className="h-3 w-3 mr-1" />
      case "no-show": return <Clock className="h-3 w-3 mr-1" />
      default: return <Calendar className="h-3 w-3 mr-1" />
    }
  }

  const getSelectedDoctorInfo = () => {
    if (formData.doctorId) {
      const doctor = doctors.find(d => d._id === formData.doctorId)
      return doctor || null
    }
    return null
  }

  const getSelectedPatientInfo = () => {
    if (formData.patientId) {
      return patients.find(p => 
        p._id === formData.patientId || 
        p.id === formData.patientId
      )
    }
    return null
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return "Invalid date"
    }
  }

  if (!isMounted) {
    return (
      <div className="flex-1 overflow-auto">
        <Header title="Appointments" subtitle="Loading..." />
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    <Skeleton className="h-4 w-24" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="mt-6">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 overflow-auto">
        <Header title="Appointments" subtitle="Manage all appointments" />
        <div className="p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-yellow-500 mb-4">
                <Calendar className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Using Demo Data</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchInitialData} className="bg-[#5B6EF5] hover:bg-[#4A5DE4]">
                Retry Loading Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Appointments" subtitle="Manage all appointments" />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Total Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.total}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Today's Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.today}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming (7 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.upcoming}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Scheduled
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.byStatus?.scheduled || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle>Appointments</CardTitle>
                <div className="flex gap-1 bg-muted p-1 rounded-lg">
                  <Button
                    variant={viewMode === "calendar" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewModeChange("calendar")}
                    className={viewMode === "calendar" ? "bg-[#5B6EF5] hover:bg-[#4A5DE4]" : ""}
                    disabled={calendarLoading}
                  >
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Calendar
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewModeChange("list")}
                    className={viewMode === "list" ? "bg-[#5B6EF5] hover:bg-[#4A5DE4]" : ""}
                    disabled={loading}
                  >
                    <List className="h-4 w-4 mr-2" />
                    List
                  </Button>
                </div>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} className="bg-[#5B6EF5] hover:bg-[#4A5DE4]">
                    <Plus className="h-4 w-4 mr-2" />
                    New Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedAppointment ? "Edit Appointment" : "Schedule New Appointment"}</DialogTitle>
                    <DialogDescription>
                      {selectedAppointment
                        ? "Update appointment details"
                        : "Fill in the details to schedule a new appointment"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="patientId" className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          Patient *
                        </Label>
                        <Select
                          value={formData.patientId}
                          onValueChange={handlePatientSelect}
                          disabled={formLoading || patients.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={patients.length === 0 ? "No patients available" : "Select patient"} />
                          </SelectTrigger>
                          <SelectContent>
                            {patients.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">No patients found</div>
                            ) : (
                              patients.map((patient) => (
                                <SelectItem key={`patient-${patient._id || patient.id}`} value={patient._id || patient.id}>
                                  <div className="flex flex-col">
                                    <span>{patient.name || "Unnamed Patient"}</span>
                                    <span className="text-xs text-muted-foreground">ID: {patient.id || patient._id || "N/A"}</span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="doctorId" className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4" />
                          Doctor *
                        </Label>
                        <Select
                          value={formData.doctorId}
                          onValueChange={handleDoctorSelect}
                          disabled={formLoading || doctors.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={doctors.length === 0 ? "No doctors available" : "Select doctor"} />
                          </SelectTrigger>
                          <SelectContent>
                            {doctors.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">No doctors found</div>
                            ) : (
                              doctors.map((doctor) => (
                                <SelectItem key={`doctor-${doctor._id}`} value={doctor._id}>
                                  <div className="flex flex-col">
                                    <span>{doctor.staff?.name || "Doctor"}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {doctor.specialization || "General"} • {doctor.doctorCode || "DOC000"}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {formData.patientId && (
                      <div className="p-3 bg-muted rounded-lg">
                        <Label className="text-sm font-medium mb-2 block">Selected Patient:</Label>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Name:</span> {getSelectedPatientInfo()?.name || formData.patientName || "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">ID:</span> {formData.patientId}
                          </div>
                          <div>
                            <span className="font-medium">Phone:</span> {getSelectedPatientInfo()?.phone || "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Email:</span> {getSelectedPatientInfo()?.email || "N/A"}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {formData.doctorId && (
                      <div className="p-3 bg-muted rounded-lg">
                        <Label className="text-sm font-medium mb-2 block">Selected Doctor:</Label>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Name:</span> {formData.doctorName}
                          </div>
                          <div>
                            <span className="font-medium">Specialization:</span> {formData.specialization}
                          </div>
                          <div>
                            <span className="font-medium">Code:</span> {getSelectedDoctorInfo()?.doctorCode || "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Fee:</span> ${getSelectedDoctorInfo()?.consultationFee || "N/A"}
                          </div>
                          {getSelectedDoctorInfo()?.availableDays && (
                            <div className="col-span-2">
                              <span className="font-medium">Available Days:</span> {getSelectedDoctorInfo()?.availableDays?.join(', ') || "N/A"}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          disabled={formLoading}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Time *</Label>
                        <Select
                          value={formData.time}
                          onValueChange={(value) => setFormData({ ...formData, time: value })}
                          disabled={formLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeSlots.map((time) => (
                              <SelectItem key={`time-${time}`} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="room">Room *</Label>
                        <Select
                          value={formData.room}
                          onValueChange={(value) => setFormData({ ...formData, room: value })}
                          disabled={formLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select room" />
                          </SelectTrigger>
                          <SelectContent>
                            {rooms.map((room) => (
                              <SelectItem key={`room-${room}`} value={room}>
                                {room}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason for Visit *</Label>
                      <Input
                        id="reason"
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        placeholder="e.g., Regular checkup, Follow-up, Consultation"
                        disabled={formLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Additional notes..."
                        rows={3}
                        disabled={formLoading}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)} 
                      disabled={formLoading}
                    >
                      Cancel
                    </Button>
                    {selectedAppointment && (
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteAppointment(selectedAppointment._id)}
                        disabled={formLoading}
                      >
                        Delete Appointment
                      </Button>
                    )}
                    <Button
                      onClick={selectedAppointment ? handleUpdateAppointment : handleCreateAppointment}
                      className="bg-[#5B6EF5] hover:bg-[#4A5DE4]"
                      disabled={formLoading || 
                        !formData.patientId || !formData.staffId || 
                        !formData.date || !formData.time || !formData.room || !formData.reason}
                    >
                      {formLoading ? (
                        <>
                          <span className="animate-spin mr-2">⟳</span>
                          Processing...
                        </>
                      ) : selectedAppointment ? (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Update
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Appointment
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "calendar" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => changeDate(-1)} 
                    disabled={calendarLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="font-semibold text-lg">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => changeDate(1)} 
                    disabled={calendarLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {calendarLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={`calendar-row-${i}`} className="flex items-center space-x-4">
                        <Skeleton className="h-4 w-20" />
                        {[1, 2, 3, 4, 5].map((j) => (
                          <Skeleton key={`room-skeleton-${i}-${j}`} className="h-20 flex-1" />
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-2 mb-2">
                        <div className="font-semibold text-sm text-muted-foreground">Time</div>
                        {rooms.map((room) => (
                          <div
                            key={`room-header-${room}`}
                            className="font-semibold text-sm text-center p-2 bg-[#5B6EF5] text-white rounded-lg"
                          >
                            {room}
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        {timeSlots.map((time) => (
                          <div key={`time-row-${time}`} className="grid grid-cols-[100px_repeat(5,1fr)] gap-2">
                            <div className="font-medium text-sm flex items-center text-muted-foreground">{time}</div>
                            {rooms.map((room) => {
                              const appointment = getAppointmentForSlot(room, time, selectedDate)
                              return (
                                <div key={`slot-${room}-${time}`} className="min-h-[80px]">
                                  {appointment ? (
                                    <Card
                                      className="h-full cursor-pointer hover:shadow-md transition-shadow border-l-4"
                                      style={{ borderLeftColor: appointment.status === 'scheduled' ? '#5B6EF5' : 
                                               appointment.status === 'completed' ? '#10B981' : 
                                               appointment.status === 'cancelled' ? '#EF4444' : '#6B7280' }}
                                      onClick={() => openEditDialog(appointment)}
                                    >
                                      <CardContent className="p-2">
                                        <div className="space-y-1">
                                          <p className="font-semibold text-xs truncate">{appointment.patientName || "Patient"}</p>
                                          <p className="text-xs text-muted-foreground truncate">
                                            <Stethoscope className="inline h-3 w-3 mr-1" />
                                            {appointment.doctorName || "Doctor"}
                                          </p>
                                          <div className="flex items-center justify-between">
                                            <Badge 
                                              variant={getStatusBadgeVariant(appointment.status)}
                                              className="text-xs px-1 py-0 flex items-center"
                                            >
                                              {getStatusIcon(appointment.status)}
                                              {appointment.status}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">{appointment.time}</span>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ) : (
                                    <Card
                                      className="h-full cursor-pointer hover:bg-muted/50 transition-colors border-dashed"
                                      onClick={() => openBookingDialog(room, time)}
                                    >
                                      <CardContent className="p-2 flex items-center justify-center h-full">
                                        <p className="text-xs text-muted-foreground">Available</p>
                                      </CardContent>
                                    </Card>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#5B6EF5] rounded"></div>
                    <span className="text-sm">Scheduled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#10B981] rounded"></div>
                    <span className="text-sm">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#EF4444] rounded"></div>
                    <span className="text-sm">Cancelled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-dashed border-muted-foreground rounded"></div>
                    <span className="text-sm">Available</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by patient name, doctor, or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={`list-skeleton-${i}`}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-6 w-48" />
                              <Skeleton className="h-9 w-16" />
                            </div>
                            <Skeleton className="h-4 w-64" />
                            <div className="flex gap-4">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                            <Skeleton className="h-4 w-48" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No appointments found</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery ? "Try a different search term" : "Schedule your first appointment"}
                    </p>
                    <Button 
                      onClick={() => setIsDialogOpen(true)} 
                      className="bg-[#5B6EF5] hover:bg-[#4A5DE4]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Your First Appointment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAppointments.map((appointment) => (
                      <Card key={`appointment-${appointment._id}`} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-lg">{appointment.patientName || "Patient"}</h3>
                                    <Badge variant="outline" className="text-xs">
                                      ID: {appointment.patientId || "N/A"}
                                    </Badge>
                                    <Badge 
                                      variant={getStatusBadgeVariant(appointment.status)}
                                      className="ml-2 flex items-center"
                                    >
                                      {getStatusIcon(appointment.status)}
                                      {appointment.status}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                    <div className="flex items-center gap-1">
                                      <Stethoscope className="h-4 w-4" />
                                      {appointment.doctorName || "Doctor"}
                                    </div>
                                    {appointment.specialization && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                          {appointment.specialization}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {appointment.status === "scheduled" && (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleStatusUpdate(appointment._id, "completed")}
                                        className="flex items-center gap-1"
                                      >
                                        <CheckCircle className="h-3 w-3" />
                                        Complete
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleStatusUpdate(appointment._id, "cancelled")}
                                        className="flex items-center gap-1"
                                      >
                                        <X className="h-3 w-3" />
                                        Cancel
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleStatusUpdate(appointment._id, "no-show")}
                                        className="flex items-center gap-1"
                                      >
                                        <Clock className="h-3 w-3" />
                                        No-Show
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm font-medium">Date</p>
                                    <p className="text-sm text-muted-foreground">
                                      {formatDate(appointment.date)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm font-medium">Time</p>
                                    <p className="text-sm text-muted-foreground">{appointment.time}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm font-medium">Room</p>
                                    <p className="text-sm text-muted-foreground">{appointment.room}</p>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium mb-1">Reason for Visit</p>
                                <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                              </div>
                              {appointment.notes && (
                                <div>
                                  <p className="text-sm font-medium mb-1">Notes</p>
                                  <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                Created: {new Date(appointment.createdAt).toLocaleString()}
                                {appointment.updatedAt !== appointment.createdAt && 
                                  ` • Updated: ${new Date(appointment.updatedAt).toLocaleString()}`}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openEditDialog(appointment)}
                                className="flex items-center gap-1"
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleDeleteAppointment(appointment._id)}
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}