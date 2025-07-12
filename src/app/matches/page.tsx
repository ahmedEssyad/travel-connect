'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useBloodNotifications } from '@/hooks/useBloodNotifications';
import { apiClient } from '@/lib/api-client';
import MobileHeader from '@/components/Layout/MobileHeader';
import { calculateDistance } from '@/lib/geolocation';

interface BloodRequest {
  _id: string;
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
  };
  urgencyLevel: 'critical' | 'urgent' | 'standard';
  requiredUnits: number;
  deadline: string;
  status: string;
  matchedDonors: DonorMatch[];
  createdAt: string;
  contactInfo: {
    requesterName: string;
    requesterPhone: string;
  };
}

interface DonorMatch {
  donorId: string;
  donorName: string;
  donorBloodType: string;
  status: 'pending' | 'accepted' | 'declined';
  respondedAt: string;
  message?: string;
}

export default function MatchesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const toast = useToast();
  const { activeRequests, respondToBloodRequest } = useBloodNotifications();
  const [activeTab, setActiveTab] = useState<'my-donations' | 'my-requests'>('my-donations');
  const [userRequests, setUserRequests] = useState<BloodRequest[]>([]);
  const [userDonations, setUserDonations] = useState<DonorMatch[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Load user's blood requests and donations
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoadingData(true);
      
      // Load user's blood requests
      const requestsResponse = await apiClient.get(`/api/blood-requests?requesterId=${user?.id}`);
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setUserRequests(requestsData.requests || []);
      }

      // Load user's donation history
      const donationsResponse = await apiClient.get(`/api/blood-requests/donations?donorId=${user?.id}`);
      if (donationsResponse.ok) {
        const donationsData = await donationsResponse.json();
        setUserDonations(donationsData.donations || []);
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load your data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleDonorResponse = async (requestId: string, response: 'accepted' | 'declined') => {
    try {
      const apiResponse = await apiClient.post('/api/blood-requests/respond', {
        requestId,
        donorId: user?.id,
        response
      });

      if (apiResponse.ok) {
        respondToBloodRequest(requestId, response);
        toast.success(`Response recorded: ${response}`);
        loadUserData(); // Refresh data
      } else {
        const error = await apiResponse.text();
        throw new Error(error || 'Failed to respond');
      }
    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to respond');
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'var(--danger)';
      case 'urgent': return 'var(--warning)';
      case 'standard': return 'var(--primary)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'var(--success)';
      case 'declined': return 'var(--danger)';
      case 'pending': return 'var(--warning)';
      default: return 'var(--text-secondary)';
    }
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>Access Restricted</div>
          <p style={{ color: 'var(--text-secondary)' }}>Please log in to view your matches.</p>
        </div>
      </div>
    );
  }

  if (loading || loadingData) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '2px solid transparent',
            borderTop: '2px solid var(--danger)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <MobileHeader
        title="My Matches"
        rightAction={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => router.push('/messages')}
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
            >
              💬 Messages
            </button>
            <button
              onClick={() => router.push('/blood-requests')}
              className="btn btn-primary"
              style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
            >
              Find Requests
            </button>
          </div>
        }
      />

      <main className="container" style={{ padding: '2rem 1rem' }}>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)', marginBottom: '0.25rem' }}>
              {userDonations.filter(d => d.status === 'accepted').length}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Donations Made
            </div>
          </div>
          <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)', marginBottom: '0.25rem' }}>
              {userRequests.filter(r => r.status === 'active').length}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Active Requests
            </div>
          </div>
          <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.25rem' }}>
              {activeRequests.length}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Pending Responses
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            display: 'inline-flex',
            background: 'white',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-light)',
            padding: '4px'
          }}>
            <button
              onClick={() => setActiveTab('my-donations')}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: activeTab === 'my-donations' ? 'var(--success)' : 'transparent',
                color: activeTab === 'my-donations' ? 'white' : 'var(--text-secondary)',
                fontWeight: '500',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              My Donations
            </button>
            <button
              onClick={() => setActiveTab('my-requests')}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: activeTab === 'my-requests' ? 'var(--warning)' : 'transparent',
                color: activeTab === 'my-requests' ? 'white' : 'var(--text-secondary)',
                fontWeight: '500',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              My Requests
            </button>
          </div>
        </div>

        {/* Active Emergency Requests */}
        {activeRequests.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--danger)', marginBottom: '1rem' }}>
              Emergency Requests Awaiting Response
            </h3>
            {activeRequests.slice(0, 3).map((request, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  background: 'rgba(220, 38, 38, 0.1)',
                  border: '1px solid var(--danger)',
                  borderRadius: '0.5rem',
                  marginBottom: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--danger)' }}>
                      {request.urgency.toUpperCase()}: {request.bloodType} needed
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {request.hospital.name} • {request.condition}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => respondToBloodRequest(request.requestId, 'accepted')}
                      className="btn"
                      style={{ 
                        background: 'var(--success)', 
                        color: 'white',
                        fontSize: '0.75rem',
                        padding: '0.5rem 0.75rem'
                      }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => respondToBloodRequest(request.requestId, 'declined')}
                      className="btn btn-outline"
                      style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'my-donations' && (
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              My Donation History
            </h3>
            {userDonations.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🩸</div>
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  No Donations Yet
                </h4>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Start saving lives by responding to blood requests
                </p>
                <button
                  onClick={() => router.push('/blood-requests')}
                  className="btn btn-primary"
                >
                  Find Blood Requests
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {userDonations.map((donation, index) => (
                  <div key={index} className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                          {donation.donorBloodType} Blood Donation
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          Responded: {new Date(donation.respondedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: getStatusColor(donation.status),
                        background: `${getStatusColor(donation.status)}20`,
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem'
                      }}>
                        {donation.status.toUpperCase()}
                      </span>
                    </div>
                    {donation.message && (
                      <div style={{ 
                        fontSize: '0.875rem', 
                        color: 'var(--text-secondary)',
                        background: 'var(--surface)',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        fontStyle: 'italic'
                      }}>
                        "{donation.message}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-requests' && (
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              My Blood Requests
            </h3>
            {userRequests.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚨</div>
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  No Requests Created
                </h4>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Create an emergency blood request when needed
                </p>
                <button
                  onClick={() => router.push('/request-blood')}
                  className="btn btn-primary"
                >
                  Create Blood Request
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {userRequests.map((request, index) => (
                  <div key={index} className="card" style={{ padding: '1.5rem', borderLeft: `4px solid ${getUrgencyColor(request.urgencyLevel)}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                          {request.patientInfo.bloodType} Blood Request
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          Patient: {request.patientInfo.name} ({request.patientInfo.age} years)
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          Hospital: {request.hospital.name}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '600',
                          color: getUrgencyColor(request.urgencyLevel),
                          background: `${getUrgencyColor(request.urgencyLevel)}20`,
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          marginBottom: '0.5rem'
                        }}>
                          {request.urgencyLevel.toUpperCase()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {request.matchedDonors.length} responses
                        </div>
                      </div>
                    </div>
                    
                    {request.matchedDonors.length > 0 && (
                      <div style={{ marginTop: '1rem' }}>
                        <h5 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                          Donor Responses ({request.matchedDonors.length})
                        </h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {request.matchedDonors.slice(0, 3).map((donor, donorIndex) => (
                            <div key={donorIndex} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              padding: '0.5rem',
                              background: 'var(--surface)',
                              borderRadius: '0.375rem'
                            }}>
                              <div>
                                <span style={{ fontWeight: '500' }}>{donor.donorName}</span>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                                  ({donor.donorBloodType})
                                </span>
                              </div>
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                color: getStatusColor(donor.status),
                                background: `${getStatusColor(donor.status)}20`,
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.375rem'
                              }}>
                                {donor.status}
                              </span>
                            </div>
                          ))}
                          {request.matchedDonors.length > 3 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                              +{request.matchedDonors.length - 3} more responses
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}