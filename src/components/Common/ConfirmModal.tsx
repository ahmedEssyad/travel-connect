'use client';

import { useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'info'
}: ConfirmModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'rgba(220, 38, 38, 0.1)',
          iconColor: 'var(--danger)',
          confirmBg: 'var(--danger)',
          confirmColor: 'white'
        };
      case 'warning':
        return {
          iconBg: 'rgba(217, 119, 6, 0.1)',
          iconColor: 'var(--warning)',
          confirmBg: 'var(--warning)',
          confirmColor: 'white'
        };
      default:
        return {
          iconBg: 'rgba(37, 99, 235, 0.1)',
          iconColor: 'var(--primary)',
          confirmBg: 'var(--primary)',
          confirmColor: 'white'
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div 
        className="card animate-fade-in"
        style={{
          maxWidth: '400px',
          width: '100%',
          padding: '1.5rem',
          background: 'white',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          animation: 'modalSlideIn 0.2s ease-out'
        }}
      >
        {/* Icon */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: typeStyles.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
          color: typeStyles.iconColor,
          fontSize: '1.5rem',
          fontWeight: '600'
        }}>
          {type === 'danger' ? '!' : type === 'warning' ? '?' : 'i'}
        </div>

        {/* Content */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            {title}
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.5'
          }}>
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            className="btn btn-outline"
            style={{
              minWidth: '80px',
              padding: '0.5rem 1rem'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="btn"
            style={{
              minWidth: '80px',
              padding: '0.5rem 1rem',
              background: typeStyles.confirmBg,
              color: typeStyles.confirmColor
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}