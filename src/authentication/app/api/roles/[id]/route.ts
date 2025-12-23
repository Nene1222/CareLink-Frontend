// app/api/roles/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Role from "@/lib/models/Role";
import User from "@/lib/models/User";
import mongoose from "mongoose";

function badRequest(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

/* ============================================================
   PUT — UPDATE ROLE
   ============================================================ */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // 🔥 MUST AWAIT PARAMS

  await dbConnect();

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return badRequest("Invalid role ID");
  }

  const body = await req.json();
  const { name, description, permissions } = body;

  if (!name || !description) {
    return badRequest("Name and description are required");
  }

  const role = await Role.findById(id);
  if (!role) {
    return NextResponse.json(
      { success: false, error: "Role not found" },
      { status: 404 }
    );
  }

  const normalizedName = name.toLowerCase().trim();

  // Check duplicate role
  const duplicate = await Role.findOne({
    name: normalizedName,
    _id: { $ne: id },
  });

  if (duplicate) {
    return badRequest("Role with this name already exists");
  }

  if (!Array.isArray(permissions)) {
    return badRequest("Invalid permissions format");
  }

  role.name = normalizedName;
  role.description = description;
  role.permissions = permissions;

  await role.save();

  return NextResponse.json(
    { success: true, message: "Role updated successfully", role },
    { status: 200 }
  );
}

/* ============================================================
   DELETE — REMOVE ROLE
   ============================================================ */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // 🔥 FIX HERE TOO

  try {
    await dbConnect();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return badRequest("Invalid role ID");
    }

    const role = await Role.findById(id);
    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    // Count users who use this role
    const userCount = await User.countDocuments({ role: role.name });

    if (userCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete role. There are ${userCount} user(s) assigned.`,
        },
        { status: 400 }
      );
    }

    await Role.findByIdAndDelete(id);

    return NextResponse.json(
      { success: true, message: "Role deleted successfully" },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("DELETE Role Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete role" },
      { status: 500 }
    );
  }
}
