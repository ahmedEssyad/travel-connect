import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BloodRequest from '@/models/BloodRequest';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const donorId = searchParams.get('donorId');

    if (!donorId) {
      return NextResponse.json({ error: 'Donor ID is required' }, { status: 400 });
    }

    await connectDB();

    // Find all blood requests where this user is a donor
    const bloodRequests = await BloodRequest.find({
      'matchedDonors.donorId': donorId
    }).sort({ createdAt: -1 });

    const donations = [];

    // Extract donor-specific information from each request
    for (const request of bloodRequests) {
      const donorMatch = request.matchedDonors.find(d => d.donorId === donorId);
      
      if (donorMatch) {
        donations.push({
          requestId: request._id.toString(),
          donorId: donorMatch.donorId,
          donorName: donorMatch.donorName,
          donorBloodType: donorMatch.donorBloodType,
          status: donorMatch.status,
          respondedAt: donorMatch.respondedAt,
          message: donorMatch.message,
          // Additional request context
          patientBloodType: request.patientInfo.bloodType,
          hospitalName: request.hospital.name,
          urgencyLevel: request.urgencyLevel,
          requestStatus: request.status,
          createdAt: request.createdAt
        });
      }
    }

    return NextResponse.json({
      success: true,
      donations,
      count: donations.length,
      stats: {
        total: donations.length,
        accepted: donations.filter(d => d.status === 'accepted').length,
        declined: donations.filter(d => d.status === 'declined').length,
        pending: donations.filter(d => d.status === 'pending').length
      }
    });

  } catch (error) {
    console.error('Error fetching user donations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}