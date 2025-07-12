'use client';

import { useState, useEffect } from 'react';
import { Request } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import LocationSelector from './LocationSelector';
import PhotoUpload from './PhotoUpload';
import { PhotoUploadResult } from '@/lib/photo-upload';

interface EditRequestFormProps {
  request: Request;
  onSave: (updatedRequest: Request) => void;
  onCancel: () => void;
  loading?: boolean;
}

const itemTypes = [
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

export default function EditRequestForm({ 
  request, 
  onSave, 
  onCancel, 
  loading = false 
}: EditRequestFormProps) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    from: request.from || '',
    to: request.to || '',
    fromCoords: request.fromCoords,
    toCoords: request.toCoords,
    deadline: request.deadline ? new Date(request.deadline).toISOString().split('T')[0] : '',
    itemType: request.itemType || '',
    description: request.description || '',
    reward: request.reward || '',
    photos: request.photos || []
  });

  const [isFormDirty, setIsFormDirty] = useState(false);

  // Track form changes
  useEffect(() => {
    const hasChanges = 
      formData.from !== request.from ||
      formData.to !== request.to ||
      formData.deadline !== (request.deadline ? new Date(request.deadline).toISOString().split('T')[0] : '') ||
      formData.itemType !== request.itemType ||
      formData.description !== request.description ||
      formData.reward !== request.reward ||
      JSON.stringify(formData.photos) !== JSON.stringify(request.photos);
    
    setIsFormDirty(hasChanges);
  }, [formData, request]);

  const handlePhotoUpload = (results: PhotoUploadResult[]) => {
    const photoUrls = results.map(result => result.url);
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...photoUrls]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.from || !formData.to || !formData.deadline) {
      toast.error('Please fill in all required fields.');
      return;
    }
    
    if (request.requestType === 'delivery_request' && !formData.itemType) {
      toast.error('Please specify the item type for delivery request.');
      return;
    }

    if (new Date(formData.deadline) <= new Date()) {
      toast.error('Deadline must be in the future.');
      return;
    }

    try {
      const response = await fetch(`/api/requests`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: request._id,
          ...formData,
          deadline: new Date(formData.deadline),
          fromCoords: formData.fromCoords,
          toCoords: formData.toCoords,
          photos: formData.photos
        })
      });

      if (response.ok) {
        const updatedRequest = await response.json();
        onSave(updatedRequest);
        toast.success('Request updated successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update request');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update request. Please try again.');
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
            placeholder="Select pickup location"
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
            placeholder="Select delivery destination"
            required
            showExactLocation={true}
          />
        </div>
      </div>

      {/* Deadline */}
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          {request.requestType === 'delivery_request' ? 'Delivery deadline *' : 'Travel deadline *'}
        </label>
        <input
          type="date"
          value={formData.deadline}
          onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
          required
          min={new Date().toISOString().split('T')[0]}
          className="input"
        />
      </div>

      {/* Item Type - only for delivery requests */}
      {request.requestType === 'delivery_request' && (
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Item type *
          </label>
          <select
            value={formData.itemType}
            onChange={(e) => setFormData(prev => ({ ...prev, itemType: e.target.value }))}
            required
            className="input"
          >
            <option value="">Select item type</option>
            {itemTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      )}

      {/* Description */}
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          {request.requestType === 'delivery_request' ? 'Item description' : 'Travel details'}
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
          className="input"
          style={{ resize: 'vertical' }}
          placeholder={request.requestType === 'delivery_request' 
            ? 'Describe the item, size, weight, special requirements, etc.' 
            : 'Travel preferences, shared budget, flexible schedule, etc.'}
        />
      </div>

      {/* Reward */}
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          {request.requestType === 'delivery_request' ? 'Compensation/Reward (optional)' : 'Travel contribution (optional)'}
        </label>
        <input
          type="text"
          value={formData.reward}
          onChange={(e) => setFormData(prev => ({ ...prev, reward: e.target.value }))}
          className="input"
          placeholder={request.requestType === 'delivery_request' 
            ? 'ex: 50€, dinner, or thank you gift' 
            : 'ex: Gas sharing, tolls, or contribution'}
        />
      </div>

      {/* Photos */}
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          {request.requestType === 'delivery_request' ? 'Item photos (optional)' : 'Travel photos (optional)'}
        </label>
        <PhotoUpload
          folder={request.requestType === 'delivery_request' ? 'items' : 'requests'}
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