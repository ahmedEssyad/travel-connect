'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useData } from '@/contexts/DataContext';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { trips, requests } = useData();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    bio: '',
    photo: '',
  });

  const userTrips = trips?.filter(trip => trip.userId === user?.uid) || [];
  const userRequests = requests?.filter(request => request.userId === user?.uid) || [];

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        location: user.location || '',
        bio: user.bio || '',
        photo: user.photo || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name.trim()) {
      toast.error('Name is required.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          ...formData,
          name: formData.name.trim(),
          location: formData.location.trim(),
          bio: formData.bio.trim(),
        }),
      });
      
      if (response.ok) {
        toast.success('Profile updated successfully!');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-slate-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-slate-600 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100"
              >
                ← Back
              </button>
              <h1 className="text-xl font-semibold text-slate-900">Profile</h1>
            </div>
            <button
              onClick={logout}
              className="text-red-600 hover:text-red-800 px-3 py-1 rounded-lg hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-6">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-3 rounded-lg font-medium text-sm ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              👤 Profil
            </button>
            <button
              onClick={() => setActiveTab('trips')}
              className={`px-4 py-3 rounded-lg font-medium text-sm ${
                activeTab === 'trips'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              🚗 Mes Voyages ({userTrips.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-3 rounded-lg font-medium text-sm ${
                activeTab === 'requests'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              📦 Mes Demandes ({userRequests.length})
            </button>
          </div>
        </div>

        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Profile Settings</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  👤 Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  🗺️ Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  📝 Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'trips' && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold mb-6">🚗 Mes Voyages ({userTrips.length})</h2>
            {userTrips.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🚗</div>
                <h3 className="text-xl font-semibold mb-2">Aucun voyage publié</h3>
                <button
                  onClick={() => router.push('/post-trip')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Publier un voyage
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {userTrips.map((trip) => (
                  <div key={trip._id} className="border border-slate-200 rounded-lg p-4">
                    <h4 className="font-semibold">{trip.from} → {trip.to}</h4>
                    <p className="text-sm text-slate-600">
                      {new Date(trip.departureDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold mb-6">📦 Mes Demandes ({userRequests.length})</h2>
            {userRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📦</div>
                <h3 className="text-xl font-semibold mb-2">Aucune demande publiée</h3>
                <button
                  onClick={() => router.push('/post-request')}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700"
                >
                  Publier une demande
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {userRequests.map((request) => (
                  <div key={request._id} className="border border-slate-200 rounded-lg p-4">
                    <h4 className="font-semibold">{request.from} → {request.to}</h4>
                    <p className="text-sm text-slate-600">
                      Deadline: {new Date(request.deadline).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}