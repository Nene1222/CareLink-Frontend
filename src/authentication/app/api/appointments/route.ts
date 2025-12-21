// app/api/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Appointment from "@/lib/models/Appointment";
import Staff from "@/lib/models/Staff";
import Patient from "@/lib/models/Patient";

// ─────────────────────────────────────────────
// GET APPOINTMENTS
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// GET APPOINTMENTS
// ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    let query: any = {};

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      query.date = { $gte: startDate, $lt: endDate };
    }

    const appointments = await Appointment.find(query)
      .populate({
        path: "patientId",
        select: "name email phoneNumber patientCode",
        model: Patient
      })
      .populate({
        path: "staffId",
        select: "name specialization",
        model: Staff
      })
      .sort({ date: 1, time: 1 })
      .lean();

    // Safe formatting with null checks
    const formatted = appointments.map((a: any) => {
      // Safe access to patient data
      const patient = a.patientId;
      const staff = a.staffId;
      
      return {
        _id: a._id?.toString() || "",
        patientId: patient?._id?.toString() || a.patientId?.toString() || "",
        patientCode: patient?.patientCode || "",
        patientName: a.patientName || patient?.name || "Unknown Patient",
        patientEmail: patient?.email || "",
        patientPhone: patient?.phoneNumber || "",
        staffId: staff?._id?.toString() || a.staffId?.toString() || "",
        doctorName: a.doctorName || staff?.name || "Unknown Doctor",
        specialization: a.specialization || staff?.specialization || "",
        date: a.date ? new Date(a.date).toISOString().split("T")[0] : "",
        time: a.time || "",
        room: a.room || "Room 101",
        reason: a.reason || "Consultation",
        notes: a.notes || "",
        status: a.status || "scheduled",
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("GET Appointments Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// POST - CREATE APPOINTMENT
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// POST - CREATE APPOINTMENT
// ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    const required = ["patientId", "staffId", "date", "time", "room", "reason"];
    const missing = required.filter((f) => !body[f]);

    if (missing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing fields: ${missing.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // ──────────────── PATIENT VALIDATION ────────────────
    let patient;

    // Case 1 → Frontend sends ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(body.patientId)) {
      patient = await Patient.findById(body.patientId);
    }

    // Case 2 → Frontend sends patientCode like "P236"
    if (!patient) {
      patient = await Patient.findOne({ patientCode: body.patientId });
    }

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    // ───────────── STAFF VALIDATION ─────────────
    const staff = await Staff.findById(body.staffId);
    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Doctor/Staff not found" },
        { status: 404 }
      );
    }

    // ───────────── TIME SLOT CHECK ─────────────
    const exists = await Appointment.findOne({
      staffId: body.staffId,
      date: new Date(body.date),
      time: body.time,
      status: { $nin: ["cancelled", "no-show"] },
    });

    if (exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Time slot already booked for this doctor",
        },
        { status: 409 }
      );
    }

    // ───────────── CREATE APPOINTMENT ─────────────
    const appointmentData = {
      patientId: patient._id,
      patientName: patient.name || "Unknown Patient",
      staffId: body.staffId,
      doctorName: body.doctorName || staff.name || "Unknown Doctor",
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
      .populate({
        path: "patientId",
        select: "name email phoneNumber patientCode",
        model: Patient
      })
      .populate({
        path: "staffId",
        select: "name specialization",
        model: Staff
      })
      .lean();

    if (!saved) {
      return NextResponse.json(
        { success: false, error: "Failed to create appointment" },
        { status: 500 }
      );
    }

    // Safe access to populated data
    const patientData = saved.patientId as any;
    const staffData = saved.staffId as any;

    return NextResponse.json(
      {
        success: true,
        message: "Appointment created successfully",
        data: {
          _id: saved._id.toString(),
          patientId: patientData?._id?.toString() || saved.patientId?.toString() || "",
          patientCode: patientData?.patientCode || "",
          patientName: saved.patientName || patientData?.name || "Unknown Patient",
          patientEmail: patientData?.email || "",
          patientPhone: patientData?.phoneNumber || "",
          staffId: staffData?._id?.toString() || saved.staffId?.toString() || "",
          doctorName: saved.doctorName || staffData?.name || "Unknown Doctor",
          specialization: saved.specialization || staffData?.specialization || "",
          date: new Date(saved.date).toISOString().split("T")[0],
          time: saved.time,
          room: saved.room,
          reason: saved.reason,
          notes: saved.notes,
          status: saved.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST Appointment Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
