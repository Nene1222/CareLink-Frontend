// app/api/patients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Patient from '@/lib/models/Patient';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    
    // Search filter
    if (searchQuery) {
      const regex = new RegExp(searchQuery, 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { patientCode: regex },
        { phoneNumber: regex }
      ];
    }
    
    // Status filter
    if (status !== 'all') {
      query.status = status;
    }

    // Fetch patients with pagination
    const [patients, total] = await Promise.all([
      Patient.find(query)
        .populate('user', 'username role isActive isVerified lastLogin')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Patient.countDocuments(query)
    ]);

    // Transform data to match frontend format
    const transformedPatients = patients.map(patient => ({
      id: patient.patientCode,
      name: patient.name,
      email: patient.email,
      phone: patient.phoneNumber || '',
      dob: patient.dateOfBirth.toISOString().split('T')[0],
      status: patient.status,
      lastVisit: patient.updatedAt.toISOString().split('T')[0],
      userId: patient.user?._id,
      gender: patient.gender,
      address: patient.address,
      emergencyContact: patient.emergencyContact,
      medicalHistory: patient.medicalHistory
    }));

    return NextResponse.json({
      success: true,
      patients: transformedPatients,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Get patients error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
// app/api/patients/route.ts - POST method
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const data = await request.json();
    
    // Required fields
    const requiredFields = ['name', 'email', 'dateOfBirth', 'phoneNumber'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if email already exists in Patient collection
    const existingPatient = await Patient.findOne({ email: data.email });
    if (existingPatient) {
      return NextResponse.json(
        { error: 'Patient with this email already exists' },
        { status: 409 }
      );
    }

    // Check if user exists (verified or unverified)
    const existingUser = await User.findOne({ email: data.email });
    
    if (existingUser?.isVerified) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Generate patient code
    const { generatePatientCode } = await import('@/lib/utils/generatePatientCode');
    const patientCode = await generatePatientCode();

    // Generate username from name
    const username = data.name.toLowerCase().replace(/\s+/g, '');
    const baseUsername = username;
    let uniqueUsername = baseUsername;
    let counter = 1;
    
    // Make sure username is unique
    while (await User.findOne({ username: uniqueUsername })) {
      uniqueUsername = `${baseUsername}${counter}`;
      counter++;
    }

    let user;
    if (existingUser && !existingUser.isVerified) {
      // Update existing unverified user
      user = existingUser;
      user.username = uniqueUsername;
      user.role = data.role || 'patient';
      user.isActive = true;
      user.contactNumber = data.phoneNumber;
      
      // If password is provided, update it
      if (data.password) {
        user.password = data.password;
      }
      
      await user.save();
    } else {
      // Create new user
      user = new User({
        username: uniqueUsername,
        email: data.email,
        password: data.password || 'defaultPassword123', // You might want to generate a random one
        role: data.role || 'patient',
        isVerified: true, // Admin creates, no need for verification
        isActive: true,
        contactNumber: data.phoneNumber
      });
      await user.save();
    }

    // Create patient record
    const patient = new Patient({
      patientCode,
      user: user._id,
      name: data.name,
      email: data.email,
      dateOfBirth: new Date(data.dateOfBirth),
      phoneNumber: data.phoneNumber,
      address: data.address || '',
      gender: data.gender || 'prefer-not-to-say',
      emergencyContact: data.emergencyContact || {},
      medicalHistory: data.medicalHistory || [],
      status: data.status || 'active'
    });

    await patient.save();

    return NextResponse.json({
      success: true,
      message: 'Patient created successfully',
      patient: {
        id: patient.patientCode,
        name: patient.name,
        email: patient.email,
        phone: patient.phoneNumber,
        dob: patient.dateOfBirth.toISOString().split('T')[0],
        status: patient.status,
        lastVisit: patient.updatedAt.toISOString().split('T')[0]
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create patient error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Duplicate patient or user record' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}