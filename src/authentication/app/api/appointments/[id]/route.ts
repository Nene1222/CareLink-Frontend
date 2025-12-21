// app/api/appointments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Appointment from '@/lib/models/Appointment';
import Staff from '@/lib/models/Staff';
import Patient from '@/lib/models/Patient';
import mongoose from 'mongoose';

interface Params {
  params: Promise<{ id: string }>;
}

// Helper function to validate ObjectId
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Helper function to format appointment response
const formatAppointmentResponse = (appointment: any) => {
  const isPopulatedPatient = appointment.patientId && typeof appointment.patientId === 'object';
  const isPopulatedStaff = appointment.staffId && typeof appointment.staffId === 'object';
  
  return {
    _id: appointment._id.toString(),
    patientId: isPopulatedPatient 
      ? (appointment.patientId as any)._id?.toString() 
      : appointment.patientId.toString(),
    patientCode: isPopulatedPatient 
      ? (appointment.patientId as any).patientCode || ''
      : '',
    patientName: appointment.patientName || (isPopulatedPatient 
      ? (appointment.patientId as any).name 
      : 'Unknown Patient'),
    patientEmail: isPopulatedPatient 
      ? (appointment.patientId as any).email || ''
      : '',
    patientPhone: isPopulatedPatient 
      ? (appointment.patientId as any).phoneNumber || ''
      : '',
    staffId: isPopulatedStaff 
      ? (appointment.staffId as any)._id?.toString() 
      : appointment.staffId.toString(),
    doctorName: appointment.doctorName || (isPopulatedStaff 
      ? (appointment.staffId as any).name 
      : 'Unknown Doctor'),
    specialization: appointment.specialization || (isPopulatedStaff 
      ? (appointment.staffId as any).specialization 
      : ''),
    date: new Date(appointment.date).toISOString().split('T')[0],
    time: appointment.time,
    room: appointment.room,
    reason: appointment.reason,
    notes: appointment.notes || '',
    status: appointment.status,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt
  };
};

// GET single appointment
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
      .populate('patientId', 'name email phoneNumber patientCode')
      .populate('staffId', 'name specialization phoneNumber email')
      .lean();

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: formatAppointmentResponse(appointment)
    });

  } catch (error: any) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch appointment' 
      },
      { status: 500 }
    );
  }
}

// PUT - Update appointment
export async function PUT(request: NextRequest, { params }: Params) {
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
    
    console.log('Updating appointment with ID:', id);
    console.log('Update data:', body);
    
    // Find existing appointment
    const existingAppointment = await Appointment.findById(id);
    if (!existingAppointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Validate status if provided
    if (body.status && !['scheduled', 'completed', 'cancelled', 'no-show'].includes(body.status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    // Update patient info if patientId is provided
    if (body.patientId) {
      let patient;
      
      // Try to find by ObjectId first
      if (mongoose.Types.ObjectId.isValid(body.patientId)) {
        patient = await Patient.findById(body.patientId);
      }
      
      // If not found, try by patientCode
      if (!patient) {
        patient = await Patient.findOne({ patientCode: body.patientId });
      }
      
      if (!patient) {
        return NextResponse.json(
          { success: false, error: 'Patient not found' },
          { status: 404 }
        );
      }
      
      updateData.patientId = patient._id;
      updateData.patientName = patient.name;
    }
    
    // Update doctor info if staffId is provided
    if (body.staffId) {
      const staff = await Staff.findById(body.staffId);
      if (!staff) {
        return NextResponse.json(
          { success: false, error: 'Doctor not found' },
          { status: 404 }
        );
      }
      
      updateData.staffId = staff._id;
      updateData.doctorName = body.doctorName || staff.name;
      updateData.specialization = body.specialization || staff.specialization;
    } else {
      // If doctor name/specialization is provided without staffId, update those fields
      if (body.doctorName) updateData.doctorName = body.doctorName;
      if (body.specialization) updateData.specialization = body.specialization;
    }
    
    // Update other fields
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.time !== undefined) updateData.time = body.time;
    if (body.room !== undefined) updateData.room = body.room;
    if (body.reason !== undefined) updateData.reason = body.reason;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    
    // Check for time slot conflicts if date/time/staffId/room is being changed
    const checkDate = body.date ? new Date(body.date) : existingAppointment.date;
    const checkTime = body.time || existingAppointment.time;
    const checkRoom = body.room || existingAppointment.room;
    const checkStaffId = body.staffId || existingAppointment.staffId;
    
    // Only check conflicts if the appointment is not being cancelled
    if (body.status !== 'cancelled' && (body.date || body.time || body.room || body.staffId)) {
      const conflictQuery: any = {
        _id: { $ne: id },
        date: checkDate,
        time: checkTime,
        room: checkRoom,
        staffId: checkStaffId,
        status: { $nin: ['cancelled', 'no-show'] }
      };
      
      // Also check if another doctor might be using the same room at same time
      const roomConflictQuery: any = {
        _id: { $ne: id },
        date: checkDate,
        time: checkTime,
        room: checkRoom,
        status: { $nin: ['cancelled', 'no-show'] }
      };
      
      const [doctorConflict, roomConflict] = await Promise.all([
        Appointment.findOne(conflictQuery),
        Appointment.findOne(roomConflictQuery)
      ]);
      
      if (doctorConflict) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Time slot already booked for ${doctorConflict.doctorName} in ${doctorConflict.room}` 
          },
          { status: 409 }
        );
      }
      
      if (roomConflict) {
        return NextResponse.json(
          { 
            success: false, 
            error: `${roomConflict.room} is already booked at ${roomConflict.time} by ${roomConflict.doctorName}` 
          },
          { status: 409 }
        );
      }
    }
    
    // Update the appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('patientId', 'name email phoneNumber patientCode')
      .populate('staffId', 'name specialization phoneNumber email')
      .lean();

    if (!updatedAppointment) {
      return NextResponse.json(
        { success: false, error: 'Failed to update appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: formatAppointmentResponse(updatedAppointment),
      message: 'Appointment updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update appointment' 
      },
      { status: 500 }
    );
  }
}

// PATCH - Partial update (mainly for status)
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
    
    // Find existing appointment
    const existingAppointment = await Appointment.findById(id);
    if (!existingAppointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }
    
    // Validate status if provided
    if (body.status && !['scheduled', 'completed', 'cancelled', 'no-show'].includes(body.status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    // Update only provided fields
    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.reason !== undefined) updateData.reason = body.reason;
    if (body.time !== undefined) updateData.time = body.time;
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.room !== undefined) updateData.room = body.room;
    
    // For partial updates, also update doctor/patient names if IDs are provided
    if (body.staffId) {
      const staff = await Staff.findById(body.staffId);
      if (!staff) {
        return NextResponse.json(
          { success: false, error: 'Doctor not found' },
          { status: 404 }
        );
      }
      updateData.staffId = staff._id;
      updateData.doctorName = body.doctorName || staff.name;
      updateData.specialization = body.specialization || staff.specialization;
    }
    
    if (body.patientId) {
      let patient;
      
      if (mongoose.Types.ObjectId.isValid(body.patientId)) {
        patient = await Patient.findById(body.patientId);
      }
      
      if (!patient) {
        patient = await Patient.findOne({ patientCode: body.patientId });
      }
      
      if (!patient) {
        return NextResponse.json(
          { success: false, error: 'Patient not found' },
          { status: 404 }
        );
      }
      
      updateData.patientId = patient._id;
      updateData.patientName = patient.name;
    }
    
    // Check for time slot conflicts if date/time/room/staffId is being changed
    if ((body.date || body.time || body.room || body.staffId) && body.status !== 'cancelled') {
      const checkDate = body.date ? new Date(body.date) : existingAppointment.date;
      const checkTime = body.time || existingAppointment.time;
      const checkRoom = body.room || existingAppointment.room;
      const checkStaffId = body.staffId || existingAppointment.staffId;
      
      const conflictQuery: any = {
        _id: { $ne: id },
        date: checkDate,
        time: checkTime,
        room: checkRoom,
        staffId: checkStaffId,
        status: { $nin: ['cancelled', 'no-show'] }
      };
      
      const conflictingAppointment = await Appointment.findOne(conflictQuery);
      
      if (conflictingAppointment) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Time slot already booked for this doctor and room' 
          },
          { status: 409 }
        );
      }
    }
    
    // Update the appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('patientId', 'name email phoneNumber patientCode')
      .populate('staffId', 'name specialization phoneNumber email')
      .lean();

    if (!updatedAppointment) {
      return NextResponse.json(
        { success: false, error: 'Failed to update appointment' },
        { status: 500 }
      );
    }

    const statusMessage = body.status 
      ? `marked as ${body.status}` 
      : 'updated';
    
    return NextResponse.json({
      success: true,
      data: formatAppointmentResponse(updatedAppointment),
      message: `Appointment ${statusMessage} successfully`
    });

  } catch (error: any) {
    console.error('Error patching appointment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update appointment' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Permanently delete appointment (hard delete)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid appointment ID' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Find and delete the appointment
    const deletedAppointment = await Appointment.findByIdAndDelete(id)
      .populate('patientId', 'name email phoneNumber patientCode')
      .populate('staffId', 'name specialization phoneNumber email')
      .lean();

    if (!deletedAppointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: deletedAppointment._id.toString(),
        patientName: deletedAppointment.patientName || (deletedAppointment.patientId as any)?.name || 'Unknown Patient',
        doctorName: deletedAppointment.doctorName || (deletedAppointment.staffId as any)?.name || 'Unknown Doctor',
        date: new Date(deletedAppointment.date).toISOString().split('T')[0],
        time: deletedAppointment.time
      },
      message: 'Appointment permanently deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to delete appointment' 
      },
      { status: 500 }
    );
  }
}