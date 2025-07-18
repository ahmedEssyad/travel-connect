'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useLocation } from '@/contexts/LocationContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();
  const { location } = useLocation();
  const { t, isRTL } = useLanguage();
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'compatible' | 'mine'>('all');

  useEffect(() => {
    const refreshParam = searchParams.get('refresh');
    if (refreshParam) {
      // Clear cache when refresh parameter is present
      const locationStr = location ? `${location.lat}-${location.lng}` : 'no-location';
      const cacheKey = `blood-requests-${locationStr}`;
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(`${cacheKey}-time`);
      
      // Remove refresh parameter from URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('refresh');
      router.replace('/blood-requests?' + newParams.toString(), { scroll: false });
    }
    
    fetchBloodRequests();
  }, [location, searchParams]);

  const fetchBloodRequests = async () => {
    try {
      setLoading(true);
      
      // Check cache first
      const locationStr = location ? `${location.lat}-${location.lng}` : 'no-location';
      const cacheKey = `blood-requests-${locationStr}`;
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
      const locationStr = location ? `${location.lat}-${location.lng}` : 'no-location';
      const cacheKey = `blood-requests-${locationStr}`;
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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🩸</div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '8px'
          }}>
            {t('auth.accessRestricted')}
          </h2>
          <p style={{ color: '#6b7280' }}>{t('auth.pleaseLogin')}</p>
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb',
      direction: isRTL ? 'rtl' : 'ltr'
    }}>
      <MobileHeader
        title={t('bloodRequests.title')}
        subtitle={`${filteredRequests.length} ${t('bloodRequests.active')} • ${stats.mine} ${t('bloodRequests.fromYou')}`}
        rightAction={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => router.push('/messages')}
              style={{
                padding: '4px 12px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              💬 {t('bloodRequests.messages')}
            </button>
            <button
              onClick={() => router.push('/request-blood')}
              style={{
                padding: '4px 12px',
                fontSize: '14px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            >
              🚨 {t('bloodRequests.request')}
            </button>
          </div>
        }
      />

      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 16px',
        paddingTop: '104px'
      }}>
        <div style={{ maxWidth: '1536px', margin: '0 auto' }}>
          {/* Filter Tabs */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex' }}>
              <button
                onClick={() => setFilter('all')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderTopLeftRadius: '12px',
                  borderBottomLeftRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: filter === 'all' ? '#3b82f6' : 'white',
                  color: filter === 'all' ? 'white' : '#6b7280'
                }}
                onMouseOver={(e) => {
                  if (filter !== 'all') {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseOut={(e) => {
                  if (filter !== 'all') {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                {t('bloodRequests.allRequests')} ({bloodRequests.length})
              </button>
              <button
                onClick={() => setFilter('compatible')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: filter === 'compatible' ? '#dc2626' : 'white',
                  color: filter === 'compatible' ? 'white' : '#6b7280'
                }}
                onMouseOver={(e) => {
                  if (filter !== 'compatible') {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseOut={(e) => {
                  if (filter !== 'compatible') {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                🩸 {t('bloodRequests.compatible')} ({stats.compatible})
              </button>
              <button
                onClick={() => setFilter('mine')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderTopRightRadius: '12px',
                  borderBottomRightRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: filter === 'mine' ? '#d97706' : 'white',
                  color: filter === 'mine' ? 'white' : '#6b7280'
                }}
                onMouseOver={(e) => {
                  if (filter !== 'mine') {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseOut={(e) => {
                  if (filter !== 'mine') {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                📝 {t('bloodRequests.myRequests')} ({stats.mine})
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          {!loading && bloodRequests.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#dc2626',
                  marginBottom: '4px'
                }}>
                  {stats.critical}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>{t('bloodRequest.critical')}</div>
              </div>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#d97706',
                  marginBottom: '4px'
                }}>
                  {stats.urgent}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>{t('bloodRequest.urgent')}</div>
              </div>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#3b82f6',
                  marginBottom: '4px'
                }}>
                  {stats.compatible}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>{t('bloodRequests.forYou')}</div>
              </div>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#059669',
                  marginBottom: '4px'
                }}>
                  {stats.mine}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>{t('bloodRequests.yourRequests')}</div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '48px 0'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '4px solid #fecaca',
                  borderTop: '4px solid #dc2626',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px auto'
                }}></div>
                <p style={{ color: '#6b7280' }}>{t('bloodRequests.loadingRequests')}</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredRequests.length === 0 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              padding: '32px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🩸</div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '8px'
              }}>
                {filter === 'all' ? t('bloodRequests.noActiveRequests') : 
                 filter === 'compatible' ? t('bloodRequests.noCompatibleRequests') : 
                 t('bloodRequests.noRequestsFromYou')}
              </h3>
              <p style={{
                color: '#6b7280',
                marginBottom: '24px',
                maxWidth: '448px',
                margin: '0 auto 24px auto'
              }}>
                {filter === 'all' ? t('bloodRequests.noRequestsInArea') :
                 filter === 'compatible' ? t('bloodRequests.noMatchingBloodType') :
                 t('bloodRequests.noRequestsCreated')}
              </p>
              <button
                onClick={() => router.push('/request-blood')}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              >
                🚨 {t('bloodRequests.createEmergencyRequest')}
              </button>
            </div>
          )}

          {/* Blood Request Cards */}
          {!loading && filteredRequests.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px'
            }}>
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
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              padding: '24px',
              marginTop: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ fontSize: '24px' }}>💡</div>
                <div>
                  <h3 style={{
                    fontWeight: '600',
                    color: '#1e40af',
                    marginBottom: '8px',
                    margin: '0 0 8px 0'
                  }}>
                    {t('bloodRequests.completeProfilePrompt')}
                  </h3>
                  <p style={{
                    color: '#1d4ed8',
                    marginBottom: '16px',
                    margin: '0 0 16px 0'
                  }}>
                    {t('bloodRequests.addBloodTypePrompt')}
                  </p>
                  <button
                    onClick={() => router.push('/profile')}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                  >
                    {t('home.updateProfile')}
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