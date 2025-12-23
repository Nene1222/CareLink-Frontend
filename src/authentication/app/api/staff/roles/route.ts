// app/api/staff/roles/route.ts
import { NextRequest, NextResponse } from "next/server";
import Role from "@/lib/models/Role";
import dbConnect from "@/lib/dbConnect";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const roles = await Role.find({ status: 'active' })
      .select('name description userCount')
      .sort({ name: 1 });
    
    return NextResponse.json({ 
      success: true, 
      data: roles 
    });
    
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}