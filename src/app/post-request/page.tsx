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
    fromCoords: undefined as { lat: number; lng: number } | undefined,
    toCoords: undefined as { lat: number; lng: number } | undefined,
    deadline: '',
    requestType: '',
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
      // For now, we'll skip photo upload and just save the request
      // In production, you'd want to implement image upload to a service like Cloudinary
      const response = await apiClient.post('/api/requests', {
        ...formData,
        deadline: new Date(formData.deadline),
        photo: '', // TODO: Implement image upload service
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
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              🚗 Type de demande *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { 
                  value: 'travel_companion', 
                  title: '🚗 Compagnon de voyage', 
                  description: 'Je cherche quelqu\'un avec qui partager un voyage' 
                },
                { 
                  value: 'delivery_request', 
                  title: '📦 Demande de livraison', 
                  description: 'J\'ai besoin qu\'on me livre un objet' 
                }
              ].map((type) => (
                <label key={type.value} className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${
                  formData.requestType === type.value 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="requestType"
                    value={type.value}
                    checked={formData.requestType === type.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, requestType: e.target.value }))}
                    className="sr-only"
                  />
                  <div className="text-lg font-semibold mb-1">{type.title}</div>
                  <div className="text-sm text-slate-600">{type.description}</div>
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

          {formData.requestType === 'delivery_request' && (
          <div>
            <label htmlFor="photo" className="block text-sm font-semibold text-slate-700 mb-2">
              📷 Photo de l'objet (optionnel)
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
          )}

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
      </main>
    </div>
  );
}