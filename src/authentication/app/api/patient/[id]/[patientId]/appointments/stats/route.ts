import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Appointment from "@/lib/models/Appointment";
import Patient from "@/lib/models/Patient";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; patientId: string }> }) {
  try {
    const { id, patientId } = await params;
    await dbConnect();

    // Validate patient belongs to this user
    const patient = await Patient.findOne({ _id: patientId, user: id });
    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total appointments for this patient
    const total = await Appointment.countDocuments({
      patientId: patient._id,
      status: { $ne: "cancelled" },
    });

    // Today's appointments for this patient
    const todayCount = await Appointment.countDocuments({
      patientId: patient._id,
      date: { $gte: today, $lt: tomorrow },
      status: { $ne: "cancelled" },
    });

    // Upcoming appointments for this patient (next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcoming = await Appointment.countDocuments({
      patientId: patient._id,
      date: { $gte: tomorrow, $lte: nextWeek },
      status: { $ne: "cancelled" },
    });

    // Past appointments for this patient
    const past = await Appointment.countDocuments({
      patientId: patient._id,
      date: { $lt: today },
      status: { $ne: "cancelled" },
    });

    // Appointments by status for this patient
    const byStatus = await Appointment.aggregate([
      {
        $match: {
          patientId: patient._id,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Next appointment
    const nextAppointment = await Appointment.findOne({
      patientId: patient._id,
      date: { $gte: today },
      status: { $nin: ["cancelled", "completed", "no-show"] },
    })
      .sort({ date: 1, time: 1 })
      .populate({ path: "staffId", select: "name specialization" })
      .lean();

    // Format next appointment
    let formattedNextAppointment = null;
    if (nextAppointment) {
      const staff = nextAppointment.staffId as any;
      formattedNextAppointment = {
        _id: nextAppointment._id.toString(),
        doctorName: nextAppointment.doctorName || staff?.name || "Unknown Doctor",
        specialization: nextAppointment.specialization || staff?.specialization || "",
        date: nextAppointment.date ? new Date(nextAppointment.date).toISOString().split("T")[0] : "",
        time: nextAppointment.time,
        room: nextAppointment.room,
        status: nextAppointment.status,
      };
    }

    // Convert byStatus array to object
    const statusCounts = byStatus.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        patientId: patient._id.toString(),
        patientName: patient.name,
        patientCode: patient.patientCode,
        total,
        today: todayCount,
        upcoming,
        past,
        byStatus: statusCounts,
        nextAppointment: formattedNextAppointment,
        summary: {
          active: statusCounts["scheduled"] || 0,
          completed: statusCounts["completed"] || 0,
          cancelled: statusCounts["cancelled"] || 0,
          noShow: statusCounts["no-show"] || 0,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching patient appointment stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch appointment statistics",
      },
      { status: 500 }
    );
  }
}