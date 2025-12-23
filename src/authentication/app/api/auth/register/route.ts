import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import Patient from "@/lib/models/Patient";
import { sendOTPEmail } from "@/lib/emailService";
import { generatePatientCode } from "@/lib/utils/generatePatientCode";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      password,
      dateOfBirth,
      phoneNumber,
      address,
      gender,
    } = body;

    // ---------------- VALIDATION ----------------
    if (!firstName || !lastName || !email || !password || !dateOfBirth) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Validate date
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return NextResponse.json(
        { error: "Invalid date of birth" },
        { status: 400 }
      );
    }

    const patientName = `${firstName} ${lastName}`;
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;

    // ---------------- CHECK VERIFIED USER ----------------
    const verifiedUser = await User.findOne({
      email,
      isVerified: true,
    });

    if (verifiedUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 409 }
      );
    }

    // ---------------- CHECK EXISTING UNVERIFIED USER ----------------
    let user = await User.findOne({
      email,
      isVerified: false,
    });

    let isNewUser = false;

    if (user) {
      user.username = username;
      user.contactNumber = phoneNumber;

      // Only update password if provided
      if (password) {
        user.password = password;
      }
    } else {
      user = new User({
        username,
        email,
        password,
        role: "patient",
        isVerified: false,
        isActive: true,
        contactNumber: phoneNumber,
      });

      isNewUser = true;
    }

    // ---------------- GENERATE OTP ----------------
    const otp = user.generateOTP("registration");
    await user.save();

    // ---------------- CREATE PATIENT (SAFE) ----------------
    if (isNewUser) {
      const patientCode = await generatePatientCode();

      if (!patientCode) {
        throw new Error("Patient code generation failed");
      }

      const existingPatient = await Patient.findOne({ email });
      if (!existingPatient) {
        const patient = new Patient({
          patientCode,
          user: user._id,
          name: patientName,
          email,
          dateOfBirth: dob,
          phoneNumber,
          address,
          gender: gender || "prefer-not-to-say",
          status: "active",
        });

        await patient.save();
      }
    }

    // ---------------- SEND OTP EMAIL ----------------
    let emailSent = false;
    try {
      emailSent = await sendOTPEmail(email, otp, "registration");
    } catch (mailError) {
      console.error("Email error:", mailError);
    }

    if (!emailSent) {
      user.otp = undefined;
      await user.save();

      if (isNewUser) {
        await Patient.deleteOne({ user: user._id });
      }

      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    // ---------------- SUCCESS ----------------
    return NextResponse.json(
      {
        success: true,
        message:
          "Registration successful. Please verify your email using the OTP.",
        userId: user._id,
        email,
        redirectTo: "/verify-otp",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("REGISTER API ERROR:", error);

    // Duplicate key errors
    if (error.code === 11000) {
      if (error.keyPattern?.email) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 }
        );
      }

      if (error.keyPattern?.patientCode) {
        return NextResponse.json(
          { error: "Patient code conflict. Try again." },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
