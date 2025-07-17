'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PWAInstallPromptProps {
  onClose: () => void;
}

export default function PWAInstallPrompt({ onClose }: PWAInstallPromptProps) {
  const { t, isRTL } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Listen for the install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      onClose();
    }
  };

  if (isStandalone) {
    return null; // Already installed
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
        <button
          onClick={onClose}
          className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} text-gray-400 hover:text-gray-600`}
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center">
          <div className="bg-red-600 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Smartphone className="h-10 w-10 text-white" />
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {t('pwa.installTitle')}
          </h3>

          <p className="text-gray-600 mb-6">
            {t('pwa.installDesc')}
          </p>

          {/* Benefits */}
          <div className={`space-y-3 mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
              <div className="bg-green-100 p-1 rounded-full">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              </div>
              <span className="text-gray-700">{t('pwa.instantNotifications')}</span>
            </div>
            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
              <div className="bg-green-100 p-1 rounded-full">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              </div>
              <span className="text-gray-700">{t('pwa.worksOffline')}</span>
            </div>
            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
              <div className="bg-green-100 p-1 rounded-full">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              </div>
              <span className="text-gray-700">{t('pwa.fasterAccess')}</span>
            </div>
            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
              <div className="bg-green-100 p-1 rounded-full">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              </div>
              <span className="text-gray-700">{t('pwa.homeScreenShortcut')}</span>
            </div>
          </div>

          {/* Install Instructions */}
          {isIOS ? (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800 font-medium mb-2">
                To install on iOS:
              </p>
              <ol className="text-sm text-blue-700 text-left space-y-1">
                <li>1. Tap the Share button in Safari</li>
                <li>2. Scroll down and tap "Add to Home Screen"</li>
                <li>3. Tap "Add" to install</li>
              </ol>
            </div>
          ) : deferredPrompt ? (
            <button
              onClick={handleInstall}
              className="w-full bg-red-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 mb-4"
            >
              <Download className="h-5 w-5" />
              <span>{t('pwa.installNow')}</span>
            </button>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600">
                {t('pwa.installInstructions')}
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full text-gray-500 py-2 font-medium hover:text-gray-700 transition-colors"
          >
            {t('pwa.maybeLater')}
          </button>
        </div>
      </div>
    </div>
  );
}