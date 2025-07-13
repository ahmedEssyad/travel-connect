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
  hospital?: {
    name?: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
    contactNumber?: string;
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
      
      // Check cache first
      const cacheKey = `blood-requests-${location?.lat}-${location?.lng}`;
      const cached = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(`${cacheKey}-time`);
      
      // Use cache if less than 2 minutes old
      if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 120000) {
        setBloodRequests(JSON.parse(cached));
        setLoading(false);
        return;
      }
      
      const params = new URLSearchParams({
        status: 'active',
        limit: '10' // Reduced from 20 to 10 for faster loading
      });

      if (location) {
        params.append('lat', location.lat.toString());
        params.append('lng', location.lng.toString());
        params.append('radius', '25'); // Reduced radius for faster queries
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await apiClient.get(`/api/blood-requests?${params}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const requests = data.requests || [];
        setBloodRequests(requests);
        
        // Cache the results
        localStorage.setItem(cacheKey, JSON.stringify(requests));
        localStorage.setItem(`${cacheKey}-time`, Date.now().toString());
      } else {
        throw new Error('Failed to fetch blood requests');
      }
    } catch (error) {
      console.error('Error fetching blood requests:', error);
      
      // Try to use cache on error
      const cacheKey = `blood-requests-${location?.lat}-${location?.lng}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setBloodRequests(JSON.parse(cached));
        toast.error('Using cached data - check your connection');
      } else {
        toast.error('No internet connection - please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResponseUpdate = () => {
    fetchBloodRequests();
  };

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

  const getMyRequestsCount = () => {
    return bloodRequests.filter(request => request.requesterId === user?.id).length;
  };

  const getStats = () => {
    return {
      critical: bloodRequests.filter(req => req.urgencyLevel === 'critical').length,
      urgent: bloodRequests.filter(req => req.urgencyLevel === 'urgent').length,
      compatible: user?.bloodType ? bloodRequests.filter(req => 
        canDonateToPatient(user.bloodType, req.patientInfo.bloodType)
      ).length : 0,
      mine: getMyRequestsCount()
    };
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">🩸</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Restricted</h2>
          <p className="text-gray-600">Please log in to view blood requests.</p>
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader
        title="Blood Requests"
        subtitle={`${filteredRequests.length} active • ${stats.mine} from you`}
        rightAction={
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/messages')}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              💬 Messages
            </button>
            <button
              onClick={() => router.push('/request-blood')}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              🚨 Request
            </button>
          </div>
        }
      />

      <main className="container mx-auto px-4 py-6" style={{ paddingTop: '80px' }}>
        <div className="max-w-6xl mx-auto">
          {/* Filter Tabs */}
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="flex">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-l-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                All Requests ({bloodRequests.length})
              </button>
              <button
                onClick={() => setFilter('compatible')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  filter === 'compatible'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                🩸 Compatible ({stats.compatible})
              </button>
              <button
                onClick={() => setFilter('mine')}
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-r-lg transition-colors ${
                  filter === 'mine'
                    ? 'bg-yellow-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                📝 My Requests ({stats.mine})
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          {!loading && bloodRequests.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {stats.critical}
                </div>
                <div className="text-sm text-gray-600">Critical</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600 mb-1">
                  {stats.urgent}
                </div>
                <div className="text-sm text-gray-600">Urgent</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {stats.compatible}
                </div>
                <div className="text-sm text-gray-600">For You</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {stats.mine}
                </div>
                <div className="text-sm text-gray-600">Your Requests</div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading blood requests...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredRequests.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="text-6xl mb-4">🩸</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {filter === 'all' ? 'No active blood requests' : 
                 filter === 'compatible' ? 'No compatible requests' : 
                 'No requests from you'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {filter === 'all' ? 'There are currently no blood requests in your area.' :
                 filter === 'compatible' ? 'No blood requests match your blood type right now.' :
                 'You haven\'t created any blood requests yet.'}
              </p>
              <button
                onClick={() => router.push('/request-blood')}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                🚨 Create Emergency Request
              </button>
            </div>
          )}

          {/* Blood Request Cards */}
          {!loading && filteredRequests.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map(request => (
                <BloodRequestCard
                  key={request._id}
                  request={request}
                  onResponseUpdate={handleResponseUpdate}
                />
              ))}
            </div>
          )}

          {/* Profile Completion Prompt */}
          {user && !user.bloodType && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
              <div className="flex items-start gap-4">
                <div className="text-2xl">💡</div>
                <div>
                  <h3 className="font-semibold text-blue-800 mb-2">Complete your profile</h3>
                  <p className="text-blue-700 mb-4">
                    Add your blood type to see compatible requests and help others in need.
                  </p>
                  <button
                    onClick={() => router.push('/profile')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Update Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}