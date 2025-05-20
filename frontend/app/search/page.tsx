'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MyH1 as H1, MyH2 as H2, MyBody as Body, MySubtitle as Subtitle } from '@/components/ui/TypographyWrapper';
import { MyCard as Card } from '@/components/ui/TypographyWrapper';
import Banner from '@leafygreen-ui/banner';
import { ParagraphSkeleton } from '@leafygreen-ui/skeleton-loader';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
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
  const [searchMethod, setSearchMethod] = useState<SearchMethod>('text'); // Default to keyword (text) search
  const [rrf_k, setRrf_k] = useState(60); // RRF k parameter with slider control
  const [activeTab] = useState<'search'>('search');
  const [searchPlaceholder, setSearchPlaceholder] = useState('How do I change a flat tire?');
  
  // Custom hooks
  const { search, loading, error, results, clearCache } = useSearch();
  
  // Handle initial URL params only once on mount
  useEffect(() => {
    // Set initial state from URL
    if (queryParam) {
      setQuery(queryParam);
    }
    
    if (methodParam && ['vector', 'text', 'hybrid'].includes(methodParam)) {
      setSearchMethod(methodParam as SearchMethod);
    }
    
    // Check if we have results already (from cache restoration in useSearch hook)
    // Only perform the search if we don't have results yet
    if (queryParam && queryParam.trim() && !results) {
      const method = methodParam && ['vector', 'text', 'hybrid'].includes(methodParam) 
        ? (methodParam as SearchMethod) 
        : 'hybrid';
      
      // Use a slight delay to ensure state is updated
      setTimeout(() => {
        console.log('Performing initial search from URL params');
        performSearch(queryParam, method);
      }, 10);
    } else if (results) {
      console.log('Using cached results, no need to search again');
    }
    
    // Save in sessionStorage that we're on the search page with active results
    if (typeof window !== 'undefined' && queryParam) {
      sessionStorage.setItem('car_manual_previous_search_url', window.location.href);
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
      
      // Include rrf_k in URL for hybrid searches
      if (method === 'hybrid') {
        params.set('krf', rrf_k.toString());
      }
      
      window.history.pushState({}, '', `/search?${params.toString()}`);
    }
  };
  
  // Handle RRF k-value change
  const handleRrfKChange = (value: number) => {
    setRrf_k(value);
    console.log(`RRF k-value changed to: ${value}`);
    
    // If we have a query and we're using hybrid search, perform the search with the new k-value
    if (query.trim() && searchMethod === 'hybrid') {
      performSearch(query);
      
      // Update URL with new k-value
      const params = new URLSearchParams(window.location.search);
      params.set('krf', value.toString());
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
        
        
        {/* Keyword Search Suggestions */}
        <div style={{ marginBottom: spacing[2] }}>
          <div style={{ 
            marginBottom: spacing[1],
            paddingLeft: spacing[1]
          }}>
            <span style={{ 
              fontWeight: 'bold', 
              fontSize: '14px',
              color: palette.gray.dark2 
            }}>
              Popular Topics (Keyword Search)
            </span>
          </div>
          
          <div style={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: spacing[2],
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
        </div>
        
        {/* Natural Language Search Suggestions */}
        <div style={{ 
          marginBottom: spacing[3],
          borderBottom: '1px solid #E1E1E1',
          paddingBottom: spacing[2]
        }}>
          <div style={{ 
            marginBottom: spacing[1],
            paddingLeft: spacing[1]
          }}>
            <span style={{ 
              fontWeight: 'bold', 
              fontSize: '14px',
              color: palette.gray.dark2 
            }}>
              Natural Language Queries (Vector Search)
            </span>
          </div>
          
          <div style={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: spacing[2],
            paddingBottom: spacing[2]
          }}>
            <Button 
              size="small"
              variant="default"
              onClick={() => handleSearch("What should I do if my car won't start on a cold morning?")}
              leftGlyph={<Icon glyph="Bulb" size="small" />}
            >
              Car won't start on cold morning
            </Button>
            
            <Button 
              size="small" 
              variant="default"
              onClick={() => handleSearch("How can I improve my car's fuel efficiency?")}
              leftGlyph={<Icon glyph="Bulb" size="small" />}
            >
              Improve fuel efficiency
            </Button>
            
            <Button 
              size="small" 
              variant="default"
              onClick={() => handleSearch("What's the best way to clean the interior of my car?")}
              leftGlyph={<Icon glyph="Bulb" size="small" />}
            >
              Best way to clean interior
            </Button>
            
            <Button 
              size="small" 
              variant="default"
              onClick={() => handleSearch("What noise indicates a problem with the transmission?")}
              leftGlyph={<Icon glyph="Bulb" size="small" />}
            >
              Noise indicating transmission problem
            </Button>
            
            <Button 
              size="small" 
              variant="default"
              onClick={() => handleSearch("How do I know when it's time to replace my brakes?")}
              leftGlyph={<Icon glyph="Bulb" size="small" />}
            >
              When to replace brakes
            </Button>
            
            <Button 
              size="small" 
              variant="default"
              onClick={() => handleSearch("Why does my steering wheel shake when I brake?")}
              leftGlyph={<Icon glyph="Bulb" size="small" />}
            >
              Steering wheel shakes during braking
            </Button>
            
            <Button 
              size="small" 
              variant="default"
              onClick={() => handleSearch("What causes my car to pull to one side when driving?")}
              leftGlyph={<Icon glyph="Bulb" size="small" />}
            >
              Car pulls to one side
            </Button>
            
            <Button 
              size="small" 
              variant="default"
              onClick={() => handleSearch("How do driving habits affect my car's lifespan?")}
              leftGlyph={<Icon glyph="Bulb" size="small" />}
            >
              Driving habits impact on car lifespan
            </Button>
            
            <Button 
              size="small" 
              variant="default"
              onClick={() => handleSearch("What maintenance should I do before a long road trip?")}
              leftGlyph={<Icon glyph="Bulb" size="small" />}
            >
              Maintenance before road trip
            </Button>
          </div>
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
                  rrf_k={rrf_k}
                  onRrfKChange={handleRrfKChange}
                />
                
                {/* Advanced options */}
                <div style={{ marginTop: spacing[3], borderTop: '1px solid #eee', paddingTop: spacing[3] }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: spacing[2] }}>Advanced</div>
                  <Button
                    size="small"
                    variant="danger"
                    onClick={() => {
                      clearCache();
                      // If we have a query, re-run the search to refresh results
                      if (query) {
                        performSearch(query, searchMethod);
                      }
                    }}
                    leftGlyph={<Icon glyph="Refresh" />}
                  >
                    Clear Search Cache
                  </Button>
                </div>
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