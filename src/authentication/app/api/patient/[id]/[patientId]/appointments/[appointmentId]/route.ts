// app/api/patient/[id]/[patientId]/appointments/[appointmentId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Appointment from "@/lib/models/Appointment";
import Staff from "@/lib/models/Staff";
import Patient from "@/lib/models/Patient";
import mongoose from "mongoose";

interface Params {
  params: Promise<{ id: string; patientId: string; appointmentId: string }>;
}

// Helper function to validate ObjectId
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Helper function to format appointment response
const formatAppointmentResponse = (appointment: any, patient: any) => {
  const isPopulatedStaff = appointment.staffId && typeof appointment.staffId === "object";

  return {
    _id: appointment._id.toString(),
    patientId: patient._id.toString(),
    patientCode: patient.patientCode || "",
    patientName: patient.name,
    patientEmail: patient.email || "",
    patientPhone: patient.phoneNumber || "",
    staffId: isPopulatedStaff
      ? (appointment.staffId as any)._id?.toString()
      : appointment.staffId.toString(),
    doctorName: appointment.doctorName || (isPopulatedStaff ? (appointment.staffId as any).name : "Unknown Doctor"),
    specialization: appointment.specialization || (isPopulatedStaff ? (appointment.staffId as any).specialization : ""),
    date: appointment.date ? new Date(appointment.date).toISOString().split("T")[0] : "",
    time: appointment.time,
    room: appointment.room,
    reason: appointment.reason,
    notes: appointment.notes || "",
    status: appointment.status,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
  };
};

// Middleware function to validate patient and appointment ownership
const validatePatientAndAppointment = async (
  userId: string,
  patientId: string,
  appointmentId: string
) => {
  // Validate patient belongs to this user
  const patient = await Patient.findOne({ _id: patientId, user: userId });
  if (!patient) {
    return { success: false, error: "Patient not found", status: 404 };
  }

  // Validate appointment belongs to this patient
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    return { success: false, error: "Appointment not found", status: 404 };
  }

  if (appointment.patientId.toString() !== patientId) {
    return { success: false, error: "Appointment does not belong to this patient", status: 403 };
  }

  return { success: true, patient, appointment };
};

// GET single appointment
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

    // Validate ownership
    const validation = await validatePatientAndAppointment(id, patientId, appointmentId);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const { patient, appointment: existingAppointment } = validation;

    // Get appointment with populated staff
    const appointment = await Appointment.findById(appointmentId)
      .populate({ path: "staffId", select: "name specialization phoneNumber email" })
      .lean();

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: formatAppointmentResponse(appointment, patient),
    });
  } catch (error: any) {
    console.error("Error fetching patient appointment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch appointment",
      },
      { status: 500 }
    );
  }
}

// PUT - Update appointment (Allow patients to edit doctor, room, time, etc.)
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id, patientId, appointmentId } = await params;

    if (!isValidObjectId(patientId) || !isValidObjectId(appointmentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID format" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Validate ownership
    const validation = await validatePatientAndAppointment(id, patientId, appointmentId);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const { patient, appointment: existingAppointment } = validation;
    const body = await request.json();

    // Validate status if provided
    if (body.status && !["scheduled", "completed", "cancelled", "no-show"].includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Patients can update ALL fields except patientId and patientName (these are fixed)
    const disallowedFields = ["patientId", "patientName"];
    const providedFields = Object.keys(body);
    const providedDisallowedFields = providedFields.filter((field) => disallowedFields.includes(field));

    if (providedDisallowedFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `You are not allowed to update: ${providedDisallowedFields.join(", ")}`,
        },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    // Check and update doctor/staff information
    if (body.staffId && body.staffId !== existingAppointment.staffId.toString()) {
      const staff = await Staff.findById(body.staffId);
      if (!staff) {
        return NextResponse.json(
          { success: false, error: "Doctor/Staff not found" },
          { status: 404 }
        );
      }
      updateData.staffId = staff._id;
      updateData.doctorName = body.doctorName || staff.name;
      updateData.specialization = body.specialization || staff.specialization || "General";
    } else if (body.doctorName || body.specialization) {
      // If doctor name or specialization is updated without changing staffId
      if (body.doctorName) updateData.doctorName = body.doctorName;
      if (body.specialization) updateData.specialization = body.specialization;
    }

    // Update other fields
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.time !== undefined) updateData.time = body.time;
    if (body.room !== undefined) updateData.room = body.room;
    if (body.reason !== undefined) updateData.reason = body.reason;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.status !== undefined) updateData.status = body.status;

    // For patients, only allow changing status to "cancelled" or keep as "scheduled"
    if (body.status && !["scheduled", "cancelled"].includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Patients can only change status to 'cancelled'",
        },
        { status: 403 }
      );
    }

    // Check for time slot conflicts if date/time/room/doctor is being changed
    const checkDate = body.date ? new Date(body.date) : existingAppointment.date;
    const checkTime = body.time || existingAppointment.time;
    const checkRoom = body.room || existingAppointment.room;
    const checkStaffId = body.staffId ? new mongoose.Types.ObjectId(body.staffId) : existingAppointment.staffId;

    // Only check conflicts if the appointment is not being cancelled
    if (body.status !== "cancelled" && (body.date || body.time || body.room || body.staffId)) {
      
      // Check for doctor time slot conflict (same doctor, same time)
      const doctorConflictQuery: any = {
        _id: { $ne: appointmentId },
        staffId: checkStaffId,
        date: checkDate,
        time: checkTime,
        status: { $nin: ["cancelled", "no-show"] },
      };

      const doctorConflict = await Appointment.findOne(doctorConflictQuery);

      if (doctorConflict) {
        const staff = await Staff.findById(checkStaffId);
        return NextResponse.json(
          {
            success: false,
            error: `Dr. ${staff?.name || "Unknown Doctor"} is already booked at ${checkTime} on ${checkDate.toISOString().split('T')[0]}`,
          },
          { status: 409 }
        );
      }

      // Check for room time slot conflict (same room, same time)
      const roomConflictQuery: any = {
        _id: { $ne: appointmentId },
        room: checkRoom,
        date: checkDate,
        time: checkTime,
        status: { $nin: ["cancelled", "no-show"] },
      };

      const roomConflict = await Appointment.findOne(roomConflictQuery);

      if (roomConflict) {
        return NextResponse.json(
          {
            success: false,
            error: `${checkRoom} is already booked at ${checkTime} on ${checkDate.toISOString().split('T')[0]}`,
          },
          { status: 409 }
        );
      }
    }

    // Update the appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate({ path: "staffId", select: "name specialization phoneNumber email" })
      .lean();

    if (!updatedAppointment) {
      return NextResponse.json(
        { success: false, error: "Failed to update appointment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: formatAppointmentResponse(updatedAppointment, patient),
      message: "Appointment updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating patient appointment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update appointment",
      },
      { status: 500 }
    );
  }
}

// PATCH - Partial update (mainly for status updates)
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

    // Validate ownership
    const validation = await validatePatientAndAppointment(id, patientId, appointmentId);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const { patient, appointment: existingAppointment } = validation;
    const body = await request.json();

    // Prepare update data
    const updateData: any = {};
    
    // Only allow status updates via PATCH (for cancellation from the button)
    if (body.status !== undefined) {
      if (body.status === "cancelled") {
        updateData.status = "cancelled";
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Patients can only cancel appointments via PATCH",
          },
          { status: 403 }
        );
      }
    }

    // Update the appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      updateData,
      { new: true }
    )
      .populate({ path: "staffId", select: "name specialization phoneNumber email" })
      .lean();

    if (!updatedAppointment) {
      return NextResponse.json(
        { success: false, error: "Failed to update appointment" },
        { status: 500 }
      );
    }

    const message = "Appointment cancelled successfully";

    return NextResponse.json({
      success: true,
      data: formatAppointmentResponse(updatedAppointment, patient),
      message,
    });
  } catch (error: any) {
    console.error("Error patching patient appointment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update appointment",
      },
      { status: 500 }
    );
  }
}

// DELETE - Cancel appointment (soft delete by changing status)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id, patientId, appointmentId } = await params;

    if (!isValidObjectId(patientId) || !isValidObjectId(appointmentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID format" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Validate ownership
    const validation = await validatePatientAndAppointment(id, patientId, appointmentId);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const { patient, appointment: existingAppointment } = validation;

    // Soft delete by changing status to cancelled
    const cancelledAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: "cancelled" },
      { new: true }
    )
      .populate({ path: "staffId", select: "name specialization" })
      .lean();

    if (!cancelledAppointment) {
      return NextResponse.json(
        { success: false, error: "Failed to cancel appointment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: cancelledAppointment._id.toString(),
        patientName: patient.name,
        doctorName: cancelledAppointment.doctorName || (cancelledAppointment.staffId as any)?.name || "Unknown Doctor",
        date: cancelledAppointment.date ? new Date(cancelledAppointment.date).toISOString().split("T")[0] : "",
        time: cancelledAppointment.time,
        status: cancelledAppointment.status,
      },
      message: "Appointment cancelled successfully",
    });
  } catch (error: any) {
    console.error("Error cancelling patient appointment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to cancel appointment",
      },
      { status: 500 }
    );
  }
}