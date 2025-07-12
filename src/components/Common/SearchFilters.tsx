'use client';

import { useState, useEffect } from 'react';

export interface SearchFilters {
  search: string;
  from: string;
  to: string;
  dateFrom: string;
  dateTo: string;
  itemType: string;
  tripType: string;
  requestType: string;
  minCapacity: number;
  maxCapacity: number;
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  type: 'trips' | 'requests';
  disabled?: boolean;
}

const tripTypes = [
  { value: '', label: 'All Trip Types' },
  { value: 'car_sharing', label: 'Car Sharing' },
  { value: 'delivery_service', label: 'Delivery Service' }
];

const requestTypes = [
  { value: '', label: 'All Request Types' },
  { value: 'travel_companion', label: 'Travel Companion' },
  { value: 'delivery_request', label: 'Delivery Request' }
];

const itemTypes = [
  { value: '', label: 'All Items' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Documents', label: 'Documents' },
  { value: 'Gifts', label: 'Gifts' },
  { value: 'Clothing', label: 'Clothing' },
  { value: 'Books', label: 'Books' },
  { value: 'Food Items', label: 'Food Items' },
  { value: 'Jewelry', label: 'Jewelry' },
  { value: 'Art/Crafts', label: 'Art/Crafts' },
  { value: 'Sports Equipment', label: 'Sports Equipment' },
  { value: 'Other', label: 'Other' }
];

export default function SearchFilters({ 
  filters, 
  onFiltersChange, 
  type, 
  disabled = false 
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof SearchFilters, value: string | number) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      from: '',
      to: '',
      dateFrom: '',
      dateTo: '',
      itemType: '',
      tripType: '',
      requestType: '',
      minCapacity: 1,
      maxCapacity: type === 'trips' ? 8 : 50
    });
  };

  const hasActiveFilters = () => {
    return filters.search || filters.from || filters.to || filters.dateFrom || 
           filters.dateTo || filters.itemType || filters.tripType || filters.requestType ||
           filters.minCapacity > 1 || filters.maxCapacity < (type === 'trips' ? 8 : 50);
  };

  return (
    <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      {/* Search Input */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder={type === 'trips' ? 'Search trips by location or description...' : 'Search requests by location or description...'}
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            disabled={disabled}
            className="input"
            style={{ paddingLeft: '2.5rem' }}
          />
          <div style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            ⌕
          </div>
        </div>
      </div>

      {/* Quick Filters Row */}
      <div style={{ 
        display: 'flex', 
        gap: '0.75rem', 
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: isExpanded ? '1rem' : '0'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', flex: '1', minWidth: '300px' }}>
          <input
            type="text"
            placeholder="From location"
            value={filters.from}
            onChange={(e) => updateFilter('from', e.target.value)}
            disabled={disabled}
            className="input"
            style={{ fontSize: '0.875rem' }}
          />
          <input
            type="text"
            placeholder="To location"
            value={filters.to}
            onChange={(e) => updateFilter('to', e.target.value)}
            disabled={disabled}
            className="input"
            style={{ fontSize: '0.875rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-outline"
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            {isExpanded ? 'Less Filters' : 'More Filters'}
          </button>
          
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="btn btn-secondary"
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-light)'
        }}>
          {/* Date Filters */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.75rem', 
              fontWeight: '500', 
              color: 'var(--text-secondary)', 
              marginBottom: '0.25rem' 
            }}>
              {type === 'trips' ? 'Departure From' : 'Deadline From'}
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              disabled={disabled}
              className="input"
              style={{ fontSize: '0.875rem' }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.75rem', 
              fontWeight: '500', 
              color: 'var(--text-secondary)', 
              marginBottom: '0.25rem' 
            }}>
              {type === 'trips' ? 'Departure To' : 'Deadline To'}
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              disabled={disabled}
              className="input"
              style={{ fontSize: '0.875rem' }}
            />
          </div>

          {/* Type Filters */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.75rem', 
              fontWeight: '500', 
              color: 'var(--text-secondary)', 
              marginBottom: '0.25rem' 
            }}>
              {type === 'trips' ? 'Trip Type' : 'Request Type'}
            </label>
            <select
              value={type === 'trips' ? filters.tripType : filters.requestType}
              onChange={(e) => updateFilter(type === 'trips' ? 'tripType' : 'requestType', e.target.value)}
              disabled={disabled}
              className="input"
              style={{ fontSize: '0.875rem' }}
            >
              {(type === 'trips' ? tripTypes : requestTypes).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Item Type Filter - only for delivery services */}
          {((type === 'trips' && filters.tripType === 'delivery_service') || 
            (type === 'requests' && filters.requestType === 'delivery_request')) && (
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.75rem', 
                fontWeight: '500', 
                color: 'var(--text-secondary)', 
                marginBottom: '0.25rem' 
              }}>
                Item Type
              </label>
              <select
                value={filters.itemType}
                onChange={(e) => updateFilter('itemType', e.target.value)}
                disabled={disabled}
                className="input"
                style={{ fontSize: '0.875rem' }}
              >
                {itemTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Capacity Filters - only for car sharing */}
          {((type === 'trips' && filters.tripType === 'car_sharing') || 
            (type === 'requests' && filters.requestType === 'travel_companion')) && (
            <>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.75rem', 
                  fontWeight: '500', 
                  color: 'var(--text-secondary)', 
                  marginBottom: '0.25rem' 
                }}>
                  Min Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max={filters.maxCapacity}
                  value={filters.minCapacity}
                  onChange={(e) => updateFilter('minCapacity', parseInt(e.target.value) || 1)}
                  disabled={disabled}
                  className="input"
                  style={{ fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.75rem', 
                  fontWeight: '500', 
                  color: 'var(--text-secondary)', 
                  marginBottom: '0.25rem' 
                }}>
                  Max Capacity
                </label>
                <input
                  type="number"
                  min={filters.minCapacity}
                  max="8"
                  value={filters.maxCapacity}
                  onChange={(e) => updateFilter('maxCapacity', parseInt(e.target.value) || 8)}
                  disabled={disabled}
                  className="input"
                  style={{ fontSize: '0.875rem' }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}