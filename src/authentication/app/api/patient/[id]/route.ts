import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Patient from "@/lib/models/Patient";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    // ✅ MUST await params in new Next.js
    const { id: userId } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid userId" },
        { status: 400 }
      );
    }

    // Find patient by userId
    const patient = await Patient.findOne({ user: userId }).lean();

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found for this user" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: patient,
    });

  } catch (error) {
    console.error("GET /api/patient/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
