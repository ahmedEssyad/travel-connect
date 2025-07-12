'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Using API routes instead of direct Firebase calls
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';
import LocationSelector from '@/components/Common/LocationSelector';
import PhotoUpload from '@/components/Common/PhotoUpload';
import { PhotoUploadResult } from '@/lib/photo-upload';

export default function PostRequestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    fromCoords: undefined as { lat: number; lng: number } | undefined,
    toCoords: undefined as { lat: number; lng: number } | undefined,
    deadline: '',
    requestType: '',
    itemType: '',
    description: '',
    reward: '',
    photos: [] as string[],
  });

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
    if (!formData.from || !formData.to || !formData.deadline || !formData.requestType) {
      toast.error('Veuillez remplir tous les champs obligatoires y compris le type de demande.');
      return;
    }
    
    if (formData.requestType === 'delivery_request' && !formData.itemType) {
      toast.error('Veuillez spécifier le type d\'objet pour la demande de livraison.');
      return;
    }

    if (new Date(formData.deadline) <= new Date()) {
      toast.error('Deadline must be in the future.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/api/requests', {
        ...formData,
        deadline: new Date(formData.deadline),
        photos: formData.photos,
        fromCoords: formData.fromCoords,
        toCoords: formData.toCoords,
        requestType: formData.requestType,
      });
      
      if (response.ok) {
        toast.success('Request posted successfully!');
        router.push('/');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create request');
      }
    } catch (error) {
      console.error('Error posting request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to post request. Please try again.');
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
            background: 'var(--accent)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 1rem',
            opacity: '0.1'
          }}></div>
          <p style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Please log in to post a request.</p>
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
              background: 'var(--accent)', 
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
            <h1 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>Post a Delivery Request</h1>
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
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--success) 100%)', 
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
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Request a Delivery</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Find travelers who can help deliver your item</p>
            </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LocationSelector
              label="From"
              value={formData.from}
              onChange={(location, coordinates) => setFormData(prev => ({ ...prev, from: location, fromCoords: coordinates }))}
              placeholder="Select pickup location"
              required
              showExactLocation={true}
            />

            <LocationSelector
              label="To"
              value={formData.to}
              onChange={(location, coordinates) => setFormData(prev => ({ ...prev, to: location, toCoords: coordinates }))}
              placeholder="Select delivery destination"
              required
              showExactLocation={true}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Type de demande *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {[
                { 
                  value: 'travel_companion', 
                  title: 'Compagnon de voyage', 
                  description: 'Je cherche quelqu\'un avec qui partager un voyage' 
                },
                { 
                  value: 'delivery_request', 
                  title: 'Demande de livraison', 
                  description: 'J\'ai besoin qu\'on me livre un objet' 
                }
              ].map((type) => (
                <label key={type.value} style={{
                  cursor: 'pointer',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${formData.requestType === type.value ? 'var(--accent)' : 'var(--border)'}`,
                  background: formData.requestType === type.value ? 'rgba(14, 165, 233, 0.05)' : 'var(--background)',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="radio"
                    name="requestType"
                    value={type.value}
                    checked={formData.requestType === type.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, requestType: e.target.value }))}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>{type.title}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{type.description}</div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="deadline" className="block text-sm font-semibold text-slate-700 mb-2">
                ⏰ Date limite
              </label>
              <input
                type="date"
                id="deadline"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-slate-400 text-slate-900 placeholder-slate-400"
              />
            </div>

            {formData.requestType === 'delivery_request' && (
            <div>
              <label htmlFor="itemType" className="block text-sm font-semibold text-slate-700 mb-2">
                📊 Type d'objet
              </label>
              <select
                id="itemType"
                value={formData.itemType}
                onChange={(e) => setFormData(prev => ({ ...prev, itemType: e.target.value }))}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-slate-400 text-slate-900 placeholder-slate-400"
              >
                <option value="">Sélectionner le type d'objet</option>
                {itemTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            )}

            {formData.requestType === 'travel_companion' && (
            <div>
              <label htmlFor="companions" className="block text-sm font-semibold text-slate-700 mb-2">
                👥 Nombre de personnes
              </label>
              <input
                type="number"
                id="companions"
                value={formData.itemType}
                onChange={(e) => setFormData(prev => ({ ...prev, itemType: e.target.value }))}
                required
                min="1"
                max="8"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-slate-400 text-slate-900 placeholder-slate-400"
                placeholder="ex: 2 personnes"
              />
            </div>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
              📝 {formData.requestType === 'delivery_request' ? 'Description de l\'objet' : 'Détails du voyage'}
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-slate-400 resize-none"
              placeholder={formData.requestType === 'delivery_request' 
                ? 'Décrire l\'objet, taille, poids, exigences spéciales, etc.' 
                : 'Préférences de voyage, budget partagé, horaires flexibles, etc.'}
            />
          </div>

          <div>
            <label htmlFor="reward" className="block text-sm font-semibold text-slate-700 mb-2">
              💰 {formData.requestType === 'delivery_request' ? 'Rémunération/Compensation' : 'Contribution voyage'} (optionnel)
            </label>
            <input
              type="text"
              id="reward"
              value={formData.reward}
              onChange={(e) => setFormData(prev => ({ ...prev, reward: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-slate-400"
              placeholder={formData.requestType === 'delivery_request' 
                ? 'ex: 50€, dîner, ou cadeau de remerciement' 
                : 'ex: Partage essence, péage, ou contribution'}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              {formData.requestType === 'delivery_request' ? 'Photos de l\'objet (optionnel)' : 'Photos du voyage (optionnel)'}
            </label>
            <PhotoUpload
              folder={formData.requestType === 'delivery_request' ? 'items' : 'requests'}
              onUpload={handlePhotoUpload}
              maxFiles={5}
              currentPhotos={formData.photos}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3 px-4 rounded-lg hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Publication...</span>
              </>
            ) : (
              <>
                <span>{formData.requestType === 'travel_companion' ? '🚗' : '📦'}</span>
                <span>{formData.requestType === 'travel_companion' ? 'Publier la demande' : 'Publier la demande'}</span>
              </>
            )}
          </button>
          </form>
          </div>
        </div>
      </main>
    </div>
  );
}