import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Appointment from '@/lib/models/Appointment';

// GET appointment statistics
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total appointments
    const total = await Appointment.countDocuments({ 
      status: { $ne: 'cancelled' }
    });

    // Today's appointments
    const todayCount = await Appointment.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: { $ne: 'cancelled' }
    });

    // Upcoming appointments (next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcoming = await Appointment.countDocuments({
      date: { $gte: tomorrow, $lte: nextWeek },
      status: { $ne: 'cancelled' }
    });

    // By status
    const byStatus = await Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        total,
        today: todayCount,
        upcoming,
        byStatus: byStatus.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error) {
    console.error('Error fetching appointment stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}