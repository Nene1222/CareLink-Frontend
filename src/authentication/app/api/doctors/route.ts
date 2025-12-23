// app/api/doctors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Doctor from '@/lib/models/Doctor';
import Staff from '@/lib/models/Staff';
import User from '@/lib/models/User';
import mongoose from 'mongoose';

// GET all doctors with filters
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const specialization = searchParams.get('specialization') || '';
    const department = searchParams.get('department') || '';
    const isAvailable = searchParams.get('isAvailable');
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = {};

    if (search) {
      filter.$or = [
        { doctorCode: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { education: { $regex: search, $options: 'i' } },
      ];
    }

    if (specialization) {
      filter.specialization = specialization;
    }

    if (department) {
      filter.department = department;
    }

    if (isAvailable) {
      filter.isAvailable = isAvailable === 'true';
    }

    // Get total count
    const total = await Doctor.countDocuments(filter);

    // Fetch doctors with populated staff and user details
    const doctors = await Doctor.find(filter)
      .populate({
        path: 'staff',
        select: 'name email phoneNumber specialization status',
        match: status ? { status } : {},
      })
      .populate({
        path: 'user',
        select: 'username email role isActive isVerified',
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    // Filter out doctors whose staff doesn't match the status filter
    const filteredDoctors = doctors.filter((doctor: any) => {
      if (status && (!doctor.staff || (doctor.staff && doctor.staff.status !== status))) {
        return false;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      data: filteredDoctors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch doctors' },
      { status: 500 }
    );
  }
}

// POST create new doctor
// POST create new doctor
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      staffId,
      specialization,
      department,
      experience,
      education,
      qualifications,
      consultationFee,
      bio,
      languages,
      awards,
      publications,
      availableDays,
      availableHours,
    } = body;

    // Validate required fields
    if (!staffId || !specialization || !experience || !education || !consultationFee) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check staff
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 }
      );
    }

    if (staff.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Staff is not active" },
        { status: 400 }
      );
    }

    if (!staff.user) {
      return NextResponse.json(
        { success: false, error: "Staff does not have a user account" },
        { status: 400 }
      );
    }

    // Check doctor already exists
    const existingDoctor = await Doctor.findOne({ staff: staffId });
    if (existingDoctor) {
      return NextResponse.json(
        { success: false, error: "Doctor already exists for this staff" },
        { status: 400 }
      );
    }

    // Update staff role
    if (staff.role !== "doctor") {
      staff.role = "doctor";
      await staff.save();
    }

    // Update user role
    const user = await User.findById(staff.user);
    if (user) {
      user.role = "doctor";
      await user.save();
    }

    // Create doctor
    const doctor = await Doctor.create({
      staff: staffId,
      user: staff.user,
      specialization,
      department,
      experience,
      education,
      qualifications: qualifications || [],
      consultationFee,
      bio,
      languages: languages || [],
      awards: awards || [],
      publications: publications || [],
      availableDays: availableDays || [],
      availableHours: availableHours || {},
      isAvailable: true,
      rating: 0,
      totalPatients: 0,
    });

    const populatedDoctor = await Doctor.findById(doctor._id)
      .populate("staff", "name email phoneNumber specialization status")
      .populate("user", "username email role isActive isVerified");

    return NextResponse.json({
      success: true,
      data: populatedDoctor,
      message: "Doctor created successfully",
    });
  } catch (error: any) {
    console.error("Error creating doctor:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create doctor" },
      { status: 500 }
    );
  }
}
