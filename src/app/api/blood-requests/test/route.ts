import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BloodRequest from '@/models/BloodRequest';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Create a test blood request if none exist
    const existingRequests = await BloodRequest.countDocuments();
    
    if (existingRequests === 0) {
      const testRequest = new BloodRequest({
        requesterId: 'test-user-123',
        patientInfo: {
          name: 'Test Patient',
          age: 30,
          bloodType: 'A+',
          condition: 'Emergency surgery required',
          urgentNote: 'Urgent blood needed'
        },
        hospital: {
          name: 'Test Hospital',
          address: 'Nouakchott, Mauritania',
          coordinates: {
            lat: 18.0735,
            lng: -15.9582
          },
          contactNumber: '+222 12345678',
          department: 'Emergency'
        },
        urgencyLevel: 'critical',
        requiredUnits: 2,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        description: 'Test blood request for emergency surgery',
        status: 'active',
        matchedDonors: [],
        fulfilledUnits: 0,
        contactInfo: {
          requesterName: 'Dr. Test',
          requesterPhone: '+222 87654321',
          alternateContact: '+222 11111111'
        },
        medicalDetails: {
          procedure: 'Emergency surgery',
          doctorName: 'Dr. Test',
          roomNumber: '101',
          specialInstructions: 'Handle with care'
        }
      });
      
      await testRequest.save();
      console.log('Test blood request created');
    }
    
    // Get all blood requests
    const allRequests = await BloodRequest.find({});
    
    return NextResponse.json({
      success: true,
      message: `Database has ${allRequests.length} blood requests`,
      requests: allRequests
    });
    
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}