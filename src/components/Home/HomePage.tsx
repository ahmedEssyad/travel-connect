'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useBloodNotifications } from '@/hooks/useBloodNotifications';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { Heart, Users, MapPin, Bell, UserCheck, Settings, Plus } from 'lucide-react';

export default function HomePage() {
  const { user, logout } = useAuth();
  const { location } = useLocation();
  const { activeRequests } = useBloodNotifications();
  const { t, isRTL } = useLanguage();
  const [stats, setStats] = useState({
    totalDonors: 0,
    activeRequests: 0,
    successfulMatches: 0
  });

  useEffect(() => {
    setStats({
      totalDonors: 1247,
      activeRequests: activeRequests.length,
      successfulMatches: 89
    });
  }, [activeRequests]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb',
      margin: 0,
      padding: 0,
      direction: isRTL ? 'rtl' : 'ltr'
    }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              backgroundColor: '#dc2626', 
              padding: '8px', 
              borderRadius: '12px' 
            }}>
              <Heart style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#111827',
                margin: 0
              }}>
                {t('app.name')}
              </h1>
              {user?.name && (
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280',
                  margin: 0
                }}>
                  {t('home.welcome')}, {user.name.split(' ')[0]}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              href="/settings"
              style={{
                padding: '8px',
                color: '#6b7280',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
            >
              <Settings style={{ width: '20px', height: '20px' }} />
            </Link>
            <button
              onClick={logout}
              style={{
                color: '#6b7280',
                fontSize: '14px',
                fontWeight: '500',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Quick Actions */}
      <section style={{ 
        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        color: 'white',
        padding: '48px 16px'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ 
              fontSize: '30px', 
              fontWeight: '700', 
              marginBottom: '16px',
              margin: 0
            }}>
              {t('home.quickActions')}
            </h2>
            <p style={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: '18px',
              margin: 0
            }}>
              {t('home.howCanWeHelp')}
            </p>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '24px', 
            maxWidth: '800px', 
            margin: '0 auto' 
          }}>
            <Link
              href="/request-blood"
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                textDecoration: 'none',
                color: 'white',
                transition: 'all 0.3s ease',
                display: 'block'
              }}
            >
              <div style={{ 
                background: '#ef4444', 
                padding: '12px', 
                borderRadius: '50%', 
                width: '64px', 
                height: '64px', 
                margin: '0 auto 16px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bell style={{ width: '32px', height: '32px', color: 'white' }} />
              </div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                marginBottom: '8px',
                margin: '0 0 8px 0'
              }}>
                {t('home.requestBlood')}
              </h3>
              <p style={{ 
                color: 'rgba(255,255,255,0.8)', 
                fontSize: '14px',
                margin: 0
              }}>
                {t('home.requestBloodDesc')}
              </p>
            </Link>
            
            <Link
              href="/blood-requests"
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                textDecoration: 'none',
                color: 'white',
                transition: 'all 0.3s ease',
                display: 'block'
              }}
            >
              <div style={{ 
                background: '#ef4444', 
                padding: '12px', 
                borderRadius: '50%', 
                width: '64px', 
                height: '64px', 
                margin: '0 auto 16px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Heart style={{ width: '32px', height: '32px', color: 'white' }} />
              </div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                marginBottom: '8px',
                margin: '0 0 8px 0'
              }}>
                {t('home.donateBlood')}
              </h3>
              <p style={{ 
                color: 'rgba(255,255,255,0.8)', 
                fontSize: '14px',
                margin: 0
              }}>
                {t('home.donateBloodDesc')}
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ backgroundColor: 'white', padding: '48px 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '32px' 
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '36px', 
                fontWeight: '700', 
                color: '#dc2626', 
                marginBottom: '8px' 
              }}>
                {stats.totalDonors.toLocaleString()}
              </div>
              <div style={{ 
                color: '#6b7280', 
                fontWeight: '500',
                fontSize: '16px'
              }}>
                {t('home.registeredDonors')}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '36px', 
                fontWeight: '700', 
                color: '#d97706', 
                marginBottom: '8px' 
              }}>
                {stats.activeRequests}
              </div>
              <div style={{ 
                color: '#6b7280', 
                fontWeight: '500',
                fontSize: '16px'
              }}>
                {t('home.activeRequests')}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '36px', 
                fontWeight: '700', 
                color: '#059669', 
                marginBottom: '8px' 
              }}>
                {stats.successfulMatches}
              </div>
              <div style={{ 
                color: '#6b7280', 
                fontWeight: '500',
                fontSize: '16px'
              }}>
                {t('home.livesSaved')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Notifications */}
      {activeRequests.length > 0 && (
        <section style={{ backgroundColor: '#fef2f2', padding: '32px 16px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '24px' 
            }}>
              <Bell style={{ width: '24px', height: '24px', color: '#dc2626' }} />
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#991b1b',
                margin: 0
              }}>
                {t('home.emergencyBloodRequests')}
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeRequests.slice(0, 3).map((request, index) => (
                <div 
                  key={index} 
                  style={{ 
                    backgroundColor: 'white', 
                    padding: '16px', 
                    borderRadius: '8px', 
                    border: '1px solid #fecaca', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <div>
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#b91c1c',
                        marginBottom: '4px'
                      }}>
                        {request.urgency.toUpperCase()}: {request.bloodType} needed
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#6b7280' 
                      }}>
                        {request.hospital.name} • {request.condition}
                      </div>
                    </div>
                    <Link
                      href="/blood-requests"
                      style={{
                        backgroundColor: '#dc2626',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        textDecoration: 'none',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      Respond
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            {activeRequests.length > 3 && (
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Link
                  href="/blood-requests"
                  style={{
                    color: '#dc2626',
                    border: '1px solid #dc2626',
                    padding: '8px 24px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    display: 'inline-block',
                    transition: 'background-color 0.2s'
                  }}
                >
                  View All {activeRequests.length} Requests
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* User Profile Status */}
      {user && (
        <section style={{ backgroundColor: 'white', padding: '32px 0' }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            padding: '0 16px' 
          }}>
            <div style={{ 
              backgroundColor: '#f9fafb', 
              borderRadius: '12px', 
              padding: '24px' 
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    backgroundColor: '#fecaca', 
                    padding: '12px', 
                    borderRadius: '50%' 
                  }}>
                    <UserCheck style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                  </div>
                  <div>
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      color: '#111827',
                      margin: '0 0 8px 0'
                    }}>
                      {t('home.yourDonorProfile')}
                    </h3>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      margin: '0 0 4px 0'
                    }}>
                      {t('home.bloodType')}: <span style={{ fontWeight: '500' }}>{user.bloodType || t('validation.required')}</span>
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      margin: 0
                    }}>
                      {t('home.status')}: <span style={{ 
                        fontWeight: '500',
                        color: user.bloodType ? '#059669' : '#d97706'
                      }}>
                        {user.bloodType ? t('home.activeDonor') : t('home.profileIncomplete')}
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/profile"
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '500',
                    fontSize: '14px',
                    transition: 'background-color 0.2s',
                    display: 'inline-block'
                  }}
                >
                  {user.bloodType ? t('home.updateProfile') : t('home.completeProfile')}
                </Link>
              </div>
            </div>

            {/* Location Status */}
            {location && (
              <div style={{ 
                marginTop: '16px', 
                backgroundColor: '#f0fdf4', 
                borderRadius: '12px', 
                padding: '16px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <MapPin style={{ width: '20px', height: '20px', color: '#059669' }} />
                  <div>
                    <div style={{ 
                      fontWeight: '500', 
                      color: '#065f46',
                      margin: '0 0 4px 0'
                    }}>
                      {t('home.locationEnabled')}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#059669',
                      margin: 0
                    }}>
                      {t('home.readyToReceive')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}