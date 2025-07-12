'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Using API routes instead of direct Firebase calls
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import LocationSelector from '@/components/Common/LocationSelector';
import PhotoUpload from '@/components/Common/PhotoUpload';
import { apiClient } from '@/lib/api-client';
import { PhotoUploadResult } from '@/lib/photo-upload';

export default function PostTripPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    fromCoords: undefined as { lat: number; lng: number } | undefined,
    toCoords: undefined as { lat: number; lng: number } | undefined,
    departureDate: '',
    arrivalDate: '',
    tripType: '',
    capacity: '',
    allowedItems: [] as string[],
    description: '',
    photos: [] as string[],
  });

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
    if (!user) return;

    // Validation
    if (!formData.from || !formData.to || !formData.departureDate || !formData.arrivalDate || !formData.tripType || !formData.capacity) {
      toast.error('Veuillez remplir tous les champs obligatoires y compris le type de voyage.');
      return;
    }
    
    if (formData.tripType === 'delivery_service' && formData.allowedItems.length === 0) {
      toast.error('Veuillez sélectionner au moins un type d\'objet accepté pour le service de livraison.');
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

    setLoading(true);
    try {
      const response = await apiClient.post('/api/trips', {
        ...formData,
        capacity: parseInt(formData.capacity),
        departureDate: new Date(formData.departureDate),
        arrivalDate: new Date(formData.arrivalDate),
        fromCoords: formData.fromCoords,
        toCoords: formData.toCoords,
        tripType: formData.tripType,
        photos: formData.photos,
      });
      
      if (response.ok) {
        toast.success('Trip posted successfully!');
        router.push('/');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create trip');
      }
    } catch (error) {
      console.error('Error posting trip:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to post trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'var(--primary)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 1rem',
            opacity: '0.1'
          }}></div>
          <p style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Please log in to post a trip.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', paddingBottom: '5rem' }}>
      <header style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(8px)', 
        borderBottom: '1px solid var(--border-light)', 
        position: 'sticky', 
        top: 0, 
        zIndex: 40
      }}>
        <div className="container" style={{ height: '64px', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => router.back()}
            className="btn btn-outline"
            style={{ marginRight: '1rem' }}
          >
            ← Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              background: 'var(--primary)', 
              borderRadius: '0.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
            }}>
              <div style={{ 
                width: '16px', 
                height: '16px', 
                background: 'white', 
                borderRadius: '50%', 
                opacity: '0.9'
              }}></div>
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>Post a Trip</h1>
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', 
                borderRadius: '1rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1rem'
              }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  background: 'white', 
                  borderRadius: '50%', 
                  opacity: '0.9'
                }}></div>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Share Your Trip</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Help others by carrying their items on your journey</p>
            </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LocationSelector
              label="From"
              value={formData.from}
              onChange={(location, coordinates) => setFormData(prev => ({ ...prev, from: location, fromCoords: coordinates }))}
              placeholder="Select departure location"
              required
              showExactLocation={true}
            />

            <LocationSelector
              label="To"
              value={formData.to}
              onChange={(location, coordinates) => setFormData(prev => ({ ...prev, to: location, toCoords: coordinates }))}
              placeholder="Select destination"
              required
              showExactLocation={true}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="departureDate" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Departure Date
              </label>
              <input
                type="date"
                id="departureDate"
                value={formData.departureDate}
                onChange={(e) => setFormData(prev => ({ ...prev, departureDate: e.target.value }))}
                required
                className="input"
              />
            </div>

            <div>
              <label htmlFor="arrivalDate" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Arrival Date
              </label>
              <input
                type="date"
                id="arrivalDate"
                value={formData.arrivalDate}
                onChange={(e) => setFormData(prev => ({ ...prev, arrivalDate: e.target.value }))}
                required
                className="input"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Type de voyage *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {[
                { 
                  value: 'car_sharing', 
                  title: 'Partage de voiture', 
                  description: 'J\'ai une voiture et je cherche des compagnons de route' 
                },
                { 
                  value: 'delivery_service', 
                  title: 'Service de livraison', 
                  description: 'Je propose de livrer des colis contre rémunération' 
                }
              ].map((type) => (
                <label key={type.value} style={{
                  cursor: 'pointer',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${formData.tripType === type.value ? 'var(--primary)' : 'var(--border)'}`,
                  background: formData.tripType === type.value ? 'rgba(37, 99, 235, 0.05)' : 'var(--background)',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="radio"
                    name="tripType"
                    value={type.value}
                    checked={formData.tripType === type.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, tripType: e.target.value }))}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>{type.title}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{type.description}</div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="capacity" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              {formData.tripType === 'car_sharing' ? 'Nombre de places disponibles' : 'Capacité de transport (kg)'}
            </label>
            <input
              type="number"
              id="capacity"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
              required
              min="1"
              max={formData.tripType === 'car_sharing' ? "8" : "50"}
              className="input"
              placeholder={formData.tripType === 'car_sharing' ? 'ex: 3 personnes' : 'ex: 5 kg'}
            />
          </div>

          {formData.tripType === 'delivery_service' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Types d'objets acceptés (sélectionner tous qui s'appliquent)
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

          <div>
            <label htmlFor="description" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Détails supplémentaires (optionnel)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="input"
              style={{ resize: 'none' }}
              placeholder={formData.tripType === 'car_sharing' 
                ? 'Conditions du voyage, coût du partage d\'essence, préférences de compagnons, etc.' 
                : 'Exigences spéciales, détails de collecte/livraison, etc.'}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Photos du voyage (optionnel)
            </label>
            <PhotoUpload
              folder="trips"
              onUpload={handlePhotoUpload}
              maxFiles={5}
              currentPhotos={formData.photos}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || (formData.tripType === 'delivery_service' && formData.allowedItems.length === 0)}
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              fontSize: '0.875rem', 
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? (
              <>
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  border: '2px solid transparent', 
                  borderTop: '2px solid white', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span>Publication...</span>
              </>
            ) : (
              <span>{formData.tripType === 'car_sharing' ? 'Publier le voyage' : 'Publier le service'}</span>
            )}
          </button>
          </form>
        </div>
        </div>
      </main>
    </div>
  );
}