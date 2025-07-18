'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiClient } from '@/lib/api-client';
import BloodTypeSelector from '@/components/Common/BloodTypeSelector';
import MobileHeader from '@/components/Layout/MobileHeader';
import { BloodType, UrgencyLevel, URGENCY_LEVELS } from '@/lib/blood-types';

export default function RequestBloodPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    patientInfo: {
      name: '',
      age: 0,
      bloodType: '' as BloodType | '',
      condition: '',
      urgentNote: ''
    },
    urgencyLevel: 'urgent' as UrgencyLevel,
    requiredUnits: 1,
    deadline: '',
    description: '',
    contactInfo: {
      requesterName: user?.name || '',
      requesterPhone: user?.phone || '',
      alternateContact: ''
    },
    hospital: {
      name: '',
      address: '',
      department: '',
      contactNumber: ''
    },
    medicalDetails: {
      procedure: '',
      doctorName: '',
      roomNumber: '',
      specialInstructions: ''
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to create a blood request');
      return;
    }

    // Validation
    if (!formData.patientInfo.name.trim()) {
      toast.error(t('validation.patientNameRequired'));
      return;
    }
    
    if (!formData.patientInfo.bloodType) {
      toast.error(t('validation.bloodTypeRequired'));
      return;
    }
    
    if (!formData.patientInfo.condition.trim()) {
      toast.error(t('validation.conditionRequired'));
      return;
    }
    
    if (!formData.deadline) {
      toast.error(t('validation.deadlineRequired'));
      return;
    }

    if (!formData.contactInfo.requesterPhone.trim()) {
      toast.error(t('validation.phoneRequired'));
      return;
    }

    if (!formData.hospital.name.trim()) {
      toast.error('Hospital name is required');
      return;
    }

    // Check if deadline is in the future
    const deadlineDate = new Date(formData.deadline);
    if (deadlineDate <= new Date()) {
      toast.error(t('validation.deadlineFuture'));
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/api/blood-requests', {
        ...formData,
        deadline: deadlineDate.toISOString()
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`${t('notifications.requestCreated')} ${result.notifiedDonors} ${t('notifications.donorsNotified')}.`);
        
        // Force refresh by adding timestamp parameter
        router.push('/blood-requests?refresh=' + Date.now());
      } else {
        const error = await response.text();
        throw new Error(error || t('notifications.connectionFailed'));
      }
    } catch (error) {
      console.error('Error creating blood request:', error);
      toast.error(error instanceof Error ? error.message : t('notifications.connectionFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        direction: isRTL ? 'rtl' : 'ltr'
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

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb',
      direction: isRTL ? 'rtl' : 'ltr'
    }}>
      <MobileHeader
        title={t('bloodRequest.emergencyRequest')}
        rightAction={
          <button
            onClick={() => router.back()}
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
            {t('common.cancel')}
          </button>
        }
      />

      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 16px',
        paddingTop: '104px'
      }}>
        <div style={{ maxWidth: '672px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#fecaca',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '24px' }}>🩸</span>
              </div>
              <div>
                <h1 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#dc2626',
                  margin: 0
                }}>
                  {t('bloodRequest.emergencyRequest')}
                </h1>
                <p style={{
                  color: '#6b7280',
                  fontSize: '14px',
                  margin: 0
                }}>
                  {t('bloodRequest.connectWithDonors')}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Urgency Level */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              padding: '24px'
            }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '12px'
              }}>
                {t('bloodRequest.urgencyLevel')} *
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px'
              }}>
                {[
                  { value: 'critical', label: t('bloodRequest.critical'), icon: '🚨', color: 'red' },
                  { value: 'urgent', label: t('bloodRequest.urgent'), icon: '⚠️', color: 'yellow' },
                  { value: 'standard', label: t('bloodRequest.standard'), icon: '📋', color: 'blue' }
                ].map((urgency) => {
                  const isSelected = formData.urgencyLevel === urgency.value;
                  const getStyles = () => {
                    if (isSelected) {
                      if (urgency.color === 'red') return { border: '2px solid #ef4444', backgroundColor: '#fef2f2', color: '#b91c1c' };
                      if (urgency.color === 'yellow') return { border: '2px solid #eab308', backgroundColor: '#fefce8', color: '#a16207' };
                      return { border: '2px solid #3b82f6', backgroundColor: '#eff6ff', color: '#1d4ed8' };
                    }
                    return { border: '2px solid #e5e7eb', backgroundColor: 'white', color: '#374151' };
                  };
                  
                  return (
                    <button
                      key={urgency.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, urgencyLevel: urgency.value as UrgencyLevel }))}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        textAlign: 'center',
                        ...getStyles()
                      }}
                      onMouseOver={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      <div style={{ fontSize: '18px', marginBottom: '4px' }}>{urgency.icon}</div>
                      {urgency.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Patient Information */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '16px',
                margin: '0 0 16px 0'
              }}>
                {t('bloodRequest.patientInfo')}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px'
                    }}>
                      {t('bloodRequest.patientName')} *
                    </label>
                    <input
                      type="text"
                      value={formData.patientInfo.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        patientInfo: { ...prev.patientInfo, name: e.target.value }
                      }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#dc2626';
                        e.target.style.boxShadow = '0 0 0 2px rgba(220, 38, 38, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder={t('bloodRequest.patientName')}
                      required
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px'
                    }}>
                      {t('bloodRequest.age')} *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="150"
                      value={formData.patientInfo.age || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        patientInfo: { ...prev.patientInfo, age: parseInt(e.target.value) || 0 }
                      }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#dc2626';
                        e.target.style.boxShadow = '0 0 0 2px rgba(220, 38, 38, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder={t('bloodRequest.age')}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    {t('bloodRequest.bloodTypeNeeded')} *
                  </label>
                  <BloodTypeSelector
                    value={formData.patientInfo.bloodType}
                    onChange={(bloodType) => setFormData(prev => ({
                      ...prev,
                      patientInfo: { ...prev.patientInfo, bloodType }
                    }))}
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    {t('bloodRequest.medicalCondition')} *
                  </label>
                  <textarea
                    value={formData.patientInfo.condition}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      patientInfo: { ...prev.patientInfo, condition: e.target.value }
                    }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      outline: 'none',
                      resize: 'vertical',
                      minHeight: '72px'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#dc2626';
                      e.target.style.boxShadow = '0 0 0 2px rgba(220, 38, 38, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                    rows={3}
                    placeholder={t('bloodRequest.conditionDesc')}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px'
                    }}>
                      {t('bloodRequest.unitsRequired')} *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.requiredUnits}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        requiredUnits: parseInt(e.target.value) || 1
                      }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#dc2626';
                        e.target.style.boxShadow = '0 0 0 2px rgba(220, 38, 38, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = 'none';
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px'
                    }}>
                      {t('bloodRequest.deadline')} *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#dc2626';
                        e.target.style.boxShadow = '0 0 0 2px rgba(220, 38, 38, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = 'none';
                      }}
                      min={new Date().toISOString().slice(0, 16)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Hospital Information */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '16px',
                margin: '0 0 16px 0'
              }}>
                Hospital Information
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    Hospital/Clinic Name *
                  </label>
                  <input
                    type="text"
                    value={formData.hospital.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      hospital: { ...prev.hospital, name: e.target.value }
                    }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#dc2626';
                      e.target.style.boxShadow = '0 0 0 2px rgba(220, 38, 38, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="e.g., General Hospital, City Clinic"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px'
                    }}>
                      Department (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.hospital.department}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        hospital: { ...prev.hospital, department: e.target.value }
                      }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#dc2626';
                        e.target.style.boxShadow = '0 0 0 2px rgba(220, 38, 38, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder="e.g., Emergency, ICU, Surgery"
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px'
                    }}>
                      Hospital Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.hospital.contactNumber}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        hospital: { ...prev.hospital, contactNumber: e.target.value }
                      }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#dc2626';
                        e.target.style.boxShadow = '0 0 0 2px rgba(220, 38, 38, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder="Hospital contact number"
                    />
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    Hospital Address (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.hospital.address}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      hospital: { ...prev.hospital, address: e.target.value }
                    }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#dc2626';
                      e.target.style.boxShadow = '0 0 0 2px rgba(220, 38, 38, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="Hospital address or location"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '16px',
                margin: '0 0 16px 0'
              }}>
                {t('bloodRequest.contactInfo')}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px'
                    }}>
                      {t('bloodRequest.yourName')} *
                    </label>
                    <input
                      type="text"
                      value={formData.contactInfo.requesterName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, requesterName: e.target.value }
                      }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#dc2626';
                        e.target.style.boxShadow = '0 0 0 2px rgba(220, 38, 38, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = 'none';
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px'
                    }}>
                      {t('bloodRequest.yourPhone')} *
                    </label>
                    <input
                      type="tel"
                      value={formData.contactInfo.requesterPhone}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, requesterPhone: e.target.value }
                      }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#dc2626';
                        e.target.style.boxShadow = '0 0 0 2px rgba(220, 38, 38, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = 'none';
                      }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    {t('bloodRequest.additionalNotes')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      outline: 'none',
                      resize: 'vertical',
                      minHeight: '72px'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#dc2626';
                      e.target.style.boxShadow = '0 0 0 2px rgba(220, 38, 38, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                    rows={3}
                    placeholder={t('bloodRequest.additionalNotesDesc')}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              padding: '24px'
            }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: loading ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#b91c1c';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                  }
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    {t('bloodRequest.creatingRequest')}
                  </>
                ) : (
                  <>🩸 {t('bloodRequest.createRequest')}</>
                )}
              </button>
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                textAlign: 'center',
                marginTop: '8px',
                margin: '8px 0 0 0'
              }}>
                {t('bloodRequest.donorsNotified')}
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}