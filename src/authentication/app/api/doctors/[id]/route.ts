// app/api/doctors/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Doctor from "@/lib/models/Doctor";
import Staff from "@/lib/models/Staff";
import User from "@/lib/models/User";
import mongoose from "mongoose";

// GET SINGLE DOCTOR
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid doctor ID" },
        { status: 400 }
      );
    }

    const doctor = await Doctor.findById(id)
      .populate({
        path: "staff",
        select: "name email phoneNumber specialization status",
      })
      .populate({
        path: "user",
        select: "username email role isActive isVerified lastLogin",
      })
      .lean();

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: "Doctor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: doctor });
  } catch (error: any) {
    console.error("Error fetching doctor:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch doctor" },
      { status: 500 }
    );
  }
}

// UPDATE DOCTOR (NO TRANSACTIONS)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const {
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
      isAvailable,
      status, // staff status update
    } = body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid doctor ID" },
        { status: 400 }
      );
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return NextResponse.json(
        { success: false, error: "Doctor not found" },
        { status: 404 }
      );
    }

    // Update Doctor
    if (specialization !== undefined) doctor.specialization = specialization;
    if (department !== undefined) doctor.department = department;
    if (experience !== undefined) doctor.experience = experience;
    if (education !== undefined) doctor.education = education;
    if (qualifications !== undefined) doctor.qualifications = qualifications;
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
    if (bio !== undefined) doctor.bio = bio;
    if (languages !== undefined) doctor.languages = languages;
    if (awards !== undefined) doctor.awards = awards;
    if (publications !== undefined) doctor.publications = publications;
    if (availableDays !== undefined) doctor.availableDays = availableDays;
    if (availableHours !== undefined) doctor.availableHours = availableHours;
    if (isAvailable !== undefined) doctor.isAvailable = isAvailable;

    await doctor.save();

    // Update Staff
    if (doctor.staff) {
      const staff = await Staff.findById(doctor.staff);
      if (staff) {
        if (specialization !== undefined) staff.specialization = specialization;
        if (status !== undefined) staff.status = status;
        await staff.save();
      }
    }

    // Update User (only timestamps)
    if (doctor.user) {
      const user = await User.findById(doctor.user);
      if (user) await user.save();
    }

    // Return updated doc
    const updatedDoctor = await Doctor.findById(id)
      .populate({
        path: "staff",
        select: "name email phoneNumber specialization status",
      })
      .populate({
        path: "user",
        select: "username email role isActive isVerified",
      })
      .lean();

    return NextResponse.json({
      success: true,
      data: updatedDoctor,
      message: "Doctor updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating doctor:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update doctor" },
      { status: 500 }
    );
  }
}

// DELETE DOCTOR (NO TRANSACTIONS)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const deleteStaff = searchParams.get("deleteStaff") === "true";
    const deleteUser = searchParams.get("deleteUser") === "true";

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid doctor ID" },
        { status: 400 }
      );
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return NextResponse.json(
        { success: false, error: "Doctor not found" },
        { status: 404 }
      );
    }

    const staffId = doctor.staff;
    const userId = doctor.user;

    await Doctor.findByIdAndDelete(id);

    if (deleteStaff && staffId) {
      await Staff.findByIdAndDelete(staffId);

      if (deleteUser && userId) {
        await User.findByIdAndDelete(userId);
      }
    } else if (deleteUser && userId) {
      await User.findByIdAndDelete(userId);

      if (staffId) {
        await Staff.findByIdAndUpdate(staffId, { $unset: { user: 1 } });
      }
    } else if (staffId) {
      await Staff.findByIdAndUpdate(staffId, { role: "staff" });
    }

    return NextResponse.json({
      success: true,
      message: `Doctor deleted successfully${
        deleteStaff ? " with staff" : ""
      }${deleteUser ? " and user" : ""}`,
    });
  } catch (error: any) {
    console.error("Error deleting doctor:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete doctor" },
      { status: 500 }
    );
  }
}
