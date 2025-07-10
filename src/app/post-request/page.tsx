'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Using API routes instead of direct Firebase calls
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';
import LocationSelector from '@/components/Common/LocationSelector';

export default function PostRequestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    deadline: '',
    itemType: '',
    description: '',
    reward: '',
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!formData.from || !formData.to || !formData.deadline || !formData.itemType) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (new Date(formData.deadline) <= new Date()) {
      toast.error('Deadline must be in the future.');
      return;
    }

    setLoading(true);
    try {
      // For now, we'll skip photo upload and just save the request
      // In production, you'd want to implement image upload to a service like Cloudinary
      const response = await apiClient.post('/api/requests', {
        ...formData,
        deadline: new Date(formData.deadline),
        photo: '', // TODO: Implement image upload service
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-slate-600 font-medium">Please log in to post a request.</p>
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
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📦</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Post a Delivery Request</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8 animate-slide-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg mb-4 mx-auto">
              <span className="text-white text-2xl">📦</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Request a Delivery</h2>
            <p className="text-slate-600">Find travelers who can help deliver your item</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LocationSelector
              label="From"
              value={formData.from}
              onChange={(location) => setFormData(prev => ({ ...prev, from: location }))}
              placeholder="Select pickup location"
              required
              showExactLocation={true}
            />

            <LocationSelector
              label="To"
              value={formData.to}
              onChange={(location) => setFormData(prev => ({ ...prev, to: location }))}
              placeholder="Select delivery destination"
              required
              showExactLocation={true}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="deadline" className="block text-sm font-semibold text-slate-700 mb-2">
                ⏰ Deadline
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

            <div>
              <label htmlFor="itemType" className="block text-sm font-semibold text-slate-700 mb-2">
                📊 Item Type
              </label>
              <select
                id="itemType"
                value={formData.itemType}
                onChange={(e) => setFormData(prev => ({ ...prev, itemType: e.target.value }))}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-slate-400 text-slate-900 placeholder-slate-400"
              >
                <option value="">Select item type</option>
                {itemTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
              📝 Item Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-slate-400 resize-none"
              placeholder="Describe the item, size, weight, special handling requirements, etc."
            />
          </div>

          <div>
            <label htmlFor="reward" className="block text-sm font-semibold text-slate-700 mb-2">
              💰 Reward/Compensation (optional)
            </label>
            <input
              type="text"
              id="reward"
              value={formData.reward}
              onChange={(e) => setFormData(prev => ({ ...prev, reward: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-slate-400"
              placeholder="e.g., $50, dinner, or 'Thank you gift'"
            />
          </div>

          <div>
            <label htmlFor="photo" className="block text-sm font-semibold text-slate-700 mb-2">
              📷 Item Photo (optional)
            </label>
            <input
              type="file"
              id="photo"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-slate-400"
            />
            {photoFile && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 font-medium">Selected: {photoFile.name}</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3 px-4 rounded-lg hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Posting Request...</span>
              </>
            ) : (
              <>
                <span>📦</span>
                <span>Post Request</span>
              </>
            )}
          </button>
          </form>
        </div>
      </main>
    </div>
  );
}