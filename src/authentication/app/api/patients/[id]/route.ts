// app/api/patients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Patient from '@/lib/models/Patient';
import User from '@/lib/models/User';

// Type for route parameters
type RouteParams = {
  id: string; // This should match the folder name [id]
};

// GET: Get single patient by id (patientCode)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // Await the params in Next.js 15
    const { id } = await params;
    
    console.log('GET: Fetching patient with ID:', id);

    // Find patient by patientCode (since frontend uses P001, P002, etc.)
    const patient = await Patient.findOne({ patientCode: id })
      .populate('user', 'username role isActive isVerified lastLogin');

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      patient: {
        id: patient.patientCode,
        name: patient.name,
        email: patient.email,
        phone: patient.phoneNumber || '',
        dob: patient.dateOfBirth.toISOString().split('T')[0],
        status: patient.status,
        lastVisit: patient.updatedAt.toISOString().split('T')[0],
        gender: patient.gender,
        address: patient.address,
        patientCode: patient.patientCode
      }
    });
  } catch (error: any) {
    console.error('Get patient error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update patient by id (patientCode)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // Await the params in Next.js 15
    const { id } = await params;
    const data = await request.json();

    console.log('PUT: Updating patient:', id, data);

    // Find patient by patientCode
    const patient = await Patient.findOne({ patientCode: id });
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Update patient fields - match your frontend form data
    if (data.name !== undefined) patient.name = data.name;
    if (data.phone !== undefined) patient.phoneNumber = data.phone;
    if (data.address !== undefined) patient.address = data.address;
    if (data.gender !== undefined) patient.gender = data.gender;
    if (data.status !== undefined) patient.status = data.status;
    
    // Update date of birth if provided (frontend sends as 'dob')
    if (data.dob) {
      patient.dateOfBirth = new Date(data.dob);
    }

    // Update email if provided
    if (data.email && data.email !== patient.email) {
      const user = await User.findById(patient.user);
      if (user) {
        // Check if new email already exists
        const existingUser = await User.findOne({ 
          email: data.email,
          _id: { $ne: user._id }
        });
        
        if (existingUser) {
          return NextResponse.json(
            { error: 'Email already in use by another user' },
            { status: 409 }
          );
        }

        user.email = data.email;
        await user.save();
        
        // Update email in patient record
        patient.email = data.email;
      }
    }

    await patient.save();

    return NextResponse.json({
      success: true,
      message: 'Patient updated successfully',
      patient: {
        id: patient.patientCode,
        name: patient.name,
        email: patient.email,
        phone: patient.phoneNumber || '',
        dob: patient.dateOfBirth.toISOString().split('T')[0],
        status: patient.status,
        lastVisit: patient.updatedAt.toISOString().split('T')[0]
      }
    });
  } catch (error: any) {
    console.error('Update patient error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Duplicate email or patient code' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete patient by id (patientCode)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // Await the params in Next.js 15
    const { id } = await params;

    console.log('DELETE: Deleting patient:', id);

    // Find patient by patientCode
    const patient = await Patient.findOne({ patientCode: id });
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Delete patient record
    await Patient.deleteOne({ patientCode: id });
    
    // Also delete the associated user
    await User.deleteOne({ _id: patient.user });

    return NextResponse.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete patient error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}