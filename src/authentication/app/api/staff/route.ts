// app/api/staff/route.ts
import { NextRequest, NextResponse } from "next/server";
import Staff from "@/lib/models/Staff";
import User from "@/lib/models/User";
import Role from "@/lib/models/Role";
import Doctor from "@/lib/models/Doctor";
import dbConnect from "@/lib/dbConnect";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { 
      name, 
      email, 
      role, 
      specialization, 
      phoneNumber, 
      status, 
      createUser, 
      username, 
      password, 
      confirmPassword,
      experience,
      education,
      consultationFee
    } = body;

    // Validation
    if (!name || !email || !role) {
      return NextResponse.json(
        { success: false, error: "Name, email, and role are required" }, 
        { status: 400 }
      );
    }

    // Check if staff exists
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      return NextResponse.json(
        { success: false, error: "Staff with this email already exists" }, 
        { status: 400 }
      );
    }

    let userId: string | null = null;
    const formattedRole = role.toLowerCase().trim();

    // Handle user creation
    if (createUser) {
      if (!username || !password || !confirmPassword) {
        return NextResponse.json(
          { success: false, error: "Username and password are required for user account" }, 
          { status: 400 }
        );
      }
      
      if (password !== confirmPassword) {
        return NextResponse.json(
          { success: false, error: "Passwords do not match" }, 
          { status: 400 }
        );
      }

      // Check if user exists
      const existingUser = await User.findOne({ 
        $or: [{ email: email.toLowerCase() }, { username }] 
      });
      
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: "User with this email or username already exists" }, 
          { status: 400 }
        );
      }

      // Create user - DON'T manually hash the password!
      // The User model will automatically hash it in the pre-save hook
      const newUser = new User({ 
        username, 
        email: email.toLowerCase(), 
        password: password, // Raw password - User model will hash it
        role: formattedRole, 
        isActive: status === "active", 
        isVerified: true, 
        contactNumber: phoneNumber 
      });
      
      await newUser.save();
      userId = newUser._id.toString();

      // Update role count
      try {
        await Role.updateUserCount(formattedRole);
      } catch (error) {
        console.error("Error updating role count after user creation:", error);
      }
    }

    // Create staff
    const newStaff = new Staff({ 
      name, 
      email: email.toLowerCase(), 
      role: formattedRole, 
      specialization, 
      phoneNumber, 
      status: status || "active", 
      user: userId 
    });
    
    await newStaff.save();

    // If role is "doctor", create basic Doctor record
    if (formattedRole === "doctor") {
      try {
        const doctorCode = await Doctor.generateDoctorCode();
        
        const newDoctor = new Doctor({
          staff: newStaff._id,
          user: userId,
          doctorCode,
          specialization: specialization || "General Medicine",
          experience: experience || "0 years",
          education: education || "Medical Degree",
          consultationFee: consultationFee ? Number(consultationFee) : 0,
          isAvailable: status === "active",
          rating: 0,
          totalPatients: 0
        });
        
        await newDoctor.save();
      } catch (doctorError) {
        console.error("Error creating doctor record:", doctorError);
      }
    }

    // Populate and return
    const populatedStaff = await Staff.findById(newStaff._id)
      .populate("user", "username email role isActive isVerified contactNumber")
      .lean();

    return NextResponse.json(
      { 
        success: true, 
        message: "Staff created successfully", 
        data: populatedStaff 
      }, 
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error creating staff:", err);
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      if (err.keyPattern?.email) {
        return NextResponse.json(
          { success: false, error: "Email already exists" }, 
          { status: 409 }
        );
      }
      if (err.keyPattern?.username) {
        return NextResponse.json(
          { success: false, error: "Username already exists" }, 
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create staff" }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get query params
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const role = url.searchParams.get('role');

    // Build filter
    const filter: any = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (role && role !== 'all') {
      filter.role = role.toLowerCase();
    }
    
    // Base query
    let query = Staff.find(filter)
      .populate("user", "username email role isActive isVerified contactNumber")
      .sort({ createdAt: -1 });

    // If search exists
    if (search) {
      query = query.or([
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ]);
    }

    const staffs = await query.lean();

    return NextResponse.json(
      { success: true, data: staffs }, 
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error fetching staff data:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch staff data" }, 
      { status: 500 }
    );
  }
}