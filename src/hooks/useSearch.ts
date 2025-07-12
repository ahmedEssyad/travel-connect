'use client';

import { useState, useEffect, useMemo } from 'react';
import { SearchFilters } from '@/components/Common/SearchFilters';
import { Trip, Request } from '@/types';

interface UseSearchProps<T> {
  data: T[];
  type: 'trips' | 'requests';
  userId?: string;
}

export function useSearch<T extends Trip | Request>({ data, type, userId }: UseSearchProps<T>) {
  const [filters, setFilters] = useState<SearchFilters>({
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

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.search]);

  // Filter and search logic
  const filteredData = useMemo(() => {
    let filtered = data;

    // Exclude current user's items (existing logic)
    if (userId) {
      filtered = filtered.filter(item => item.userId !== userId);
    }

    // Text search in locations and descriptions
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(item => 
        item.from.toLowerCase().includes(searchLower) ||
        item.to.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower))
      );
    }

    // Location filters
    if (filters.from) {
      const fromLower = filters.from.toLowerCase();
      filtered = filtered.filter(item => 
        item.from.toLowerCase().includes(fromLower)
      );
    }

    if (filters.to) {
      const toLower = filters.to.toLowerCase();
      filtered = filtered.filter(item => 
        item.to.toLowerCase().includes(toLower)
      );
    }

    // Date filters
    if (type === 'trips') {
      const trips = filtered as Trip[];
      
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        filtered = trips.filter(trip => 
          new Date(trip.departureDate) >= fromDate
        ) as T[];
      }

      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        filtered = trips.filter(trip => 
          new Date(trip.departureDate) <= toDate
        ) as T[];
      }

      // Trip type filter
      if (filters.tripType) {
        filtered = trips.filter(trip => 
          trip.tripType === filters.tripType
        ) as T[];
      }

      // Capacity filters for car sharing
      if (filters.tripType === 'car_sharing' || !filters.tripType) {
        filtered = trips.filter(trip => {
          if (trip.tripType !== 'car_sharing') return filters.tripType !== 'car_sharing';
          return trip.capacity >= filters.minCapacity && 
                 trip.capacity <= filters.maxCapacity;
        }) as T[];
      }

      // Item type filter for delivery service
      if (filters.itemType && (filters.tripType === 'delivery_service' || !filters.tripType)) {
        filtered = trips.filter(trip => {
          if (trip.tripType !== 'delivery_service') return false;
          return trip.allowedItems && trip.allowedItems.includes(filters.itemType);
        }) as T[];
      }
    } else {
      const requests = filtered as Request[];
      
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        filtered = requests.filter(request => 
          new Date(request.deadline) >= fromDate
        ) as T[];
      }

      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        filtered = requests.filter(request => 
          new Date(request.deadline) <= toDate
        ) as T[];
      }

      // Request type filter
      if (filters.requestType) {
        filtered = requests.filter(request => 
          request.requestType === filters.requestType
        ) as T[];
      }

      // Item type filter for delivery requests
      if (filters.itemType && (filters.requestType === 'delivery_request' || !filters.requestType)) {
        filtered = requests.filter(request => {
          if (request.requestType !== 'delivery_request') return false;
          return request.itemType === filters.itemType;
        }) as T[];
      }
    }

    return filtered;
  }, [data, userId, debouncedSearch, filters, type]);

  // Get search result count
  const resultCount = filteredData.length;
  const totalCount = data.filter(item => userId ? item.userId !== userId : true).length;

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.search || filters.from || filters.to || filters.dateFrom || 
           filters.dateTo || filters.itemType || filters.tripType || filters.requestType ||
           filters.minCapacity > 1 || filters.maxCapacity < (type === 'trips' ? 8 : 50);
  }, [filters, type]);

  return {
    filters,
    setFilters,
    filteredData,
    resultCount,
    totalCount,
    hasActiveFilters,
    isSearching: debouncedSearch !== filters.search
  };
}