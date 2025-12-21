// app/api/staff/index.ts
import { NextRequest, NextResponse } from "next/server";
import Staff from "@/lib/models/Staff";
import User from "@/lib/models/User";
import Role from "@/lib/models/Role";
import dbConnect from "@/lib/dbConnect";
import bcrypt from "bcryptjs";

// Helper function to create user
const createUserAccount = async (data: {
  username: string;
  email: string;
  role: string;
  password: string;
  phoneNumber?: string;
  isActive: boolean;
}) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const newUser = new User({
    username: data.username,
    email: data.email,
    password: hashedPassword,
    role: data.role.toLowerCase(),
    isActive: data.isActive,
    isVerified: true,
    contactNumber: data.phoneNumber
  });
  
  await newUser.save();
  return newUser._id.toString();
};

// Helper function to update role counts
const updateRoleUserCount = async (roleName: string) => {
  try {
    await Role.updateUserCount(roleName);
  } catch (error) {
    console.error("Error updating role count:", error);
  }
};

export { createUserAccount, updateRoleUserCount };