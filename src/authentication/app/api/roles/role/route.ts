// app/api/roles/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect"; // your MongoDB connection
import Role from "@/lib/models/Role";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Fetch all roles from database
    const roles = await Role.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, roles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}
