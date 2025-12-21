// app/api/staff/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import Staff from "@/lib/models/Staff";
import dbConnect from "@/lib/dbConnect";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';

    // If no search query provided, return all staff
    const searchQuery = query.trim();

    // Build MongoDB search filter
    const filter: any = {};
    
    if (searchQuery) {
      filter.$or = [
        { name: { $regex: searchQuery, $options: "i" } },
        { email: { $regex: searchQuery, $options: "i" } },
        { role: { $regex: searchQuery, $options: "i" } },
        { phoneNumber: { $regex: searchQuery, $options: "i" } },
        { specialization: { $regex: searchQuery, $options: "i" } },
      ];
    }

    // Fetch staff and populate user
    const staffs = await Staff.find(filter)
      .populate("user", "username email role isActive isVerified contactNumber")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: staffs }, { status: 200 });
  } catch (err: any) {
    console.error("Error searching staff:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || "Failed to search staff" 
    }, { status: 500 });
  }
}