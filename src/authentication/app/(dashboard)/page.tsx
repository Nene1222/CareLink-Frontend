import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar, Package, Clock, TrendingUp, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const stats = [
    {
      label: "Total Appointments",
      value: "24",
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/appointments",
    },
    {
      label: "Staff Check-ins Today",
      value: "12",
      icon: Clock,
      color: "text-green-600",
      bg: "bg-green-50",
      href: "/attendance",
    },
    {
      label: "Low Stock Items",
      value: "5",
      icon: AlertCircle,
      color: "text-orange-600",
      bg: "bg-orange-50",
      href: "/inventory",
    },
    {
      label: "Active Patients",
      value: "156",
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: "/patients",
    },
  ]

  const recentActivities = [
    { time: "09:30 AM", activity: "Appointment confirmed - John Doe with Dr. Sarah Johnson" },
    { time: "09:15 AM", activity: "Inventory stock updated - Syringes (100 units)" },
    { time: "08:45 AM", activity: "Dr. Michael Chen checked in" },
    { time: "08:20 AM", activity: "Patient Lisa Anderson registered" },
  ]

  return (
    <div className="flex-1 overflow-auto flex flex-col">
      <Header title="Dashboard" subtitle="Welcome back to CareLink Clinic Management" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Link key={stat.label} href={stat.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                        <p className="text-3xl font-bold mt-2 text-foreground">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.bg}`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Link href="/appointments">
                <Button className="w-full bg-transparent" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
              </Link>
              <Link href="/attendance">
                <Button className="w-full bg-transparent" variant="outline">
                  <Clock className="h-4 w-4 mr-2" />
                  Mark Attendance
                </Button>
              </Link>
              <Link href="/inventory">
                <Button className="w-full bg-transparent" variant="outline">
                  <Package className="h-4 w-4 mr-2" />
                  Update Inventory
                </Button>
              </Link>
              <Link href="/staff">
                <Button className="w-full bg-transparent" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Staff
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, i) => (
                <div key={i} className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className="text-sm font-medium text-muted-foreground min-w-[70px]">{activity.time}</div>
                  <p className="text-sm text-foreground">{activity.activity}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
