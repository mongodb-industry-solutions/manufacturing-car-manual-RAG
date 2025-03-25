'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { H1, Body } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import Banner from '@leafygreen-ui/banner';
import { ParagraphSkeleton } from '@leafygreen-ui/skeleton-loader';
import { spacing } from '@leafygreen-ui/tokens';

import dynamic from 'next/dynamic';
const SearchInput = dynamic(() => import('@/components/search/SearchInput'));
const SearchMethodSelector = dynamic(() => import('@/components/search/SearchMethodSelector'));
const WeightSlider = dynamic(() => import('@/components/search/WeightSlider'));
const SearchResultList = dynamic(() => import('@/components/search/SearchResultList'));
import { useSearch } from '@/hooks/useSearch';
import { SearchMethod, HybridMethod } from '@/types/Search';
const MainLayout = dynamic(() => import('@/components/layout/MainLayout'));

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q');
  const methodParam = searchParams.get('method');
  
  // State
  const [query, setQuery] = useState('');
  const [searchMethod, setSearchMethod] = useState<SearchMethod>('hybrid');
  const [hybridMethod, setHybridMethod] = useState<HybridMethod>('weighted');
  const [vectorWeight, setVectorWeight] = useState(0.7);
  const [textWeight, setTextWeight] = useState(0.3);
  
  // Custom hooks
  const { search, loading, error, results } = useSearch();
  
  // Handle URL params
  useEffect(() => {
    if (queryParam) {
      setQuery(queryParam);
      
      // If we have a query, perform the search
      if (queryParam.trim()) {
        performSearch(queryParam);
      }
    }
    
    if (methodParam && ['vector', 'text', 'hybrid'].includes(methodParam)) {
      setSearchMethod(methodParam as SearchMethod);
    }
  }, [queryParam, methodParam]);
  
  // Update URL when search parameters change
  useEffect(() => {
    if (query) {
      updateSearchParams();
    }
  }, [searchMethod]);
  
  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    params.set('method', searchMethod);
    
    // Update URL without causing a navigation/reload
    window.history.pushState({}, '', `/search?${params.toString()}`);
  };
  
  const performSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    
    try {
      if (searchMethod === 'hybrid') {
        await search('hybrid', searchQuery, 10, {
          method: hybridMethod,
          vector_weight: vectorWeight,
          text_weight: textWeight
        });
      } else {
        await search(searchMethod, searchQuery, 10);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  };
  
  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    performSearch(newQuery);
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', newQuery);
    router.push(`/search?${params.toString()}`);
  };
  
  const handleMethodChange = (method: SearchMethod) => {
    setSearchMethod(method);
    
    // If we have a query, perform the search with the new method
    if (query.trim()) {
      setTimeout(() => performSearch(), 0);
    }
  };
  
  const handleWeightChange = (newVectorWeight: number, newTextWeight: number) => {
    setVectorWeight(newVectorWeight);
    setTextWeight(newTextWeight);
    
    // If we have a query, perform the search with the new weights
    if (query.trim() && searchMethod === 'hybrid') {
      setTimeout(() => performSearch(), 0);
    }
  };
  
  return (
    <MainLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing[3] }}>
        <H1 style={{ marginBottom: spacing[3] }}>Car Manual Search</H1>
        
        <Card style={{ padding: spacing[3], marginBottom: spacing[3] }}>
          <SearchInput 
            onSearch={handleSearch} 
            initialValue={query}
            loading={loading}
          />
        </Card>
        
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
              
              {searchMethod === 'hybrid' && (
                <WeightSlider 
                  vectorWeight={vectorWeight}
                  onWeightChange={handleWeightChange}
                />
              )}
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
              <Banner variant="danger">
                An error occurred: {error}
              </Banner>
            )}
            
            {/* Loading state */}
            {loading && (
              <>
                <ParagraphSkeleton />
                <ParagraphSkeleton />
                <ParagraphSkeleton />
              </>
            )}
            
            {/* Results state */}
            {!loading && results && (
              <>
                <Body style={{ marginBottom: spacing[2] }}>
                  Found {results.total} results for &quot;{results.query}&quot; using {results.method} search
                </Body>
                
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