'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import MobileHeader from '@/components/Layout/MobileHeader';
import LanguageSelector from '@/components/Common/LanguageSelector';
import { 
  Settings, 
  Bell, 
  Shield, 
  Globe, 
  User, 
  Heart,
  ChevronRight,
  Moon,
  Sun
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const handleLanguageChange = (lang: 'en' | 'ar') => {
    setLanguage(lang);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        direction: isRTL ? 'rtl' : 'ltr'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '8px'
          }}>
            {t('auth.accessRestricted')}
          </h2>
          <p style={{ color: '#6b7280' }}>{t('auth.pleaseLogin')}</p>
        </div>
      </div>
    );
  }

  const settingsItems = [
    {
      id: 'profile',
      icon: User,
      title: t('settings.profile'),
      description: t('settings.profileDesc'),
      href: '/profile',
      color: '#3b82f6'
    },
    {
      id: 'notifications',
      icon: Bell,
      title: t('settings.notifications'),
      description: t('settings.notificationsDesc'),
      href: '/settings/notifications',
      color: '#d97706'
    },
    {
      id: 'auth',
      icon: Shield,
      title: t('settings.security'),
      description: t('settings.securityDesc'),
      href: '/settings/auth',
      color: '#059669'
    },
    {
      id: 'blood',
      icon: Heart,
      title: t('settings.bloodSettings'),
      description: t('settings.bloodSettingsDesc'),
      href: '/profile/setup',
      color: '#dc2626'
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb',
      direction: isRTL ? 'rtl' : 'ltr'
    }}>
      <MobileHeader
        title={t('settings.title')}
        rightAction={
          <button
            onClick={() => router.back()}
            style={{
              padding: '4px 12px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#374151',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            {t('common.back')}
          </button>
        }
      />

      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 16px',
        paddingTop: '104px'
      }}>
        <div style={{ maxWidth: '672px', margin: '0 auto' }}>
          
          {/* User Info Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#dc2626',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User style={{ width: '32px', height: '32px', color: 'white' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0 0 4px 0'
                }}>
                  {user.name || t('settings.user')}
                </h2>
                <p style={{
                  color: '#6b7280',
                  fontSize: '14px',
                  margin: '0 0 4px 0'
                }}>
                  {user.phone}
                </p>
                <p style={{
                  color: '#dc2626',
                  fontSize: '14px',
                  fontWeight: '500',
                  margin: 0
                }}>
                  {user.bloodType ? `${t('home.bloodType')}: ${user.bloodType}` : t('settings.bloodTypeNotSet')}
                </p>
              </div>
            </div>
          </div>

          {/* Language & Appearance Settings */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '16px',
              margin: '0 0 16px 0'
            }}>
              {t('settings.languageAndAppearance')}
            </h3>

            {/* Language Setting */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  backgroundColor: '#3b82f6',
                  padding: '8px',
                  borderRadius: '8px'
                }}>
                  <Globe style={{ width: '20px', height: '20px', color: 'white' }} />
                </div>
                <div>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#111827',
                    margin: '0 0 2px 0'
                  }}>
                    {t('settings.language')}
                  </h4>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    {t('settings.languageDesc')}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleLanguageChange('en')}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: language === 'en' ? '#3b82f6' : '#e5e7eb',
                    color: language === 'en' ? 'white' : '#374151'
                  }}
                >
                  English
                </button>
                <button
                  onClick={() => handleLanguageChange('ar')}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: language === 'ar' ? '#3b82f6' : '#e5e7eb',
                    color: language === 'ar' ? 'white' : '#374151'
                  }}
                >
                  عربي
                </button>
              </div>
            </div>

            {/* Theme Setting */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  backgroundColor: '#6b7280',
                  padding: '8px',
                  borderRadius: '8px'
                }}>
                  {theme === 'light' ? 
                    <Sun style={{ width: '20px', height: '20px', color: 'white' }} /> :
                    <Moon style={{ width: '20px', height: '20px', color: 'white' }} />
                  }
                </div>
                <div>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#111827',
                    margin: '0 0 2px 0'
                  }}>
                    {t('settings.theme')}
                  </h4>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    {t('settings.themeDesc')}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: '#e5e7eb',
                  color: '#374151'
                }}
              >
                {theme === 'light' ? t('settings.darkMode') : t('settings.lightMode')}
              </button>
            </div>
          </div>

          {/* Settings Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {settingsItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.href)}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: isRTL ? 'right' : 'left',
                    width: '100%'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        backgroundColor: item.color,
                        padding: '12px',
                        borderRadius: '12px'
                      }}>
                        <IconComponent style={{ width: '24px', height: '24px', color: 'white' }} />
                      </div>
                      <div>
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#111827',
                          margin: '0 0 4px 0'
                        }}>
                          {item.title}
                        </h3>
                        <p style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          margin: 0
                        }}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight 
                      style={{ 
                        width: '20px', 
                        height: '20px', 
                        color: '#9ca3af',
                        transform: isRTL ? 'rotate(180deg)' : 'none'
                      }} 
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* App Info */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            padding: '24px',
            marginTop: '24px',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <Heart style={{ 
                width: '32px', 
                height: '32px', 
                color: '#dc2626', 
                margin: '0 auto 8px auto' 
              }} />
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#dc2626',
              margin: '0 0 8px 0'
            }}>
              {t('app.name')}
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '0 0 16px 0'
            }}>
              {t('app.tagline')}
            </p>
            <p style={{
              fontSize: '12px',
              color: '#9ca3af',
              margin: 0
            }}>
              {t('settings.version')} 1.0.0
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}