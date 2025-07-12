'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useBloodNotifications } from '@/hooks/useBloodNotifications';
import Link from 'next/link';
import MobileHeader from '@/components/Layout/MobileHeader';
import LocationStatus from '@/components/Common/LocationStatus';

export default function HomePage() {
  const { user, logout } = useAuth();
  const { location } = useLocation();
  const { activeRequests } = useBloodNotifications();
  const [stats, setStats] = useState({
    totalDonors: 0,
    activeRequests: 0,
    successfulMatches: 0
  });

  useEffect(() => {
    // Mock stats for now - in production, fetch from API
    setStats({
      totalDonors: 1247,
      activeRequests: activeRequests.length,
      successfulMatches: 89
    });
  }, [activeRequests]);

  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      {/* Mobile-Optimized Header */}
      <MobileHeader
        title="BloodConnect"
        subtitle={user?.name ? `Welcome, ${user.name.split(' ')[0]}` : undefined}
        showBack={false}
        rightAction={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link 
              href="/profile" 
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
            >
              Profile
            </Link>
            <button 
              onClick={logout} 
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
            >
              Logout
            </button>
          </div>
        }
      />

      {/* Hero Section */}
      <section style={{ 
        background: 'linear-gradient(135deg, var(--danger) 0%, #B91C1C 100%)',
        color: 'white',
        padding: '3rem 0'
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ 
              fontSize: '2.25rem', 
              fontWeight: '700', 
              marginBottom: '1rem',
              lineHeight: '1.2'
            }}>
              Save Lives. Share Blood.
            </h2>
            <p style={{ 
              fontSize: '1.125rem', 
              opacity: '0.9', 
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}>
              Emergency blood request matching system - connecting donors with patients in need
            </p>
            
            {/* Action Buttons */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem',
              maxWidth: '400px',
              margin: '0 auto'
            }}>
              <Link 
                href="/request-blood"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  textDecoration: 'none',
                  color: 'white',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
                className="card"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  🚨 Emergency Request
                </div>
                <div style={{ fontSize: '0.875rem', opacity: '0.8' }}>
                  Need blood urgently?
                </div>
              </Link>
              
              <Link 
                href="/blood-requests"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  textDecoration: 'none',
                  color: 'white',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
                className="card"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  🩸 Donate Blood
                </div>
                <div style={{ fontSize: '0.875rem', opacity: '0.8' }}>
                  Help save lives
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '2rem 1rem', background: 'white' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--danger)', marginBottom: '0.5rem' }}>
                {stats.totalDonors.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Registered Donors
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--warning)', marginBottom: '0.5rem' }}>
                {stats.activeRequests}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Active Requests
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--success)', marginBottom: '0.5rem' }}>
                {stats.successfulMatches}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Lives Saved
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Notifications */}
      {activeRequests.length > 0 && (
        <section style={{ padding: '2rem 1rem', background: 'rgba(220, 38, 38, 0.05)' }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '1.5rem' }}>🚨</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--danger)' }}>
                Emergency Blood Requests
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeRequests.slice(0, 3).map((request, index) => (
                <div
                  key={index}
                  style={{
                    background: 'white',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--danger)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--danger)' }}>
                      {request.urgency.toUpperCase()}: {request.bloodType} needed
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {request.hospital.name} • {request.condition}
                    </div>
                  </div>
                  <Link
                    href="/blood-requests"
                    className="btn"
                    style={{ background: 'var(--danger)', color: 'white', fontSize: '0.75rem' }}
                  >
                    Respond
                  </Link>
                </div>
              ))}
            </div>
            {activeRequests.length > 3 && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Link
                  href="/blood-requests"
                  className="btn btn-outline"
                  style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                >
                  View All {activeRequests.length} Requests
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section style={{ padding: '3rem 1rem', background: 'var(--surface)' }}>
        <div className="container">
          <h3 style={{ fontSize: '1.5rem', fontWeight: '600', textAlign: 'center', marginBottom: '2rem' }}>
            How BloodConnect Works
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                1. Register as Donor
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Sign up and add your blood type, medical info, and contact details
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                2. Get Notifications
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Receive real-time alerts when compatible blood is needed nearby
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🩸</div>
              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                3. Save Lives
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Respond to urgent requests and help save lives in your community
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Profile Status */}
      {user && (
        <section style={{ padding: '2rem 1rem', background: 'white' }}>
          <div className="container">
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                Your Donor Status
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Blood Type: <strong>{user.bloodType || 'Not set'}</strong>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Status: <strong>{user.bloodType ? 'Active Donor' : 'Profile Incomplete'}</strong>
                  </div>
                </div>
                <Link
                  href="/profile"
                  className="btn btn-primary"
                  style={{ fontSize: '0.875rem' }}
                >
                  {user.bloodType ? 'Update Profile' : 'Complete Profile'}
                </Link>
              </div>
            </div>
            
            {/* Location Status */}
            <LocationStatus />
          </div>
        </section>
      )}
    </div>
  );
}