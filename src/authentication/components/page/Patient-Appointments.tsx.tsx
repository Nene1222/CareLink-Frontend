// app/dashboard/appointments/components/patient-appointments.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
  Stethoscope,
  Phone,
  Mail,
  Trash2,
  Edit,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import axiosClient from "@/lib/axiosClient"

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
}

interface Doctor {
  _id: string
  doctorCode: string
  specialization: string
  consultationFee: number
  staff: {
    _id: string
    name: string
    email: string
    phoneNumber: string
    specialization: string
  }
}

interface PatientInfo {
  _id: string
  patientCode: string
  user: string
  name: string
  email: string
  phoneNumber: string
  dateOfBirth: string
  gender: string
  address?: string
  status: string
  userId: string
}

interface AppointmentStats {
  total: number
  today: number
  upcoming: number
  past: number
  byStatus: {
    scheduled: number
    completed: number
    cancelled: number
    "no-show": number
  }
  summary: {
    active: number
    completed: number
    cancelled: number
    noShow: number
  }
  nextAppointment?: {
    _id: string
    doctorName: string
    specialization: string
    date: string
    time: string
    room: string
    status: string
  }
}

interface Props {
  userId: string
}

const rooms = ["Room 101", "Room 102", "Room 203", "Room 105", "Room 204", "Room 205", "Room 206", "Room 301", "Room 302"]
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
  "06:00 PM",
]

export default function PatientAppointments({ userId }: Props) {
  const { toast } = useToast()
  
  const [isMounted, setIsMounted] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null)
  const [stats, setStats] = useState<AppointmentStats | null>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  // Consolidated loading states
  const [isLoading, setIsLoading] = useState({
    initial: true,
    appointments: false,
    calendar: false,
    form: false,
  })

  const [formData, setFormData] = useState({
    staffId: "",
    doctorName: "",
    specialization: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
    room: "",
    reason: "",
    notes: "",
  })

  // Initialize component
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // Fetch all data when component mounts
  useEffect(() => {
    if (isMounted && userId) {
      fetchAllData()
    }
  }, [isMounted, userId])

  // Filter appointments based on search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredAppointments(appointments)
    } else {
      const filtered = appointments.filter((apt) => {
        const searchLower = searchQuery.toLowerCase()
        return (
          apt.doctorName.toLowerCase().includes(searchLower) ||
          (apt.specialization?.toLowerCase() || '').includes(searchLower) ||
          apt.reason.toLowerCase().includes(searchLower) ||
          apt.room.toLowerCase().includes(searchLower)
        )
      })
      setFilteredAppointments(filtered)
    }
  }, [searchQuery, appointments])

  // Fetch calendar appointments when date changes
  useEffect(() => {
    if (isMounted && viewMode === "calendar" && patientInfo?._id) {
      fetchCalendarAppointments()
    }
  }, [selectedDate, viewMode])

  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, initial: true }))
      
      // Step 1: Fetch patient data first
      const patientData = await fetchPatientData()
      if (!patientData) {
        toast({
          title: "Error",
          description: "Failed to load patient information",
          variant: "destructive",
        })
        return
      }

      // Step 2: Fetch all other data in parallel
      await Promise.all([
        fetchDoctors(),
        fetchAppointments(patientData._id),
        fetchStats(patientData._id)
      ])
      
    } catch (error) {
      console.error("Error fetching initial data:", error)
      toast({
        title: "Error",
        description: "Failed to load appointment data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(prev => ({ ...prev, initial: false }))
    }
  }, [userId, toast])

  const fetchPatientData = async (): Promise<PatientInfo | null> => {
    try {
      const response = await axiosClient.get(`/patient/${userId}`)
      
      if (response.data?.success) {
        const patientData = response.data.data
        setPatientInfo(patientData)
        return patientData
      }
      return null
    } catch (error: any) {
      console.error("Error fetching patient data:", error)
      return null
    }
  }

  const fetchDoctors = async () => {
    try {
      const response = await axiosClient.get("/doctors")
      
      let doctorsData: Doctor[] = []
      
      if (response.data?.success) {
        // Handle different response structures
        if (Array.isArray(response.data.data)) {
          doctorsData = response.data.data
        } else if (Array.isArray(response.data.doctors)) {
          doctorsData = response.data.doctors
        }
      }
      
      // Map the doctors data to ensure consistent structure
      const mappedDoctors = doctorsData.map((doctor: any) => {
        // Extract staff information
        let staffInfo = {
          _id: "",
          name: "",
          email: "",
          phoneNumber: "",
          specialization: ""
        }
        
        if (doctor.staff) {
          staffInfo = {
            _id: doctor.staff._id || "",
            name: doctor.staff.name || "Unknown Doctor",
            email: doctor.staff.email || "",
            phoneNumber: doctor.staff.phoneNumber || "",
            specialization: doctor.staff.specialization || doctor.specialization || "General"
          }
        }
        
        return {
          _id: doctor._id || staffInfo._id,
          doctorCode: doctor.doctorCode || `DOC${Math.floor(Math.random() * 1000)}`,
          specialization: doctor.specialization || staffInfo.specialization || "General",
          consultationFee: doctor.consultationFee || 100,
          staff: staffInfo
        } as Doctor
      })
      
      // Filter out invalid doctors
      const validDoctors = mappedDoctors.filter(doctor => 
        doctor._id && doctor.staff && doctor.staff._id && doctor.staff.name
      )
      
      setDoctors(validDoctors)
      
    } catch (error: any) {
      console.error("Error fetching doctors:", error)
      setDoctors([])
    }
  }

  const fetchAppointments = async (patientId: string) => {
    if (!patientId) return
    
    try {
      setIsLoading(prev => ({ ...prev, appointments: true }))
      const response = await axiosClient.get(
        `/patient/${userId}/${patientId}/appointments`
      )
      
      if (response.data?.success) {
        const appointmentsData = response.data.data || []
        setAppointments(appointmentsData)
        setFilteredAppointments(appointmentsData)
      } else {
        setAppointments([])
        setFilteredAppointments([])
      }
    } catch (error: any) {
      console.error("Error fetching appointments:", error)
      setAppointments([])
      setFilteredAppointments([])
    } finally {
      setIsLoading(prev => ({ ...prev, appointments: false }))
    }
  }

  const fetchCalendarAppointments = async () => {
    if (!patientInfo?._id) return
    
    try {
      setIsLoading(prev => ({ ...prev, calendar: true }))
      const dateStr = selectedDate.toISOString().split("T")[0]
      
      const response = await axiosClient.get(
        `/patient/${userId}/${patientInfo._id}/appointments`,
        { params: { date: dateStr } }
      )
      
      if (response.data?.success) {
        const appointmentsData = response.data.data || []
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
      setIsLoading(prev => ({ ...prev, calendar: false }))
    }
  }

  const fetchStats = async (patientId: string) => {
    if (!patientId) return
    
    try {
      const response = await axiosClient.get(
        `/patient/${userId}/${patientId}/appointments/stats`
      )
      
      if (response.data?.success) {
        setStats(response.data.data)
      } else {
        // Create default stats
        const defaultStats: AppointmentStats = {
          total: 0,
          today: 0,
          upcoming: 0,
          past: 0,
          byStatus: {
            scheduled: 0,
            completed: 0,
            cancelled: 0,
            "no-show": 0
          },
          summary: {
            active: 0,
            completed: 0,
            cancelled: 0,
            noShow: 0
          }
        }
        setStats(defaultStats)
      }
    } catch (error: any) {
      console.error("Error fetching stats:", error)
      // Create default stats
      const defaultStats: AppointmentStats = {
        total: 0,
        today: 0,
        upcoming: 0,
        past: 0,
        byStatus: {
          scheduled: 0,
          completed: 0,
          cancelled: 0,
          "no-show": 0
        },
        summary: {
          active: 0,
          completed: 0,
          cancelled: 0,
          noShow: 0
        }
      }
      setStats(defaultStats)
    }
  }

  const getAppointmentForSlot = useCallback((room: string, time: string, date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return appointments.find((apt) => apt.room === room && apt.time === time && apt.date === dateStr)
  }, [appointments])

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const openBookingDialog = (room?: string, time?: string) => {
    resetForm()
    const newFormData = {
      staffId: "",
      doctorName: "",
      specialization: "",
      date: selectedDate.toISOString().split("T")[0],
      time: time || "",
      room: room || "",
      reason: "",
      notes: "",
    }
    setFormData(newFormData)
    setIsDialogOpen(true)
  }

  const handleCreateAppointment = async () => {
    if (!patientInfo) {
      toast({
        title: "Error",
        description: "Patient information not found",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsLoading(prev => ({ ...prev, form: true }))
      
      // Validate required fields
      if (!formData.staffId || !formData.date || !formData.time || !formData.room || !formData.reason) {
        toast({
          title: "Validation Error",
          description: "Please fill all required fields",
          variant: "destructive",
        })
        return
      }

      const appointmentData = {
        patientId: patientInfo._id,
        patientName: patientInfo.name,
        staffId: formData.staffId,
        doctorName: formData.doctorName,
        specialization: formData.specialization,
        date: formData.date,
        time: formData.time,
        room: formData.room,
        reason: formData.reason,
        notes: formData.notes || "",
        status: "scheduled" as const
      }

      const response = await axiosClient.post(
        `/patient/${userId}/${patientInfo._id}/appointments`,
        appointmentData
      )

      if (response.data?.success) {
        toast({
          title: "Success",
          description: "Appointment booked successfully!",
          variant: "default",
        })
        
        // Refresh data
        await fetchAppointments(patientInfo._id)
        await fetchStats(patientInfo._id)
        
        setIsDialogOpen(false)
        resetForm()
      } else {
        toast({
          title: "Error",
          description: response.data?.error || "Failed to create appointment",
          variant: "destructive",
        })
      }
      
    } catch (error: any) {
      console.error("Error creating appointment:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create appointment",
        variant: "destructive",
      })
    } finally {
      setIsLoading(prev => ({ ...prev, form: false }))
    }
  }

  const resetForm = () => {
    setFormData({
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
    
    setFormData({
      staffId: appointment.staffId,
      doctorName: appointment.doctorName,
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
    if (!selectedAppointment || !patientInfo) return
    
    try {
      setIsLoading(prev => ({ ...prev, form: true }))
      
      if (!formData.staffId || !formData.date || !formData.time || !formData.room || !formData.reason) {
        toast({
          title: "Validation Error",
          description: "Please fill all required fields",
          variant: "destructive",
        })
        return
      }

      const appointmentData = {
        staffId: formData.staffId,
        doctorName: formData.doctorName,
        specialization: formData.specialization,
        date: formData.date,
        time: formData.time,
        room: formData.room,
        reason: formData.reason,
        notes: formData.notes,
        status: selectedAppointment.status
      }

      const response = await axiosClient.put(
        `/patient/${userId}/${patientInfo._id}/appointments/${selectedAppointment._id}`,
        appointmentData
      )

      if (response.data?.success) {
        toast({
          title: "Success",
          description: "Appointment updated successfully",
          variant: "default",
        })
        
        // Refresh data
        await fetchAppointments(patientInfo._id)
        await fetchStats(patientInfo._id)
        
        setIsDialogOpen(false)
        resetForm()
      } else {
        toast({
          title: "Error",
          description: response.data?.error || "Failed to update appointment",
          variant: "destructive",
        })
      }
      
    } catch (error: any) {
      console.error("Error updating appointment:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update appointment",
        variant: "destructive",
      })
    } finally {
      setIsLoading(prev => ({ ...prev, form: false }))
    }
  }

  const handleDeleteAppointment = async (id: string) => {
    if (!patientInfo) return
    
    if (!confirm("Are you sure you want to cancel this appointment?")) return
    
    try {
      const response = await axiosClient.delete(
        `/patient/${userId}/${patientInfo._id}/appointments/${id}`
      )
      
      if (response.data?.success) {
        toast({
          title: "Success",
          description: "Appointment cancelled successfully",
          variant: "default",
        })
        
        // Refresh data
        await fetchAppointments(patientInfo._id)
        await fetchStats(patientInfo._id)
        
      } else {
        toast({
          title: "Error",
          description: response.data?.error || "Failed to cancel appointment",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error deleting appointment:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to cancel appointment",
        variant: "destructive",
      })
    }
  }

  const handleDoctorSelect = (doctorId: string) => {
    const doctor = doctors.find(d => d._id === doctorId)
    if (doctor) {
      setFormData(prev => ({
        ...prev,
        staffId: doctor.staff._id,
        doctorName: doctor.staff.name,
        specialization: doctor.specialization || doctor.staff.specialization
      }))
    }
  }

  const handleStatusUpdate = async (appointmentId: string) => {
    if (!patientInfo) return
    
    if (!confirm("Are you sure you want to cancel this appointment?")) return
    
    try {
      const response = await axiosClient.patch(
        `/patient/${userId}/${patientInfo._id}/appointments/${appointmentId}/status`,
        { status: "cancelled" }
      )
      
      if (response.data?.success) {
        toast({
          title: "Success",
          description: "Appointment cancelled",
          variant: "default",
        })
        
        // Refresh data
        await fetchAppointments(patientInfo._id)
        await fetchStats(patientInfo._id)
        
      } else {
        toast({
          title: "Error",
          description: response.data?.error || "Failed to cancel appointment",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to cancel appointment",
        variant: "destructive",
      })
    }
  }

  const handleViewModeChange = (mode: "list" | "calendar") => {
    setViewMode(mode)
    if (mode === "list" && patientInfo?._id) {
      fetchAppointments(patientInfo._id)
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
    if (formData.staffId) {
      return doctors.find(d => d.staff._id === formData.staffId)
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

  // Memoized calendar slots for better performance
  const calendarSlots = useMemo(() => {
    return timeSlots.slice(0, 10).map((time) => ({
      time,
      rooms: rooms.slice(0, 5).map((room) => ({
        room,
        appointment: getAppointmentForSlot(room, time, selectedDate)
      }))
    }))
  }, [getAppointmentForSlot, selectedDate])

  if (!isMounted) {
    return (
      <div className="flex-1 overflow-auto">
        <Header title="My Appointments" subtitle="Loading..." />
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

  if (isLoading.initial) {
    return (
      <div className="flex-1 overflow-auto">
        <Header title="My Appointments" subtitle="Loading your appointments..." />
        <div className="p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
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

  if (!patientInfo) {
    return (
      <div className="flex-1 overflow-auto">
        <Header title="My Appointments" subtitle="Manage your appointments" />
        <div className="p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unable to Load Appointments</h3>
              <p className="text-muted-foreground mb-4">
                Patient information not found. Please try again.
              </p>
              <Button onClick={fetchAllData} className="bg-[#5B6EF5] hover:bg-[#4A5DE4]">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <Header 
        title="My Appointments" 
        subtitle={`Manage appointments for ${patientInfo.name}`} 
      />
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Total Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading.appointments ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
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
              {isLoading.appointments ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.today || 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading.appointments ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.upcoming || 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading.appointments ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.summary?.active || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Next Appointment Card */}
        {stats?.nextAppointment && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Next Appointment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold">{stats.nextAppointment.doctorName}</span>
                    <Badge variant="outline" className="text-xs">
                      {stats.nextAppointment.specialization}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span>{formatDate(stats.nextAppointment.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span>{stats.nextAppointment.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span>{stats.nextAppointment.room}</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const appointment = appointments.find(a => a._id === stats.nextAppointment?._id)
                    if (appointment) openEditDialog(appointment)
                  }}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Appointments Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle>My Appointments</CardTitle>
                <div className="flex gap-1 bg-muted p-1 rounded-lg">
                  <Button
                    variant={viewMode === "calendar" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewModeChange("calendar")}
                    className={viewMode === "calendar" ? "bg-[#5B6EF5] hover:bg-[#4A5DE4]" : ""}
                    disabled={isLoading.calendar || isLoading.appointments}
                  >
                    {isLoading.calendar ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CalendarDays className="h-4 w-4 mr-2" />
                    )}
                    Calendar
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewModeChange("list")}
                    className={viewMode === "list" ? "bg-[#5B6EF5] hover:bg-[#4A5DE4]" : ""}
                    disabled={isLoading.appointments}
                  >
                    <List className="h-4 w-4 mr-2" />
                    List
                  </Button>
                </div>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openBookingDialog()} className="bg-[#5B6EF5] hover:bg-[#4A5DE4]">
                    <Plus className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedAppointment ? "Edit Appointment" : "Book New Appointment"}</DialogTitle>
                    <DialogDescription>
                      {selectedAppointment
                        ? "Update appointment details"
                        : "Fill in the details to book a new appointment"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {/* Patient Info Display */}
                    <div className="p-3 bg-muted rounded-lg">
                      <Label className="text-sm font-medium mb-2 block">Your Information:</Label>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Name:</span> {patientInfo.name}
                        </div>
                        <div>
                          <span className="font-medium">Patient Code:</span> {patientInfo.patientCode}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {patientInfo.phoneNumber || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {patientInfo.email}
                        </div>
                      </div>
                    </div>

                    {/* Doctor selection */}
                    <div className="space-y-2">
                      <Label htmlFor="doctorId" className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        Select Doctor *
                      </Label>
                      <Select
                        value={formData.staffId}
                        onValueChange={handleDoctorSelect}
                        disabled={isLoading.form || doctors.length === 0}
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
                                  <span>{doctor.staff.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {doctor.specialization} • {doctor.doctorCode}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {doctors.length === 0 && (
                        <p className="text-xs text-yellow-600">
                          No doctors available. Please check if doctors are registered in the system.
                        </p>
                      )}
                    </div>
                    
                    {/* Display selected doctor info */}
                    {formData.staffId && (
                      <div className="p-3 bg-muted rounded-lg">
                        <Label className="text-sm font-medium mb-2 block">Selected Doctor:</Label>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Name:</span> {getSelectedDoctorInfo()?.staff.name || formData.doctorName}
                          </div>
                          <div>
                            <span className="font-medium">Specialization:</span> {getSelectedDoctorInfo()?.specialization || formData.specialization}
                          </div>
                          <div>
                            <span className="font-medium">Code:</span> {getSelectedDoctorInfo()?.doctorCode || "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Fee:</span> ${getSelectedDoctorInfo()?.consultationFee || "N/A"}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          disabled={isLoading.form}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Time *</Label>
                        <Select
                          value={formData.time}
                          onValueChange={(value) => setFormData({ ...formData, time: value })}
                          disabled={isLoading.form}
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
                          disabled={isLoading.form}
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
                        disabled={isLoading.form}
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
                        disabled={isLoading.form}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)} 
                      disabled={isLoading.form}
                    >
                      Cancel
                    </Button>
                    {selectedAppointment && (
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteAppointment(selectedAppointment._id)}
                        disabled={isLoading.form}
                      >
                        Cancel Appointment
                      </Button>
                    )}
                    <Button
                      onClick={selectedAppointment ? handleUpdateAppointment : handleCreateAppointment}
                      className="bg-[#5B6EF5] hover:bg-[#4A5DE4]"
                      disabled={isLoading.form || 
                        !formData.staffId || 
                        !formData.date || !formData.time || !formData.room || !formData.reason}
                    >
                      {isLoading.form ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : selectedAppointment ? (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Update
                        </>
                      ) : (
                        <>
                          <Calendar className="h-4 w-4 mr-2" />
                          Book Appointment
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
                    disabled={isLoading.calendar}
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
                    disabled={isLoading.calendar}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {isLoading.calendar ? (
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
                        {rooms.slice(0, 5).map((room) => (
                          <div
                            key={`room-header-${room}`}
                            className="font-semibold text-sm text-center p-2 bg-[#5B6EF5] text-white rounded-lg"
                          >
                            {room}
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        {calendarSlots.map((slot) => (
                          <div key={`time-row-${slot.time}`} className="grid grid-cols-[100px_repeat(5,1fr)] gap-2">
                            <div className="font-medium text-sm flex items-center text-muted-foreground">{slot.time}</div>
                            {slot.rooms.map(({ room, appointment }) => (
                              <div key={`slot-${room}-${slot.time}`} className="min-h-[80px]">
                                {appointment ? (
                                  <Card
                                    className="h-full cursor-pointer hover:shadow-md transition-shadow border-l-4"
                                    style={{ 
                                      borderLeftColor: appointment.status === 'scheduled' ? '#5B6EF5' : 
                                                    appointment.status === 'completed' ? '#10B981' : 
                                                    appointment.status === 'cancelled' ? '#EF4444' : '#6B7280' 
                                    }}
                                    onClick={() => openEditDialog(appointment)}
                                  >
                                    <CardContent className="p-2">
                                      <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground truncate">
                                          <Stethoscope className="inline h-3 w-3 mr-1" />
                                          {appointment.doctorName}
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
                                    onClick={() => openBookingDialog(room, slot.time)}
                                  >
                                    <CardContent className="p-2 flex items-center justify-center h-full">
                                      <p className="text-xs text-muted-foreground">Available</p>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            ))}
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
                      placeholder="Search by doctor name, specialization, or reason..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {isLoading.appointments ? (
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
                      {searchQuery ? "Try a different search term" : "You haven't booked any appointments yet"}
                    </p>
                    <Button 
                      onClick={() => openBookingDialog()} 
                      className="bg-[#5B6EF5] hover:bg-[#4A5DE4]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Book Your First Appointment
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
                                    <h3 className="font-semibold text-lg">{appointment.doctorName}</h3>
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
                                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                        {appointment.specialization || "General"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {appointment.status === "scheduled" && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleStatusUpdate(appointment._id)}
                                      className="flex items-center gap-1"
                                    >
                                      <X className="h-3 w-3" />
                                      Cancel
                                    </Button>
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
                              {appointment.status === "scheduled" && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => openEditDialog(appointment)}
                                  className="flex items-center gap-1"
                                >
                                  <Edit className="h-3 w-3" />
                                  Edit
                                </Button>
                              )}
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleDeleteAppointment(appointment._id)}
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="h-3 w-3" />
                                Cancel
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