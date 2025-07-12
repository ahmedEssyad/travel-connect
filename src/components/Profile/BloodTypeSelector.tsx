'use client';

import { BloodType } from '@/types';

interface BloodTypeSelectorProps {
  value: string;
  onChange: (bloodType: BloodType) => void;
  required?: boolean;
}

const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const bloodTypeDescriptions: Record<BloodType, string> = {
  'A+': 'Can donate to A+, AB+ | Can receive from A+, A-, O+, O-',
  'A-': 'Can donate to A+, A-, AB+, AB- | Can receive from A-, O-',
  'B+': 'Can donate to B+, AB+ | Can receive from B+, B-, O+, O-',
  'B-': 'Can donate to B+, B-, AB+, AB- | Can receive from B-, O-',
  'AB+': 'Universal plasma donor | Can receive from all blood types',
  'AB-': 'Can donate to AB+, AB- | Can receive from AB-, A-, B-, O-',
  'O+': 'Can donate to A+, B+, AB+, O+ | Can receive from O+, O-',
  'O-': 'Universal blood donor | Can receive from O- only'
};

export default function BloodTypeSelector({ value, onChange, required = true }: BloodTypeSelectorProps) {
  return (
    <div>
      <label style={{ 
        display: 'block', 
        fontSize: '0.875rem', 
        fontWeight: '500',
        marginBottom: '0.5rem',
        color: 'var(--text-primary)'
      }}>
        Blood Type {required && '*'}
      </label>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        {bloodTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            style={{
              padding: '0.75rem',
              border: `2px solid ${value === type ? 'var(--danger)' : 'var(--border)'}`,
              borderRadius: '0.5rem',
              background: value === type ? 'rgba(239, 68, 68, 0.1)' : 'white',
              color: value === type ? 'var(--danger)' : 'var(--text-primary)',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              if (value !== type) {
                e.currentTarget.style.borderColor = 'var(--danger)';
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (value !== type) {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'white';
              }
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {value && (
        <div style={{
          padding: '0.75rem',
          background: 'rgba(239, 68, 68, 0.05)',
          borderRadius: '0.5rem',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.4'
        }}>
          <div style={{ 
            fontWeight: '600', 
            color: 'var(--danger)',
            marginBottom: '0.25rem'
          }}>
            {value} Blood Type
          </div>
          {bloodTypeDescriptions[value as BloodType]}
        </div>
      )}

      <div style={{
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        marginTop: '0.5rem',
        fontStyle: 'italic'
      }}>
        💡 If you're unsure of your blood type, you can update this later after getting tested
      </div>
    </div>
  );
}