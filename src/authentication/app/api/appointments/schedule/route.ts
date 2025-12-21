import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Appointment from '@/lib/models/Appointment';
import Staff from '@/lib/models/Staff';
import Patient from '@/lib/models/Patient';

// POST - Create new appointment
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['patientId', 'staffId', 'date', 'time'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if patient exists
    const patient = await Patient.findById(body.patientId);
    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Check if staff exists
    const staff = await Staff.findById(body.staffId);
    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Check for existing appointment at same time
    const existingAppointment = await Appointment.findOne({
      staffId: body.staffId,
      date: new Date(body.date),
      time: body.time,
      status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
      return NextResponse.json(
        { success: false, error: 'Time slot already booked for this doctor' },
        { status: 409 }
      );
    }

    // Create new appointment
    const appointment = new Appointment({
      patientId: body.patientId,
      staffId: body.staffId,
      date: new Date(body.date),
      time: body.time,
      status: 'scheduled',
      notes: body.notes || ''
    });

    await appointment.save();

    // Populate data for response
    const savedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email')
      .populate('staffId', 'name role')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        id: savedAppointment._id.toString(),
        patientName: savedAppointment.patientId?.name,
        doctorName: savedAppointment.staffId?.name,
        date: new Date(savedAppointment.date).toISOString().split('T')[0],
        time: savedAppointment.time,
        status: savedAppointment.status
      },
      message: 'Appointment scheduled successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error scheduling appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to schedule appointment' },
      { status: 500 }
    );
  }
}