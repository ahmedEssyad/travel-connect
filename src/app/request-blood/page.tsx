'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';
import BloodTypeSelector from '@/components/Common/BloodTypeSelector';
import MobileHeader from '@/components/Layout/MobileHeader';
import { BloodType, UrgencyLevel, URGENCY_LEVELS } from '@/lib/blood-types';

export default function RequestBloodPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">🩸</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Restricted</h2>
          <p className="text-gray-600">Please log in to create a blood request.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader
        title="Request Blood"
        rightAction={
          <button
            onClick={() => router.back()}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        }
      />

      <main className="container mx-auto px-4 py-6" style={{ paddingTop: '80px' }}>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🩸</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-red-600">Emergency Blood Request</h1>
                <p className="text-gray-600 text-sm">Connect with compatible donors in your area</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Urgency Level */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Urgency Level *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'critical', label: 'Critical', icon: '🚨', color: 'red' },
                  { value: 'urgent', label: 'Urgent', icon: '⚠️', color: 'yellow' },
                  { value: 'standard', label: 'Standard', icon: '📋', color: 'blue' }
                ].map((urgency) => (
                  <button
                    key={urgency.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, urgencyLevel: urgency.value as UrgencyLevel }))}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.urgencyLevel === urgency.value
                        ? urgency.color === 'red' ? 'border-red-500 bg-red-50 text-red-700'
                        : urgency.color === 'yellow' ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-lg mb-1">{urgency.icon}</div>
                    {urgency.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Patient Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Patient Information</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Patient Name *
                    </label>
                    <input
                      type="text"
                      value={formData.patientInfo.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        patientInfo: { ...prev.patientInfo, name: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Age"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medical Condition *
                  </label>
                  <textarea
                    value={formData.patientInfo.condition}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      patientInfo: { ...prev.patientInfo, condition: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={3}
                    placeholder="Describe the medical condition requiring blood transfusion"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      min={new Date().toISOString().slice(0, 16)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={formData.contactInfo.requesterName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, requesterName: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Phone *
                    </label>
                    <input
                      type="tel"
                      value={formData.contactInfo.requesterPhone}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, requesterPhone: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={3}
                    placeholder="Any additional information that might help donors..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Request...
                  </div>
                ) : (
                  <>🩸 Create Blood Request</>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Compatible donors in your area will be notified immediately
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}