
// app/doctors/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2, 
  Phone, 
  Mail, 
  Award,
  Stethoscope,
  Star,
  UserX,
  UserCheck,
  Loader2,
  X,
  GraduationCap,
  DollarSign,
  Globe,
  BookOpen,
  Languages,
  AlertTriangle,
  Users
} from "lucide-react"
import axiosClient from "@/lib/axiosClient"
import { useToast } from "@/hooks/use-toast"
import { debounce } from "lodash"

// Types with safer defaults
interface Staff {
  _id: string
  name: string
  email: string
  phoneNumber?: string
  specialization?: string
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
}

interface User {
  _id: string
  username: string
  email: string
  role: string
  isActive: boolean
  isVerified: boolean
  lastLogin?: string
  profileImage?: string
}

interface Doctor {
  _id: string
  staff?: Staff | null
  user?: User | null
  doctorCode: string
  specialization: string
  department?: string
  experience: string
  education: string
  qualifications?: string[]
  consultationFee: number
  bio?: string
  languages?: string[]
  awards?: string[]
  publications?: string[]
  availableDays?: string[]
  availableHours?: {
    start: string
    end: string
  }
  isAvailable: boolean
  rating: number
  totalPatients: number
  createdAt: string
  updatedAt: string
}

interface StaffForDoctor {
  _id: string
  name: string
  email: string
  role: string
  specialization?: string
  phoneNumber?: string
  status: "active" | "inactive"
  user?: {
    _id: string
    username: string
  }
}

interface Specialization {
  _id?: string
  name: string
  description?: string
  userCount?: number
  count?: number
}

// Safe accessor functions
const getStaffName = (doctor: Doctor): string => {
  if (!doctor.staff) return "Unknown Doctor";
  return doctor.staff.name || "Unknown Doctor";
}

const getStaffEmail = (doctor: Doctor): string => {
  if (!doctor.staff) return "No email";
  return doctor.staff.email || "No email";
}

const getStaffPhoneNumber = (doctor: Doctor): string => {
  if (!doctor.staff || !doctor.staff.phoneNumber) return "Not specified";
  return doctor.staff.phoneNumber;
}

const getStaffStatus = (doctor: Doctor): "active" | "inactive" => {
  if (!doctor.staff) return "active";
  return doctor.staff.status || "active";
}

const getUsername = (doctor: Doctor): string => {
  if (!doctor.user) return "No user account";
  return doctor.user.username || "No user account";
}

const getIsUserVerified = (doctor: Doctor): boolean => {
  if (!doctor.user) return false;
  return doctor.user.isVerified || false;
}

const getIsUserActive = (doctor: Doctor): boolean => {
  if (!doctor.user) return false;
  return doctor.user.isActive || false;
}

// Doctor Stats Component
function DoctorStats({ stats }: { stats: any }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Doctors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalDoctors || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Available Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.availableDoctors || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Active Doctors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.doctorsWithActiveStaff || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Average Rating
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-2xl font-bold text-amber-600">
            <Star className="h-5 w-5 mr-1 fill-amber-500" />
            {stats.averageRating || "0.0"}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// View Doctor Dialog Component
function ViewDoctorDialog({ 
  doctor, 
  isOpen, 
  onOpenChange 
}: { 
  doctor: Doctor | null; 
  isOpen: boolean; 
  onOpenChange: (open: boolean) => void 
}) {
  if (!doctor) return null;

  const staffName = getStaffName(doctor);
  const staffEmail = getStaffEmail(doctor);
  const staffPhoneNumber = getStaffPhoneNumber(doctor);
  const staffStatus = getStaffStatus(doctor);
  const username = getUsername(doctor);
  const isUserVerified = getIsUserVerified(doctor);
  const isUserActive = getIsUserActive(doctor);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${staffName}`} 
                alt={staffName} 
              />
              <AvatarFallback>
                {staffName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>{staffName}</DialogTitle>
              <DialogDescription className="flex items-center">
                <Badge className="mr-2">{doctor.specialization}</Badge>
                <Badge variant={staffStatus === "active" ? "default" : "secondary"}>
                  {staffStatus === "active" ? <UserCheck className="h-3 w-3 mr-1" /> : <UserX className="h-3 w-3 mr-1" />}
                  {staffStatus}
                </Badge>
                <Badge variant="outline" className="ml-2">
                  {doctor.doctorCode}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Department</h4>
              <p className="flex items-center">
                <Stethoscope className="h-4 w-4 mr-2 text-muted-foreground" />
                {doctor.department || "Not specified"}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Experience</h4>
              <p className="flex items-center">
                <Award className="h-4 w-4 mr-2 text-muted-foreground" />
                {doctor.experience}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Education</h4>
              <p className="flex items-center">
                <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
                {doctor.education}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Consultation Fee</h4>
              <p className="flex items-center text-lg font-semibold text-primary">
                <DollarSign className="h-5 w-5" />
                {doctor.consultationFee}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Contact</h4>
              <p className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                {staffEmail}
              </p>
              <p className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                {staffPhoneNumber}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">User Account</h4>
              <p>Username: {username}</p>
              <p>Status: {isUserActive ? "Active" : "Inactive"}</p>
              <p>Verified: {isUserVerified ? "Yes" : "No"}</p>
            </div>
          </div>

          {doctor.languages && doctor.languages.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Languages</h4>
              <div className="flex flex-wrap gap-2">
                {doctor.languages.map((language, index) => (
                  <Badge key={`${language}-${index}`} variant="secondary">
                    <Globe className="h-3 w-3 mr-1" />
                    {language}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {doctor.qualifications && doctor.qualifications.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Qualifications</h4>
              <div className="flex flex-wrap gap-2">
                {doctor.qualifications.map((qualification, index) => (
                  <Badge key={`${qualification}-${index}`} variant="outline">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {qualification}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Rating</h4>
            <div className="flex items-center">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={`star-${star}`}
                    className={`h-5 w-5 ${
                      star <= Math.floor(doctor.rating)
                        ? "fill-amber-500 text-amber-500"
                        : star <= doctor.rating
                        ? "fill-amber-300 text-amber-300"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="ml-2 text-lg font-semibold">{doctor.rating.toFixed(1)}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                ({doctor.totalPatients} patients)
              </span>
            </div>
          </div>

          {doctor.availableDays && doctor.availableDays.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Available Days</h4>
              <div className="flex flex-wrap gap-2">
                {doctor.availableDays.map((day, index) => (
                  <Badge key={`${day}-${index}`} variant="default">
                    {day}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {doctor.availableHours && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Available Hours</h4>
              <p>{doctor.availableHours.start} - {doctor.availableHours.end}</p>
            </div>
          )}

          {doctor.bio && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Bio</h4>
              <p className="text-sm">{doctor.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p>Joined: {new Date(doctor.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p>Last Updated: {new Date(doctor.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Add Doctor Dialog Component
function AddDoctorDialog({ 
  isOpen, 
  onOpenChange, 
  onSave, 
  loading,
  formData,
  setFormData,
  specializations,
  availableStaff
}: { 
  isOpen: boolean; 
  onOpenChange: (open: boolean) => void; 
  onSave: () => void; 
  loading: boolean;
  formData: any;
  setFormData: (data: any) => void;
  specializations: Specialization[];
  availableStaff: StaffForDoctor[];
}) {
  const [languageInput, setLanguageInput] = useState("")
  const [qualificationInput, setQualificationInput] = useState("")
  const [selectedStaff, setSelectedStaff] = useState<StaffForDoctor | null>(null)

  const availableDaysOptions = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ]

  const handleStaffSelect = (staffId: string) => {
    const staff = availableStaff.find(s => s._id === staffId)
    if (staff) {
      setSelectedStaff(staff)
      setFormData({
        ...formData,
        staffId: staff._id,
        name: staff.name,
        email: staff.email,
        phoneNumber: staff.phoneNumber || "",
        specialization: staff.specialization || "",
        status: staff.status,
        username: staff.user?.username || staff.email.split('@')[0],
        userExists: !!staff.user
      })
    } else if (staffId === 'new') {
      setSelectedStaff(null)
      setFormData({
        ...formData,
        staffId: 'new',
        name: "",
        email: "",
        phoneNumber: "",
        specialization: "",
        status: "active",
        username: "",
        userExists: false
      })
    }
  }

  const addLanguage = () => {
    if (languageInput.trim() && !formData.languages.includes(languageInput.trim())) {
      setFormData({
        ...formData,
        languages: [...formData.languages, languageInput.trim()]
      })
      setLanguageInput("")
    }
  }

  const removeLanguage = (language: string) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter((l: string) => l !== language)
    })
  }

  const addQualification = () => {
    if (qualificationInput.trim() && !formData.qualifications.includes(qualificationInput.trim())) {
      setFormData({
        ...formData,
        qualifications: [...formData.qualifications, qualificationInput.trim()]
      })
      setQualificationInput("")
    }
  }

  const removeQualification = (qualification: string) => {
    setFormData({
      ...formData,
      qualifications: formData.qualifications.filter((q: string) => q !== qualification)
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Doctor</DialogTitle>
          <DialogDescription>
            Select a staff member to convert to a doctor or add a new doctor with staff account.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Select Staff Member</h4>
            <Select onValueChange={handleStaffSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a staff member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Create New Staff + Doctor</SelectItem>
                {availableStaff.map((staff) => (
                  <SelectItem key={staff._id} value={staff._id}>
                    {staff.name} - {staff.email} {staff.role !== 'doctor' ? `(${staff.role})` : '(Already Doctor)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedStaff && (
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <h4 className="text-sm font-medium text-blue-800">Selected Staff Member</h4>
                </div>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>Name: {selectedStaff.name}</p>
                  <p>Email: {selectedStaff.email}</p>
                  <p>Role: {selectedStaff.role}</p>
                  <p>Status: {selectedStaff.status}</p>
                  {selectedStaff.user && (
                    <p>User Account: {selectedStaff.user.username} ✓</p>
                  )}
                </div>
              </div>
            )}

            {!selectedStaff && formData.staffId === 'new' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name || "Doctor"}`} 
                      alt="Doctor Avatar"
                    />
                    <AvatarFallback>DR</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Avatar will be generated based on the doctor's name
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Dr. John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        const newFormData = {...formData, email: e.target.value}
                        if (!formData.username && e.target.value) {
                          newFormData.username = e.target.value.split('@')[0]
                        }
                        setFormData(newFormData)
                      }}
                      placeholder="doctor@clinic.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "active" | "inactive") => 
                        setFormData({...formData, status: value})
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

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-2">User Account (Required)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        placeholder="Enter username"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Enter password"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Doctor Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Doctor Details</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization *</Label>
                <Select
                  value={formData.specialization}
                  onValueChange={(value) => setFormData({...formData, specialization: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    {specializations.map((spec) => (
                      <SelectItem key={spec._id || spec.name} value={spec.name}>
                        {spec.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  placeholder="Heart Center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Experience</Label>
                <Input
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => setFormData({...formData, experience: e.target.value})}
                  placeholder="10 years"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <Input
                  id="education"
                  value={formData.education}
                  onChange={(e) => setFormData({...formData, education: e.target.value})}
                  placeholder="MD, Cardiology, Harvard"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consultationFee">Consultation Fee ($)</Label>
                <Input
                  id="consultationFee"
                  type="number"
                  value={formData.consultationFee}
                  onChange={(e) => setFormData({...formData, consultationFee: parseFloat(e.target.value) || 0})}
                  placeholder="150"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isAvailable">Availability</Label>
                <Select
                  value={formData.isAvailable ? "available" : "unavailable"}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    isAvailable: value === "available"
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Languages</h4>
              <div className="flex gap-2 mb-2">
                <Input
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  placeholder="Add language"
                  onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                />
                <Button type="button" onClick={addLanguage}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.languages.map((language: string, index: number) => (
                  <Badge key={`${language}-${index}`} variant="secondary" className="flex items-center gap-1">
                    {language}
                    <button
                      type="button"
                      onClick={() => removeLanguage(language)}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Qualifications</h4>
              <div className="flex gap-2 mb-2">
                <Input
                  value={qualificationInput}
                  onChange={(e) => setQualificationInput(e.target.value)}
                  placeholder="Add qualification"
                  onKeyPress={(e) => e.key === 'Enter' && addQualification()}
                />
                <Button type="button" onClick={addQualification}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.qualifications.map((qualification: string, index: number) => (
                  <Badge key={`${qualification}-${index}`} variant="outline" className="flex items-center gap-1">
                    {qualification}
                    <button
                      type="button"
                      onClick={() => removeQualification(qualification)}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Available Days</h4>
              <div className="flex flex-wrap gap-2">
                {availableDaysOptions.map((day) => (
                  <Badge
                    key={day}
                    variant={formData.availableDays.includes(day) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const newDays = formData.availableDays.includes(day)
                        ? formData.availableDays.filter((d: string) => d !== day)
                        : [...formData.availableDays, day]
                      setFormData({...formData, availableDays: newDays})
                    }}
                  >
                    {day}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="availableHoursStart">Available Hours Start</Label>
                <Input
                  id="availableHoursStart"
                  type="time"
                  value={formData.availableHours.start}
                  onChange={(e) => setFormData({
                    ...formData,
                    availableHours: {...formData.availableHours, start: e.target.value}
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availableHoursEnd">Available Hours End</Label>
                <Input
                  id="availableHoursEnd"
                  type="time"
                  value={formData.availableHours.end}
                  onChange={(e) => setFormData({
                    ...formData,
                    availableHours: {...formData.availableHours, end: e.target.value}
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio/Description</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Brief description about the doctor's expertise..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onSave} 
            className="bg-[#5B6EF5] hover:bg-[#4A5DE4]"
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Doctor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Edit Doctor Dialog Component
function EditDoctorDialog({ 
  doctor, 
  isOpen, 
  onOpenChange, 
  onSave, 
  loading,
  formData,
  setFormData,
  specializations
}: { 
  doctor: Doctor | null; 
  isOpen: boolean; 
  onOpenChange: (open: boolean) => void; 
  onSave: () => void; 
  loading: boolean;
  formData: any;
  setFormData: (data: any) => void;
  specializations: Specialization[];
}) {
  const [languageInput, setLanguageInput] = useState("")
  const [qualificationInput, setQualificationInput] = useState("")

  const availableDaysOptions = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ]

  const addLanguage = () => {
    if (languageInput.trim() && !formData.languages.includes(languageInput.trim())) {
      setFormData({
        ...formData,
        languages: [...formData.languages, languageInput.trim()]
      })
      setLanguageInput("")
    }
  }

  const removeLanguage = (language: string) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter((l: string) => l !== language)
    })
  }

  const addQualification = () => {
    if (qualificationInput.trim() && !formData.qualifications.includes(qualificationInput.trim())) {
      setFormData({
        ...formData,
        qualifications: [...formData.qualifications, qualificationInput.trim()]
      })
      setQualificationInput("")
    }
  }

  const removeQualification = (qualification: string) => {
    setFormData({
      ...formData,
      qualifications: formData.qualifications.filter((q: string) => q !== qualification)
    })
  }

  if (!doctor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Doctor</DialogTitle>
          <DialogDescription>
            Update the details for {doctor.staff?.name || doctor.doctorCode}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`} 
                alt="Doctor Avatar"
              />
              <AvatarFallback>DR</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{doctor.doctorCode}</p>
              <p className="text-sm text-muted-foreground">
                Avatar updates when you change the name
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-specialization">Specialization *</Label>
              <Select
                value={formData.specialization}
                onValueChange={(value) => setFormData({...formData, specialization: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  {specializations.map((spec) => (
                    <SelectItem key={spec._id || spec.name} value={spec.name}>
                      {spec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-department">Department</Label>
              <Input
                id="edit-department"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-experience">Experience</Label>
              <Input
                id="edit-experience"
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-education">Education</Label>
              <Input
                id="edit-education"
                value={formData.education}
                onChange={(e) => setFormData({...formData, education: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-consultationFee">Consultation Fee ($)</Label>
              <Input
                id="edit-consultationFee"
                type="number"
                value={formData.consultationFee}
                onChange={(e) => setFormData({...formData, consultationFee: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Languages</h4>
            <div className="flex gap-2 mb-2">
              <Input
                value={languageInput}
                onChange={(e) => setLanguageInput(e.target.value)}
                placeholder="Add language"
                onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
              />
              <Button type="button" onClick={addLanguage}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.languages.map((language: string, index: number) => (
                <Badge key={`${language}-${index}`} variant="secondary" className="flex items-center gap-1">
                  {language}
                  <button
                    type="button"
                    onClick={() => removeLanguage(language)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Qualifications</h4>
            <div className="flex gap-2 mb-2">
              <Input
                value={qualificationInput}
                onChange={(e) => setQualificationInput(e.target.value)}
                placeholder="Add qualification"
                onKeyPress={(e) => e.key === 'Enter' && addQualification()}
              />
              <Button type="button" onClick={addQualification}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.qualifications.map((qualification: string, index: number) => (
                <Badge key={`${qualification}-${index}`} variant="outline" className="flex items-center gap-1">
                  {qualification}
                  <button
                    type="button"
                    onClick={() => removeQualification(qualification)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Available Days</h4>
            <div className="flex flex-wrap gap-2">
              {availableDaysOptions.map((day) => (
                <Badge
                  key={day}
                  variant={formData.availableDays.includes(day) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    const newDays = formData.availableDays.includes(day)
                      ? formData.availableDays.filter((d: string) => d !== day)
                      : [...formData.availableDays, day]
                    setFormData({...formData, availableDays: newDays})
                  }}
                >
                  {day}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-availableHoursStart">Available Hours Start</Label>
              <Input
                id="edit-availableHoursStart"
                type="time"
                value={formData.availableHours.start}
                onChange={(e) => setFormData({
                  ...formData,
                  availableHours: {...formData.availableHours, start: e.target.value}
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-availableHoursEnd">Available Hours End</Label>
              <Input
                id="edit-availableHoursEnd"
                type="time"
                value={formData.availableHours.end}
                onChange={(e) => setFormData({
                  ...formData,
                  availableHours: {...formData.availableHours, end: e.target.value}
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-isAvailable">Availability</Label>
              <Select
                value={formData.isAvailable ? "available" : "unavailable"}
                onValueChange={(value) => setFormData({
                  ...formData,
                  isAvailable: value === "available"
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") => 
                  setFormData({...formData, status: value})
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

          <div className="space-y-2">
            <Label htmlFor="edit-bio">Bio/Description</Label>
            <Textarea
              id="edit-bio"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onSave} 
            className="bg-[#5B6EF5] hover:bg-[#4A5DE4]"
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Update Doctor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Delete Doctor Dialog Component
function DeleteDoctorDialog({ 
  doctor, 
  isOpen, 
  onOpenChange, 
  onDelete,
  loading
}: { 
  doctor: Doctor | null; 
  isOpen: boolean; 
  onOpenChange: (open: boolean) => void; 
  onDelete: (deleteStaff: boolean, deleteUser: boolean) => void;
  loading: boolean;
}) {
  const [deleteStaff, setDeleteStaff] = useState(false)
  const [deleteUser, setDeleteUser] = useState(false)

  if (!doctor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Doctor
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete Dr. {doctor.staff?.name || doctor.doctorCode}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-red-50 p-3 rounded-md border border-red-200">
            <div className="flex items-center gap-2 text-red-800 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Warning: This action will affect:</span>
            </div>
            <ul className="text-sm text-red-700 space-y-1 list-disc pl-4">
              <li>Doctor record: {doctor.doctorCode}</li>
              <li>Staff record: {doctor.staff?.name || "Unknown"} - {doctor.staff?.email || "No email"}</li>
              <li>User account: {doctor.user?.username || "No user"} - {doctor.user?.email || "No email"}</li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="deleteStaff"
                checked={deleteStaff}
                onChange={(e) => setDeleteStaff(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="deleteStaff" className="text-sm font-medium">
                Also delete associated staff record
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="deleteUser"
                checked={deleteUser}
                onChange={(e) => setDeleteUser(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="deleteUser" className="text-sm font-medium">
                Also delete associated user account
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Note: Deleting staff/user will remove all associated data including appointments and records.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => onDelete(deleteStaff, deleteUser)} 
            variant="destructive"
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete Doctor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Main Component
export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([])
  const [availableStaff, setAvailableStaff] = useState<StaffForDoctor[]>([])
  const [specializations, setSpecializations] = useState<Specialization[]>([])
  const [doctorStats, setDoctorStats] = useState({
    totalDoctors: 0,
    availableDoctors: 0,
    doctorsWithActiveStaff: 0,
    averageRating: "0.0",
    topSpecializations: []
  })
  
  const [searchQuery, setSearchQuery] = useState("")
  const [specializationFilter, setSpecializationFilter] = useState("all")
  const [availabilityFilter, setAvailabilityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  
  // Dialog states
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    staffId: "",
    name: "",
    email: "",
    phoneNumber: "",
    specialization: "",
    department: "",
    experience: "",
    education: "",
    consultationFee: 0,
    bio: "",
    languages: [] as string[],
    qualifications: [] as string[],
    availableDays: [] as string[],
    availableHours: {
      start: "09:00",
      end: "17:00"
    },
    isAvailable: true,
    status: "active" as "active" | "inactive",
    // User account fields (for new staff)
    username: "",
    password: "",
    userExists: false
  })
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const { toast } = useToast()

  // Fetch doctors, stats, and available staff on mount
  useEffect(() => {
    fetchDoctors()
    fetchDoctorStats()
    fetchAvailableStaff()
    fetchSpecializations()
  }, [])

  // Apply filters whenever doctors or filter states change
  useEffect(() => {
    applyFilters()
  }, [doctors, searchQuery, specializationFilter, availabilityFilter, statusFilter])

  const applyFilters = () => {
    let result = [...doctors]

    // Apply specialization filter
    if (specializationFilter !== 'all') {
      result = result.filter(d => 
        d.specialization.toLowerCase() === specializationFilter.toLowerCase()
      )
    }
    
    // Apply availability filter
    if (availabilityFilter !== 'all') {
      result = result.filter(d => 
        (availabilityFilter === 'available' && d.isAvailable) ||
        (availabilityFilter === 'unavailable' && !d.isAvailable)
      )
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(d => 
        getStaffStatus(d) === statusFilter
      )
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(d => {
        const staffName = getStaffName(d).toLowerCase()
        const staffEmail = getStaffEmail(d).toLowerCase()
        
        return (
          staffName.includes(query) ||
          staffEmail.includes(query) ||
          d.specialization.toLowerCase().includes(query) ||
          d.doctorCode.toLowerCase().includes(query) ||
          d.department?.toLowerCase().includes(query) ||
          d.education.toLowerCase().includes(query)
        )
      })
    }

    setFilteredDoctors(result)
  }

  const fetchDoctors = async () => {
    try {
      setFetching(true)
      const response = await axiosClient.get('/doctors')
      
      if (response.data.success) {
        setDoctors(response.data.data || [])
      } else {
        setDoctors([])
      }
    } catch (error: any) {
      console.error("Error fetching doctors:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to fetch doctors",
        variant: "destructive"
      })
      setDoctors([])
    } finally {
      setFetching(false)
    }
  }

  const fetchDoctorStats = async () => {
    try {
      const response = await axiosClient.get('/doctors/stats')
      if (response.data.success) {
        setDoctorStats(response.data.data || {
          totalDoctors: 0,
          availableDoctors: 0,
          doctorsWithActiveStaff: 0,
          averageRating: "0.0",
          topSpecializations: []
        })
      }
    } catch (error: any) {
      console.error("Error fetching doctor stats:", error)
      setDoctorStats({
        totalDoctors: 0,
        availableDoctors: 0,
        doctorsWithActiveStaff: 0,
        averageRating: "0.0",
        topSpecializations: []
      })
    }
  }

  const fetchAvailableStaff = async () => {
    try {
      const response = await axiosClient.get('/staff')
      if (response.data.success) {
        // Filter staff who are not already doctors
        const staffData = response.data.data || []
        const filteredStaff = staffData.filter((staff: any) => 
          staff.role !== 'doctor' && staff.status === 'active'
        )
        setAvailableStaff(filteredStaff)
      }
    } catch (error: any) {
      console.error("Error fetching available staff:", error)
      setAvailableStaff([])
    }
  }

  const fetchSpecializations = async () => {
    try {
      // Try doctors/specializations endpoint first
      const response = await axiosClient.get('/doctors/specializations')
      if (response.data.success && response.data.data) {
        // Handle different response structures
        if (response.data.data.specializations && Array.isArray(response.data.data.specializations)) {
          setSpecializations(response.data.data.specializations)
        } else if (Array.isArray(response.data.data)) {
          setSpecializations(response.data.data)
        } else {
          setSpecializations([])
        }
      } else {
        setSpecializations([])
      }
    } catch (error: any) {
      console.log("Specializations endpoint not available")
      // Use default specializations
      setSpecializations([
        { name: "Cardiology" },
        { name: "Neurology" },
        { name: "Orthopedics" },
        { name: "Pediatrics" },
        { name: "Dermatology" },
        { name: "Gynecology" },
        { name: "General Medicine" },
        { name: "Etc" },
      ])
    }
  }

  const handleAddDoctor = async () => {
    // Validation
    if (!formData.specialization) {
      toast({
        title: "Validation Error",
        description: "Specialization is required",
        variant: "destructive"
      })
      return
    }

    if (formData.staffId === 'new') {
      // Validate new staff fields
      if (!formData.name || !formData.email || !formData.username) {
        toast({
          title: "Validation Error",
          description: "Name, email, and username are required",
          variant: "destructive"
        })
        return
      }
    } else if (!formData.staffId) {
      toast({
        title: "Validation Error",
        description: "Please select a staff member",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      let staffId = formData.staffId

      // If creating new staff
      if (formData.staffId === 'new') {
        // First create staff with user
        const staffPayload = {
          name: formData.name,
          email: formData.email,
          role: "doctor",
          specialization: formData.specialization,
          phoneNumber: formData.phoneNumber,
          status: formData.status,
          createUser: true,
          username: formData.username,
          password: formData.password || "Temp123!", // Temporary password
          confirmPassword: formData.password || "Temp123!"
        }

        const staffResponse = await axiosClient.post('/staff', staffPayload)
        if (!staffResponse.data.success) {
          throw new Error("Failed to create staff")
        }
        
        staffId = staffResponse.data.data._id
      }

      // Now create doctor
      const doctorPayload = {
        staffId,
        specialization: formData.specialization,
        department: formData.department,
        experience: formData.experience || "0 years",
        education: formData.education || "Medical Degree",
        consultationFee: formData.consultationFee || 0,
        bio: formData.bio,
        languages: formData.languages,
        qualifications: formData.qualifications,
        availableDays: formData.availableDays,
        availableHours: formData.availableHours,
        isAvailable: formData.isAvailable
      }

      const response = await axiosClient.post('/doctors', doctorPayload)
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Doctor created successfully",
          variant: "default"
        })
        
        // Refresh data
        fetchDoctors()
        fetchDoctorStats()
        fetchAvailableStaff()
        
        // Reset and close
        resetForm()
        setIsAddDialogOpen(false)
      }
    } catch (error: any) {
      console.error("Error creating doctor:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create doctor",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDoctor = async () => {
    if (!selectedDoctor) return

    // Validation
    if (!formData.specialization) {
      toast({
        title: "Validation Error",
        description: "Specialization is required",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Update doctor-specific info
      const doctorPayload = {
        specialization: formData.specialization,
        department: formData.department,
        experience: formData.experience,
        education: formData.education,
        consultationFee: formData.consultationFee,
        bio: formData.bio,
        languages: formData.languages,
        qualifications: formData.qualifications,
        availableDays: formData.availableDays,
        availableHours: formData.availableHours,
        isAvailable: formData.isAvailable,
        status: formData.status
      }

      console.log("Updating doctor with payload:", doctorPayload);

      const response = await axiosClient.put(`/doctors/${selectedDoctor._id}`, doctorPayload)

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Doctor updated successfully",
          variant: "default"
        })
        
        // Refresh data
        fetchDoctors()
        fetchDoctorStats()
        
        // Close dialog
        setIsEditDialogOpen(false)
        resetForm()
      }
    } catch (error: any) {
      console.error("Error updating doctor:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update doctor",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDoctor = async (deleteStaff: boolean, deleteUser: boolean) => {
    if (!selectedDoctor) return

    setLoading(true)
    try {
      console.log(`Deleting doctor ${selectedDoctor._id} with options:`, {
        deleteStaff,
        deleteUser
      });

      const response = await axiosClient.delete(`/doctors/${selectedDoctor._id}`, {
        params: {
          deleteStaff: deleteStaff.toString(),
          deleteUser: deleteUser.toString()
        }
      })
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: response.data.message || "Doctor deleted successfully",
          variant: "default"
        })
        
        // Remove from local state
        setDoctors(doctors.filter(d => d._id !== selectedDoctor._id))
        
        // Refresh stats
        fetchDoctorStats()
        fetchAvailableStaff()
        
        // Close dialog
        setIsDeleteDialogOpen(false)
      }
    } catch (error: any) {
      console.error("Error deleting doctor:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete doctor",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setIsViewDialogOpen(true)
  }

  const handleEditDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setFormData({
      staffId: doctor.staff?._id || "",
      name: doctor.staff?.name || "",
      email: doctor.staff?.email || "",
      phoneNumber: doctor.staff?.phoneNumber || "",
      specialization: doctor.specialization,
      department: doctor.department || "",
      experience: doctor.experience,
      education: doctor.education,
      consultationFee: doctor.consultationFee,
      bio: doctor.bio || "",
      languages: doctor.languages || [],
      qualifications: doctor.qualifications || [],
      availableDays: doctor.availableDays || [],
      availableHours: doctor.availableHours || { start: "09:00", end: "17:00" },
      isAvailable: doctor.isAvailable,
      status: doctor.staff?.status || "active",
      username: doctor.user?.username || "",
      password: "",
      userExists: !!doctor.user
    })
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setIsDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setSelectedDoctor(null)
    setFormData({
      staffId: "",
      name: "",
      email: "",
      phoneNumber: "",
      specialization: "",
      department: "",
      experience: "",
      education: "",
      consultationFee: 0,
      bio: "",
      languages: [],
      qualifications: [],
      availableDays: [],
      availableHours: {
        start: "09:00",
        end: "17:00"
      },
      isAvailable: true,
      status: "active",
      username: "",
      password: "",
      userExists: false
    })
  }

  const handleSearch = useCallback(
    debounce(() => {
      applyFilters()
    }, 300),
    []
  )

  const clearFilters = () => {
    setSearchQuery("")
    setSpecializationFilter("all")
    setAvailabilityFilter("all")
    setStatusFilter("all")
  }

  // Get unique specializations for filter
  const specializationOptions = Array.from(new Set(doctors.map(d => d.specialization))).filter(Boolean)

  return (
    <div className="flex-1 overflow-auto">
      <Header 
        title="Doctor Management" 
        subtitle="Manage and view all doctors in the clinic"
      />
      
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <DoctorStats stats={doctorStats} />

        {/* Main Card */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Doctors Directory</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Showing {filteredDoctors.length} of {doctors.length} doctors
              </p>
            </div>
            
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-[#5B6EF5] hover:bg-[#4A5DE4]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Doctor
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, specialization, or department..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    handleSearch()
                  }}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specializations</SelectItem>
                    {specializationOptions.map((spec) => (
                      <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => {
                    fetchDoctors()
                    fetchDoctorStats()
                  }}
                  variant="outline"
                  size="icon"
                  title="Refresh"
                >
                  <Loader2 className="h-4 w-4" />
                </Button>
                {(searchQuery || specializationFilter !== 'all' || availabilityFilter !== 'all' || statusFilter !== 'all') && (
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

            {/* Doctors List */}
            {fetching ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading doctors...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDoctors.map((doctor) => {
                  const staffName = getStaffName(doctor);
                  const staffStatus = getStaffStatus(doctor);
                  
                  return (
                    <Card key={doctor._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage 
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${staffName}`} 
                                alt={staffName} 
                              />
                              <AvatarFallback>
                                {staffName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-lg">{staffName}</h3>
                              <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                              <div className="flex items-center mt-1">
                                <Star className="h-3 w-3 fill-amber-500 text-amber-500 mr-1" />
                                <span className="text-sm font-medium">{doctor.rating.toFixed(1)}</span>
                                <Badge 
                                  className="ml-2"
                                  variant={doctor.isAvailable ? "default" : "secondary"}
                                >
                                  {doctor.isAvailable ? "Available" : "Unavailable"}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className="ml-2 text-xs"
                                >
                                  {doctor.doctorCode}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Stethoscope className="h-4 w-4 mr-2" />
                            {doctor.department || "No department specified"}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Award className="h-4 w-4 mr-2" />
                            {doctor.experience}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <GraduationCap className="h-4 w-4 mr-2" />
                            {doctor.education}
                          </div>
                          <div className="flex items-center text-sm">
                            <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                            <span className="font-semibold">Fee: </span>
                            <span className="ml-2 text-primary">${doctor.consultationFee}</span>
                          </div>
                          {doctor.languages && doctor.languages.length > 0 && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Globe className="h-4 w-4 mr-2" />
                              <span className="truncate">{doctor.languages.join(", ")}</span>
                            </div>
                          )}
                        </div>

                        <Separator className="my-4" />

                        <div className="flex justify-between">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleViewDoctor(doctor)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEditDoctor(doctor)}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDeleteClick(doctor)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {!fetching && filteredDoctors.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No doctors found</p>
                <p className="text-sm mt-2">
                  {searchQuery || specializationFilter !== 'all' || availabilityFilter !== 'all' || statusFilter !== 'all' 
                    ? "Try clearing filters or using different search terms" 
                    : "Click 'Add Doctor' to get started"}
                </p>
                {(searchQuery || specializationFilter !== 'all' || availabilityFilter !== 'all' || statusFilter !== 'all') && (
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
          </CardContent>
        </Card>
      </div>

      {/* View Doctor Dialog */}
      <ViewDoctorDialog 
        doctor={selectedDoctor}
        isOpen={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />

      {/* Add Doctor Dialog */}
      <AddDoctorDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleAddDoctor}
        loading={loading}
        formData={formData}
        setFormData={setFormData}
        specializations={specializations}
        availableStaff={availableStaff}
      />

      {/* Edit Doctor Dialog */}
      <EditDoctorDialog 
        doctor={selectedDoctor}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleUpdateDoctor}
        loading={loading}
        formData={formData}
        setFormData={setFormData}
        specializations={specializations}
      />

      {/* Delete Doctor Dialog */}
      <DeleteDoctorDialog 
        doctor={selectedDoctor}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDelete={handleDeleteDoctor}
        loading={loading}
      />
    </div>
  )
}