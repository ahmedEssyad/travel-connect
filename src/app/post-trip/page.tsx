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
    departureDate: '',
    arrivalDate: '',
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
    if (!formData.from || !formData.to || !formData.departureDate || !formData.arrivalDate || !formData.capacity || formData.allowedItems.length === 0) {
      toast.error('Please fill in all required fields and select at least one allowed item type.');
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
              onChange={(location) => setFormData(prev => ({ ...prev, from: location }))}
              placeholder="Select departure location"
              required
              showExactLocation={true}
            />

            <LocationSelector
              label="To"
              value={formData.to}
              onChange={(location) => setFormData(prev => ({ ...prev, to: location }))}
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
            <label htmlFor="capacity" className="block text-sm font-semibold text-slate-700 mb-2">
              🎽 Carry Capacity (kg)
            </label>
            <input
              type="number"
              id="capacity"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
              required
              min="1"
              max="50"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400"
              placeholder="e.g., 5"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              📦 Allowed Items (select all that apply)
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

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
              📝 Additional Details (optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400 resize-none"
              placeholder="Any special requirements, pickup/delivery details, etc."
            />
          </div>

          <button
            type="submit"
            disabled={loading || formData.allowedItems.length === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Posting Trip...</span>
              </>
            ) : (
              <>
                <span>✈️</span>
                <span>Post Trip</span>
              </>
            )}
          </button>
          </form>
        </div>
      </main>
    </div>
  );
}