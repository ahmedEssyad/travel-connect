'use client';

import { useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import { Request } from '@/types';
import { ComponentLoading } from '@/components/Common/Loading';
import SearchFilters from '@/components/Common/SearchFilters';
import { useSearch } from '@/hooks/useSearch';

function RequestsList() {
  const router = useRouter();
  const { user } = useAuth();
  const { requests: allRequests, loading } = useData();
  const toast = useToast();

  // Use search hook for filtering and search functionality
  const { 
    filters, 
    setFilters, 
    filteredData: requests, 
    resultCount, 
    totalCount, 
    hasActiveFilters,
    isSearching 
  } = useSearch({ 
    data: allRequests, 
    type: 'requests', 
    userId: user?.uid 
  });

  const handleOfferToDeliver = useCallback((request: Request) => {
    if (!user) {
      toast.error('Please log in to offer delivery services.');
      router.push('/login');
      return;
    }

    if (request.userId === user.uid) {
      toast.info('This is your own request! You cannot deliver for yourself.');
      return;
    }

    // Navigate to matches page to handle the connection
    router.push('/matches');
    toast.info('Check the "Find Matches" tab to connect with this request.');
  }, [user, toast, router]);

  if (loading) {
    return <ComponentLoading text="Chargement des demandes..." />;
  }

  return (
    <div>
      {/* Search Filters */}
      <SearchFilters
        filters={filters}
        onFiltersChange={setFilters}
        type="requests"
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
              Showing {resultCount} of {totalCount} requests
              {hasActiveFilters && ' (filtered)'}
            </>
          )}
        </div>
        
        {requests.length > 0 && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {requests.length} result{requests.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Requests List or Empty State */}
      {requests.length === 0 ? (
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
              background: 'var(--accent)', 
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
            {hasActiveFilters ? 'No requests match your search' : 'No delivery requests'}
          </p>
          <p style={{ 
            color: 'var(--text-muted)', 
            fontSize: '0.875rem'
          }}>
            {hasActiveFilters ? 'Try adjusting your search filters' : 'People can post items they need delivered here'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {requests.map((request) => (
        <div key={request.id} className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                fontWeight: '600', 
                fontSize: '1.125rem', 
                color: 'var(--text-primary)', 
                marginBottom: '0.5rem'
              }}>
                {request.from} → {request.to}
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
                  Deadline: {request.deadline.toLocaleDateString()}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ 
                fontSize: '0.875rem', 
                color: 'var(--text-muted)', 
                marginBottom: '0.25rem'
              }}>Item Type</p>
              <p style={{ 
                fontWeight: '600', 
                color: 'var(--accent)', 
                fontSize: '1.125rem'
              }}>{request.itemType}</p>
            </div>
          </div>
          
          {request.description && (
            <p style={{ 
              color: 'var(--text-secondary)', 
              marginBottom: '1rem', 
              background: 'var(--surface)', 
              padding: '0.75rem', 
              borderRadius: '0.5rem', 
              fontStyle: 'italic',
              fontSize: '0.875rem'
            }}>
              "{request.description}"
            </p>
          )}
          
          {request.reward && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ 
                fontSize: '0.875rem', 
                color: 'var(--text-secondary)', 
                marginBottom: '0.25rem', 
                fontWeight: '500'
              }}>Reward offered:</p>
              <p style={{ 
                color: 'var(--success)', 
                fontWeight: '600', 
                background: 'rgba(5, 150, 105, 0.1)', 
                padding: '0.5rem 0.75rem', 
                borderRadius: '0.5rem', 
                display: 'inline-block',
                fontSize: '0.875rem'
              }}>
                {request.reward}
              </p>
            </div>
          )}
          
          {request.photo && (
            <div style={{ marginBottom: '1rem' }}>
              <img
                src={request.photo}
                alt="Item photo"
                style={{ 
                  width: '100%', 
                  maxWidth: '300px', 
                  borderRadius: '0.5rem', 
                  border: '1px solid var(--border-light)'
                }}
              />
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)'
            }}>
              Posted {request.createdAt.toLocaleDateString()}
            </span>
            <button 
              onClick={() => handleOfferToDeliver(request)}
              className="btn"
              style={{ 
                background: 'var(--success)',
                color: 'white',
                fontSize: '0.875rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--success)';
                e.currentTarget.style.filter = 'brightness(0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--success)';
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              Offer to Deliver
            </button>
          </div>
        </div>
      ))}
        </div>
      )}
    </div>
  );
}

export default memo(RequestsList);