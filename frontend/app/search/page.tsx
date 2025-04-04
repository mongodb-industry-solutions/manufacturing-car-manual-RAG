'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MyH1 as H1, MyH2 as H2, MyBody as Body, MySubtitle as Subtitle } from '@/components/ui/TypographyWrapper';
import { MyCard as Card } from '@/components/ui/TypographyWrapper';
import Banner from '@leafygreen-ui/banner';
import { ParagraphSkeleton } from '@leafygreen-ui/skeleton-loader';
import { spacing } from '@leafygreen-ui/tokens';
import { MyButton as Button } from '@/components/ui/TypographyWrapper';
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

// Client Component that uses searchParams
function SearchPageContent() {
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
  const [searchPlaceholder, setSearchPlaceholder] = useState('How do I change a flat tire?');
  
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
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/search?${params.toString()}`);
    }
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
    setSearchPlaceholder(newQuery); // Update placeholder to match current query
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
            placeholder={searchPlaceholder}
          />
        </Card>
        
        
        {/* Search Suggestions */}
        <div style={{ 
          marginBottom: spacing[3],
          display: 'flex',
          flexWrap: 'wrap',
          gap: spacing[2],
          borderBottom: '1px solid #E1E1E1',
          paddingBottom: spacing[2]
        }}>
          
          <Button 
            size="small"
            variant="primaryOutline"
            onClick={() => handleSearch("Oil change procedure")}
            leftGlyph={<Icon glyph="Wrench" size="small" />}
          >
            Oil change procedure
          </Button>
          
          <Button 
            size="small" 
            variant="primaryOutline"
            onClick={() => handleSearch("Check engine light")}
            leftGlyph={<Icon glyph="Warning" size="small" />}
          >
            Check engine light
          </Button>
          
          <Button 
            size="small" 
            variant="primaryOutline"
            onClick={() => handleSearch("Tire pressure")}
            leftGlyph={<Icon glyph="Plus" size="small" />}
          >
            Tire pressure
          </Button>
          
          <Button 
            size="small" 
            variant="primaryOutline"
            onClick={() => handleSearch("Battery replacement")}
            leftGlyph={<Icon glyph="LightningBolt" size="small" />}
          >
            Battery replacement
          </Button>
          
          <Button 
            size="small" 
            variant="primaryOutline"
            onClick={() => handleSearch("Brake maintenance")}
            leftGlyph={<Icon glyph="Settings" size="small" />}
          >
            Brake maintenance
          </Button>
        </div>
        
        {/* Search Results */}
          <div style={{ 
            display: 'flex', 
            gap: spacing[3],
            flexDirection: 'row'
          }}>
            {/* Left column - search options */}
            <div style={{ 
              width: '300px'
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
              flexGrow: 1
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
                      Found {results.total} results for &quot;{results.query}&quot; using MongoDB Atlas {results.method} search
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

// Main page component that wraps the client component in a Suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading search page..." />}>
      <SearchPageContent />
    </Suspense>
  );
}