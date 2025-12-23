// app/api/patients/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Patient from '@/lib/models/Patient';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const [total, active] = await Promise.all([
      Patient.countDocuments(),
      Patient.countDocuments({ status: 'active' })
    ]);

    // You can add more stats like:
    // - Patients added this month
    // - Gender distribution
    // - Age groups, etc.

    return NextResponse.json({
      success: true,
      stats: {
        total,
        active,
        inactive: total - active
      }
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}