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

      <main style={{ padding: '1rem' }}>
        {/* Filter Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginBottom: '1.5rem',
          padding: '0.25rem',
          background: 'white',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)'
        }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              borderRadius: '0.25rem',
              background: filter === 'all' ? 'var(--primary)' : 'transparent',
              color: filter === 'all' ? 'white' : 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            All Requests ({bloodRequests.length})
          </button>
          <button
            onClick={() => setFilter('compatible')}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              borderRadius: '0.25rem',
              background: filter === 'compatible' ? 'var(--success)' : 'transparent',
              color: filter === 'compatible' ? 'white' : 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🩸 For My Type ({bloodRequests.filter(req => 
              user?.bloodType && canDonateToPatient(user.bloodType, req.patientInfo.bloodType)
            ).length})
          </button>
          <button
            onClick={() => setFilter('mine')}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              borderRadius: '0.25rem',
              background: filter === 'mine' ? 'var(--warning)' : 'transparent',
              color: filter === 'mine' ? 'white' : 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📝 Mine ({getMyRequestsCount()})
          </button>
        </div>

        {/* Quick Stats */}
        {!loading && bloodRequests.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '0.5rem',
              textAlign: 'center',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--danger)' }}>
                {bloodRequests.filter(req => req.urgencyLevel === 'critical').length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Critical</div>
            </div>
            <div style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '0.5rem',
              textAlign: 'center',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
                {bloodRequests.filter(req => req.urgencyLevel === 'urgent').length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Urgent</div>
            </div>
            <div style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '0.5rem',
              textAlign: 'center',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                {user?.bloodType && bloodRequests.filter(req => 
                  canDonateToPatient(user.bloodType, req.patientInfo.bloodType)
                ).length || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>For You</div>
            </div>
            <div style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '0.5rem',
              textAlign: 'center',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
                {getMyRequestsCount()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Your Requests</div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔄</div>
            Loading blood requests...
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRequests.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem 2rem',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🩸</div>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              marginBottom: '0.5rem',
              color: 'var(--text-primary)'
            }}>
              {filter === 'all' ? 'No active blood requests' : 
               filter === 'compatible' ? 'No compatible requests' : 
               'No requests from you'}
            </h3>
            <p style={{ marginBottom: '1.5rem' }}>
              {filter === 'all' ? 'There are currently no blood requests in your area.' :
               filter === 'compatible' ? 'No blood requests match your blood type right now.' :
               'You haven\'t created any blood requests yet.'}
            </p>
            <button
              onClick={() => router.push('/request-blood')}
              className="btn"
              style={{
                background: 'var(--danger)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}
            >
              🚨 Create Emergency Request
            </button>
          </div>
        )}

        {/* Blood Request Cards */}
        {!loading && filteredRequests.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
          <div style={{ 
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <div style={{ 
              fontSize: '0.875rem',
              color: 'var(--primary)',
              fontWeight: '500',
              marginBottom: '0.5rem'
            }}>
              💡 Complete your profile
            </div>
            <p style={{ 
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              margin: '0 0 1rem 0'
            }}>
              Add your blood type to see compatible requests and help others.
            </p>
            <button
              onClick={() => router.push('/profile')}
              className="btn btn-primary"
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              Update Profile
            </button>
          </div>
        )}
      </main>
    </div>
  );
}