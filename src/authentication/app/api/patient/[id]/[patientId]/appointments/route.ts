// app/api/patient/[id]/[patientId]/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Appointment from "@/lib/models/Appointment";
import Staff from "@/lib/models/Staff";
import Patient from "@/lib/models/Patient";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patientId: string }> }
) {
  try {
    await dbConnect();

    // Await the params promise
    const { id, patientId } = await params;

    // Validate patient belongs to this user
    const patient = await Patient.findOne({ _id: patientId, user: id });
    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    // Optional date filter
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    const query: any = { patientId: patient._id };

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const appointments = await Appointment.find(query)
      .populate({ path: "staffId", select: "name specialization" })
      .sort({ date: 1, time: 1 })
      .lean();

    const formatted = appointments.map((a: any) => {
      const staff = a.staffId;
      return {
        _id: a._id.toString(),
        patientId: patient._id.toString(),
        patientCode: patient.patientCode,
        patientName: patient.name,
        doctorName: a.doctorName || staff?.name || "Unknown Doctor",
        specialization: a.specialization || staff?.specialization || "",
        staffId: staff?._id?.toString() || "",
        date: a.date ? new Date(a.date).toISOString().split("T")[0] : "",
        time: a.time,
        room: a.room,
        reason: a.reason,
        notes: a.notes || "",
        status: a.status,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error("GET Patient Appointments Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patientId: string }> }
) {
  try {
    await dbConnect();

    // Await the params promise
    const { id, patientId } = await params;
    const body = await request.json();

    // Validate patient
    const patient = await Patient.findOne({ _id: patientId, user: id });
    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    // Validate staff
    if (!body.staffId) {
      return NextResponse.json(
        { success: false, error: "Staff ID is required" },
        { status: 400 }
      );
    }
    const staff = await Staff.findById(body.staffId);
    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Doctor/Staff not found" },
        { status: 404 }
      );
    }

    const required = ["date", "time", "room", "reason"];
    const missing = required.filter((f) => !body[f]);
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // Check for time slot conflict
    const exists = await Appointment.findOne({
      staffId: staff._id,
      date: new Date(body.date),
      time: body.time,
      status: { $nin: ["cancelled", "no-show"] },
    });
    if (exists) {
      return NextResponse.json(
        { success: false, error: "Time slot already booked for this doctor" },
        { status: 409 }
      );
    }

    const appointmentData = {
      patientId: patient._id,
      patientName: patient.name,
      staffId: staff._id,
      doctorName: body.doctorName || staff.name,
      specialization: body.specialization || staff.specialization || "",
      date: new Date(body.date),
      time: body.time,
      room: body.room,
      reason: body.reason,
      notes: body.notes || "",
      status: "scheduled",
    };

    const appointment = await Appointment.create(appointmentData);

    const saved = await Appointment.findById(appointment._id)
      .populate({ path: "staffId", select: "name specialization" })
      .lean();

    return NextResponse.json({
      success: true,
      message: "Appointment created successfully",
      data: {
        _id: saved!._id.toString(),
        patientId: patient._id.toString(),
        patientCode: patient.patientCode,
        patientName: patient.name,
        doctorName: saved!.doctorName,
        specialization: saved!.specialization,
        staffId: saved!.staffId?._id?.toString() || "",
        date: new Date(saved!.date).toISOString().split("T")[0],
        time: saved!.time,
        room: saved!.room,
        reason: saved!.reason,
        notes: saved!.notes || "",
        status: saved!.status,
      },
    });
  } catch (error: any) {
    console.error("POST Patient Appointment Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create appointment" },
      { status: 500 }
    );
  }
}