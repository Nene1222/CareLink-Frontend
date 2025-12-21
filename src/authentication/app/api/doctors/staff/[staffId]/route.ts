// app/api/doctors/staff/[staffId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Doctor from '@/lib/models/Doctor';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> } // params is now a Promise
) {
  try {
    await dbConnect();

    const { staffId } = await params; // Await the params

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid staff ID' },
        { status: 400 }
      );
    }

    const doctor = await Doctor.findOne({ staff: staffId })
      .populate({
        path: 'staff',
        select: 'name email phoneNumber specialization status',
      })
      .populate({
        path: 'user',
        select: 'username email role isActive isVerified',
      })
      .lean();

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: 'Doctor not found for this staff member' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: doctor,
    });
  } catch (error: any) {
    console.error('Error fetching doctor by staff:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch doctor' },
      { status: 500 }
    );
  }
}