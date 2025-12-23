// app/api/roles/route.ts
import { NextRequest, NextResponse } from "next/server";

import Role from "@/lib/models/Role";
import dbConnect from "@/lib/dbConnect";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, description, permissions } = body;

    if (!name) {
      return NextResponse.json(
        { 
          success: false,
          error: "Name and description are required" 
        },
        { status: 400 }
      );
    }

    // Convert name to lowercase and check if role already exists
    const roleName = name.toLowerCase().trim();
    const existingRole = await Role.findOne({ name: roleName });
    if (existingRole) {
      return NextResponse.json( 
        { 
          success: false,
          error: "Role with this name already exists" 
        },
        { status: 400 }
      );
    }

    const newRole = new Role({
      name: roleName,
      description,
      permissions: permissions || [],
      userCount: 0,
      status: "active"
    });

    await newRole.save();

    return NextResponse.json(
      { 
        success: true,
        message: "Role created successfully", 
        role: newRole 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to create role" 
      },
      { status: 500 }
    );
  }
}