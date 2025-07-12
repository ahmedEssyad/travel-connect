'use client';

import { BLOOD_TYPES, BloodType } from '@/lib/blood-types';

interface BloodTypeSelectorProps {
  value: BloodType | '';
  onChange: (bloodType: BloodType) => void;
  disabled?: boolean;
  required?: boolean;
}

export default function BloodTypeSelector({ 
  value, 
  onChange, 
  disabled = false,
  required = false 
}: BloodTypeSelectorProps) {
  return (
    <div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '0.5rem' 
      }}>
        {BLOOD_TYPES.map((bloodType) => (
          <button
            key={bloodType}
            type="button"
            onClick={() => onChange(bloodType)}
            disabled={disabled}
            style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '2px solid',
              borderColor: value === bloodType ? 'var(--danger)' : 'var(--border)',
              background: value === bloodType ? 'rgba(220, 38, 38, 0.1)' : 'white',
              color: value === bloodType ? 'var(--danger)' : 'var(--text-primary)',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: disabled ? '0.5' : '1',
              minHeight: '44px', // Touch-friendly
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              if (!disabled && value !== bloodType) {
                e.currentTarget.style.borderColor = 'var(--danger)';
                e.currentTarget.style.background = 'rgba(220, 38, 38, 0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled && value !== bloodType) {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'white';
              }
            }}
          >
            {bloodType}
          </button>
        ))}
      </div>
      
      {required && !value && (
        <p style={{ 
          fontSize: '0.75rem', 
          color: 'var(--danger)', 
          marginTop: '0.5rem',
          margin: '0.5rem 0 0 0'
        }}>
          Please select your blood type
        </p>
      )}
      
      <div style={{ 
        marginTop: '0.75rem', 
        padding: '0.75rem', 
        background: 'rgba(37, 99, 235, 0.05)',
        borderRadius: '0.5rem',
        border: '1px solid rgba(37, 99, 235, 0.2)'
      }}>
        <p style={{ 
          fontSize: '0.75rem', 
          color: 'var(--primary)', 
          margin: 0,
          fontWeight: '500'
        }}>
          💡 Your blood type determines who you can help and who can help you in emergencies
        </p>
      </div>
    </div>
  );
}