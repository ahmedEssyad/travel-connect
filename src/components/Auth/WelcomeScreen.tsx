'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const handleGetStarted = () => {
    router.push('/profile/setup?setup=true');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--danger) 0%, #B91C1C 100%)',
      padding: '1rem'
    }}>
      <div style={{ 
        maxWidth: '400px', 
        width: '100%', 
        textAlign: 'center',
        color: 'white'
      }}>
        {/* Welcome Animation */}
        <div style={{
          fontSize: '4rem',
          marginBottom: '1rem',
          animation: 'pulse 2s infinite'
        }}>
          🩸
        </div>

        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700',
          marginBottom: '1rem'
        }}>
          Welcome to mounkidh!
        </h1>

        <p style={{ 
          fontSize: '1.125rem',
          marginBottom: '2rem',
          opacity: 0.9,
          lineHeight: '1.6'
        }}>
          You've successfully verified your phone number. Now let's set up your profile to connect you with blood donation opportunities in Mauritania.
        </p>

        {/* Features */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ 
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            What you can do:
          </div>
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🚨</span>
              <span>Create emergency blood requests</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🩸</span>
              <span>Find compatible blood donors nearby</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📱</span>
              <span>Get instant SMS notifications</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🔐</span>
              <span>Set password to save SMS costs</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🏥</span>
              <span>Connect with hospitals and clinics</span>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <button
          onClick={handleGetStarted}
          className="btn"
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1.125rem',
            fontWeight: '600',
            background: 'white',
            color: 'var(--danger)',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
        >
          Set Up My Profile
        </button>

        <p style={{ 
          fontSize: '0.875rem',
          marginTop: '1rem',
          opacity: 0.8
        }}>
          This will only take 2-3 minutes
        </p>
      </div>
    </div>
  );
}