'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Using API routes instead of direct Firebase calls
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import LocationSelector from '@/components/Common/LocationSelector';
import { apiClient } from '@/lib/api-client';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-slate-600 font-medium">Please log in to post a trip.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => router.back()}
              className="mr-4 text-slate-600 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ← Back
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">✈️</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Post a Trip</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8 animate-slide-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg mb-4 mx-auto">
              <span className="text-white text-2xl">✈️</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Share Your Trip</h2>
            <p className="text-slate-600">Help others by carrying their items on your journey</p>
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
              <label htmlFor="departureDate" className="block text-sm font-semibold text-slate-700 mb-2">
                📅 Departure Date
              </label>
              <input
                type="date"
                id="departureDate"
                value={formData.departureDate}
                onChange={(e) => setFormData(prev => ({ ...prev, departureDate: e.target.value }))}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400 text-slate-900 placeholder-slate-400"
              />
            </div>

            <div>
              <label htmlFor="arrivalDate" className="block text-sm font-semibold text-slate-700 mb-2">
                🎯 Arrival Date
              </label>
              <input
                type="date"
                id="arrivalDate"
                value={formData.arrivalDate}
                onChange={(e) => setFormData(prev => ({ ...prev, arrivalDate: e.target.value }))}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400 text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              🚗 Type de voyage *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { 
                  value: 'car_sharing', 
                  title: '🚗 Partage de voiture', 
                  description: 'J\'ai une voiture et je cherche des compagnons de route' 
                },
                { 
                  value: 'delivery_service', 
                  title: '📦 Service de livraison', 
                  description: 'Je propose de livrer des colis contre rémunération' 
                }
              ].map((type) => (
                <label key={type.value} className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${
                  formData.tripType === type.value 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="tripType"
                    value={type.value}
                    checked={formData.tripType === type.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, tripType: e.target.value }))}
                    className="sr-only"
                  />
                  <div className="text-lg font-semibold mb-1">{type.title}</div>
                  <div className="text-sm text-slate-600">{type.description}</div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="capacity" className="block text-sm font-semibold text-slate-700 mb-2">
              {formData.tripType === 'car_sharing' ? '👥 Nombre de places disponibles' : '🎽 Capacité de transport (kg)'}
            </label>
            <input
              type="number"
              id="capacity"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
              required
              min="1"
              max={formData.tripType === 'car_sharing' ? "8" : "50"}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400"
              placeholder={formData.tripType === 'car_sharing' ? 'ex: 3 personnes' : 'ex: 5 kg'}
            />
          </div>

          {formData.tripType === 'delivery_service' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              📦 Types d'objets acceptés (sélectionner tous qui s'appliquent)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {itemOptions.map((item) => (
                <label key={item} className={`flex items-center space-x-2 cursor-pointer p-3 rounded-lg border transition-all duration-200 ${
                  formData.allowedItems.includes(item) 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}>
                  <input
                    type="checkbox"
                    checked={formData.allowedItems.includes(item)}
                    onChange={() => handleItemToggle(item)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">{item}</span>
                </label>
              ))}
            </div>
          </div>
          )}

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
              📝 Détails supplémentaires (optionnel)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400 resize-none"
              placeholder={formData.tripType === 'car_sharing' 
                ? 'Conditions du voyage, coût du partage d\'essence, préférences de compagnons, etc.' 
                : 'Exigences spéciales, détails de collecte/livraison, etc.'}
            />
          </div>

          <button
            type="submit"
            disabled={loading || (formData.tripType === 'delivery_service' && formData.allowedItems.length === 0)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Publication...</span>
              </>
            ) : (
              <>
                <span>{formData.tripType === 'car_sharing' ? '🚗' : '📦'}</span>
                <span>{formData.tripType === 'car_sharing' ? 'Publier le voyage' : 'Publier le service'}</span>
              </>
            )}
          </button>
          </form>
        </div>
      </main>
    </div>
  );
}