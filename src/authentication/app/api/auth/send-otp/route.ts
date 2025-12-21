// app/api/auth/send-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { sendOTPEmail } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const { email, type } = await request.json();

    if (!email || !type) {
      return NextResponse.json(
        { error: 'Email and type are required' },
        { status: 400 }
      );
    }

    let user;

    if (type === 'password-reset') {
      // For password reset, user must exist
      user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json(
          { error: 'No account found with this email' },
          { status: 404 }
        );
      }
    } else if (type === 'registration') {
      // For registration, check if user already exists
      user = await User.findOne({ email });
      if (user && user.isVerified) {
        return NextResponse.json(
          { error: 'User already exists with this email' },
          { status: 409 }
        );
      }
      
      // If user exists but not verified, use that record
      if (!user) {
        // For new registration, we'll create a temporary user or wait for registration API
        return NextResponse.json(
          { error: 'Please complete registration first' },
          { status: 400 }
        );
      }
    }

    // Generate OTP
    const otp = user.generateOTP(type);
    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, type);

    if (!emailSent) {
      // Clear OTP if email failed
      user.otp = undefined;
      await user.save();
      
      return NextResponse.json(
        { error: 'Failed to send OTP email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}