'use client';

import { useState } from 'react';

interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

interface EmergencyContactFormProps {
  initialData: EmergencyContact[];
  onSubmit: (data: EmergencyContact[]) => void;
  onBack: () => void;
  loading?: boolean;
}

const relationshipOptions = [
  'Spouse',
  'Parent',
  'Child',
  'Sibling',
  'Friend',
  'Relative',
  'Colleague',
  'Other'
];

export default function EmergencyContactForm({ initialData, onSubmit, onBack, loading }: EmergencyContactFormProps) {
  const [contacts, setContacts] = useState<EmergencyContact[]>(
    initialData.length > 0 ? initialData : [{ name: '', phone: '', relationship: '' }]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out empty contacts
    const validContacts = contacts.filter(contact => 
      contact.name.trim() && contact.phone.trim() && contact.relationship.trim()
    );
    onSubmit(validContacts);
  };

  const formatPhoneInput = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as +222 XXXX XXXX for Mauritanian numbers
    if (digits.length <= 3) {
      return '+222 ' + digits;
    } else if (digits.length <= 7) {
      return '+222 ' + digits.slice(3, 7);
    } else {
      return '+222 ' + digits.slice(3, 7) + ' ' + digits.slice(7, 11);
    }
  };

  const updateContact = (index: number, field: keyof EmergencyContact, value: string) => {
    setContacts(prev => prev.map((contact, i) => 
      i === index ? { ...contact, [field]: value } : contact
    ));
  };

  const addContact = () => {
    if (contacts.length < 3) {
      setContacts(prev => [...prev, { name: '', phone: '', relationship: '' }]);
    }
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(prev => prev.filter((_, i) => i !== index));
    }
  };

  const hasValidContact = contacts.some(contact => 
    contact.name.trim() && contact.phone.trim() && contact.relationship.trim()
  );

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ 
        fontSize: '1.25rem', 
        fontWeight: '600',
        marginBottom: '1rem',
        color: 'var(--text-primary)'
      }}>
        Emergency Contacts
      </h3>

      <div style={{ 
        fontSize: '0.875rem',
        color: 'var(--text-secondary)',
        marginBottom: '1.5rem',
        padding: '1rem',
        background: 'rgba(59, 130, 246, 0.05)',
        borderRadius: '0.5rem',
        border: '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        <div style={{ 
          fontWeight: '500',
          color: 'var(--primary)',
          marginBottom: '0.5rem'
        }}>
          🚨 Why we need this information:
        </div>
        <ul style={{ 
          paddingLeft: '1rem',
          margin: '0',
          lineHeight: '1.4'
        }}>
          <li>In case of emergency during blood donation</li>
          <li>To notify family about donation appointments</li>
          <li>Required for safety protocols</li>
        </ul>
      </div>

      {contacts.map((contact, index) => (
        <div 
          key={index}
          style={{
            padding: '1.5rem',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            background: 'rgba(248, 250, 252, 0.5)'
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: '0'
            }}>
              Contact {index + 1}
              {index === 0 && (
                <span style={{ 
                  fontSize: '0.75rem',
                  fontWeight: '400',
                  color: 'var(--text-muted)',
                  marginLeft: '0.5rem'
                }}>
                  (Primary)
                </span>
              )}
            </h4>
            {contacts.length > 1 && (
              <button
                type="button"
                onClick={() => removeContact(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  padding: '0.25rem'
                }}
              >
                Remove
              </button>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: 'var(--text-primary)'
            }}>
              Full Name *
            </label>
            <input
              type="text"
              value={contact.name}
              onChange={(e) => updateContact(index, 'name', e.target.value)}
              placeholder="Enter contact's full name"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: 'var(--text-primary)'
            }}>
              Phone Number *
            </label>
            <input
              type="tel"
              value={contact.phone}
              onChange={(e) => updateContact(index, 'phone', formatPhoneInput(e.target.value))}
              placeholder="+222 XXXX XXXX"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: 'var(--text-primary)'
            }}>
              Relationship *
            </label>
            <select
              value={contact.relationship}
              onChange={(e) => updateContact(index, 'relationship', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                background: 'white'
              }}
            >
              <option value="">Select relationship</option>
              {relationshipOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      ))}

      {contacts.length < 3 && (
        <button
          type="button"
          onClick={addContact}
          className="btn btn-outline"
          style={{ 
            width: '100%', 
            padding: '0.75rem',
            marginBottom: '1.5rem',
            border: '2px dashed var(--border)',
            background: 'transparent'
          }}
        >
          + Add Another Contact
        </button>
      )}

      <div style={{ 
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        marginBottom: '2rem',
        textAlign: 'center',
        fontStyle: 'italic'
      }}>
        You can add up to 3 emergency contacts. At least one contact is required.
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          type="button"
          onClick={onBack}
          className="btn btn-outline"
          style={{ flex: 1, padding: '0.75rem' }}
          disabled={loading}
        >
          Back
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ flex: 1, padding: '0.75rem' }}
          disabled={!hasValidContact || loading}
        >
          {loading ? 'Saving...' : 'Complete Setup'}
        </button>
      </div>
    </form>
  );
}