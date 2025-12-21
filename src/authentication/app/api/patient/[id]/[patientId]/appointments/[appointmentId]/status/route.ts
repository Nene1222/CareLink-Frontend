import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Appointment from "@/lib/models/Appointment";
import Patient from "@/lib/models/Patient";
import mongoose from "mongoose";

interface Params {
  params: Promise<{ id: string; patientId: string; appointmentId: string }>;
}

// Helper function to validate ObjectId
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// PATCH - Update appointment status
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id, patientId, appointmentId } = await params;

    if (!isValidObjectId(patientId) || !isValidObjectId(appointmentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID format" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Validate patient belongs to this user
    const patient = await Patient.findOne({ _id: patientId, user: id });
    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    // Validate appointment belongs to this patient
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patientId: patientId,
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status } = body;

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status is required" },
        { status: 400 }
      );
    }

    // Validate status value - Patients can only cancel appointments
    const validStatuses = ["cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Patients can only cancel appointments. Valid status: ${validStatuses.join(", ")}`,
        },
        { status: 403 }
      );
    }

    // Update the appointment status
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        status,
        updatedAt: new Date(),
      },
      { new: true }
    )
      .populate({ path: "staffId", select: "name specialization" })
      .lean();

    if (!updatedAppointment) {
      return NextResponse.json(
        { success: false, error: "Failed to update appointment status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: updatedAppointment._id.toString(),
        patientId: patient._id.toString(),
        patientName: patient.name,
        doctorName: updatedAppointment.doctorName || (updatedAppointment.staffId as any)?.name || "Unknown Doctor",
        date: updatedAppointment.date ? new Date(updatedAppointment.date).toISOString().split("T")[0] : "",
        time: updatedAppointment.time,
        room: updatedAppointment.room,
        status: updatedAppointment.status,
      },
      message: `Appointment ${status === "cancelled" ? "cancelled" : "updated"} successfully`,
    });
  } catch (error: any) {
    console.error("Error updating patient appointment status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update appointment status",
      },
      { status: 500 }
    );
  }
}

// GET - Get current appointment status
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id, patientId, appointmentId } = await params;

    if (!isValidObjectId(patientId) || !isValidObjectId(appointmentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID format" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Validate patient belongs to this user
    const patient = await Patient.findOne({ _id: patientId, user: id });
    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    // Validate appointment belongs to this patient
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patientId: patientId,
    })
      .select("status date time")
      .lean();

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: appointment._id.toString(),
        patientId: patient._id.toString(),
        patientName: patient.name,
        date: appointment.date ? new Date(appointment.date).toISOString().split("T")[0] : "",
        time: appointment.time,
        status: appointment.status,
      },
    });
  } catch (error: any) {
    console.error("Error fetching patient appointment status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch appointment status",
      },
      { status: 500 }
    );
  }
}