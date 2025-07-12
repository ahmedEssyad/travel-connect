import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BloodRequest from '@/models/BloodRequest';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await connectDB();

    // Find all blood requests where user is either:
    // 1. The requester (created the blood request)
    // 2. A donor who accepted a blood request
    
    const userRequests = await BloodRequest.find({
      requesterId: userId,
      'matchedDonors.status': 'accepted'
    }).populate('matchedDonors.donorId', 'name bloodType');

    const userDonations = await BloodRequest.find({
      'matchedDonors.donorId': userId,
      'matchedDonors.status': 'accepted'
    }).populate('requesterId', 'name bloodType');

    const connections = [];

    // Process user's requests (where others donated)
    for (const request of userRequests) {
      const acceptedDonors = request.matchedDonors.filter(d => d.status === 'accepted');
      
      for (const donor of acceptedDonors) {
        // Get donor info
        const donorUser = await User.findById(donor.donorId);
        
        if (donorUser) {
          connections.push({
            requestId: request._id.toString(),
            donorId: donor.donorId,
            requesterId: request.requesterId,
            donorName: donorUser.name,
            requesterName: request.contactInfo.requesterName,
            bloodType: request.patientInfo.bloodType,
            hospital: request.hospital.name,
            urgency: request.urgencyLevel,
            status: request.status === 'active' ? 'active' : 'completed',
            createdAt: donor.respondedAt || request.createdAt,
            lastMessage: donor.message || null,
            lastActivity: donor.respondedAt || request.createdAt
          });
        }
      }
    }

    // Process user's donations (where they donated)
    for (const request of userDonations) {
      const userDonation = request.matchedDonors.find(d => 
        d.donorId.toString() === userId && d.status === 'accepted'
      );
      
      if (userDonation) {
        // Get requester info
        const requesterUser = await User.findById(request.requesterId);
        
        if (requesterUser) {
          connections.push({
            requestId: request._id.toString(),
            donorId: userId,
            requesterId: request.requesterId,
            donorName: requesterUser.name, // This would be the current user, but we use requester name
            requesterName: request.contactInfo.requesterName,
            bloodType: request.patientInfo.bloodType,
            hospital: request.hospital.name,
            urgency: request.urgencyLevel,
            status: request.status === 'active' ? 'active' : 'completed',
            createdAt: userDonation.respondedAt || request.createdAt,
            lastMessage: userDonation.message || null,
            lastActivity: userDonation.respondedAt || request.createdAt
          });
        }
      }
    }

    // Remove duplicates and sort by last activity
    const uniqueConnections = connections.filter((conn, index, self) => 
      index === self.findIndex(c => c.requestId === conn.requestId && c.donorId === conn.donorId)
    );

    uniqueConnections.sort((a, b) => 
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );

    return NextResponse.json({
      success: true,
      connections: uniqueConnections,
      count: uniqueConnections.length
    });

  } catch (error) {
    console.error('Error fetching blood connections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}