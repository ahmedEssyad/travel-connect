'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/Common/LanguageSelector';
import { Heart, Users, Clock, MapPin, Download, Shield, Zap, UserCheck, Bell } from 'lucide-react';
import PWAInstallPrompt from './PWAInstallPrompt';

export default function LandingPage() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);

  useEffect(() => {
    // Check if PWA is installable
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setShowPWAPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const features = [
    {
      icon: <Heart className="h-8 w-8 text-red-600" />,
      title: t('landing.saveLives'),
      description: t('landing.saveLivesDesc')
    },
    {
      icon: <Zap className="h-8 w-8 text-red-600" />,
      title: t('landing.fastMatching'),
      description: t('landing.fastMatchingDesc')
    },
    {
      icon: <Bell className="h-8 w-8 text-red-600" />,
      title: t('landing.realTimeAlerts'),
      description: t('landing.realTimeAlertsDesc')
    },
    {
      icon: <Shield className="h-8 w-8 text-red-600" />,
      title: t('landing.securePrivate'),
      description: t('landing.securePrivateDesc')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 overflow-x-hidden" style={{ margin: 0, padding: 0 }}>
      {/* PWA Install Prompt */}
      {showPWAPrompt && (
        <PWAInstallPrompt onClose={() => setShowPWAPrompt(false)} />
      )}

      {/* Header */}
      <header className="relative overflow-hidden bg-white/80 backdrop-blur-md shadow-sm border-b border-red-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-gradient-to-br from-red-600 to-red-700 p-2 sm:p-3 rounded-xl shadow-lg">
                <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('app.name')}</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">{t('app.tagline')}</p>
              </div>
            </div>
            <button
              onClick={() => setShowPWAPrompt(true)}
              className="bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 border border-red-200 hover:border-red-300 text-sm font-medium"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                width: 'auto',
                minHeight: 'auto'
              }}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{t('landing.installApp')}</span>
              <span className="sm:hidden">{t('landing.installApp')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section - Fixed spacing */}
      <section className="relative" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-pink-50 to-white opacity-70"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-700"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div style={{ marginBottom: '2rem' }}>
            <div className="inline-flex items-center space-x-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>{t('landing.realTimeAlerts')}</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight" style={{ marginBottom: '1.5rem' }}>
              {t('landing.title')}
            </h2>
            
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed" style={{ marginBottom: '2rem' }}>
              {t('landing.subtitle')}
            </p>
          </div>

          {/* Action Buttons - Fixed spacing */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center" style={{ marginBottom: '3rem' }}>
            <button
              onClick={() => router.push('/signup')}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-lg transition-colors shadow-lg"
              style={{ 
                border: 'none',
                padding: '1rem 2rem',
                fontSize: '1.125rem',
                fontWeight: '600',
                width: 'auto',
                minHeight: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {t('landing.getStarted')}
            </button>
            <button
              onClick={() => router.push('/login')}
              className="bg-white text-red-600 hover:bg-red-50 rounded-lg font-semibold text-lg transition-colors"
              style={{ 
                border: '2px solid #dc2626',
                padding: '1rem 2rem',
                fontSize: '1.125rem',
                fontWeight: '600',
                width: 'auto',
                minHeight: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {t('auth.login')}
            </button>
          </div>

          {/* Stats - Fixed spacing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto">
            <div className="bg-white/70 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-red-100 group hover:scale-105">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600 mb-2 group-hover:text-red-700 transition-colors">24/7</div>
              <div className="text-gray-600 font-medium text-sm sm:text-base">Emergency Support</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-red-100 group hover:scale-105">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600 mb-2 group-hover:text-red-700 transition-colors">&lt;5min</div>
              <div className="text-gray-600 font-medium text-sm sm:text-base">Response Time</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-red-100 group hover:scale-105">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600 mb-2 group-hover:text-red-700 transition-colors">100%</div>
              <div className="text-gray-600 font-medium text-sm sm:text-base">Secure</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Fixed spacing */}
      <section className="bg-white relative overflow-hidden" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center" style={{ marginBottom: '3rem' }}>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900" style={{ marginBottom: '1rem' }}>
              {t('landing.fastMatching')}
            </h3>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('landing.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group bg-white p-6 sm:p-8 rounded-2xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-red-200 relative overflow-hidden"
              >
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 to-red-100/0 group-hover:from-red-50/50 group-hover:to-red-100/30 transition-all duration-500"></div>
                
                <div className="relative">
                  <div className="mb-4 lg:mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 lg:mb-4 group-hover:text-red-700 transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                    {feature.description}
                  </p>
                </div>

                {/* Decorative element */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Fixed spacing */}
      <section className="bg-red-600">
        <div className="mx-auto max-w-7xl px-6 lg:px-8" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl" style={{ marginBottom: '1.5rem' }}>
              {t('landing.readyToSave')}
            </h2>
            <p className="mx-auto max-w-xl text-lg leading-8 text-red-100" style={{ marginBottom: '2.5rem' }}>
              {t('landing.joinCommunity')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/signup')}
                className="bg-white text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors shadow-lg"
                style={{ 
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  width: 'auto',
                  minHeight: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {t('landing.getStarted')}
              </button>
              <button
                onClick={() => setShowPWAPrompt(true)}
                className="bg-red-500 text-white rounded-lg font-semibold hover:bg-red-400 transition-colors shadow-lg"
                style={{ 
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  width: 'auto',
                  minHeight: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {t('landing.downloadApp')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3" style={{ marginBottom: '1rem' }}>
            <div className="bg-gradient-to-br from-red-600 to-red-700 p-2 sm:p-3 rounded-xl shadow-lg">
              <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold">{t('app.name')}</span>
          </div>
          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {t('app.tagline')}
            <span className="block mt-2 text-gray-500">Built with ❤️ for saving lives</span>
          </p>
        </div>
      </footer>
    </div>
  );
}