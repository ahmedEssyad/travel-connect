'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useLocation } from '@/contexts/LocationContext';
import { apiClient } from '@/lib/api-client';
import BloodTypeSelector from '@/components/Common/BloodTypeSelector';
import LocationPicker from '@/components/Common/LocationPicker';
import MobileHeader from '@/components/Layout/MobileHeader';
import { BloodType, UrgencyLevel, URGENCY_LEVELS } from '@/lib/blood-types';

export default function RequestBloodPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const { location } = useLocation();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    patientInfo: {
      name: '',
      age: 0,
      bloodType: '' as BloodType | '',
      condition: '',
      urgentNote: ''
    },
    hospital: {
      name: '',
      address: '',
      coordinates: { lat: 0, lng: 0 },
      contactNumber: '',
      department: ''
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
    medicalDetails: {
      procedure: '',
      doctorName: '',
      roomNumber: '',
      specialInstructions: ''
    }
  });

  const handleLocationSelect = (selectedLocation: any) => {
    setFormData(prev => ({
      ...prev,
      hospital: {
        ...prev.hospital,
        name: selectedLocation.name,
        address: selectedLocation.address,
        coordinates: selectedLocation.coordinates
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to create a blood request');
      return;
    }

    // Validation
    if (!formData.patientInfo.name.trim()) {
      toast.error('Patient name is required');
      return;
    }
    
    if (!formData.patientInfo.bloodType) {
      toast.error('Blood type is required');
      return;
    }
    
    if (!formData.patientInfo.condition.trim()) {
      toast.error('Medical condition is required');
      return;
    }
    
    if (!formData.hospital.name) {
      toast.error('Please select a hospital');
      return;
    }
    
    if (!formData.deadline) {
      toast.error('Deadline is required');
      return;
    }

    if (!formData.contactInfo.requesterPhone.trim()) {
      toast.error('Contact phone number is required');
      return;
    }

    // Check if deadline is in the future
    const deadlineDate = new Date(formData.deadline);
    if (deadlineDate <= new Date()) {
      toast.error('Deadline must be in the future');
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
        toast.success(`Blood request created! ${result.notifiedDonors} compatible donors have been notified.`);
        router.push('/blood-requests');
      } else {
        const error = await response.text();
        throw new Error(error || 'Failed to create blood request');
      }
    } catch (error) {
      console.error('Error creating blood request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create blood request');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>Access Restricted</div>
          <p style={{ color: 'var(--text-secondary)' }}>Please log in to create a blood request.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <MobileHeader
        title="Request Blood"
        rightAction={
          <button
            onClick={() => router.back()}
            className="btn btn-outline"
            style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
          >
            Cancel
          </button>
        }
      />

      <main className="container" style={{ padding: '2rem 1rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            marginBottom: '2rem' 
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem'
            }}>
              🩸
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--danger)', margin: 0 }}>
                Emergency Blood Request
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                Fill out the details below to notify compatible donors
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Urgency Level */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Urgency Level *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, urgencyLevel: URGENCY_LEVELS.CRITICAL }))}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '2px solid',
                    borderColor: formData.urgencyLevel === 'critical' ? 'var(--danger)' : 'var(--border)',
                    background: formData.urgencyLevel === 'critical' ? 'rgba(220, 38, 38, 0.1)' : 'white',
                    color: formData.urgencyLevel === 'critical' ? 'var(--danger)' : 'var(--text-primary)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  🚨 CRITICAL
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, urgencyLevel: URGENCY_LEVELS.URGENT }))}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '2px solid',
                    borderColor: formData.urgencyLevel === 'urgent' ? 'var(--warning)' : 'var(--border)',
                    background: formData.urgencyLevel === 'urgent' ? 'rgba(217, 119, 6, 0.1)' : 'white',
                    color: formData.urgencyLevel === 'urgent' ? 'var(--warning)' : 'var(--text-primary)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  ⚠️ URGENT
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, urgencyLevel: URGENCY_LEVELS.STANDARD }))}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '2px solid',
                    borderColor: formData.urgencyLevel === 'standard' ? 'var(--primary)' : 'var(--border)',
                    background: formData.urgencyLevel === 'standard' ? 'rgba(37, 99, 235, 0.1)' : 'white',
                    color: formData.urgencyLevel === 'standard' ? 'var(--primary)' : 'var(--text-primary)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  📋 STANDARD
                </button>
              </div>
            </div>

            {/* Patient Information */}
            <div style={{ 
              marginBottom: '1.5rem', 
              padding: '1.5rem', 
              background: 'rgba(37, 99, 235, 0.05)', 
              borderRadius: '0.5rem',
              border: '1px solid rgba(37, 99, 235, 0.2)'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '1rem' }}>
                Patient Information
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    value={formData.patientInfo.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      patientInfo: { ...prev.patientInfo, name: e.target.value }
                    }))}
                    className="input"
                    placeholder="Patient's full name"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Age *
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
                    className="input"
                    placeholder="Age"
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Blood Type Needed *
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

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Medical Condition *
                </label>
                <textarea
                  value={formData.patientInfo.condition}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    patientInfo: { ...prev.patientInfo, condition: e.target.value }
                  }))}
                  className="input"
                  rows={3}
                  placeholder="Describe the medical condition requiring blood transfusion"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Units Required *
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
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    className="input"
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Hospital Information */}
            <div style={{ 
              marginBottom: '1.5rem', 
              padding: '1.5rem', 
              background: 'rgba(5, 150, 105, 0.05)', 
              borderRadius: '0.5rem',
              border: '1px solid rgba(5, 150, 105, 0.2)'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--success)', marginBottom: '1rem' }}>
                Hospital Information
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Hospital/Clinic *
                </label>
                <LocationPicker
                  type="hospital"
                  onLocationSelect={handleLocationSelect}
                  placeholder="Search for hospital or clinic"
                  currentLocation={location}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.hospital.contactNumber}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      hospital: { ...prev.hospital, contactNumber: e.target.value }
                    }))}
                    className="input"
                    placeholder="Hospital phone number"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.hospital.department}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      hospital: { ...prev.hospital, department: e.target.value }
                    }))}
                    className="input"
                    placeholder="e.g. Emergency, ICU"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div style={{ 
              marginBottom: '1.5rem', 
              padding: '1.5rem', 
              background: 'rgba(217, 119, 6, 0.05)', 
              borderRadius: '0.5rem',
              border: '1px solid rgba(217, 119, 6, 0.2)'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--warning)', marginBottom: '1rem' }}>
                Contact Information
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={formData.contactInfo.requesterName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, requesterName: e.target.value }
                    }))}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Your Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.contactInfo.requesterPhone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, requesterPhone: e.target.value }
                    }))}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Additional Notes
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input"
                  rows={3}
                  placeholder="Any additional information for donors..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn"
              style={{
                width: '100%',
                background: 'var(--danger)',
                color: 'white',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: '600',
                opacity: loading ? '0.5' : '1',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Creating Request...
                </div>
              ) : (
                '🩸 Send Emergency Blood Request'
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}