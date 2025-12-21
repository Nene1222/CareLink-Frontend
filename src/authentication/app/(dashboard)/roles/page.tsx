"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import axiosClient from "@/lib/axiosClient"
// import { toast } from "sonner"

interface Permission {
  id: string
  name: string
  description: string
  module: string
}

interface PermissionModule {
  module: string;
  permissions: string[];
}

interface Role {
  _id: string
  name: string
  description: string
  permissions: PermissionModule[]
  userCount: number
  status: "active" | "inactive"
  createdAt: string
}

const allPermissions: Permission[] = [
  // Dashboard Permissions
  { id: "dashboard-view", name: "View Dashboard", description: "Access dashboard and statistics", module: "Dashboard" },
  {
    id: "dashboard-export",
    name: "Export Dashboard Data",
    description: "Export dashboard reports",
    module: "Dashboard",
  },

  // Appointment Permissions
  {
    id: "appointment-view",
    name: "View Appointments",
    description: "Access appointments list",
    module: "Appointments",
  },
  {
    id: "appointment-create",
    name: "Create Appointments",
    description: "Create new appointments",
    module: "Appointments",
  },
  {
    id: "appointment-edit",
    name: "Edit Appointments",
    description: "Edit existing appointments",
    module: "Appointments",
  },
  { id: "appointment-delete", name: "Delete Appointments", description: "Delete appointments", module: "Appointments" },

  // Attendance Permissions
  { id: "attendance-view", name: "View Attendance", description: "Access attendance records", module: "Attendance" },
  {
    id: "attendance-checkin",
    name: "Check In/Out",
    description: "Perform attendance check-in and check-out",
    module: "Attendance",
  },
  {
    id: "attendance-manage",
    name: "Manage Attendance",
    description: "Edit and manage attendance records",
    module: "Attendance",
  },
  {
    id: "attendance-reports",
    name: "Attendance Reports",
    description: "View attendance reports and analytics",
    module: "Attendance",
  },

  // Inventory Permissions
  { id: "inventory-view", name: "View Inventory", description: "Access inventory list", module: "Inventory" },
  { id: "inventory-add", name: "Add Items", description: "Add new inventory items", module: "Inventory" },
  { id: "inventory-edit", name: "Edit Items", description: "Edit inventory items", module: "Inventory" },
  { id: "inventory-delete", name: "Delete Items", description: "Delete inventory items", module: "Inventory" },
  { id: "inventory-adjust", name: "Adjust Stock", description: "Adjust stock quantities", module: "Inventory" },

  // Staff Permissions
  { id: "staff-view", name: "View Staff", description: "Access staff directory", module: "Staff" },
  { id: "staff-create", name: "Add Staff", description: "Add new staff members", module: "Staff" },
  { id: "staff-edit", name: "Edit Staff", description: "Edit staff information", module: "Staff" },
  { id: "staff-delete", name: "Delete Staff", description: "Delete staff records", module: "Staff" },

  // Patient Permissions
  { id: "patient-view", name: "View Patients", description: "Access patient records", module: "Patients" },
  { id: "patient-create", name: "Add Patients", description: "Create new patient records", module: "Patients" },
  { id: "patient-edit", name: "Edit Patients", description: "Edit patient information", module: "Patients" },
  { id: "patient-delete", name: "Delete Patients", description: "Delete patient records", module: "Patients" },

  // Medical Records Permissions
  {
    id: "medical-records-view",
    name: "View Medical Records",
    description: "Access medical records",
    module: "Medical Records",
  },
  {
    id: "medical-records-create",
    name: "Create Records",
    description: "Create new medical records",
    module: "Medical Records",
  },
  { id: "medical-records-edit", name: "Edit Records", description: "Edit medical records", module: "Medical Records" },
  {
    id: "medical-records-delete",
    name: "Delete Records",
    description: "Delete medical records",
    module: "Medical Records",
  },
  {
    id: "medical-records-download",
    name: "Download Records",
    description: "Download medical records as PDF",
    module: "Medical Records",
  },

  // Reports Permissions
  { id: "reports-view", name: "View Reports", description: "Access reports and analytics", module: "Reports" },
  { id: "reports-export", name: "Export Reports", description: "Export reports", module: "Reports" },

  // Role Permissions
  { id: "roles-manage", name: "Manage Roles", description: "Create and manage roles", module: "Roles & Permissions" },
]

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Role | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionModule[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [roleSelectMode, setRoleSelectMode] = useState<"select" | "custom">("select")

  const modules = Array.from(new Set(allPermissions.map((p) => p.module)))

  // Fetch roles from API
  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await axiosClient.get('/roles/role')
      console.log("Roles data:", response.data)
      setRoles(response.data.roles || [])
    } catch (error: any) {
      console.error('Error fetching roles:', error)
      // toast.error('Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const handleAddRole = async () => {
    if (!formData.name.trim()) {
      // toast.error('Role name is required')
      return
    }

    try {
      setSubmitting(true)
      const response = await axiosClient.post('/roles', {
        name: formData.name,
        description: formData.description,
        permissions: selectedPermissions,
      })

      // toast.success('Role created successfully')
      setFormData({ name: "", description: "" })
      setSelectedPermissions([])
      setRoleSelectMode("select")
      setIsAddOpen(false)
      fetchRoles() // Refresh the list
    } catch (error: any) {
      console.error('Error creating role:', error)
      // toast.error(error.response?.data?.error || 'Failed to create role')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditRole = async () => {
    if (!selectedRole || !formData.name.trim()) {
      // toast.error('Role name is required')
      return
    }

    try {
      setSubmitting(true)
      const response = await axiosClient.put(`/roles/${selectedRole._id}`, {
        name: formData.name,
        description: formData.description,
        permissions: selectedPermissions,
      })

      // toast.success('Role updated successfully')
      setFormData({ name: "", description: "" })
      setSelectedPermissions([])
      setRoleSelectMode("select")
      setIsEditOpen(false)
      setSelectedRole(null)
      fetchRoles() // Refresh the list
    } catch (error: any) {
      console.error('Error updating role:', error)
      // toast.error(error.response?.data?.error || 'Failed to update role')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteRole = async (role: Role) => {
    try {
      await axiosClient.delete(`/roles/${role._id}`)
      // toast.success('Role deleted successfully')
      setDeleteConfirm(null)
      fetchRoles() // Refresh the list
    } catch (error: any) {
      console.error('Error deleting role:', error)
      // toast.error(error.response?.data?.error || 'Failed to delete role')
    }
  }

  const openEditDialog = (role: Role) => {
    setSelectedRole(role)
    setFormData({ 
      name: role.name.charAt(0).toUpperCase() + role.name.slice(1), 
      description: role.description 
    })
    setSelectedPermissions(role.permissions || [])
    
    // Check if role name exists in predefined list
    const predefinedRoles = ["Admin", "Doctor", "Nurse", "Receptionist", "Lab Technician", "Pharmacist", "Accountant"]
    const normalizedRoleName = role.name.charAt(0).toUpperCase() + role.name.slice(1)
    if (predefinedRoles.includes(normalizedRoleName)) {
      setRoleSelectMode("select")
    } else {
      setRoleSelectMode("custom")
    }
    
    setIsEditOpen(true)
  }

  const handleRoleSelectChange = (value: string) => {
    if (value === "Custom") {
      setRoleSelectMode("custom")
      setFormData(prev => ({ ...prev, name: "" }))
    } else {
      setRoleSelectMode("select")
      setFormData(prev => ({ ...prev, name: value }))
    }
  }

  const togglePermission = (module: string, permissionId: string) => {
    setSelectedPermissions(prev => {
      const moduleIndex = prev.findIndex(p => p.module === module)
      
      if (moduleIndex === -1) {
        // Module doesn't exist, add it with the permission
        return [...prev, { module, permissions: [permissionId] }]
      } else {
        // Module exists, toggle the permission
        const modulePermissions = [...prev[moduleIndex].permissions]
        const permissionIndex = modulePermissions.indexOf(permissionId)
        
        if (permissionIndex === -1) {
          // Add permission
          modulePermissions.push(permissionId)
        } else {
          // Remove permission
          modulePermissions.splice(permissionIndex, 1)
        }
        
        // Update the module
        const updatedPermissions = [...prev]
        updatedPermissions[moduleIndex] = {
          ...updatedPermissions[moduleIndex],
          permissions: modulePermissions
        }
        
        // Remove module if no permissions left
        if (modulePermissions.length === 0) {
          return updatedPermissions.filter(p => p.module !== module)
        }
        
        return updatedPermissions
      }
    })
  }

  const toggleAllModulePermissions = (module: string) => {
    const modulePermissions = getModulePermissions(module).map(p => p.id)
    const currentModule = selectedPermissions.find(p => p.module === module)
    const allSelected = currentModule && currentModule.permissions.length === modulePermissions.length
    
    if (allSelected) {
      // Remove all permissions from this module
      setSelectedPermissions(prev => prev.filter(p => p.module !== module))
    } else {
      // Add all permissions from this module
      setSelectedPermissions(prev => {
        const otherModules = prev.filter(p => p.module !== module)
        return [...otherModules, { module, permissions: modulePermissions }]
      })
    }
  }

  const getModulePermissions = (module: string) => {
    return allPermissions.filter((p) => p.module === module)
  }

  const isModuleSelected = (module: string) => {
    const modulePermissions = getModulePermissions(module).map(p => p.id)
    const currentModule = selectedPermissions.find(p => p.module === module)
    return currentModule && currentModule.permissions.length === modulePermissions.length
  }

  const isModulePartiallySelected = (module: string) => {
    const modulePermissions = getModulePermissions(module).map(p => p.id)
    const currentModule = selectedPermissions.find(p => p.module === module)
    const selectedCount = currentModule ? currentModule.permissions.length : 0
    return selectedCount > 0 && selectedCount < modulePermissions.length
  }

  const isPermissionSelected = (module: string, permissionId: string) => {
    const currentModule = selectedPermissions.find(p => p.module === module)
    return currentModule ? currentModule.permissions.includes(permissionId) : false
  }

  const getSelectedPermissionCount = (module: string) => {
    const currentModule = selectedPermissions.find(p => p.module === module)
    return currentModule ? currentModule.permissions.length : 0
  }

  const getTotalPermissionsForRole = (role: Role) => {
    return role.permissions.reduce((total, module) => total + module.permissions.length, 0)
  }

  const resetForm = () => {
    setFormData({ name: "", description: "" })
    setSelectedPermissions([])
    setRoleSelectMode("select")
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-auto flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading roles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Roles & Permissions</h1>
            <p className="text-muted-foreground mt-2">Manage user roles and their permissions</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 gap-2">
                <Plus className="h-5 w-5" />
                Add New Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>Add a new role with specific permissions</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Role</Label>
                  <Select
                    value={roleSelectMode === "custom" ? "Custom" : formData.name}
                    onValueChange={handleRoleSelectChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Doctor">Doctor</SelectItem>
                      <SelectItem value="Nurse">Nurse</SelectItem>
                      <SelectItem value="Receptionist">Receptionist</SelectItem>
                      <SelectItem value="Lab Technician">Lab Technician</SelectItem>
                      <SelectItem value="Pharmacist">Pharmacist</SelectItem>
                      <SelectItem value="Accountant">Accountant</SelectItem>
                      <SelectItem value="Custom">Custom (Manual Entry)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {roleSelectMode === "custom" && (
                  <div>
                    <Label htmlFor="custom-role">Custom Role Name</Label>
                    <Input
                      id="custom-role"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter custom role name"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="desc">Description</Label>
                  <Textarea
                    id="desc"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the role's responsibilities"
                    rows={3}
                  />
                </div>
                <div className="space-y-4">
                  <Label>Assign Permissions</Label>
                  {modules.map((module) => (
                    <div key={module} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Checkbox
                          id={`module-${module}`}
                          checked={isModuleSelected(module)}
                          {...(isModulePartiallySelected(module) && { indeterminate: true })}
                          onCheckedChange={() => toggleAllModulePermissions(module)}
                          className="data-[state=checked]:bg-primary data-[state=indeterminate]:bg-primary"
                        />
                        <label htmlFor={`module-${module}`} className="flex-1 cursor-pointer">
                          <h3 className="font-semibold text-foreground">{module}</h3>
                        </label>
                        <Badge variant="outline" className="text-xs">
                          {getSelectedPermissionCount(module)}/
                          {getModulePermissions(module).length} selected
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {getModulePermissions(module).map((permission) => (
                          <div key={permission.id} className="flex items-start gap-3 ml-6">
                            <Checkbox
                              id={permission.id}
                              checked={isPermissionSelected(module, permission.id)}
                              onCheckedChange={() => togglePermission(module, permission.id)}
                            />
                            <label htmlFor={permission.id} className="flex-1 cursor-pointer">
                              <p className="font-medium text-sm">{permission.name}</p>
                              <p className="text-xs text-muted-foreground">{permission.description}</p>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button onClick={handleAddRole} className="bg-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Role"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {roles.length === 0 ? (
            <Card className="border border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">No roles found</p>
                <Button onClick={() => setIsAddOpen(true)} className="bg-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Role
                </Button>
              </CardContent>
            </Card>
          ) : (
            roles.map((role) => (
              <Card key={role._id} className="border border-border hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl capitalize">{role.name}</CardTitle>
                        <Badge variant={role.status === "active" ? "default" : "secondary"}>
                          {role.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <CardDescription className="mt-1">{role.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(role)} className="gap-2">
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(role)} className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Users with this role</span>
                    <span className="text-lg font-semibold text-foreground">{role.userCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Permissions assigned</span>
                    <span className="text-lg font-semibold text-foreground">{getTotalPermissionsForRole(role)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {modules.map((module) => {
                      const modulePerms = getModulePermissions(module)
                      const roleModule = role.permissions.find(p => p.module === module)
                      const assignedCount = roleModule ? roleModule.permissions.length : 0
                      return assignedCount > 0 ? (
                        <Badge key={module} variant="outline" className="text-xs">
                          {module}: {assignedCount}/{modulePerms.length}
                        </Badge>
                      ) : null
                    })}
                  </div>
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-2">
                      Created: {new Date(role.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open)
        if (!open) {
          setSelectedRole(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role: {selectedRole?.name}</DialogTitle>
            <DialogDescription>Update role details and permissions</DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4">
              <div>
                <Label>Select Role</Label>
                <Select
                  value={roleSelectMode === "custom" ? "Custom" : formData.name}
                  onValueChange={handleRoleSelectChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Doctor">Doctor</SelectItem>
                    <SelectItem value="Nurse">Nurse</SelectItem>
                    <SelectItem value="Receptionist">Receptionist</SelectItem>
                    <SelectItem value="Lab Technician">Lab Technician</SelectItem>
                    <SelectItem value="Pharmacist">Pharmacist</SelectItem>
                    <SelectItem value="Accountant">Accountant</SelectItem>
                    <SelectItem value="Custom">Custom (Manual Entry)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {roleSelectMode === "custom" && (
                <div>
                  <Label htmlFor="edit-custom-role">Custom Role Name</Label>
                  <Input
                    id="edit-custom-role"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter custom role name"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea
                  id="edit-desc"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-4">
                <Label>Assign Permissions</Label>
                {modules.map((module) => (
                  <div key={module} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Checkbox
                        id={`edit-module-${module}`}
                        checked={isModuleSelected(module)}
                        {...(isModulePartiallySelected(module) && { indeterminate: true })}
                        onCheckedChange={() => toggleAllModulePermissions(module)}
                        className="data-[state=checked]:bg-primary data-[state=indeterminate]:bg-primary"
                      />
                      <label htmlFor={`edit-module-${module}`} className="flex-1 cursor-pointer">
                        <h3 className="font-semibold text-foreground">{module}</h3>
                      </label>
                      <Badge variant="outline" className="text-xs">
                        {getSelectedPermissionCount(module)}/
                        {getModulePermissions(module).length} selected
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {getModulePermissions(module).map((permission) => (
                        <div key={permission.id} className="flex items-start gap-3 ml-6">
                          <Checkbox
                            id={`edit-${permission.id}`}
                            checked={isPermissionSelected(module, permission.id)}
                            onCheckedChange={() => togglePermission(module, permission.id)}
                          />
                          <label htmlFor={`edit-${permission.id}`} className="flex-1 cursor-pointer">
                            <p className="font-medium text-sm">{permission.name}</p>
                            <p className="text-xs text-muted-foreground">{permission.description}</p>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-end mt-6">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleEditRole} className="bg-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{deleteConfirm?.name}" role? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> {deleteConfirm?.userCount} user(s) are assigned to this role.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteRole(deleteConfirm)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}