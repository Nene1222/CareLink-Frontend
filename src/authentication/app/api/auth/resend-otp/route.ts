// app/api/auth/resend-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { sendOTPEmail } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email, isVerified: false });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found or already verified' },
        { status: 404 }
      );
    }

    // Generate new OTP
    const otp = user.generateOTP('registration');
    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, 'registration');

    if (!emailSent) {
      // Clear OTP if email failed
      user.otp = undefined;
      await user.save();
      
      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully to your email.',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}