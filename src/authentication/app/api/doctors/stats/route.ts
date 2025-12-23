// app/api/doctors/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Doctor from '@/lib/models/Doctor';
import Staff from '@/lib/models/Staff';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const [
      totalDoctors,
      availableDoctors,
      totalStaffDoctors,
      avgRating,
      topSpecializations,
    ] = await Promise.all([
      // Total doctors count
      Doctor.countDocuments(),
      
      // Available doctors count
      Doctor.countDocuments({ isAvailable: true }),
      
      // Doctors with active staff
      Doctor.aggregate([
        {
          $lookup: {
            from: 'staff',
            localField: 'staff',
            foreignField: '_id',
            as: 'staffDetails',
          },
        },
        { $unwind: '$staffDetails' },
        { $match: { 'staffDetails.status': 'active' } },
        { $count: 'count' },
      ]),
      
      // Average rating
      Doctor.aggregate([
        { $match: { rating: { $gt: 0 } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } },
      ]),
      
      // Top 5 specializations
      Doctor.aggregate([
        { $group: { _id: '$specialization', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { name: '$_id', count: 1, _id: 0 } },
      ]),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalDoctors,
        availableDoctors,
        doctorsWithActiveStaff: totalStaffDoctors[0]?.count || 0,
        averageRating: avgRating[0]?.avgRating?.toFixed(1) || '0.0',
        topSpecializations,
      },
    });
  } catch (error: any) {
    console.error('Error fetching doctor stats:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch doctor statistics' },
      { status: 500 }
    );
  }
}