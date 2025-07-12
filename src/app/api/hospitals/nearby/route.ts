import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || '5000';

    if (!lat || !lng) {
      throw createApiError('Latitude and longitude are required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      // Return mock data if no API key is configured
      const mockHospitals = [
        {
          id: 'mock-hospital-1',
          name: 'Centre Hospitalier National (CHN)',
          address: 'Nouakchott, Mauritanie',
          coordinates: {
            lat: parseFloat(lat) + 0.01,
            lng: parseFloat(lng) + 0.01
          },
          rating: 4.2,
          phone: '+222 45 25 26 27',
          type: 'hospital'
        },
        {
          id: 'mock-hospital-2',
          name: 'Hôpital Cheikh Zayed',
          address: 'Nouakchott, Mauritanie',
          coordinates: {
            lat: parseFloat(lat) - 0.01,
            lng: parseFloat(lng) - 0.01
          },
          rating: 4.0,
          phone: '+222 45 25 26 28',
          type: 'hospital'
        },
        {
          id: 'mock-hospital-3',
          name: 'Centre Hospitalier Mère et Enfant',
          address: 'Nouakchott, Mauritanie',
          coordinates: {
            lat: parseFloat(lat) + 0.005,
            lng: parseFloat(lng) - 0.005
          },
          rating: 4.1,
          phone: '+222 45 25 26 29',
          type: 'hospital'
        }
      ];

      return NextResponse.json({
        status: 'OK',
        results: mockHospitals
      });
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=hospital&key=${apiKey}`
    );

    if (!response.ok) {
      throw createApiError('Failed to fetch hospital data', HttpStatus.INTERNAL_SERVER_ERROR, ErrorTypes.EXTERNAL_SERVICE_ERROR);
    }

    const data = await response.json();

    if (data.status === 'OK') {
      const hospitals = data.results.map((hospital: any) => ({
        id: hospital.place_id,
        name: hospital.name,
        address: hospital.vicinity,
        coordinates: {
          lat: hospital.geometry.location.lat,
          lng: hospital.geometry.location.lng
        },
        rating: hospital.rating,
        phone: hospital.formatted_phone_number,
        type: 'hospital'
      }));

      return NextResponse.json({
        status: 'OK',
        results: hospitals
      });
    } else {
      throw createApiError(`Google Maps API error: ${data.status}`, HttpStatus.INTERNAL_SERVER_ERROR, ErrorTypes.EXTERNAL_SERVICE_ERROR);
    }

  } catch (error) {
    logError(error, 'GET /api/hospitals/nearby', { 
      lat: request.nextUrl.searchParams.get('lat'),
      lng: request.nextUrl.searchParams.get('lng')
    });
    return handleApiError(error, 'GET /api/hospitals/nearby');
  }
}