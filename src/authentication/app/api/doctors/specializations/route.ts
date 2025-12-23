// app/api/doctors/specializations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Doctor from '@/lib/models/Doctor';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get all unique specializations from doctors
    const specializations = await Doctor.aggregate([
      { 
        $match: { 
          specialization: { $exists: true, $ne: null, $ne: "" } 
        } 
      },
      { 
        $group: { 
          _id: '$specialization', 
          count: { $sum: 1 } 
        } 
      },
      { 
        $project: { 
          name: '$_id', 
          count: 1, 
          _id: 0 
        } 
      },
      { $sort: { count: -1 } }
    ]);

    // Get all unique departments from doctors
    const departments = await Doctor.aggregate([
      { 
        $match: { 
          department: { $exists: true, $ne: null, $ne: "" } 
        } 
      },
      { 
        $group: { 
          _id: '$department', 
          count: { $sum: 1 } 
        } 
      },
      { 
        $project: { 
          name: '$_id', 
          count: 1, 
          _id: 0 
        } 
      },
      { $sort: { count: -1 } }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        specializations: specializations || [],
        departments: departments || []
      }
    });
  } catch (error: any) {
    console.error('Error fetching specializations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch specializations' 
      },
      { status: 500 }
    );
  }
}