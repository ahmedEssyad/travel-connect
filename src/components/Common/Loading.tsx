'use client';

import { Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export default function Loading({ 
  text = "Loading...", 
  size = 'md',
  fullScreen = false 
}: LoadingProps) {
  const { t } = useLanguage();
  const sizeMap = {
    sm: { height: '128px', logoSize: '48px', textSize: '14px' },
    md: { height: '192px', logoSize: '64px', textSize: '16px' },
    lg: { height: '256px', logoSize: '96px', textSize: '18px' }
  };

  const containerStyle = fullScreen 
    ? {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
      }
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: sizeMap[size].height
      };

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center' }}>
        {/* Logo with animation */}
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            borderRadius: '16px',
            filter: 'blur(8px)',
            opacity: 0.2,
            animation: 'pulse 2s infinite'
          }}></div>
          <div style={{
            position: 'relative',
            width: sizeMap[size].logoSize,
            height: sizeMap[size].logoSize,
            margin: '0 auto',
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(220, 38, 38, 0.3)',
            animation: 'bounce 1s infinite'
          }}>
            <Heart style={{ 
              width: `${parseInt(sizeMap[size].logoSize) * 0.6}px`, 
              height: `${parseInt(sizeMap[size].logoSize) * 0.6}px`, 
              color: 'white' 
            }} />
          </div>
        </div>

        {/* Animated loading dots */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '4px', 
          marginBottom: '16px' 
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#dc2626',
            borderRadius: '50%',
            animation: 'bounce 1.4s infinite',
            animationDelay: '0ms'
          }}></div>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#dc2626',
            borderRadius: '50%',
            animation: 'bounce 1.4s infinite',
            animationDelay: '150ms'
          }}></div>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#dc2626',
            borderRadius: '50%',
            animation: 'bounce 1.4s infinite',
            animationDelay: '300ms'
          }}></div>
        </div>

        {/* Loading text */}
        <p style={{
          color: '#6b7280',
          fontWeight: '500',
          fontSize: sizeMap[size].textSize,
          animation: 'pulse 2s infinite',
          margin: 0
        }}>
          {text}
        </p>

        {/* App branding */}
        <div style={{
          marginTop: '16px',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          <span style={{ fontWeight: '600', color: '#dc2626' }}>{t('app.name')}</span>
        </div>
      </div>
    </div>
  );
}

// Specific loading components for different contexts
export function MunqidhLoading() {
  return (
    <Loading 
      text="Connecting donors and patients..." 
      size="lg" 
      fullScreen={true} 
    />
  );
}

export function PageLoading({ text }: { text?: string }) {
  return (
    <Loading 
      text={text || "Loading page..."} 
      size="md" 
      fullScreen={false} 
    />
  );
}

export function ComponentLoading({ text }: { text?: string }) {
  return (
    <Loading 
      text={text || "Loading..."} 
      size="sm" 
      fullScreen={false} 
    />
  );
}