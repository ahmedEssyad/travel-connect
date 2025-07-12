import { NextRequest, NextResponse } from 'next/server';
import { formatMauritanianPhone } from '@/lib/sms-auth';
import { handleApiError, logError } from '@/lib/error-handler';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');

    if (!phoneNumber) {
      return NextResponse.json({ exists: false, hasPassword: false });
    }

    await connectDB();

    const formattedPhone = formatMauritanianPhone(phoneNumber);

    // Check if user exists
    const user = await User.findOne({ phoneNumber: formattedPhone });
    
    if (!user) {
      return NextResponse.json({ exists: false, hasPassword: false });
    }

    return NextResponse.json({ 
      exists: true, 
      hasPassword: user.hasPassword || false 
    });

  } catch (error) {
    logError(error, 'GET /api/auth/check-user');
    return handleApiError(error, 'GET /api/auth/check-user');
  }
}