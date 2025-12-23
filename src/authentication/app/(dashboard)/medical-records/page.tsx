"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Edit, Download, Trash2, Plus, FileDown, Save } from "lucide-react"
import jsPDF from "jspdf"

interface MedicalRecord {
  id: string
  patientId: string
  patientName: string
  age: number
  gender: "Male" | "Female" | "Other"
  dateOfVisit: string
  status: "complete" | "draft"
  diagnosis: string
  doctor: string
  patientInfo: {
    phone: string
    email: string
    address: string
  }
  medicalHistory: string
  vitalSigns: {
    bloodPressure: string
    heartRate: string
    temperature: string
    respiratoryRate: string
  }
  physicalExamination: string
  diagnosisTests: string
  treatmentPlan: string
  doctorCertification: string
}

const mockRecords: MedicalRecord[] = [
  {
    id: "MR001",
    patientId: "P101",
    patientName: "John Doe",
    age: 45,
    gender: "Male",
    dateOfVisit: "2025-01-15",
    status: "complete",
    diagnosis: "Hypertension",
    doctor: "Dr. Sarah Johnson",
    patientInfo: { phone: "555-0101", email: "john@example.com", address: "123 Main St" },
    medicalHistory: "Diabetes Type 2, Asthma",
    vitalSigns: { bloodPressure: "140/90", heartRate: "78", temperature: "98.6", respiratoryRate: "16" },
    physicalExamination: "Normal",
    diagnosisTests: "ECG Normal, Blood tests pending",
    treatmentPlan: "Lisinopril 10mg daily",
    doctorCertification: "Certified and approved",
  },
  {
    id: "MR002",
    patientId: "P102",
    patientName: "Jane Smith",
    age: 32,
    gender: "Female",
    dateOfVisit: "2025-01-14",
    status: "draft",
    diagnosis: "Common Cold",
    doctor: "Dr. Michael Chen",
    patientInfo: { phone: "555-0102", email: "jane@example.com", address: "456 Oak Ave" },
    medicalHistory: "No significant history",
    vitalSigns: { bloodPressure: "120/80", heartRate: "72", temperature: "99.2", respiratoryRate: "18" },
    physicalExamination: "Mild congestion",
    diagnosisTests: "Rapid antigen test negative",
    treatmentPlan: "Rest and fluids",
    doctorCertification: "Pending",
  },
]

export default function MedicalRecords() {
  const [records, setRecords] = useState<MedicalRecord[]>(mockRecords)
  const [activeTab, setActiveTab] = useState("list")
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const [formData, setFormData] = useState<Partial<MedicalRecord>>({
    patientInfo: {},
    vitalSigns: {},
  })

  const handleAddNew = () => {
    setFormData({
      patientInfo: {},
      vitalSigns: {},
    })
    setIsEditing(false)
    setShowFormDialog(true)
  }

  const handleEditRecord = (record: MedicalRecord) => {
    setFormData(record)
    setIsEditing(true)
    setShowFormDialog(true)
  }

  const handleViewRecord = (record: MedicalRecord) => {
    setSelectedRecord(record)
    setShowViewDialog(true)
  }

  const handleDeleteClick = (record: MedicalRecord) => {
    setSelectedRecord(record)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = () => {
    if (selectedRecord) {
      setRecords(records.filter((r) => r.id !== selectedRecord.id))
      setShowDeleteDialog(false)
    }
  }

  const handleSaveDraft = () => {
    if (isEditing && selectedRecord) {
      setRecords(records.map((r) => (r.id === selectedRecord.id ? { ...(formData as MedicalRecord) } : r)))
    } else {
      const newRecord: MedicalRecord = {
        id: `MR${String(records.length + 1).padStart(3, "0")}`,
        dateOfVisit: new Date().toISOString().split("T")[0],
        status: "draft",
        ...(formData as any),
      }
      setRecords([...records, newRecord])
    }
    setShowFormDialog(false)
  }

  const handleCompleteRecord = () => {
    if (formData) {
      if (isEditing && selectedRecord) {
        setRecords(
          records.map((r) => (r.id === selectedRecord.id ? { ...(formData as MedicalRecord), status: "complete" } : r)),
        )
      } else {
        const newRecord: MedicalRecord = {
          id: `MR${String(records.length + 1).padStart(3, "0")}`,
          dateOfVisit: new Date().toISOString().split("T")[0],
          status: "complete",
          ...(formData as any),
        }
        setRecords([...records, newRecord])
      }
      setShowFormDialog(false)
    }
  }

  const handleDownloadExcel = () => {
    const csvContent = [
      ["Record ID", "Patient Name", "Patient ID", "Age", "Gender", "Date of Visit", "Diagnosis", "Doctor", "Status"],
      ...records.map((r) => [
        r.id,
        r.patientName,
        r.patientId,
        r.age,
        r.gender,
        r.dateOfVisit,
        r.diagnosis,
        r.doctor,
        r.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `medical-records-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const handleDownloadPDF = (record: MedicalRecord) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 10
    let yPos = 20

    doc.setFontSize(16)
    doc.text("Medical Record", margin, yPos)
    yPos += 10

    doc.setFontSize(10)
    const info = [
      `Record ID: ${record.id}`,
      `Patient Name: ${record.patientName}`,
      `Patient ID: ${record.patientId}`,
      `Age/Gender: ${record.age}/${record.gender}`,
      `Date of Visit: ${record.dateOfVisit}`,
      `Doctor: ${record.doctor}`,
      `Status: ${record.status}`,
      `Diagnosis: ${record.diagnosis}`,
    ]

    info.forEach((line) => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 10
      }
      doc.text(line, margin, yPos)
      yPos += 5
    })

    doc.save(`medical-record-${record.id}.pdf`)
  }

  return (
    <div className="flex-1 overflow-auto flex flex-col">
      <Header title="Medical Records" subtitle="Manage patient medical records and documentation" />

      <div className="flex-1 overflow-y-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="list">Records List</TabsTrigger>
            <TabsTrigger value="form">Add Record</TabsTrigger>
          </TabsList>

          {/* Records List Tab */}
          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Medical Records</h3>
              <div className="flex gap-2">
                <Button onClick={handleDownloadExcel} variant="outline" className="gap-2 bg-transparent">
                  <FileDown className="h-4 w-4" />
                  Download Excel
                </Button>
                <Button onClick={handleAddNew} className="gap-2 bg-primary">
                  <Plus className="h-4 w-4" />
                  Add New Record
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold">Record ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Patient Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Patient ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Age/Gender</th>
                    <th className="px-4 py-3 text-left font-semibold">Date of Visit</th>
                    <th className="px-4 py-3 text-left font-semibold">Diagnosis</th>
                    <th className="px-4 py-3 text-left font-semibold">Doctor</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-muted/50 transition">
                      <td className="px-4 py-3">{record.id}</td>
                      <td className="px-4 py-3">{record.patientName}</td>
                      <td className="px-4 py-3">{record.patientId}</td>
                      <td className="px-4 py-3">
                        {record.age}/{record.gender}
                      </td>
                      <td className="px-4 py-3">{record.dateOfVisit}</td>
                      <td className="px-4 py-3">{record.diagnosis}</td>
                      <td className="px-4 py-3">{record.doctor}</td>
                      <td className="px-4 py-3">
                        <Badge variant={record.status === "complete" ? "default" : "secondary"}>{record.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewRecord(record)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEditRecord(record)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(record)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteClick(record)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Form Tab */}
          <TabsContent value="form" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Patient Information */}
              <Card className="border-primary/20">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-base">1. Patient Information</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Patient Name</label>
                      <Input
                        placeholder="Enter patient name"
                        value={formData.patientName || ""}
                        onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Patient ID</label>
                      <Input
                        placeholder="Enter patient ID"
                        value={formData.patientId || ""}
                        onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Age</label>
                      <Input
                        type="number"
                        placeholder="Enter age"
                        value={formData.age || ""}
                        onChange={(e) => setFormData({ ...formData, age: Number.parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Gender</label>
                      <select className="w-full border rounded px-3 py-2">
                        <option>Select Gender</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Phone</label>
                      <Input
                        placeholder="Enter phone number"
                        value={formData.patientInfo?.phone || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, patientInfo: { ...formData.patientInfo, phone: e.target.value } })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        placeholder="Enter email"
                        value={formData.patientInfo?.email || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, patientInfo: { ...formData.patientInfo, email: e.target.value } })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Address</label>
                      <Input
                        placeholder="Enter address"
                        value={formData.patientInfo?.address || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            patientInfo: { ...formData.patientInfo, address: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medical History */}
              <Card className="border-primary/20">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-base">2. Medical History</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <textarea
                    className="w-full border rounded px-3 py-2 min-h-24"
                    placeholder="Enter medical history..."
                    value={formData.medicalHistory || ""}
                    onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  />
                </CardContent>
              </Card>

              {/* Vital Signs */}
              <Card className="border-primary/20">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-base">3. Vital Signs</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Blood Pressure</label>
                      <Input
                        placeholder="e.g., 120/80"
                        value={formData.vitalSigns?.bloodPressure || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vitalSigns: { ...formData.vitalSigns, bloodPressure: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Heart Rate</label>
                      <Input
                        placeholder="e.g., 72"
                        value={formData.vitalSigns?.heartRate || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vitalSigns: { ...formData.vitalSigns, heartRate: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Temperature (°F)</label>
                      <Input
                        placeholder="e.g., 98.6"
                        value={formData.vitalSigns?.temperature || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vitalSigns: { ...formData.vitalSigns, temperature: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Respiratory Rate</label>
                      <Input
                        placeholder="e.g., 16"
                        value={formData.vitalSigns?.respiratoryRate || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vitalSigns: { ...formData.vitalSigns, respiratoryRate: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Physical Examination */}
              <Card className="border-primary/20">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-base">4. Physical Examination</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <textarea
                    className="w-full border rounded px-3 py-2 min-h-24"
                    placeholder="Enter physical examination findings..."
                    value={formData.physicalExamination || ""}
                    onChange={(e) => setFormData({ ...formData, physicalExamination: e.target.value })}
                  />
                </CardContent>
              </Card>

              {/* Diagnosis & Tests */}
              <Card className="border-primary/20">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-base">5. Diagnosis & Tests</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium">Diagnosis</label>
                    <Input
                      placeholder="Enter diagnosis"
                      value={formData.diagnosis || ""}
                      onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Test Results</label>
                    <textarea
                      className="w-full border rounded px-3 py-2 min-h-20"
                      placeholder="Enter test results and findings..."
                      value={formData.diagnosisTests || ""}
                      onChange={(e) => setFormData({ ...formData, diagnosisTests: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Treatment Plan */}
              <Card className="border-primary/20">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-base">6. Treatment Plan</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <textarea
                    className="w-full border rounded px-3 py-2 min-h-24"
                    placeholder="Enter treatment plan and medications..."
                    value={formData.treatmentPlan || ""}
                    onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                  />
                </CardContent>
              </Card>

              {/* Doctor's Certification */}
              <Card className="border-primary/20">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-base">7. Doctor's Certification</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium">Consulting Doctor</label>
                    <Input
                      placeholder="Enter doctor name"
                      value={formData.doctor || ""}
                      onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Certification Notes</label>
                    <textarea
                      className="w-full border rounded px-3 py-2 min-h-20"
                      placeholder="Enter certification and approval notes..."
                      value={formData.doctorCertification || ""}
                      onChange={(e) => setFormData({ ...formData, doctorCertification: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end sticky bottom-0 bg-white p-4 border-t rounded-lg">
                <Button variant="outline" onClick={() => setShowFormDialog(false)}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={handleSaveDraft} className="gap-2 bg-transparent">
                  <Save className="h-4 w-4" />
                  Draft
                </Button>
                <Button onClick={handleCompleteRecord} className="gap-2 bg-primary">
                  <Plus className="h-4 w-4" />
                  Complete & Add Record
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Record Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Medical Record Details - {selectedRecord?.id}</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Patient Name:</span> {selectedRecord.patientName}
                </div>
                <div>
                  <span className="font-semibold">Patient ID:</span> {selectedRecord.patientId}
                </div>
                <div>
                  <span className="font-semibold">Age:</span> {selectedRecord.age}
                </div>
                <div>
                  <span className="font-semibold">Gender:</span> {selectedRecord.gender}
                </div>
                <div>
                  <span className="font-semibold">Date of Visit:</span> {selectedRecord.dateOfVisit}
                </div>
                <div>
                  <span className="font-semibold">Doctor:</span> {selectedRecord.doctor}
                </div>
                <div>
                  <span className="font-semibold">Diagnosis:</span> {selectedRecord.diagnosis}
                </div>
                <div>
                  <span className="font-semibold">Status:</span>{" "}
                  <Badge variant={selectedRecord.status === "complete" ? "default" : "secondary"}>
                    {selectedRecord.status}
                  </Badge>
                </div>
              </div>
              <hr />
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold">Medical History:</span>
                  <p className="text-muted-foreground">{selectedRecord.medicalHistory}</p>
                </div>
                <div>
                  <span className="font-semibold">Vital Signs:</span>
                  <p className="text-muted-foreground">
                    BP: {selectedRecord.vitalSigns.bloodPressure}, HR: {selectedRecord.vitalSigns.heartRate}, Temp:{" "}
                    {selectedRecord.vitalSigns.temperature}°F, RR: {selectedRecord.vitalSigns.respiratoryRate}
                  </p>
                </div>
                <div>
                  <span className="font-semibold">Physical Examination:</span>
                  <p className="text-muted-foreground">{selectedRecord.physicalExamination}</p>
                </div>
                <div>
                  <span className="font-semibold">Test Results:</span>
                  <p className="text-muted-foreground">{selectedRecord.diagnosisTests}</p>
                </div>
                <div>
                  <span className="font-semibold">Treatment Plan:</span>
                  <p className="text-muted-foreground">{selectedRecord.treatmentPlan}</p>
                </div>
                <div>
                  <span className="font-semibold">Doctor's Certification:</span>
                  <p className="text-muted-foreground">{selectedRecord.doctorCertification}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Medical Record</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this medical record ({selectedRecord?.id})? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
