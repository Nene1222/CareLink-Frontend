// app/api/permissions/route.ts
import dbConnect from "@/lib/dbConnect";
import Role from "@/lib/models/Role";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Get role from query parameter
    const { searchParams } = new URL(req.url);
    const roleName = searchParams.get("role");
    
    if (!roleName) {
      return NextResponse.json(
        { error: "Role parameter is required" },
        { status: 400 }
      );
    }
    
    const normalizedRoleName = roleName.toLowerCase().trim();
    
    // Special case 1: Admin - Return ALL permissions
    if (normalizedRoleName === "admin") {
      const allPermissions = [
        {
          module: "Dashboard",
          permissions: ["dashboard-view", "dashboard-export"]
        },
        {
          module: "Appointments",
          permissions: ["appointment-view", "appointment-create", "appointment-edit", "appointment-delete"]
        },
        {
          module: "Doctor",
          permissions: ["doctor-view", "doctor-create", "doctor-edit", "doctor-delete"]
        },
        {
          module: "Attendance",
          permissions: ["attendance-view", "attendance-checkin", "attendance-manage", "attendance-reports"]
        },
        {
          module: "Inventory",
          permissions: ["inventory-view", "inventory-add", "inventory-edit", "inventory-delete", "inventory-adjust"]
        },
        {
          module: "Staff",
          permissions: ["staff-view", "staff-create", "staff-edit", "staff-delete"]
        },
        {
          module: "Patients",
          permissions: ["patient-view", "patient-create", "patient-edit", "patient-delete"]
        },
        {
          module: "Medical Records",
          permissions: ["medical-records-view", "medical-records-create", "medical-records-edit", "medical-records-delete", "medical-records-download"]
        },
        {
          module: "Reports",
          permissions: ["reports-view", "reports-export"]
        },
        {
          module: "Roles & Permissions",
          permissions: ["roles-manage"]
        }
      ];
      
      return NextResponse.json({
        role: "admin",
        hasAllAccess: true,
        permissions: allPermissions
      });
    }
    
    // Special case 2: Patient - Return only dashboard and appointments
    if (normalizedRoleName === "patient") {
      const patientPermissions = [
        {
          module: "Dashboard",
          permissions: ["dashboard-view"]
        },
        {
          module: "Appointments",
          permissions: ["appointment-view", "appointment-create"]
        }
      ];
      
      return NextResponse.json({
        role: "patient",
        hasAllAccess: false,
        permissions: patientPermissions
      });
    }
    
    // For other roles: Fetch from database
    const role = await Role.findOne({ 
      name: normalizedRoleName,
      status: "active" 
    });
    
    if (!role) {
      return NextResponse.json(
        { 
          error: "Role not found",
          role: normalizedRoleName 
        },
        { status: 404 }
      );
    }
    
    // Return the exact permissions structure from database
    return NextResponse.json({
      role: role.name,
      hasAllAccess: false,
      permissions: role.permissions || []
    });
    
  } catch (err: any) {
    console.error("Permissions API Error:", err);
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}