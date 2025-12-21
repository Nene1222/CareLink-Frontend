// app/api/appointments/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Appointment from '@/lib/models/Appointment';
import mongoose from 'mongoose';

interface Params {
  params: Promise<{ id: string }>;
}

// Helper function to validate ObjectId
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// PATCH - Update appointment status
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid appointment ID' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    const body = await request.json();
    const { status } = body;
    
    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }
    
    // Validate status value
    const validStatuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        },
        { status: 400 }
      );
    }
    
    // Find and update the appointment
    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { 
        status,
        updatedAt: new Date()
      },
      { 
        new: true,
        runValidators: true 
      }
    )
      .populate('patientId', 'name email phoneNumber patientCode')
      .populate('staffId', 'name specialization phoneNumber email')
      .lean();

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Format the response
    const formattedAppointment = {
      _id: appointment._id.toString(),
      patientId: (appointment.patientId as any)?._id?.toString() || appointment.patientId.toString(),
      patientCode: (appointment.patientId as any)?.patientCode || '',
      patientName: appointment.patientName || (appointment.patientId as any)?.name || 'Unknown Patient',
      patientEmail: (appointment.patientId as any)?.email || '',
      patientPhone: (appointment.patientId as any)?.phoneNumber || '',
      staffId: (appointment.staffId as any)?._id?.toString() || appointment.staffId.toString(),
      doctorName: appointment.doctorName || (appointment.staffId as any)?.name || 'Unknown Doctor',
      specialization: appointment.specialization || (appointment.staffId as any)?.specialization || '',
      date: new Date(appointment.date).toISOString().split('T')[0],
      time: appointment.time,
      room: appointment.room || 'Room 101',
      reason: appointment.reason || 'Consultation',
      notes: appointment.notes || '',
      status: appointment.status,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: formattedAppointment,
      message: `Appointment status updated to ${status}`
    });

  } catch (error: any) {
    console.error('Error updating appointment status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update appointment status' 
      },
      { status: 500 }
    );
  }
}

// GET - Get current appointment status
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid appointment ID' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    const appointment = await Appointment.findById(id)
      .select('status')
      .lean();

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: appointment._id.toString(),
        status: appointment.status
      }
    });

  } catch (error: any) {
    console.error('Error fetching appointment status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch appointment status' 
      },
      { status: 500 }
    );
  }
}