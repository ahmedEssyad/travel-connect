'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';

interface DonationConfirmationProps {
  requestId: string;
  onConfirmed?: () => void;
}

function DonationConfirmation({ requestId, onConfirmed }: DonationConfirmationProps) {
  const { user } = useAuth();
  const toast = useToast();
  
  const [loading, setLoading] = useState(false);
  const [donation, setDonation] = useState<any>(null);
  const [canConfirm, setCanConfirm] = useState(false);
  const [userRole, setUserRole] = useState<'donor' | 'recipient' | null>(null);
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  
  // Form data for donor confirmation
  const [hospital, setHospital] = useState('');
  const [notes, setNotes] = useState('');
  const [volume, setVolume] = useState('');
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0]);

  const loadDonationStatus = useCallback(async () => {
    try {
      const response = await apiClient.get(`/api/donations/status?requestId=${requestId}`);
      if (response.ok) {
        const data = await response.json();
        setDonation(data.donation);
        setCanConfirm(data.canConfirm);
        setUserRole(data.userRole);
      }
    } catch (error) {
      console.error('Error loading donation status:', error);
    }
  }, [requestId]);

  const handleConfirm = useCallback(async (confirmationType: 'donor' | 'recipient') => {
    setLoading(true);
    try {
      const payload: any = {
        requestId,
        confirmationType
      };

      if (confirmationType === 'donor') {
        payload.hospital = hospital;
        payload.notes = notes;
        payload.donationDate = donationDate;
        if (volume) payload.volume = parseInt(volume);
      } else {
        payload.notes = notes;
      }

      const response = await apiClient.post('/api/donations/confirm', payload);
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setDonation(data.donation);
        setCanConfirm(false);
        setShowConfirmForm(false);
        onConfirmed?.();
        
        if (data.isComplete) {
          // Show celebration for completed donation
          setTimeout(() => {
            toast.success('🎉 Donation completed! Thank you for saving lives!');
          }, 1000);
        }
      } else {
        const error = await response.text();
        toast.error(error || 'Failed to confirm donation');
      }
    } catch (error) {
      console.error('Confirmation error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [requestId, hospital, notes, volume, donationDate, toast, onConfirmed]);

  useEffect(() => {
    loadDonationStatus();
  }, [loadDonationStatus]);

  if (!user) return null;

  // Debug info
  console.log('DonationConfirmation:', { 
    requestId, 
    donation, 
    canConfirm, 
    userRole,
    userId: user?.id,
    userName: user?.name 
  });

  return (
    <div style={{ 
      background: 'white',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      border: '1px solid var(--border)',
      marginTop: '1rem'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <span style={{ fontSize: '1.5rem' }}>🩸</span>
        <h3 style={{ 
          fontSize: '1.125rem', 
          fontWeight: '600',
          color: 'var(--text-primary)',
          margin: 0
        }}>
          Donation Confirmation
        </h3>
      </div>

      {!donation ? (
        // No donation record yet
        <div>
          <p style={{ 
            fontSize: '0.875rem', 
            color: '#666', 
            marginBottom: '1rem',
            fontStyle: 'italic'
          }}>
            Loading donation status...
          </p>
          {userRole === 'donor' ? (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Ready to confirm your donation? This helps track your contribution and builds trust in the community.
              </p>
              
              
              {!showConfirmForm ? (
                <button
                  onClick={() => setShowConfirmForm(true)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.875rem' }}
                >
                  ✅ I Completed the Donation
                </button>
              ) : (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.875rem', 
                        fontWeight: '500',
                        marginBottom: '0.5rem',
                        color: 'var(--text-primary)'
                      }}>
                        Hospital/Clinic
                      </label>
                      <input
                        type="text"
                        value={hospital}
                        onChange={(e) => setHospital(e.target.value)}
                        placeholder="Where did you donate?"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          fontSize: '1rem',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.875rem', 
                        fontWeight: '500',
                        marginBottom: '0.5rem',
                        color: 'var(--text-primary)'
                      }}>
                        Donation Date
                      </label>
                      <input
                        type="date"
                        value={donationDate}
                        onChange={(e) => setDonationDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          fontSize: '1rem',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.875rem', 
                        fontWeight: '500',
                        marginBottom: '0.5rem',
                        color: 'var(--text-primary)'
                      }}>
                        Volume (ml) - Optional
                      </label>
                      <input
                        type="number"
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        placeholder="e.g. 450"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          fontSize: '1rem',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.875rem', 
                        fontWeight: '500',
                        marginBottom: '0.5rem',
                        color: 'var(--text-primary)'
                      }}>
                        Notes - Optional
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any additional notes about the donation..."
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          fontSize: '1rem',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setShowConfirmForm(false)}
                      className="btn btn-outline"
                      style={{ flex: 1, padding: '0.75rem' }}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleConfirm('donor')}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '0.75rem' }}
                      disabled={loading}
                    >
                      {loading ? 'Confirming...' : 'Confirm Donation'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center',
              color: 'var(--text-secondary)',
              padding: '1rem'
            }}>
              Waiting for donor to confirm the donation...
            </div>
          )}
        </div>
      ) : (
        // Donation record exists
        <div>
          <div style={{ 
            background: 'var(--surface)',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Status:</span>
              <span style={{ 
                padding: '0.25rem 0.75rem',
                borderRadius: '1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                background: donation.status === 'completed' ? 'var(--success)' : 
                           donation.status === 'donor_confirmed' ? 'var(--warning)' : 'var(--primary)',
                color: 'white'
              }}>
                {donation.status === 'completed' ? '✅ Completed' :
                 donation.status === 'donor_confirmed' ? '⏳ Pending Recipient' :
                 '🔄 Pending'}
              </span>
            </div>

            {donation.hospital && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Hospital:</span>
                <span style={{ fontWeight: '500' }}>{donation.hospital}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Date:</span>
              <span style={{ fontWeight: '500' }}>
                {new Date(donation.donationDate).toLocaleDateString()}
              </span>
            </div>

            {donation.volume && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Volume:</span>
                <span style={{ fontWeight: '500' }}>{donation.volume} ml</span>
              </div>
            )}
          </div>

          {/* Confirmation status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ 
                fontSize: '1.25rem',
                color: donation.donorConfirmed ? 'var(--success)' : 'var(--text-muted)'
              }}>
                {donation.donorConfirmed ? '✅' : '⏳'}
              </span>
              <span style={{ color: donation.donorConfirmed ? 'var(--success)' : 'var(--text-muted)' }}>
                Donor confirmed {donation.donorConfirmed && donation.donorConfirmedAt && 
                  `(${new Date(donation.donorConfirmedAt).toLocaleDateString()})`}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ 
                fontSize: '1.25rem',
                color: donation.recipientConfirmed ? 'var(--success)' : 'var(--text-muted)'
              }}>
                {donation.recipientConfirmed ? '✅' : '⏳'}
              </span>
              <span style={{ color: donation.recipientConfirmed ? 'var(--success)' : 'var(--text-muted)' }}>
                Recipient confirmed {donation.recipientConfirmed && donation.recipientConfirmedAt && 
                  `(${new Date(donation.recipientConfirmedAt).toLocaleDateString()})`}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          {canConfirm && userRole === 'recipient' && (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Please confirm that you received the blood donation from {donation.donorId?.name || 'the donor'}.
              </p>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  marginBottom: '0.5rem',
                  color: 'var(--text-primary)'
                }}>
                  Thank you message (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Thank you message for the donor..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                onClick={() => handleConfirm('recipient')}
                className="btn btn-success"
                style={{ 
                  width: '100%', 
                  padding: '0.875rem',
                  background: 'var(--success)',
                  color: 'white'
                }}
                disabled={loading}
              >
                {loading ? 'Confirming...' : '✅ Yes, I Received the Donation'}
              </button>
            </div>
          )}

          {donation.status === 'completed' && (
            <div style={{ 
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '0.5rem',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
              <div style={{ fontWeight: '600', color: 'var(--success)', marginBottom: '0.25rem' }}>
                Donation Completed!
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Thank you for saving lives through BloodConnect
              </div>
            </div>
          )}

          {donation.notes && (
            <div style={{ 
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'var(--surface)',
              borderRadius: '0.5rem'
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                Notes:
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {donation.notes}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(DonationConfirmation);