import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Patient from '@/lib/models/Patient';

export async function GET() {
  try {
    await dbConnect();
    
    // Create a test patient
    const testPatient = await Patient.create({
      name: 'Test Patient',
      email: 'test@example.com',
      dateOfBirth: new Date(),
      phoneNumber: '1234567890'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      data: testPatient 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}