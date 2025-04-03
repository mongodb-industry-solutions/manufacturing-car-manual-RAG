'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { H1, H2, Body, Subtitle } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import Banner from '@leafygreen-ui/banner';
import { ParagraphSkeleton } from '@leafygreen-ui/skeleton-loader';
import { spacing } from '@leafygreen-ui/tokens';
import Button from '@leafygreen-ui/button';
import Icon from '@leafygreen-ui/icon';
import Tabs from '@leafygreen-ui/tabs';

import dynamic from 'next/dynamic';
const SearchInput = dynamic(() => import('@/components/search/SearchInput'));
const SearchMethodSelector = dynamic(() => import('@/components/search/SearchMethodSelector'));
const SearchResultList = dynamic(() => import('@/components/search/SearchResultList'));
const MainLayout = dynamic(() => import('@/components/layout/MainLayout'));
const LoadingState = dynamic(() => import('@/components/common/LoadingState'));
const ErrorState = dynamic(() => import('@/components/common/ErrorState'));

import { useSearch } from '@/hooks/useSearch';
import { SearchMethod, HybridMethod } from '@/types/Search';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q');
  const methodParam = searchParams.get('method');
  const modeParam = searchParams.get('mode');
  
  // State
  const [query, setQuery] = useState('');
  const [searchMethod, setSearchMethod] = useState<SearchMethod>('hybrid');
  const [rrf_k] = useState(60); // Fixed RRF k parameter
  const [activeTab] = useState<'search'>('search');
  
  // Custom hooks
  const { search, loading, error, results } = useSearch();
  
  // Handle initial URL params only once on mount
  useEffect(() => {
    // Set initial state from URL
    if (queryParam) {
      setQuery(queryParam);
    }
    
    if (methodParam && ['vector', 'text', 'hybrid'].includes(methodParam)) {
      setSearchMethod(methodParam as SearchMethod);
    }
    
    // Perform search only if query exists
    if (queryParam && queryParam.trim()) {
      const method = methodParam && ['vector', 'text', 'hybrid'].includes(methodParam) 
        ? (methodParam as SearchMethod) 
        : 'hybrid';
        
      // Use a slight delay to ensure state is updated
      setTimeout(() => {
        performSearch(queryParam, method);
      }, 10);
    }
    // Empty dependency array means this only runs once on mount
  }, []);
  
  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    params.set('method', searchMethod);
    
    // Update URL without causing a navigation/reload
    window.history.pushState({}, '', `/search?${params.toString()}`);
  };
  
  const performSearch = async (searchQuery: string = query, explicitMethod?: SearchMethod) => {
    if (!searchQuery.trim()) return;
    
    try {
      // Use explicitly provided method if available, otherwise use state
      const methodToUse = explicitMethod || searchMethod;
      
      console.log(`Performing search with method: ${methodToUse}`);
      
      if (methodToUse === 'hybrid') {
        await search('hybrid', searchQuery, 10, {
          rrf_k: rrf_k
        });
      } else {
        await search(methodToUse, searchQuery, 10);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  };
  
  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    performSearch(newQuery, searchMethod);
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', newQuery);
    router.push(`/search?${params.toString()}`);
  };
  
  const handleMethodChange = (method: SearchMethod) => {
    console.log(`Method changed to: ${method}`);
    setSearchMethod(method);
    
    // If we have a query, perform the search with the new method
    if (query.trim()) {
      // Use the explicitly provided method to avoid race conditions with state updates
      performSearch(query, method);
      
      // Update URL
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      params.set('method', method);
      window.history.pushState({}, '', `/search?${params.toString()}`);
    }
  };
  
  
  return (
    <MainLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing[3] }}>
        <H1 style={{ marginBottom: spacing[3] }}>Car Manual Search</H1>
        
        {/* Search input */}
        <Card style={{ padding: spacing[3], marginBottom: spacing[3] }}>
          <SearchInput 
            onSearch={handleSearch} 
            initialValue={query}
            loading={loading}
          />
        </Card>
        
        {/* Search Mode header */}
        <div style={{ 
          marginBottom: spacing[3],
          display: 'flex',
          gap: spacing[2],
          borderBottom: '1px solid #E1E1E1',
          paddingBottom: spacing[2]
        }}>
          <Button 
            leftGlyph={<Icon glyph="MagnifyingGlass" />}
            variant="primary"
          >
            Search Manual
          </Button>
        </div>
        
        {/* Search Results */}
          <div style={{ 
            display: 'flex', 
            gap: spacing[3],
            flexDirection: 'row',
            '@media (max-width: 768px)': {
              flexDirection: 'column',
            }
          }}>
            {/* Left column - search options */}
            <div style={{ 
              width: '300px',
              '@media (max-width: 768px)': {
                width: '100%',
              }
            }}>
              <Card style={{ padding: spacing[3], marginBottom: spacing[3] }}>
                <SearchMethodSelector 
                  selectedMethod={searchMethod}
                  onChange={handleMethodChange}
                />
                
              </Card>
            </div>
            
            {/* Right column - search results */}
            <div style={{ 
              flexGrow: 1,
              '@media (max-width: 768px)': {
                width: '100%',
              }
            }}>
              {/* Error state */}
              {error && (
                <ErrorState 
                  title="Search Error"
                  message={error}
                />
              )}
              
              {/* Loading state */}
              {loading && (
                <LoadingState message="Searching the car manual..." />
              )}
              
              {/* Results state */}
              {!loading && results && (
                <>
                  <Card style={{ padding: spacing[3], marginBottom: spacing[3] }}>
                    <Subtitle>
                      Found {results.total} results for &quot;{results.query}&quot; using {results.method} search
                    </Subtitle>
                  </Card>
                  
                  <SearchResultList 
                    results={results.results}
                    highlight={query}
                  />
                </>
              )}
              
              {/* Empty initial state (no search performed yet) */}
              {!loading && !results && !error && (
                <Card style={{ padding: spacing[3], textAlign: 'center' }}>
                  <Body>Enter a search term to find results in the car manual</Body>
                </Card>
              )}
            </div>
          </div>
        
      </div>
    </MainLayout>
  );
}