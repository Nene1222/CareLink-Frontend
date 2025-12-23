// app/api/auth/login/route.ts - CORRECTED VERSION
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import Role from "@/lib/models/Role";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    // Use case-insensitive email search
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log("No user found for email:", email.toLowerCase());
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Check email verification
    if (!user.isVerified) {
      return NextResponse.json(
        {
          error: "Please verify your email before logging in. Check your email for verification link.",
        },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Your account has been deactivated. Please contact support." },
        { status: 401 }
      );
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password mismatch for user:", user.email);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Fetch role details including permissions
    let roleData = null;
    if (user.role) {
      // Find the role in Role collection
      const roleDoc = await Role.findOne({ 
        name: user.role.toLowerCase().trim(),
        status: "active" 
      });
      
      if (roleDoc) {
        roleData = {
          name: roleDoc.name,
          permissions: roleDoc.permissions || []
        };
      } else {
        console.log(`Role "${user.role}" not found in Role collection, using default`);
        // Create default role data if role not found
        roleData = {
          name: user.role,
          permissions: []
        };
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Build payload for JWT token - DO NOT include permissions array
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      // REMOVE this line - don't include permissions in JWT
      // permissions: roleData?.permissions || [] 
    };

    // Generate JWT token
    const token = await generateToken(payload);

    // Prepare user data for response
    const userResponse = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      roleData: roleData, // Include full role data with permissions
      isVerified: user.isVerified,
      profileImage: user.profileImage,
      contactNumber: user.contactNumber,
      lastLogin: user.lastLogin
    };

    // Create response
    const response = NextResponse.json({
      message: "Login successful",
      token,
      user: userResponse,
    });

    // Set HTTP-only cookie for server-side authentication
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "strict"
    });

    return response;
  } catch (err: any) {
    console.error("Login Error:", err);
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}