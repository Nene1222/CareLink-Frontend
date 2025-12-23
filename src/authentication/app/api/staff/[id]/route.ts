// app/api/staff/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import Staff from "@/lib/models/Staff";
import User from "@/lib/models/User";
import Role from "@/lib/models/Role";
import dbConnect from "@/lib/dbConnect";
import bcrypt from "bcryptjs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // ✅ Await the params Promise
    const { id } = await params;
    const staff = await Staff.findById(id)
      .populate('user', 'username email role isActive isVerified contactNumber')
      .lean();
    
    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: staff
    });
    
  } catch (error: any) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // ✅ Await the params Promise
    const { id } = await params;
    const body = await request.json();
    const { 
      name, 
      email, 
      role, 
      specialization, 
      phoneNumber, 
      status,
      updateUser,
      username,
      password
    } = body;
    
    // Find existing staff
    const existingStaff = await Staff.findById(id);
    if (!existingStaff) {
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 }
      );
    }
    
    // Check if email is being changed and if it's already taken
    if (email && email !== existingStaff.email) {
      const emailExists = await Staff.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: id } 
      });
      
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: "Email already in use" },
          { status: 400 }
        );
      }
    }
    
    const oldRole = existingStaff.role;
    const formattedRole = role ? role.toLowerCase().trim() : existingStaff.role;
    const formattedStatus = status || existingStaff.status;
    
    // Update staff
    existingStaff.name = name || existingStaff.name;
    existingStaff.email = email ? email.toLowerCase() : existingStaff.email;
    existingStaff.role = formattedRole;
    existingStaff.specialization = specialization || existingStaff.specialization;
    existingStaff.phoneNumber = phoneNumber || existingStaff.phoneNumber;
    existingStaff.status = formattedStatus;
    
    await existingStaff.save();
    
    // Update user if exists
    if (existingStaff.user) {
      const user = await User.findById(existingStaff.user);
      if (user) {
        // If updateUser is true OR role/status changed, update user
        if (updateUser || role || status) {
          user.username = username || user.username;
          user.email = existingStaff.email;
          user.role = formattedRole;
          user.isActive = formattedStatus === 'active';
          user.contactNumber = phoneNumber || user.contactNumber;
          
          if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
          }
          
          await user.save();
          
          // Update role user counts if role changed
          if (oldRole !== formattedRole) {
            try {
              await Role.updateUserCount(oldRole);
              await Role.updateUserCount(formattedRole);
            } catch (error) {
              console.error("Failed to update role counts:", error);
            }
          }
        }
      }
    }
    
    // Update role count if role changed without user update
    if (oldRole !== formattedRole && !existingStaff.user) {
      try {
        await Role.updateUserCount(oldRole);
        await Role.updateUserCount(formattedRole);
      } catch (error) {
        console.error("Failed to update role counts:", error);
      }
    }
    
    const updatedStaff = await Staff.findById(id)
      .populate('user', 'username email role isActive isVerified contactNumber')
      .lean();
    
    return NextResponse.json({
      success: true,
      message: "Staff updated successfully",
      data: updatedStaff
    });
    
  } catch (error: any) {
    console.error("Error updating staff:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update staff" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // ✅ Await the params Promise
    const { id } = await params;
    const staff = await Staff.findById(id);
    
    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 }
      );
    }
    
    const staffRole = staff.role;
    
    // Delete associated user if exists
    if (staff.user) {
      await User.findByIdAndDelete(staff.user);
    }
    
    await Staff.findByIdAndDelete(id);
    
    // Update role user count
    try {
      await Role.updateUserCount(staffRole);
    } catch (error) {
      console.error("Failed to update role count:", error);
    }
    
    return NextResponse.json({
      success: true,
      message: "Staff deleted successfully"
    });
    
  } catch (error: any) {
    console.error("Error deleting staff:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete staff" },
      { status: 500 }
    );
  }
}