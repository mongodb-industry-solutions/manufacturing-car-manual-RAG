'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
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
const QueryVisualizationPanel = dynamic(() => import('@/components/content/QueryVisualizationPanel'));

import { useSearch } from '@/hooks/useSearch';
import { SearchMethod, HybridMethod, GraphExpansionMethod } from '@/types/Search';

// Client Component that uses searchParams
function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q');
  const methodParam = searchParams.get('method');
  const expansionParam = searchParams.get('expansion');
  
  // State - derived from URL params
  const [query, setQuery] = useState('');
  const [searchMethod, setSearchMethod] = useState<SearchMethod>('text'); // Default to keyword (text) search
  const [activeTab] = useState<'search'>('search');
  const [searchPlaceholder, setSearchPlaceholder] = useState('How do I change a flat tire?');
  
  // GraphRAG-specific state - derived from URL params
  const [expansionMethod, setExpansionMethod] = useState<GraphExpansionMethod>('vector_to_graph');
  
  // Custom hooks
  const { search, loading, error, results, clearCache } = useSearch();
  
  // Handle search based on URL parameters - URL is the single source of truth
  useEffect(() => {
    // Skip if no query parameter is present
    if (!queryParam) {
      return;
    }

    // Update local state from URL params
    setQuery(queryParam);
    
    // Determine method to use for search
    const method = (methodParam && ['vector', 'text', 'hybrid', 'graph'].includes(methodParam) 
      ? methodParam 
      : 'text') as SearchMethod;
    
    setSearchMethod(method);
    
    // For graph searches, read expansion method from URL
    let expansion: GraphExpansionMethod = 'vector_to_graph';
    if (method === 'graph') {
      if (expansionParam && ['vector_to_graph', 'graph_to_vector'].includes(expansionParam)) {
        expansion = expansionParam as GraphExpansionMethod;
      }
      setExpansionMethod(expansion);
    }
    
    // Save URL to sessionStorage for navigation tracking
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('car_manual_previous_search_url', window.location.href);
      sessionStorage.setItem('car_manual_referrer_type', 'search');
    }
    
    // Execute search with appropriate limit
    const resultLimit = method === 'graph' ? 30 : 10;
    search(method, queryParam, resultLimit, expansion);
    
  // Dependencies: Only URL params - React will automatically skip if they haven't changed
  }, [queryParam, methodParam, expansionParam, search]);
  
  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    params.set('method', searchMethod);
    
    // Add expansion method for graph searches
    if (searchMethod === 'graph') {
      params.set('expansion', expansionMethod);
    }
    
    // Update URL without causing a navigation/reload
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/search?${params.toString()}`);
    }
  };
  
  // This is a helper function to create URLs only, not for performing searches directly
  // We use this for constructing URLs for router.push() calls
  const performSearch = (searchQuery: string = query, explicitMethod?: SearchMethod) => {
    if (!searchQuery.trim()) return '';
    
    // Use explicitly provided method if available, otherwise use state
    const methodToUse = explicitMethod || searchMethod;
    
    // Create URL params
    const params = new URLSearchParams();
    params.set('q', searchQuery);
    params.set('method', methodToUse);
    
    // Add expansion method for graph searches
    if (methodToUse === 'graph') {
      params.set('expansion', expansionMethod);
    }
    
    return `/search?${params.toString()}`;
  };
  
  const handleSearch = (newQuery: string) => {
    if (!newQuery.trim()) return;
    
    // Update local state
    setQuery(newQuery);
    setSearchPlaceholder(newQuery); // Update placeholder to match current query
    
    // Get the search URL
    const searchUrl = performSearch(newQuery, searchMethod);
    
    // Save to sessionStorage before navigation
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('car_manual_previous_search_url', searchUrl);
      sessionStorage.setItem('car_manual_referrer_type', 'search');
    }
    
    // Use router.push for client-side navigation - this will trigger a re-render
    // which will then call the useEffect, which performs the search
    router.push(searchUrl);
  };
  
  const handleMethodChange = (method: SearchMethod) => {
    console.log(`Method changed to: ${method}`);
    
    // Only update the URL if we have a query
    if (query.trim()) {
      // Get the search URL with the new method
      const searchUrl = performSearch(query, method);
      
      // Save to sessionStorage before navigation
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('car_manual_previous_search_url', searchUrl);
        sessionStorage.setItem('car_manual_referrer_type', 'search');
      }
      
      // Use router.push to navigate, which will trigger useEffect to perform the search
      router.push(searchUrl);
    } else {
      // If no query, just update the state without navigation
      setSearchMethod(method);
    }
  };
  
  const handleExpansionMethodChange = (expansion: GraphExpansionMethod) => {
    console.log(`Expansion method changed to: ${expansion}`);
    
    // Update state first
    setExpansionMethod(expansion);
    
    // Only update the URL and re-search if we have a query and we're in graph mode
    if (query.trim() && searchMethod === 'graph') {
      const params = new URLSearchParams();
      params.set('q', query);
      params.set('method', 'graph');
      params.set('expansion', expansion);
      
      const searchUrl = `/search?${params.toString()}`;
      
      // Save to sessionStorage before navigation
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('car_manual_previous_search_url', searchUrl);
        sessionStorage.setItem('car_manual_referrer_type', 'search');
      }
      
      // Use router.push to navigate, which will trigger useEffect to perform the search
      router.push(searchUrl);
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
          </div>
        </div>

        {/* GraphRAG Search Suggestions */}
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
              Relationship-Aware Queries (GraphRAG Search)
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
              variant="dangerOutline"
              onClick={() => handleSearch("tire replacement steps")}
              leftGlyph={<Icon glyph="Relationship" size="small" />}
            >
              Tire replacement steps
            </Button>
            
            <Button 
              size="small" 
              variant="dangerOutline"
              onClick={() => handleSearch("engine oil maintenance")}
              leftGlyph={<Icon glyph="Relationship" size="small" />}
            >
              Engine oil maintenance
            </Button>
            
            <Button 
              size="small" 
              variant="dangerOutline"
              onClick={() => handleSearch("brake system components")}
              leftGlyph={<Icon glyph="Relationship" size="small" />}
            >
              Brake system components
            </Button>
            
            <Button 
              size="small" 
              variant="dangerOutline"
              onClick={() => handleSearch("electrical system troubleshooting")}
              leftGlyph={<Icon glyph="Relationship" size="small" />}
            >
              Electrical system troubleshooting
            </Button>
            
            <Button 
              size="small" 
              variant="dangerOutline"
              onClick={() => handleSearch("transmission fluid check")}
              leftGlyph={<Icon glyph="Relationship" size="small" />}
            >
              Transmission fluid check
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
                  selectedExpansionMethod={expansionMethod}
                  onExpansionMethodChange={handleExpansionMethodChange}
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
                  
                  {/* MongoDB Query Visualization Panel */}
                  <QueryVisualizationPanel
                    searchMethod={results.method as SearchMethod}
                    query={results.query}
                    debugInfo={results.debug_info}
                    expansionMethod={expansionMethod}
                  />
                  
                  <SearchResultList 
                    results={results.results}
                    highlight={query}
                    query={query}
                    searchMethod={results.method}
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