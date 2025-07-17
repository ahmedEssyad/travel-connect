'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { isRTL } from '@/lib/i18n';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { language } = useLanguage();
  const isRightToLeft = isRTL(language);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-white border-l-4 border-l-green-500 shadow-lg';
      case 'error':
        return 'bg-white border-l-4 border-l-red-500 shadow-lg';
      case 'warning':
        return 'bg-white border-l-4 border-l-yellow-500 shadow-lg';
      case 'info':
        return 'bg-white border-l-4 border-l-blue-500 shadow-lg';
      default:
        return 'bg-white border-l-4 border-l-gray-500 shadow-lg';
    }
  };

  const getIcon = () => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'error':
        return <XCircle className={`${iconClass} text-red-500`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      case 'info':
        return <Info className={`${iconClass} text-blue-500`} />;
      default:
        return <Info className={`${iconClass} text-gray-500`} />;
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <div
      className={`fixed top-4 ${isRightToLeft ? 'left-4' : 'right-4'} z-50 max-w-sm w-full transition-all duration-300 transform ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'
      }`}
    >
      <div className={`rounded-xl border border-gray-200 backdrop-blur-sm ${getTypeStyles()}`}>
        <div className="p-4">
          <div className={`flex items-start ${isRightToLeft ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
            <div className="flex-shrink-0 mt-0.5">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${getTextColor()}`}>
                {message}
              </p>
            </div>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 rounded-b-xl overflow-hidden">
          <div 
            className={`h-full transition-all duration-${duration} ease-linear ${
              type === 'success' ? 'bg-green-500' :
              type === 'error' ? 'bg-red-500' :
              type === 'warning' ? 'bg-yellow-500' :
              'bg-blue-500'
            } ${isVisible ? 'w-0' : 'w-full'}`}
            style={{
              animation: isVisible ? `shrink ${duration}ms linear` : 'none'
            }}
          />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}