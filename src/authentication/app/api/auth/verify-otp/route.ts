// app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If user is already verified, redirect to login
    if (user.isVerified) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified. Please login.',
        redirectTo: '/login'
      });
    }

    // Verify OTP
    const isValid = user.verifyOTP(otp);
    
    if (!isValid) {
      await user.save(); // Save attempt count
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Mark user as verified and save
    user.isVerified = true;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now login.',
      redirectTo: '/login'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}