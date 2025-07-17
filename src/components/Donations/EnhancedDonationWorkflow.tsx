'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';

interface EnhancedDonationWorkflowProps {
  requestId: string;
  onStatusUpdate?: () => void;
}

export default function EnhancedDonationWorkflow({ requestId, onStatusUpdate }: EnhancedDonationWorkflowProps) {
  const { user } = useAuth();
  const toast = useToast();
  
  const [donation, setDonation] = useState<any>(null);
  const [userRole, setUserRole] = useState<'donor' | 'recipient' | null>(null);
  const [permissions, setPermissions] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form states for different actions
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const loadDonationStatus = useCallback(async () => {
    try {
      const response = await apiClient.get(`/api/enhanced-donations?requestId=${requestId}`);
      if (response.ok) {
        const data = await response.json();
        setDonation(data.donation);
        setUserRole(data.userRole);
        setPermissions(data.permissions || {});
        
        // Determine current step based on donation status
        if (data.donation) {
          const status = data.donation.overallStatus;
          const stepMap = {
            'initiated': 1,
            'scheduled': 2,
            'in_progress': 3,
            'donor_completed': 4,
            'completed': 5
          };
          setCurrentStep(stepMap[status as keyof typeof stepMap] || 0);
        }
      } else {
        // Handle API errors when loading donation status
        if (response.status === 404) {
          console.log('No donation found for this request - this is normal for new requests');
        } else if (response.status === 403) {
          toast.error('You are not authorized to view this donation');
        } else if (response.status >= 500) {
          toast.error('Server error loading donation status');
        } else {
          console.error('Error loading donation status:', response.status, response.statusText);
        }
      }
    } catch (error) {
      console.error('Error loading donation status:', error);
      
      // Only show error to user if it's not a network connectivity issue during initial load
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('Network error loading donation status - will retry');
      } else {
        toast.error('Unable to load donation status. Please refresh the page.');
      }
    }
  }, [requestId, toast]);

  useEffect(() => {
    loadDonationStatus();
  }, [loadDonationStatus]);

  const performAction = async (action: string, data: any = {}, retryAttempt = 0) => {
    setLoading(true);
    if (retryAttempt > 0) {
      setIsRetrying(true);
    }
    
    try {
      const response = await apiClient.post('/api/enhanced-donations', {
        action,
        requestId: donation?.requestId || requestId,
        donationId: donation?._id,
        ...data
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        await loadDonationStatus();
        onStatusUpdate?.();
        
        // Close forms after successful actions
        setShowScheduleForm(false);
        setShowCompletionForm(false);
        setShowReceiptForm(false);
      } else {
        // Handle different error types
        let errorMessage = 'Action failed';
        try {
          const errorText = await response.text();
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        // Show specific error messages based on status code
        if (response.status === 409) {
          errorMessage = 'This action conflicts with current donation state. Please refresh and try again.';
        } else if (response.status === 403) {
          errorMessage = 'You are not authorized to perform this action.';
        } else if (response.status === 404) {
          errorMessage = 'Donation or request not found. Please refresh the page.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again in a moment.';
        }
        
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Action error:', error);
      
      // Handle different types of network errors with retry logic
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (retryAttempt < 2) {
          // Retry up to 2 times for network errors
          setTimeout(() => {
            performAction(action, data, retryAttempt + 1);
          }, 1000 * (retryAttempt + 1)); // Exponential backoff
          return;
        } else {
          toast.error('Network connection error. Please check your internet connection and try again.');
        }
      } else if (error instanceof Error && error.message.includes('timeout')) {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
      setIsRetrying(false);
      setRetryCount(retryAttempt);
    }
  };

  if (!user || userRole === null) return null;

  const steps = [
    { title: 'Request Matched', icon: '🤝', status: 'completed' },
    { title: 'Donation Initiated', icon: '🩸', status: currentStep >= 1 ? 'completed' : 'pending' },
    { title: 'Appointment Scheduled', icon: '📅', status: currentStep >= 2 ? 'completed' : 'pending' },
    { title: 'At Hospital', icon: '🏥', status: currentStep >= 3 ? 'completed' : 'pending' },
    { title: 'Donation Complete', icon: '✅', status: currentStep >= 4 ? 'completed' : 'pending' },
    { title: 'Recipient Confirmed', icon: '🎉', status: currentStep >= 5 ? 'completed' : 'pending' }
  ];

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'current': return '#3b82f6';
      default: return '#d1d5db';
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #e5e7eb',
      marginTop: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <span style={{ fontSize: '24px' }}>🩸</span>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#1f2937',
          margin: 0
        }}>
          Enhanced Donation Workflow
        </h3>
        {donation?.verificationLevel && (
          <span style={{
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: donation.verificationLevel === 'medical_verified' ? '#dcfce7' : '#dbeafe',
            color: donation.verificationLevel === 'medical_verified' ? '#166534' : '#1e40af'
          }}>
            {donation.verificationLevel.replace('_', ' ').toUpperCase()}
          </span>
        )}
      </div>

      {/* Progress Steps */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '32px',
        overflowX: 'auto',
        paddingBottom: '8px'
      }}>
        {steps.map((step, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: '120px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: getStepColor(index === currentStep ? 'current' : step.status),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                marginBottom: '8px'
              }}>
                {step.status === 'completed' ? '✓' : step.icon}
              </div>
              <div style={{
                fontSize: '12px',
                fontWeight: '500',
                textAlign: 'center',
                color: step.status === 'completed' ? '#10b981' : '#6b7280'
              }}>
                {step.title}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div style={{
                flex: 1,
                height: '2px',
                backgroundColor: getStepColor(step.status),
                margin: '0 8px',
                marginTop: '-20px'
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Current Status */}
      {donation && (
        <div style={{
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontWeight: '500', color: '#374151' }}>Status:</span>
            <span style={{
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: '#dbeafe',
              color: '#1e40af'
            }}>
              {donation.overallStatus.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          
          {donation.hospital && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#6b7280' }}>Hospital:</span>
              <span style={{ fontWeight: '500' }}>{donation.hospital.name}</span>
            </div>
          )}
          
          {donation.appointmentDate && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#6b7280' }}>Appointment:</span>
              <span style={{ fontWeight: '500' }}>
                {new Date(donation.appointmentDate).toLocaleDateString()} at {donation.appointmentTime}
                {donation.appointmentPlace && <><br/><span style={{ fontSize: '12px', color: '#6b7280' }}>📍 {donation.appointmentPlace}</span></>}
              </span>
            </div>
          )}
          
          {donation.trustScore && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Trust Score:</span>
              <span style={{ fontWeight: '500', color: '#10b981' }}>{donation.trustScore}/100</span>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons Based on User Role and Current Step */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Initiate Donation (Donors only, no donation yet) */}
        {!donation && userRole === 'donor' && (
          <button
            onClick={() => performAction('initiate', {
              hospitalName: 'City Hospital', // This should come from a form
              location: { lat: 0, lng: 0 } // Get from geolocation
            })}
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
{loading ? (isRetrying ? `Retrying... (${retryCount + 1})` : 'Initiating...') : '🩸 Initiate Donation Process'}
          </button>
        )}

        {/* Schedule Appointment */}
        {donation && permissions.canSchedule && donation.overallStatus === 'initiated' && (
          <div>
            <button
              onClick={() => setShowScheduleForm(!showScheduleForm)}
              style={{
                width: '100%',
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📅 Schedule Appointment
            </button>
            
            {showScheduleForm && (
              <ScheduleForm onSubmit={(data) => performAction('schedule', data)} />
            )}
          </div>
        )}

        {/* Confirm Arrival (Donors only) */}
        {donation && permissions.canConfirmArrival && donation.appointmentStatus === 'confirmed' && (
          <button
            onClick={() => performAction('confirm_arrival', {
              location: { lat: 0, lng: 0 } // Get from geolocation
            })}
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#059669',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Confirming...' : '🏥 I\'ve Arrived at Hospital'}
          </button>
        )}


        {/* Confirm Completion (Donors only) */}
        {donation && permissions.canConfirmCompletion && donation.confirmations.donorArrived && (
          <div>
            <button
              onClick={() => setShowCompletionForm(!showCompletionForm)}
              style={{
                width: '100%',
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ✅ Confirm Donation Completed
            </button>
            
            {showCompletionForm && (
              <CompletionForm onSubmit={(data) => performAction('confirm_completion', data)} />
            )}
          </div>
        )}

        {/* Confirm Receipt (Recipients only) */}
        {donation && permissions.canConfirmReceipt && donation.confirmations.donorCompleted && (
          <div>
            <button
              onClick={() => setShowReceiptForm(!showReceiptForm)}
              style={{
                width: '100%',
                backgroundColor: '#10b981',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🎉 Confirm Blood Received
            </button>
            
            {showReceiptForm && (
              <ReceiptForm onSubmit={(data) => performAction('confirm_receipt', data)} />
            )}
          </div>
        )}

      </div>

      {/* Timeline */}
      {donation?.timeline && donation.timeline.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '16px'
          }}>
            Timeline
          </h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {donation.timeline.map((entry: any, index: number) => (
              <div key={index} style={{
                display: 'flex',
                gap: '12px',
                padding: '8px 0',
                borderBottom: index < donation.timeline.length - 1 ? '1px solid #f3f4f6' : 'none'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  marginTop: '6px'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1f2937'
                  }}>
                    {entry.status.replace('_', ' ').toUpperCase()}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    {new Date(entry.timestamp).toLocaleString()} • {entry.actor}
                  </div>
                  {entry.notes && (
                    <div style={{
                      fontSize: '12px',
                      color: '#374151',
                      marginTop: '4px'
                    }}>
                      {entry.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components for forms
function ScheduleForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    appointmentDate: '',
    appointmentTime: '',
    place: '',
    estimatedDuration: 60,
    hospitalDetails: {
      address: '',
      contactNumber: '',
      department: ''
    }
  });

  return (
    <div style={{
      backgroundColor: '#f9fafb',
      padding: '16px',
      borderRadius: '8px',
      marginTop: '12px'
    }}>
      <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
        Schedule Appointment
      </h5>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <input
          type="date"
          value={formData.appointmentDate}
          onChange={(e) => setFormData(prev => ({ ...prev, appointmentDate: e.target.value }))}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
          min={new Date().toISOString().split('T')[0]}
        />
        <input
          type="time"
          value={formData.appointmentTime}
          onChange={(e) => setFormData(prev => ({ ...prev, appointmentTime: e.target.value }))}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />
      </div>
      
      <input
        type="text"
        placeholder="Meeting place (e.g., Hospital main entrance, Room 101)"
        value={formData.place}
        onChange={(e) => setFormData(prev => ({ ...prev, place: e.target.value }))}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
          marginBottom: '12px'
        }}
      />
      
      <button
        onClick={() => {
          // Validate form before submission
          if (!formData.appointmentDate || !formData.appointmentTime || !formData.place) {
            return;
          }
          
          const appointmentDateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);
          if (appointmentDateTime <= new Date()) {
            alert('Please select a future date and time for the appointment.');
            return;
          }
          
          onSubmit(formData);
        }}
        disabled={!formData.appointmentDate || !formData.appointmentTime || !formData.place}
        style={{
          width: '100%',
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '6px',
          border: 'none',
          fontSize: '14px',
          fontWeight: '500',
          cursor: formData.appointmentDate && formData.appointmentTime && formData.place ? 'pointer' : 'not-allowed',
          opacity: formData.appointmentDate && formData.appointmentTime && formData.place ? 1 : 0.6
        }}
      >
        Schedule Appointment
      </button>
    </div>
  );
}


function CompletionForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    notes: '',
    medicalInfo: {
      volume: '',
      donationType: 'whole_blood'
    }
  });

  return (
    <div style={{
      backgroundColor: '#f9fafb',
      padding: '16px',
      borderRadius: '8px',
      marginTop: '12px'
    }}>
      <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
        Confirm Donation Completion
      </h5>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          type="number"
          placeholder="Volume (ml)"
          value={formData.medicalInfo.volume}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            medicalInfo: { ...prev.medicalInfo, volume: e.target.value }
          }))}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />
        
        <textarea
          placeholder="Additional notes about the donation..."
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            resize: 'vertical'
          }}
        />
        
        <button
          onClick={() => onSubmit(formData)}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Confirm Donation Completed
        </button>
      </div>
    </div>
  );
}

function ReceiptForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    notes: ''
  });

  return (
    <div style={{
      backgroundColor: '#f0fdf4',
      padding: '16px',
      borderRadius: '8px',
      marginTop: '12px'
    }}>
      <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
        Confirm Blood Received
      </h5>
      
      <textarea
        placeholder="Thank you message for the donor..."
        value={formData.notes}
        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
        rows={3}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
          resize: 'vertical',
          marginBottom: '12px'
        }}
      />
      
      <button
        onClick={() => onSubmit(formData)}
        style={{
          width: '100%',
          backgroundColor: '#10b981',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '6px',
          border: 'none',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer'
        }}
      >
        🎉 Confirm Blood Received
      </button>
    </div>
  );
}