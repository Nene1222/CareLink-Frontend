import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Appointment from '@/lib/models/Appointment';

// GET appointments for calendar view
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const doctorId = searchParams.get('doctorId');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    let query: any = {
      date: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' }
    };

    if (doctorId) query.staffId = doctorId;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name')
      .populate('staffId', 'name role')
      .sort({ date: 1, time: 1 })
      .lean();

    // Group by date, time, and room for calendar view
    const calendarData = appointments.map(apt => ({
      id: apt._id.toString(),
      patientName: apt.patientId?.name || 'Unknown',
      doctorName: apt.staffId?.name || 'Unknown',
      date: new Date(apt.date).toISOString().split('T')[0],
      time: apt.time,
      room: 'Room ' + (Math.floor(Math.random() * 10) + 101), // Add room to your model
      status: apt.status
    }));

    return NextResponse.json({
      success: true,
      data: calendarData
    });

  } catch (error) {
    console.error('Error fetching calendar appointments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}