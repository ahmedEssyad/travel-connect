'use client';

import { useState } from 'react';

interface MedicalInfo {
  weight: number;
  age: number;
  availableForDonation: boolean;
  isDonor: boolean;
  medicalConditions: string[];
}

interface MedicalInfoFormProps {
  initialData: MedicalInfo;
  onSubmit: (data: MedicalInfo) => void;
  onBack: () => void;
}

const commonConditions = [
  'Diabetes',
  'Hypertension',
  'Heart Disease',
  'Anemia',
  'Hepatitis B',
  'Hepatitis C',
  'HIV/AIDS',
  'Pregnancy',
  'Recent Surgery',
  'Medication Use'
];

export default function MedicalInfoForm({ initialData, onSubmit, onBack }: MedicalInfoFormProps) {
  const [formData, setFormData] = useState<MedicalInfo>(initialData);
  const [customCondition, setCustomCondition] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const toggleCondition = (condition: string) => {
    setFormData(prev => ({
      ...prev,
      medicalConditions: prev.medicalConditions.includes(condition)
        ? prev.medicalConditions.filter(c => c !== condition)
        : [...prev.medicalConditions, condition]
    }));
  };

  const addCustomCondition = () => {
    if (customCondition.trim() && !formData.medicalConditions.includes(customCondition.trim())) {
      setFormData(prev => ({
        ...prev,
        medicalConditions: [...prev.medicalConditions, customCondition.trim()]
      }));
      setCustomCondition('');
    }
  };

  const removeCondition = (condition: string) => {
    setFormData(prev => ({
      ...prev,
      medicalConditions: prev.medicalConditions.filter(c => c !== condition)
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ 
        fontSize: '1.25rem', 
        fontWeight: '600',
        marginBottom: '1.5rem',
        color: 'var(--text-primary)'
      }}>
        Medical Information
      </h3>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '0.875rem', 
          fontWeight: '500',
          marginBottom: '0.5rem',
          color: 'var(--text-primary)'
        }}>
          Age *
        </label>
        <input
          type="number"
          value={formData.age || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
          placeholder="Enter your age"
          min="16"
          max="65"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            fontSize: '1rem'
          }}
          required
        />
        <div style={{ 
          fontSize: '0.75rem', 
          color: 'var(--text-muted)',
          marginTop: '0.25rem'
        }}>
          Blood donors must be between 16-65 years old
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '0.875rem', 
          fontWeight: '500',
          marginBottom: '0.5rem',
          color: 'var(--text-primary)'
        }}>
          Weight (kg) *
        </label>
        <input
          type="number"
          value={formData.weight || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
          placeholder="Enter your weight"
          min="50"
          max="200"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            fontSize: '1rem'
          }}
          required
        />
        <div style={{ 
          fontSize: '0.75rem', 
          color: 'var(--text-muted)',
          marginTop: '0.25rem'
        }}>
          Minimum weight requirement: 50kg
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.75rem'
        }}>
          <input
            type="checkbox"
            id="isDonor"
            checked={formData.isDonor}
            onChange={(e) => setFormData(prev => ({ ...prev, isDonor: e.target.checked }))}
            style={{ 
              width: '18px', 
              height: '18px',
              accentColor: 'var(--danger)'
            }}
          />
          <label htmlFor="isDonor" style={{ 
            fontSize: '0.875rem', 
            fontWeight: '500',
            color: 'var(--text-primary)'
          }}>
            I am willing to be a blood donor
          </label>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <input
            type="checkbox"
            id="availableForDonation"
            checked={formData.availableForDonation}
            onChange={(e) => setFormData(prev => ({ ...prev, availableForDonation: e.target.checked }))}
            style={{ 
              width: '18px', 
              height: '18px',
              accentColor: 'var(--danger)'
            }}
          />
          <label htmlFor="availableForDonation" style={{ 
            fontSize: '0.875rem', 
            fontWeight: '500',
            color: 'var(--text-primary)'
          }}>
            I am currently available for donation
          </label>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '0.875rem', 
          fontWeight: '500',
          marginBottom: '0.5rem',
          color: 'var(--text-primary)'
        }}>
          Medical Conditions (Select all that apply)
        </label>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          {commonConditions.map((condition) => (
            <button
              key={condition}
              type="button"
              onClick={() => toggleCondition(condition)}
              style={{
                padding: '0.5rem 0.75rem',
                border: `1px solid ${formData.medicalConditions.includes(condition) ? 'var(--danger)' : 'var(--border)'}`,
                borderRadius: '0.25rem',
                background: formData.medicalConditions.includes(condition) ? 'rgba(239, 68, 68, 0.1)' : 'white',
                color: formData.medicalConditions.includes(condition) ? 'var(--danger)' : 'var(--text-primary)',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center'
              }}
            >
              {condition}
            </button>
          ))}
        </div>

        {/* Custom condition input */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={customCondition}
            onChange={(e) => setCustomCondition(e.target.value)}
            placeholder="Add custom condition"
            style={{
              flex: 1,
              padding: '0.5rem',
              border: '1px solid var(--border)',
              borderRadius: '0.25rem',
              fontSize: '0.875rem'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomCondition();
              }
            }}
          />
          <button
            type="button"
            onClick={addCustomCondition}
            className="btn btn-outline"
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          >
            Add
          </button>
        </div>

        {/* Selected conditions */}
        {formData.medicalConditions.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ 
              fontSize: '0.875rem', 
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: 'var(--text-primary)'
            }}>
              Selected Conditions:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {formData.medicalConditions.map((condition) => (
                <span
                  key={condition}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: 'var(--danger)',
                    color: 'white',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  {condition}
                  <button
                    type="button"
                    onClick={() => removeCondition(condition)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      padding: '0',
                      lineHeight: '1'
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ 
        padding: '1rem',
        background: 'rgba(59, 130, 246, 0.05)',
        borderRadius: '0.5rem',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        marginBottom: '2rem'
      }}>
        <div style={{ 
          fontSize: '0.875rem', 
          fontWeight: '500',
          color: 'var(--primary)',
          marginBottom: '0.5rem'
        }}>
          📋 Important Information
        </div>
        <ul style={{ 
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.4',
          paddingLeft: '1rem',
          margin: '0'
        }}>
          <li>This information helps us match you safely with donation opportunities</li>
          <li>All medical information is kept confidential</li>
          <li>You can update this information anytime in your profile</li>
        </ul>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          type="button"
          onClick={onBack}
          className="btn btn-outline"
          style={{ flex: 1, padding: '0.75rem' }}
        >
          Back
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ flex: 1, padding: '0.75rem' }}
          disabled={!formData.age || !formData.weight || formData.age < 16 || formData.weight < 50}
        >
          Continue
        </button>
      </div>
    </form>
  );
}