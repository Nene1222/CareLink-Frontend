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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Plus, QrCode, CheckCircle, AlertCircle, Edit, Trash2, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Attendance {
  id: string
  profile?: string
  name: string
  staffId: string
  role: string
  organization: string
  room: string
  shift: string
  checkInTime: string
  checkOutTime?: string
  date: string
  status: "present" | "absent" | "late"
}

interface Organization {
  id: string
  name: string
  type: string
  recordType: string
  network: string
  logo?: string
}

interface OrganizationNetwork {
  id: string
  name: string
  ipAddress: string
}

const initialAttendance: Attendance[] = [
  {
    id: "1",
    profile: "👨‍⚕️",
    name: "Dr. Sarah Johnson",
    staffId: "S001",
    role: "General Physician",
    organization: "Main Clinic",
    room: "101",
    shift: "Morning",
    checkInTime: "08:45 AM",
    checkOutTime: undefined,
    date: new Date().toISOString().split("T")[0],
    status: "present",
  },
  {
    id: "2",
    profile: "👨‍⚕️",
    name: "Dr. Michael Chen",
    staffId: "S002",
    role: "Cardiologist",
    organization: "Main Clinic",
    room: "202",
    shift: "Morning",
    checkInTime: "09:15 AM",
    checkOutTime: undefined,
    date: new Date().toISOString().split("T")[0],
    status: "late",
  },
  {
    id: "3",
    profile: "👩‍⚕️",
    name: "Nurse Emma Wilson",
    staffId: "S003",
    role: "Registered Nurse",
    organization: "Main Clinic",
    room: "103",
    shift: "Morning",
    checkInTime: "08:30 AM",
    checkOutTime: "05:30 PM",
    date: new Date().toISOString().split("T")[0],
    status: "present",
  },
]

const staffRoles = [
  "General Physician",
  "Cardiologist",
  "Pediatrician",
  "Dermatologist",
  "Registered Nurse",
  "Receptionist",
]

const shifts = ["Morning", "Afternoon", "Evening", "Night"]

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>(initialAttendance)
  const [organizations, setOrganizations] = useState<Organization[]>([
    { id: "1", name: "Main Clinic", type: "Primary Care", recordType: "Hospital", network: "net1", logo: "🏥" },
    { id: "2", name: "Dental Center", type: "Dental", recordType: "Clinic", network: "net2", logo: "🦷" },
  ])
  const [networks, setNetworks] = useState<OrganizationNetwork[]>([
    { id: "1", name: "Main Network", ipAddress: "192.168.1.1" },
    { id: "2", name: "Secondary Network", ipAddress: "192.168.1.50" },
  ])

  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false)
  const [qrInput, setQrInput] = useState("")
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)
  const [isEditingAttendance, setIsEditingAttendance] = useState(false)
  const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null)
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false)
  const [isEditingOrg, setIsEditingOrg] = useState(false)
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null)
  const [isNetworkDialogOpen, setIsNetworkDialogOpen] = useState(false)
  const [isEditingNetwork, setIsEditingNetwork] = useState(false)
  const [editingNetworkId, setEditingNetworkId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string } | null>(null)
  const [generatingQR, setGeneratingQR] = useState<string | null>(null)

  const [manualData, setManualData] = useState({
    profile: "👤",
    name: "",
    staffId: "",
    role: "",
    organization: "",
    room: "",
    shift: "",
  })

  const [orgData, setOrgData] = useState({
    name: "",
    type: "",
    recordType: "",
    network: "",
    logo: "",
  })

  const [networkData, setNetworkData] = useState({
    name: "",
    ipAddress: "",
  })

  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "late" | "absent">("all")
  const [currentDeviceIP, setCurrentDeviceIP] = useState<string>("")
  const [ipValidationError, setIPValidationError] = useState<string>("")
  const [scannedOrgData, setScannedOrgData] = useState<{
    orgId: string
    orgName: string
    networkId: string
    isScanned: boolean
  } | null>(null)
  const [isQRScanning, setIsQRScanning] = useState(false)

  useEffect(() => {
    const fetchDeviceIP = async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json")
        if (response.ok) {
          const data = await response.json()
          setCurrentDeviceIP(data.ip)
          console.log("[v0] Device IP fetched:", data.ip)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch device IP:", error)
      }
    }
    fetchDeviceIP()
  }, [])

  const handleQRScan = () => {
    if (!qrInput.trim()) {
      setIPValidationError("Please enter QR code data")
      return
    }

    try {
      const parts = qrInput.split("|")
      if (parts[0] !== "ORG" || parts.length < 4) {
        setIPValidationError("Invalid QR code format")
        return
      }

      const orgId = parts[1]
      const orgName = parts[2]
      const networkId = parts[3]

      const org = organizations.find((o) => o.id === orgId)
      const network = networks.find((n) => n.id === networkId)

      if (!org || !network) {
        setIPValidationError("Organization or network not found")
        return
      }

      if (currentDeviceIP !== network.ipAddress) {
        setIPValidationError(
          `IP Mismatch! Device IP: ${currentDeviceIP}, Required IP: ${network.ipAddress}. You must be on the same network as ${orgName} to check in.`,
        )
        console.log("[v0] IP validation failed:", { deviceIP: currentDeviceIP, requiredIP: network.ipAddress })
        return
      }

      setScannedOrgData({ orgId, orgName, networkId, isScanned: true })
      setManualData({
        ...manualData,
        organization: orgName,
      })
      setIPValidationError("")
      setQrInput("")
      setIsQRDialogOpen(false)
      console.log("[v0] QR scan successful, org data:", { orgId, orgName, networkId })
    } catch (error) {
      setIPValidationError("Error processing QR code: " + String(error))
    }
  }

  const handleManualEntry = () => {
    if (manualData.name && manualData.staffId) {
      if (scannedOrgData && scannedOrgData.isScanned) {
        const org = organizations.find((o) => o.id === scannedOrgData.orgId)
        const network = networks.find((n) => n.id === scannedOrgData.networkId)

        if (!org || !network || currentDeviceIP !== network.ipAddress) {
          setIPValidationError("Network connection lost or IP changed. Please scan QR code again.")
          return
        }
      }

      if (isEditingAttendance && editingAttendanceId) {
        setAttendance(
          attendance.map((a) =>
            a.id === editingAttendanceId
              ? {
                  ...a,
                  ...manualData,
                  date: new Date().toISOString().split("T")[0],
                }
              : a,
          ),
        )
        setIsEditingAttendance(false)
        setEditingAttendanceId(null)
      } else {
        const newRecord: Attendance = {
          id: (attendance.length + 1).toString(),
          ...manualData,
          checkInTime: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          date: new Date().toISOString().split("T")[0],
          status: "present",
        }
        setAttendance([...attendance, newRecord])
      }
      setManualData({ profile: "👤", name: "", staffId: "", role: "", organization: "", room: "", shift: "" })
      setScannedOrgData(null)
      setIsManualDialogOpen(false)
    }
  }

  const handleEditAttendance = (record: Attendance) => {
    setManualData({
      profile: record.profile || "👤",
      name: record.name,
      staffId: record.staffId,
      role: record.role,
      organization: record.organization,
      room: record.room,
      shift: record.shift,
    })
    setEditingAttendanceId(record.id)
    setIsEditingAttendance(true)
    setIsManualDialogOpen(true)
  }

  const handleDeleteAttendance = (id: string) => {
    setAttendance(attendance.filter((a) => a.id !== id))
    setDeleteConfirm(null)
  }

  const handleSaveOrganization = () => {
    if (orgData.name) {
      if (isEditingOrg && editingOrgId) {
        setOrganizations(organizations.map((o) => (o.id === editingOrgId ? { ...o, ...orgData } : o)))
        setIsEditingOrg(false)
        setEditingOrgId(null)
      } else {
        const newOrg: Organization = {
          id: (organizations.length + 1).toString(),
          ...orgData,
        }
        setOrganizations([...organizations, newOrg])
      }
      setOrgData({ name: "", type: "", recordType: "", network: "", logo: "" })
      setIsOrgDialogOpen(false)
    }
  }

  const handleEditOrg = (org: Organization) => {
    setOrgData(org)
    setEditingOrgId(org.id)
    setIsEditingOrg(true)
    setIsOrgDialogOpen(true)
  }

  const handleDeleteOrg = (id: string) => {
    setOrganizations(organizations.filter((o) => o.id !== id))
    setDeleteConfirm(null)
  }

  const handleGenerateQR = (orgId: string) => {
    setGeneratingQR(orgId)
    setTimeout(() => {
      const org = organizations.find((o) => o.id === orgId)
      if (org) {
        const qrData = `ORG|${org.id}|${org.name}|${org.network}`
        const encodedData = btoa(qrData)
        console.log("[v0] QR Generated for org:", qrData)
        alert(`QR Generated for ${org.name}\nData: ${qrData}`)
      }
      setGeneratingQR(null)
    }, 500)
  }

  const handleSaveNetwork = () => {
    if (networkData.name && networkData.ipAddress) {
      if (isEditingNetwork && editingNetworkId) {
        setNetworks(networks.map((n) => (n.id === editingNetworkId ? { ...n, ...networkData } : n)))
        setIsEditingNetwork(false)
        setEditingNetworkId(null)
      } else {
        const newNetwork: OrganizationNetwork = {
          id: (networks.length + 1).toString(),
          ...networkData,
        }
        setNetworks([...networks, newNetwork])
      }
      setNetworkData({ name: "", ipAddress: "" })
      setIsNetworkDialogOpen(false)
    }
  }

  const handleEditNetwork = (network: OrganizationNetwork) => {
    setNetworkData(network)
    setEditingNetworkId(network.id)
    setIsEditingNetwork(true)
    setIsNetworkDialogOpen(true)
  }

  const handleDeleteNetwork = (id: string) => {
    setNetworks(networks.filter((n) => n.id !== id))
    setDeleteConfirm(null)
  }

  const handleFetchIP = async () => {
    try {
      const response = await fetch("https://api.ipify.org?format=json")
      if (response.ok) {
        const data = await response.json()
        setNetworkData({ ...networkData, ipAddress: data.ip })
      }
    } catch (error) {
      console.error("[v0] Failed to fetch IP:", error)
      setNetworkData({ ...networkData, ipAddress: "Unable to fetch" })
    }
  }

  const todayAttendance = attendance.filter((a) => a.date === new Date().toISOString().split("T")[0])
  const filteredAttendance =
    statusFilter === "all" ? todayAttendance : todayAttendance.filter((a) => a.status === statusFilter)

  const stats = {
    total: todayAttendance.length,
    present: todayAttendance.filter((a) => a.status === "present").length,
    late: todayAttendance.filter((a) => a.status === "late").length,
  }

  return (
    <div className="flex-1 overflow-auto">
      <Header
        title="Staff Attendance Management"
        subtitle="Track attendance, manage organizations, and configure networks"
      />
      <div className="p-6 space-y-6">
        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="attendance">Attendance List</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="networks">Networks</TabsTrigger>
          </TabsList>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Today's Check-ins</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Present</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Late</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.late}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Attendance Records</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#5B6EF5] hover:bg-[#4A5DE4]">
                        <QrCode className="h-4 w-4 mr-2" />
                        Scan QR
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Scan Staff QR Code</DialogTitle>
                        <DialogDescription>
                          Point your camera at the organization QR code to auto-fill form and validate network access
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Current Device IP</p>
                          <p className="text-sm font-mono">{currentDeviceIP || "Fetching..."}</p>
                        </div>

                        {scannedOrgData && scannedOrgData.isScanned && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm font-semibold text-green-900 mb-1">✓ Organization Detected</p>
                            <p className="text-sm text-green-800">{scannedOrgData.orgName}</p>
                            <p className="text-xs text-green-700 mt-1">Network validated successfully</p>
                          </div>
                        )}

                        {ipValidationError && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-semibold text-red-900 mb-1">⚠ Validation Error</p>
                            <p className="text-sm text-red-800">{ipValidationError}</p>
                          </div>
                        )}

                        <div className="w-full h-64 bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <QrCode className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">QR Camera Preview</p>
                            <p className="text-xs text-muted-foreground mt-1">Coming soon: Camera support</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="qr-input">Enter QR code data:</Label>
                          <Input
                            id="qr-input"
                            placeholder="ORG|1|Main Clinic|net1"
                            value={qrInput}
                            onChange={(e) => setQrInput(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleQRScan()}
                          />
                          <p className="text-xs text-muted-foreground">Format: ORG|orgId|orgName|networkId</p>
                        </div>
                        <Button
                          onClick={handleQRScan}
                          className="w-full bg-[#5B6EF5] hover:bg-[#4A5DE4]"
                          disabled={isQRScanning}
                        >
                          {isQRScanning ? "Processing..." : "Scan QR Code"}
                        </Button>
                        {scannedOrgData && scannedOrgData.isScanned && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsQRDialogOpen(false)
                            }}
                            className="w-full"
                          >
                            Continue to Form
                          </Button>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        {isEditingAttendance ? "Edit Record" : "Add Record"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{isEditingAttendance ? "Edit Attendance" : "Add Attendance Record"}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="profile">Profile Icon</Label>
                          <Input
                            id="profile"
                            value={manualData.profile}
                            onChange={(e) => setManualData({ ...manualData, profile: e.target.value })}
                            placeholder="👤"
                            maxLength={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={manualData.name}
                            onChange={(e) => setManualData({ ...manualData, name: e.target.value })}
                            placeholder="Full name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="staff-id">Staff ID</Label>
                          <Input
                            id="staff-id"
                            value={manualData.staffId}
                            onChange={(e) => setManualData({ ...manualData, staffId: e.target.value })}
                            placeholder="S001"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Select
                            value={manualData.role}
                            onValueChange={(value) => setManualData({ ...manualData, role: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {staffRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="org">Organization</Label>
                          <Select
                            value={manualData.organization}
                            onValueChange={(value) => setManualData({ ...manualData, organization: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select organization" />
                            </SelectTrigger>
                            <SelectContent>
                              {organizations.map((org) => (
                                <SelectItem key={org.id} value={org.name}>
                                  {org.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="room">Room</Label>
                          <Input
                            id="room"
                            value={manualData.room}
                            onChange={(e) => setManualData({ ...manualData, room: e.target.value })}
                            placeholder="101"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shift">Shift</Label>
                          <Select
                            value={manualData.shift}
                            onValueChange={(value) => setManualData({ ...manualData, shift: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select shift" />
                            </SelectTrigger>
                            <SelectContent>
                              {shifts.map((shift) => (
                                <SelectItem key={shift} value={shift}>
                                  {shift}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleManualEntry} className="w-full bg-[#5B6EF5] hover:bg-[#4A5DE4]">
                          {isEditingAttendance ? "Update Record" : "Add Record"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {filteredAttendance.map((record) => (
                    <div
                      key={record.id}
                      className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Profile</p>
                          <p className="text-lg font-semibold">{record.profile}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Name</p>
                          <p className="font-semibold text-sm">{record.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Role</p>
                          <p className="text-sm">{record.role}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Organization</p>
                          <p className="text-sm">{record.organization}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Room</p>
                          <p className="text-sm">{record.room}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Shift</p>
                          <p className="text-sm">{record.shift}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Check In/Out</p>
                          <p className="text-sm font-medium">
                            {record.checkInTime}
                            {record.checkOutTime && ` - ${record.checkOutTime}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant={
                            record.status === "present"
                              ? "default"
                              : record.status === "late"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {record.status === "present" && <CheckCircle className="h-3 w-3 mr-1" />}
                          {record.status === "late" && <AlertCircle className="h-3 w-3 mr-1" />}
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </Badge>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditAttendance(record)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteConfirm({ type: "attendance", id: record.id })}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredAttendance.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No attendance records found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Organizations</CardTitle>
                <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#5B6EF5] hover:bg-[#4A5DE4]">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Organization
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{isEditingOrg ? "Edit Organization" : "Add Organization"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="org-name">Name</Label>
                        <Input
                          id="org-name"
                          value={orgData.name}
                          onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                          placeholder="Organization name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="org-type">Type</Label>
                        <Select value={orgData.type} onValueChange={(value) => setOrgData({ ...orgData, type: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Primary Care">Primary Care</SelectItem>
                            <SelectItem value="Dental">Dental</SelectItem>
                            <SelectItem value="Specialist">Specialist</SelectItem>
                            <SelectItem value="Hospital">Hospital</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="record-type">Record Type</Label>
                        <Select
                          value={orgData.recordType}
                          onValueChange={(value) => setOrgData({ ...orgData, recordType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select record type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Hospital">Hospital</SelectItem>
                            <SelectItem value="Clinic">Clinic</SelectItem>
                            <SelectItem value="Lab">Lab</SelectItem>
                            <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="network">Network</Label>
                        <Select
                          value={orgData.network}
                          onValueChange={(value) => setOrgData({ ...orgData, network: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select network" />
                          </SelectTrigger>
                          <SelectContent>
                            {networks.map((net) => (
                              <SelectItem key={net.id} value={net.id}>
                                {net.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="org-logo">Logo (emoji or text)</Label>
                        <Input
                          id="org-logo"
                          value={orgData.logo}
                          onChange={(e) => setOrgData({ ...orgData, logo: e.target.value })}
                          placeholder="🏥"
                          maxLength={2}
                        />
                      </div>
                      <Button onClick={handleSaveOrganization} className="w-full bg-[#5B6EF5] hover:bg-[#4A5DE4]">
                        {isEditingOrg ? "Update Organization" : "Add Organization"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {organizations.map((org) => (
                    <div key={org.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-2xl mb-2">{org.logo}</p>
                          <h3 className="font-semibold">{org.name}</h3>
                          <p className="text-sm text-muted-foreground">{org.type}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm mb-4">
                        <p>
                          <span className="font-medium">Record Type:</span> {org.recordType}
                        </p>
                        <p>
                          <span className="font-medium">Network:</span>{" "}
                          {networks.find((n) => n.id === org.network)?.name || org.network}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditOrg(org)}>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[#5B6EF5] hover:bg-[#5B6EF5]/10 bg-transparent"
                          onClick={() => handleGenerateQR(org.id)}
                          disabled={generatingQR === org.id}
                        >
                          <QrCode className="h-3 w-3 mr-1" />
                          {generatingQR === org.id ? "Generating..." : "QR"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteConfirm({ type: "organization", id: org.id })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Networks Tab */}
          <TabsContent value="networks" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Organization Networks</CardTitle>
                <Dialog open={isNetworkDialogOpen} onOpenChange={setIsNetworkDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#5B6EF5] hover:bg-[#4A5DE4]">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Network
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{isEditingNetwork ? "Edit Network" : "Add Network"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="network-name">Network Name</Label>
                        <Input
                          id="network-name"
                          value={networkData.name}
                          onChange={(e) => setNetworkData({ ...networkData, name: e.target.value })}
                          placeholder="Network name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="network-ip">IP Address</Label>
                        <div className="flex gap-2">
                          <Input
                            id="network-ip"
                            value={networkData.ipAddress}
                            onChange={(e) => setNetworkData({ ...networkData, ipAddress: e.target.value })}
                            placeholder="192.168.1.1"
                          />
                          <Button
                            variant="outline"
                            onClick={handleFetchIP}
                            className="whitespace-nowrap bg-transparent"
                          >
                            <Download className="h-4 w-4" />
                            Fetch IP
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Click "Fetch IP" to get current IP address</p>
                      </div>
                      <Button onClick={handleSaveNetwork} className="w-full bg-[#5B6EF5] hover:bg-[#4A5DE4]">
                        {isEditingNetwork ? "Update Network" : "Add Network"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {networks.map((network) => (
                    <div
                      key={network.id}
                      className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold">{network.name}</h3>
                          <p className="text-sm text-muted-foreground">IP: {network.ipAddress}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditNetwork(network)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteConfirm({ type: "network", id: network.id })}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The record will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteConfirm) {
                  if (deleteConfirm.type === "attendance") {
                    handleDeleteAttendance(deleteConfirm.id)
                  } else if (deleteConfirm.type === "organization") {
                    handleDeleteOrg(deleteConfirm.id)
                  } else if (deleteConfirm.type === "network") {
                    handleDeleteNetwork(deleteConfirm.id)
                  }
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
