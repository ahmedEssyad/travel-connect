'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useLocation } from '@/contexts/LocationContext';
import { apiClient } from '@/lib/api-client';
import MobileHeader from '@/components/Layout/MobileHeader';
import BloodRequestCard from '@/components/BloodRequests/BloodRequestCard';

interface BloodRequest {
  _id: string;
  requesterId: string;
  patientInfo: {
    name: string;
    age: number;
    bloodType: string;
    condition: string;
  };
  hospital: {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
    contactNumber: string;
    department?: string;
  };
  urgencyLevel: 'critical' | 'urgent' | 'standard';
  requiredUnits: number;
  deadline: string;
  status: string;
  matchedDonors: any[];
  createdAt: string;
  contactInfo: {
    requesterName: string;
    requesterPhone: string;
  };
}

export default function BloodRequestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const { location } = useLocation();
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'compatible' | 'mine'>('all');

  useEffect(() => {
    fetchBloodRequests();
  }, [location]);

  const fetchBloodRequests = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        status: 'active',
        limit: '50'
      });

      // Add location if available
      if (location) {
        params.append('lat', location.lat.toString());
        params.append('lng', location.lng.toString());
        params.append('radius', '50'); // 50km radius
      }

      const response = await apiClient.get(`/api/blood-requests?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setBloodRequests(data.requests || []);
      } else {
        throw new Error('Failed to fetch blood requests');
      }
    } catch (error) {
      console.error('Error fetching blood requests:', error);
      toast.error('Failed to load blood requests');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseUpdate = () => {
    // Refresh the list when someone responds
    fetchBloodRequests();
  };

  // Simple blood compatibility check
  const canDonateToPatient = (donorType: string, patientType: string): boolean => {
    const compatibility: Record<string, string[]> = {
      'A+': ['A+', 'A-', 'O+', 'O-'],
      'A-': ['A-', 'O-'],
      'B+': ['B+', 'B-', 'O+', 'O-'],
      'B-': ['B-', 'O-'],
      'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      'AB-': ['A-', 'B-', 'AB-', 'O-'],
      'O+': ['O+', 'O-'],
      'O-': ['O-']
    };
    
    return compatibility[patientType]?.includes(donorType) || false;
  };

  const filteredRequests = bloodRequests.filter(request => {
    switch (filter) {
      case 'compatible':
        return user?.bloodType && 
               request.patientInfo.bloodType &&
               canDonateToPatient(user.bloodType, request.patientInfo.bloodType);
      case 'mine':
        return user?.id === request.requesterId;
      default:
        return true;
    }
  });

  // Get count of user's own requests
  const getMyRequestsCount = () => {
    return bloodRequests.filter(request => request.requesterId === user?.id).length;
  };

  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--surface)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            Access Restricted
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Please log in to view blood requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <MobileHeader
        title="Blood Requests"
        subtitle={`${filteredRequests.length} active request${filteredRequests.length !== 1 ? 's' : ''} • ${getMyRequestsCount()} from you`}
        rightAction={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => router.push('/messages')}
              className="btn btn-outline"
              style={{
                fontSize: '0.75rem',
                padding: '0.5rem 0.75rem',
                fontWeight: '500'
              }}
            >
              💬 Messages
            </button>
            <button
              onClick={() => router.push('/request-blood')}
              className="btn"
              style={{
                background: 'var(--danger)',
                color: 'white',
                fontSize: '0.75rem',
                padding: '0.5rem 0.75rem',
                fontWeight: '600'
              }}
            >
              🚨 Request
            </button>
          </div>
        }
      />

      <main className="container p-4 sm:p-6 md:p-8">
        {/* Filter Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6 p-1 bg-white rounded border">
        
          <button
            onClick={() => setFilter('all')}
            className="flex-1 p-3 border-0 rounded text-sm font-medium cursor-pointer transition-all touch-target"
            style={{
              background: filter === 'all' ? 'var(--primary)' : 'transparent',
              color: filter === 'all' ? 'white' : 'var(--text-secondary)'
            }}
          >
            All Requests ({bloodRequests.length})
          </button>
          <button
            onClick={() => setFilter('compatible')}
            className="flex-1 p-3 rounded text-sm font-medium cursor-pointer transition-all touch-target"
            style={{
              background: filter === 'compatible' ? 'var(--success)' : 'transparent',
              color: filter === 'compatible' ? 'white' : 'var(--text-secondary)'
            }}
          >
            🩸 For My Type ({bloodRequests.filter(req => 
              user?.bloodType && canDonateToPatient(user.bloodType, req.patientInfo.bloodType)
            ).length})
          </button>
          <button
            onClick={() => setFilter('mine')}
            className="flex-1 p-3 rounded text-sm font-medium cursor-pointer transition-all touch-target"
            style={{
              background: filter === 'mine' ? 'var(--warning)' : 'transparent',
              color: filter === 'mine' ? 'white' : 'var(--text-secondary)'
            }}
          >
            📝 Mine ({getMyRequestsCount()})
          </button>
        </div>

        {/* Quick Stats */}
        {!loading && bloodRequests.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white p-3 sm:p-4 rounded text-center border border-gray-200">
              <div className="text-lg sm:text-xl font-bold" style={{ color: 'var(--danger)' }}>
                {bloodRequests.filter(req => req.urgencyLevel === 'critical').length}
              </div>
              <div className="text-xs text-gray-600">Critical</div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded text-center border border-gray-200">
              <div className="text-lg sm:text-xl font-bold" style={{ color: '#f59e0b' }}>
                {bloodRequests.filter(req => req.urgencyLevel === 'urgent').length}
              </div>
              <div className="text-xs text-gray-600">Urgent</div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded text-center border border-gray-200">
              <div className="text-lg sm:text-xl font-bold" style={{ color: 'var(--primary)' }}>
                {user?.bloodType && bloodRequests.filter(req => 
                  canDonateToPatient(user.bloodType, req.patientInfo.bloodType)
                ).length || 0}
              </div>
              <div className="text-xs text-gray-600">For You</div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded text-center border border-gray-200">
              <div className="text-lg sm:text-xl font-bold" style={{ color: 'var(--success)' }}>
                {getMyRequestsCount()}
              </div>
              <div className="text-xs text-gray-600">Your Requests</div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center p-6 sm:p-8 text-gray-600">
            <div className="text-2xl sm:text-3xl mb-2">🔄</div>
            <div className="text-sm sm:text-base">Loading blood requests...</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRequests.length === 0 && (
          <div className="text-center px-4 py-8 sm:px-6 sm:py-12 text-gray-600">
            <div className="text-4xl sm:text-5xl md:text-6xl mb-4">🩸</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {filter === 'all' ? 'No active blood requests' : 
               filter === 'compatible' ? 'No compatible requests' : 
               'No requests from you'}
            </h3>
            <p className="text-sm sm:text-base mb-6 max-w-md mx-auto">
              {filter === 'all' ? 'There are currently no blood requests in your area.' :
               filter === 'compatible' ? 'No blood requests match your blood type right now.' :
               'You haven\'t created any blood requests yet.'}
            </p>
            <button
              onClick={() => router.push('/request-blood')}
              className="btn px-4 py-3 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold touch-target"
              style={{
                background: 'var(--danger)',
                color: 'white'
              }}
            >
              🚨 Create Emergency Request
            </button>
          </div>
        )}

        {/* Blood Request Cards */}
        {!loading && filteredRequests.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredRequests.map(request => (
              <BloodRequestCard
                key={request._id}
                request={request}
                onResponseUpdate={handleResponseUpdate}
              />
            ))}
          </div>
        )}

        {/* Info Box */}
        {user && !user.bloodType && (
          <div className="mt-6 sm:mt-8 p-4 sm:p-6 rounded-lg border" style={{
            background: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgba(59, 130, 246, 0.2)'
          }}>
            <div className="text-sm sm:text-base font-medium mb-2" style={{ color: 'var(--primary)' }}>
              💡 Complete your profile
            </div>
            <p className="text-sm sm:text-base mb-4" style={{ color: 'var(--text-secondary)' }}>
              Add your blood type to see compatible requests and help others.
            </p>
            <button
              onClick={() => router.push('/profile')}
              className="btn btn-primary text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3 touch-target"
            >
              Update Profile
            </button>
          </div>
        )}
      </main>
    </div>
  );
}