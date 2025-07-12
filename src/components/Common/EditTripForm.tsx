'use client';

import { useState, useEffect } from 'react';
import { Trip } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import LocationSelector from './LocationSelector';
import PhotoUpload from './PhotoUpload';
import { PhotoUploadResult } from '@/lib/photo-upload';

interface EditTripFormProps {
  trip: Trip;
  onSave: (updatedTrip: Trip) => void;
  onCancel: () => void;
  loading?: boolean;
}

const itemOptions = [
  'Electronics',
  'Documents',
  'Gifts',
  'Clothing',
  'Books',
  'Food Items',
  'Jewelry',
  'Art/Crafts',
  'Sports Equipment',
  'Other'
];

export default function EditTripForm({ 
  trip, 
  onSave, 
  onCancel, 
  loading = false 
}: EditTripFormProps) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    from: trip.from || '',
    to: trip.to || '',
    fromCoords: trip.fromCoords,
    toCoords: trip.toCoords,
    departureDate: trip.departureDate ? new Date(trip.departureDate).toISOString().split('T')[0] : '',
    arrivalDate: trip.arrivalDate ? new Date(trip.arrivalDate).toISOString().split('T')[0] : '',
    capacity: trip.capacity?.toString() || '',
    allowedItems: trip.allowedItems || [],
    description: trip.description || '',
    photos: trip.photos || []
  });

  const [isFormDirty, setIsFormDirty] = useState(false);

  // Track form changes
  useEffect(() => {
    const hasChanges = 
      formData.from !== trip.from ||
      formData.to !== trip.to ||
      formData.departureDate !== (trip.departureDate ? new Date(trip.departureDate).toISOString().split('T')[0] : '') ||
      formData.arrivalDate !== (trip.arrivalDate ? new Date(trip.arrivalDate).toISOString().split('T')[0] : '') ||
      formData.capacity !== trip.capacity?.toString() ||
      JSON.stringify(formData.allowedItems) !== JSON.stringify(trip.allowedItems) ||
      formData.description !== trip.description ||
      JSON.stringify(formData.photos) !== JSON.stringify(trip.photos);
    
    setIsFormDirty(hasChanges);
  }, [formData, trip]);

  const handleItemToggle = (item: string) => {
    setFormData(prev => ({
      ...prev,
      allowedItems: prev.allowedItems.includes(item)
        ? prev.allowedItems.filter(i => i !== item)
        : [...prev.allowedItems, item]
    }));
  };

  const handlePhotoUpload = (results: PhotoUploadResult[]) => {
    const photoUrls = results.map(result => result.url);
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...photoUrls]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.from || !formData.to || !formData.departureDate || !formData.arrivalDate || !formData.capacity) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (new Date(formData.departureDate) >= new Date(formData.arrivalDate)) {
      toast.error('Arrival date must be after departure date.');
      return;
    }

    if (parseInt(formData.capacity) <= 0) {
      toast.error('Capacity must be greater than 0.');
      return;
    }

    if (trip.tripType === 'delivery_service' && formData.allowedItems.length === 0) {
      toast.error('Please select at least one allowed item type for delivery service.');
      return;
    }

    try {
      const response = await fetch(`/api/trips`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: trip._id,
          ...formData,
          capacity: parseInt(formData.capacity),
          departureDate: new Date(formData.departureDate),
          arrivalDate: new Date(formData.arrivalDate),
          fromCoords: formData.fromCoords,
          toCoords: formData.toCoords,
          photos: formData.photos
        })
      });

      if (response.ok) {
        const updatedTrip = await response.json();
        onSave(updatedTrip);
        toast.success('Trip updated successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update trip');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update trip. Please try again.');
    }
  };

  const handleCancel = () => {
    if (isFormDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Route Information */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            From *
          </label>
          <LocationSelector
            value={formData.from}
            onChange={(location, coordinates) => setFormData(prev => ({ ...prev, from: location, fromCoords: coordinates }))}
            placeholder="Select departure location"
            required
            showExactLocation={true}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            To *
          </label>
          <LocationSelector
            value={formData.to}
            onChange={(location, coordinates) => setFormData(prev => ({ ...prev, to: location, toCoords: coordinates }))}
            placeholder="Select destination"
            required
            showExactLocation={true}
          />
        </div>
      </div>

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Departure Date *
          </label>
          <input
            type="date"
            value={formData.departureDate}
            onChange={(e) => setFormData(prev => ({ ...prev, departureDate: e.target.value }))}
            required
            min={new Date().toISOString().split('T')[0]}
            className="input"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Arrival Date *
          </label>
          <input
            type="date"
            value={formData.arrivalDate}
            onChange={(e) => setFormData(prev => ({ ...prev, arrivalDate: e.target.value }))}
            required
            min={formData.departureDate || new Date().toISOString().split('T')[0]}
            className="input"
          />
        </div>
      </div>

      {/* Capacity */}
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          {trip.tripType === 'car_sharing' ? 'Number of passengers *' : 'Weight capacity (kg) *'}
        </label>
        <input
          type="number"
          value={formData.capacity}
          onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
          required
          min="1"
          max={trip.tripType === 'car_sharing' ? "8" : "50"}
          className="input"
          placeholder={trip.tripType === 'car_sharing' ? 'ex: 3 passengers' : 'ex: 5 kg'}
        />
      </div>

      {/* Allowed Items - only for delivery service */}
      {trip.tripType === 'delivery_service' && (
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Allowed item types *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {itemOptions.map((item) => (
              <label key={item} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: `1px solid ${formData.allowedItems.includes(item) ? 'var(--primary)' : 'var(--border)'}`,
                background: formData.allowedItems.includes(item) ? 'rgba(37, 99, 235, 0.05)' : 'var(--surface)',
                transition: 'all 0.2s ease'
              }}>
                <input
                  type="checkbox"
                  checked={formData.allowedItems.includes(item)}
                  onChange={() => handleItemToggle(item)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>{item}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Additional details (optional)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
          className="input"
          style={{ resize: 'vertical' }}
          placeholder={trip.tripType === 'car_sharing' 
            ? 'Trip conditions, gas sharing cost, companion preferences, etc.' 
            : 'Special requirements, pickup/delivery details, etc.'}
        />
      </div>

      {/* Photos */}
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Trip photos (optional)
        </label>
        <PhotoUpload
          folder="trips"
          onUpload={handlePhotoUpload}
          maxFiles={5}
          currentPhotos={formData.photos}
          disabled={loading}
        />
      </div>

      {/* Form Actions */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="btn btn-secondary"
          style={{ flex: 1 }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !isFormDirty}
          className="btn btn-primary"
          style={{ 
            flex: 1,
            opacity: loading || !isFormDirty ? '0.5' : '1',
            cursor: loading || !isFormDirty ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}