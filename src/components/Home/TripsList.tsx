'use client';

import { useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import { Trip } from '@/types';
import { ComponentLoading } from '@/components/Common/Loading';
import SearchFilters from '@/components/Common/SearchFilters';
import { useSearch } from '@/hooks/useSearch';

function TripsList() {
  const router = useRouter();
  const { user } = useAuth();
  const { trips: allTrips, loading } = useData();
  const toast = useToast();

  // Use search hook for filtering and search functionality
  const { 
    filters, 
    setFilters, 
    filteredData: trips, 
    resultCount, 
    totalCount, 
    hasActiveFilters,
    isSearching 
  } = useSearch({ 
    data: allTrips, 
    type: 'trips', 
    userId: user?.uid 
  });

  const handleContactTraveler = useCallback((trip: Trip) => {
    if (!user) {
      toast.error('Please log in to contact travelers.');
      router.push('/login');
      return;
    }

    if (trip.userId === user.uid) {
      toast.info('This is your own trip! You cannot contact yourself.');
      return;
    }

    // Navigate to matches page to handle the connection
    router.push('/matches');
    toast.info('Check the "Find Matches" tab to connect with this traveler.');
  }, [user, toast, router]);

  if (loading) {
    return <ComponentLoading text="Chargement des voyages..." />;
  }

  return (
    <div>
      {/* Search Filters */}
      <SearchFilters
        filters={filters}
        onFiltersChange={setFilters}
        type="trips"
        disabled={loading || isSearching}
      />

      {/* Results Summary */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem',
        padding: '0 0.5rem'
      }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {isSearching ? (
            'Searching...'
          ) : (
            <>
              Showing {resultCount} of {totalCount} trips
              {hasActiveFilters && ' (filtered)'}
            </>
          )}
        </div>
        
        {trips.length > 0 && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {trips.length} result{trips.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Trips List or Empty State */}
      {trips.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'var(--surface)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 1.5rem',
            border: '2px solid var(--border-light)'
          }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              background: 'var(--primary)', 
              borderRadius: '50%', 
              opacity: '0.2'
            }}></div>
          </div>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '1.125rem', 
            fontWeight: '500', 
            marginBottom: '0.5rem'
          }}>
            {hasActiveFilters ? 'No trips match your search' : 'No trips available'}
          </p>
          <p style={{ 
            color: 'var(--text-muted)', 
            fontSize: '0.875rem'
          }}>
            {hasActiveFilters ? 'Try adjusting your search filters' : 'Travelers can post their upcoming trips here'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {trips.map((trip) => (
        <div key={trip.id} className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                fontWeight: '600', 
                fontSize: '1.125rem', 
                color: 'var(--text-primary)', 
                marginBottom: '0.5rem'
              }}>
                {trip.from} → {trip.to}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  background: 'var(--surface)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border-light)'
                }}>
                  {trip.departureDate.toLocaleDateString()} - {trip.arrivalDate.toLocaleDateString()}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ 
                fontSize: '0.875rem', 
                color: 'var(--text-muted)', 
                marginBottom: '0.25rem'
              }}>Capacity</p>
              <p style={{ 
                fontWeight: '600', 
                color: 'var(--primary)', 
                fontSize: '1.125rem'
              }}>{trip.capacity}kg</p>
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)', 
              marginBottom: '0.5rem', 
              fontWeight: '500'
            }}>Allowed items:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {trip.allowedItems.map((item, index) => (
                <span
                  key={index}
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '0.75rem',
                    borderRadius: '1rem',
                    fontWeight: '500'
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          
          {trip.description && (
            <p style={{ 
              color: 'var(--text-secondary)', 
              marginBottom: '1rem', 
              background: 'var(--surface)', 
              padding: '0.75rem', 
              borderRadius: '0.5rem', 
              fontStyle: 'italic',
              fontSize: '0.875rem'
            }}>
              "{trip.description}"
            </p>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)'
            }}>
              Posted {trip.createdAt.toLocaleDateString()}
            </span>
            <button 
              onClick={() => handleContactTraveler(trip)}
              className="btn btn-primary"
              style={{ fontSize: '0.875rem' }}
            >
              Contact Traveler
            </button>
          </div>
        </div>
      ))}
        </div>
      )}
    </div>
  );
}

export default memo(TripsList);