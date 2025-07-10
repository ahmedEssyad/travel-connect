'use client';

import { useState, useCallback, memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from './Navigation';
import TripsList from './TripsList';
import RequestsList from './RequestsList';
import Link from 'next/link';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'trips' | 'requests'>('trips');
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Modern Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">✈️</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent hidden sm:block">
                TravelConnect
              </h1>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent sm:hidden">
                TC
              </h1>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-full flex items-center justify-center">
                  <span className="text-blue-700 text-sm font-semibold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-slate-700 font-medium hidden md:block">
                  {user?.name}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all duration-200 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative">
          <div className="text-center animate-slide-in">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 drop-shadow-sm">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-blue-100 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto drop-shadow-sm">
              Connect with travelers worldwide to send and receive items safely and affordably
            </p>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto">
              <Link 
                href="/post-trip"
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 sm:p-6 hover:bg-white/20 hover:scale-105 transition-all duration-200 group shadow-lg"
              >
                <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">✈️</div>
                <div className="text-sm sm:text-base font-semibold">Post Trip</div>
                <div className="text-xs sm:text-sm text-blue-100 mt-1">Going somewhere?</div>
              </Link>
              
              <Link 
                href="/post-request"
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 sm:p-6 hover:bg-white/20 hover:scale-105 transition-all duration-200 group shadow-lg"
              >
                <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">📦</div>
                <div className="text-sm sm:text-base font-semibold">Request Delivery</div>
                <div className="text-xs sm:text-sm text-blue-100 mt-1">Need something sent?</div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2 p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="text-2xl sm:text-3xl">🌍</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-900">Global</div>
              <div className="text-xs text-slate-500 hidden sm:block">Worldwide Network</div>
            </div>
            <div className="space-y-2 p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="text-2xl sm:text-3xl">🔒</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-900">Secure</div>
              <div className="text-xs text-slate-500 hidden sm:block">Trusted Platform</div>
            </div>
            <div className="space-y-2 p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="text-2xl sm:text-3xl">💰</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-900">Free</div>
              <div className="text-xs text-slate-500 hidden sm:block">No Hidden Fees</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Tab Navigation */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-0">
              Explore Opportunities
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm text-slate-500">View:</span>
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('trips')}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                    activeTab === 'trips'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Trips
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                    activeTab === 'requests'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Requests
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content Description */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-5">
            <div className="flex items-start space-x-3">
              <div className="text-blue-600 text-lg sm:text-xl bg-blue-100 p-2 rounded-lg">
                {activeTab === 'trips' ? '✈️' : '📦'}
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-blue-900 mb-1">
                  {activeTab === 'trips' ? 'Available Trips' : 'Delivery Requests'}
                </h4>
                <p className="text-xs sm:text-sm text-blue-700">
                  {activeTab === 'trips' 
                    ? 'Find travelers going to your destination who can help deliver items'
                    : 'Discover items that need to be delivered to places you\'re traveling to'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 sm:space-y-6">
          {activeTab === 'trips' ? <TripsList /> : <RequestsList />}
        </div>
      </main>

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
}