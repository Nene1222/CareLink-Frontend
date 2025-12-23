"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Users, TrendingUp, Download, BarChart3, PieChart, LineChart } from "lucide-react"
import {
  BarChart,
  Bar,
  PieChart as PieChartComponent,
  Pie,
  Cell,
  LineChart as LineChartComponent,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("3months")

  const reportData = [
    { month: "January", appointments: 24, checkIns: 18, newPatients: 5, revenue: 4800 },
    { month: "February", appointments: 32, checkIns: 26, newPatients: 8, revenue: 6400 },
    { month: "March", appointments: 28, checkIns: 22, newPatients: 6, revenue: 5600 },
  ]

  const departmentData = [
    { name: "General Medicine", value: 35, appointments: 24 },
    { name: "Cardiology", value: 25, appointments: 18 },
    { name: "Pediatrics", value: 20, appointments: 14 },
    { name: "Laboratory", value: 20, appointments: 12 },
  ]

  const staffPerformance = [
    { name: "Dr. Sarah Johnson", appointments: 24, rating: 4.8, patients: 156 },
    { name: "Dr. Michael Chen", appointments: 18, rating: 4.6, patients: 132 },
    { name: "Dr. James Martinez", appointments: 14, rating: 4.9, patients: 98 },
    { name: "Nurse Emma Wilson", appointments: 12, rating: 4.7, patients: 85 },
  ]

  const appointmentStatus = [
    { name: "Completed", value: 68, color: "#22c55e" },
    { name: "Pending", value: 18, color: "#f59e0b" },
    { name: "Cancelled", value: 14, color: "#ef4444" },
  ]

  const metrics = {
    avgAppointments: 28,
    avgAttendance: 22,
    newPatients: 6,
    staffUtilization: 87,
    appointmentCompletion: 68,
    avgRating: 4.75,
  }

  const handleExportReport = () => {
    const reportContent = `
Clinic Management System - Monthly Report
Generated: ${new Date().toLocaleDateString()}

METRICS SUMMARY:
- Average Appointments/Month: ${metrics.avgAppointments}
- Average Attendance/Month: ${metrics.avgAttendance}
- New Patients/Month: ${metrics.newPatients}
- Staff Utilization: ${metrics.staffUtilization}%
- Appointment Completion Rate: ${metrics.appointmentCompletion}%
- Average Staff Rating: ${metrics.avgRating}/5

MONTHLY DATA:
${reportData.map((d) => `${d.month}: ${d.appointments} appointments, ${d.checkIns} check-ins, ${d.newPatients} new patients`).join("\n")}
    `
    const blob = new Blob([reportContent], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `report-${new Date().toISOString().split("T")[0]}.txt`
    a.click()
  }

  const COLORS = ["#5B6EF5", "#10b981", "#f59e0b", "#ef4444"]

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Reports & Analytics" subtitle="View clinic performance metrics and analytics" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="w-full sm:w-auto">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last 1 Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last 1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleExportReport} className="bg-[#5B6EF5] hover:bg-[#4A5DE4]">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Appointments/Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgAppointments}</div>
              <p className="text-xs text-green-600 mt-1">+12% from last quarter</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Attendance/Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgAttendance}</div>
              <p className="text-xs text-green-600 mt-1">+8% from last quarter</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">New Patients/Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.newPatients}</div>
              <p className="text-xs text-green-600 mt-1">+5% from last quarter</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Staff Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.staffUtilization}%</div>
              <p className="text-xs text-green-600 mt-1">Optimal performance</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Appointment Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.appointmentCompletion}%</div>
              <p className="text-xs text-green-600 mt-1">Excellent completion rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Staff Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgRating}/5</div>
              <p className="text-xs text-green-600 mt-1">Very satisfied patients</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-[#5B6EF5]" />
              <CardTitle>Monthly Trends</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChartComponent data={reportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="appointments" stroke="#5B6EF5" strokeWidth={2} />
                <Line type="monotone" dataKey="checkIns" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="newPatients" stroke="#f59e0b" strokeWidth={2} />
              </LineChartComponent>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#5B6EF5]" />
                <CardTitle>Department-wise Appointments</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="appointments" fill="#5B6EF5" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-[#5B6EF5]" />
                <CardTitle>Appointment Status Distribution</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChartComponent>
                  <Pie
                    data={appointmentStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {appointmentStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChartComponent>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#5B6EF5]" />
              <CardTitle>Staff Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {staffPerformance.map((staff, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{staff.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {staff.appointments} appointments • {staff.patients} patients
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-lg font-bold text-[#5B6EF5]">{staff.rating}</span>
                      <span className="text-yellow-500">★</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#5B6EF5]" />
              <CardTitle>Monthly Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {reportData.map((data, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{data.month}</h3>
                    <span className="text-sm text-muted-foreground">Revenue: ${data.revenue}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#5B6EF5]" />
                        <span className="text-sm text-muted-foreground">Appointments</span>
                      </div>
                      <p className="text-lg font-semibold">{data.appointments}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-muted-foreground">Check-ins</span>
                      </div>
                      <p className="text-lg font-semibold">{data.checkIns}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-muted-foreground">New Patients</span>
                      </div>
                      <p className="text-lg font-semibold">{data.newPatients}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Completion</span>
                      </div>
                      <p className="text-lg font-semibold">{Math.round((data.appointments / 35) * 100)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
