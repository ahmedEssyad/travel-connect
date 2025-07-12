'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';
import BloodTypeSelector from '@/components/Profile/BloodTypeSelector';
import EmergencyContactForm from '@/components/Profile/EmergencyContactForm';
import MedicalInfoForm from '@/components/Profile/MedicalInfoForm';

interface ProfileData {
  name: string;
  email: string;
  bloodType: string;
  medicalInfo: {
    weight: number;
    age: number;
    availableForDonation: boolean;
    isDonor: boolean;
    medicalConditions: string[];
  };
  emergencyContacts: {
    name: string;
    phone: string;
    relationship: string;
  }[];
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    bloodType: '',
    medicalInfo: {
      weight: 0,
      age: 0,
      availableForDonation: false,
      isDonor: false,
      medicalConditions: []
    },
    emergencyContacts: []
  });

  const isSetup = searchParams.get('setup') === 'true';

  useEffect(() => {
    if (user && user.name && user.bloodType && !isSetup) {
      // User profile is already complete, redirect to home
      router.push('/');
    }
  }, [user, router, isSetup]);

  const handleBasicInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.name || !profileData.bloodType) {
      toast.error('Please fill in all required fields');
      return;
    }
    setStep(2);
  };

  const handleMedicalInfoSubmit = async (medicalInfo: any) => {
    setProfileData(prev => ({ ...prev, medicalInfo }));
    setStep(3);
  };

  const handleEmergencyContactSubmit = async (emergencyContacts: any[]) => {
    setProfileData(prev => ({ ...prev, emergencyContacts }));
    await submitProfile();
  };

  const submitProfile = async () => {
    setLoading(true);
    try {
      const response = await apiClient.put('/api/auth/profile', profileData);
      
      if (response.ok) {
        await refreshUser();
        toast.success('Profile setup complete!');
        router.push('/');
      } else {
        const error = await response.text();
        toast.error(error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Profile setup error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = [
    'Basic Information',
    'Medical Information',
    'Emergency Contacts'
  ];

  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div>Please log in to continue</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, var(--danger) 0%, #B91C1C 100%)',
      padding: '1rem'
    }}>
      <div style={{ 
        maxWidth: '480px', 
        margin: '0 auto',
        paddingTop: '2rem'
      }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '2rem',
          color: 'white'
        }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700',
            marginBottom: '0.5rem'
          }}>
            🩸 Complete Your Profile
          </h1>
          <p style={{ opacity: 0.9 }}>
            Help us match you with blood donation opportunities
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '2rem'
        }}>
          {stepTitles.map((title, index) => (
            <div 
              key={index}
              style={{ 
                flex: 1,
                textAlign: 'center',
                color: 'white',
                opacity: step > index ? 1 : 0.6
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: step > index ? 'white' : 'rgba(255, 255, 255, 0.3)',
                color: step > index ? 'var(--danger)' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.5rem auto',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                {index + 1}
              </div>
              <div style={{ 
                fontSize: '0.75rem',
                fontWeight: '500'
              }}>
                {title}
              </div>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="card" style={{ 
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          {step === 1 && (
            <form onSubmit={handleBasicInfoSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  marginBottom: '0.5rem',
                  color: 'var(--text-primary)'
                }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  marginBottom: '0.5rem',
                  color: 'var(--text-primary)'
                }}>
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <BloodTypeSelector
                  value={profileData.bloodType}
                  onChange={(bloodType) => setProfileData(prev => ({ ...prev, bloodType }))}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
                disabled={!profileData.name || !profileData.bloodType}
              >
                Continue
              </button>
            </form>
          )}

          {step === 2 && (
            <MedicalInfoForm
              initialData={profileData.medicalInfo}
              onSubmit={handleMedicalInfoSubmit}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && (
            <EmergencyContactForm
              initialData={profileData.emergencyContacts}
              onSubmit={handleEmergencyContactSubmit}
              onBack={() => setStep(2)}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}