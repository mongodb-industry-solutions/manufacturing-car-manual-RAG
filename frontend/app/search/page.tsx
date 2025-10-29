'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { H1, H2, Body, Subtitle } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import Banner from '@leafygreen-ui/banner';
import { ParagraphSkeleton } from '@leafygreen-ui/skeleton-loader';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import Button from '@leafygreen-ui/button';
import Icon from '@leafygreen-ui/icon';
import Tabs from '@leafygreen-ui/tabs';
import Badge from '@leafygreen-ui/badge';
import { CARD_STYLES } from '@/lib/styleConstants';

import dynamic from 'next/dynamic';
const SearchInput = dynamic(() => import('@/components/search/SearchInput'));
const SearchMethodSelector = dynamic(() => import('@/components/search/SearchMethodSelector'));
const SearchResultList = dynamic(() => import('@/components/search/SearchResultList'));
const MainLayout = dynamic(() => import('@/components/layout/MainLayout'));
const LoadingState = dynamic(() => import('@/components/common/LoadingState'));
const ErrorState = dynamic(() => import('@/components/common/ErrorState'));
const QueryVisualizationPanel = dynamic(() => import('@/components/content/QueryVisualizationPanel'));
const MultimodalSearchInput = dynamic(() => import('@/components/search/MultimodalSearchInput'));
const MultimodalSearchResults = dynamic(() => import('@/components/search/MultimodalSearchResults'));
import { RerankingSummary } from '@/components/search/PositionIndicator';

import { useSearch } from '@/hooks/useSearch';
import { SearchMethod, HybridMethod, MultimodalSearchResponse } from '@/types/Search';
import { searchService } from '@/services/searchService';

// Client Component that uses searchParams
function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q');
  const methodParam = searchParams.get('method');
  
  // State - derived from URL params
  const [query, setQuery] = useState('');
  const [searchMethod, setSearchMethod] = useState<SearchMethod>('text'); // Default to keyword (text) search
  const [activeTab] = useState<'search'>('search');
  const [searchPlaceholder, setSearchPlaceholder] = useState('How do I change a flat tire?');
  
  // Reranker state - not persisted (resets on page reload)
  const [useReranker, setUseReranker] = useState(false);
  
  // Multimodal search state
  const [multimodalResults, setMultimodalResults] = useState<MultimodalSearchResponse | null>(null);
  const [multimodalLoading, setMultimodalLoading] = useState(false);
  const [multimodalError, setMultimodalError] = useState<string | null>(null);
  const [multimodalTextQuery, setMultimodalTextQuery] = useState('');
  
  // Custom hooks
  const { search, searchRef, loading, error, results, clearCache } = useSearch();
  
  // Track last executed search to prevent infinite loops
  const lastSearchRef = useRef<{
    query: string;
    method: string;
    useReranker: boolean;
  } | null>(null);
  
  // Handle search based on URL parameters - URL is the single source of truth
  useEffect(() => {
    // Skip if no query parameter is present
    if (!queryParam) {
      return;
    }
    
    // Determine method to use for search
    const method = (methodParam && ['vector', 'text', 'hybrid', 'graph', 'multimodal'].includes(methodParam) 
      ? methodParam 
      : 'text') as SearchMethod;
    
    // Skip URL-based search for multimodal (it has its own flow)
    if (method === 'multimodal') {
      // Only update state if it changed
      if (query !== queryParam) setQuery(queryParam);
      if (searchMethod !== 'multimodal') setSearchMethod('multimodal');
      return;
    }
    
    // Check if this search was already executed
    const lastSearch = lastSearchRef.current;
    const isSameSearch = lastSearch && 
      lastSearch.query === queryParam && 
      lastSearch.method === method && 
      lastSearch.useReranker === useReranker;
    
    if (isSameSearch) {
      // Same search already executed, just update state if needed
      if (query !== queryParam) setQuery(queryParam);
      if (searchMethod !== method) setSearchMethod(method);
      return;
    }
    
    // New search - update state
    setQuery(queryParam);
    setSearchMethod(method);
    
    // Save URL to sessionStorage for navigation tracking
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('car_manual_previous_search_url', window.location.href);
      sessionStorage.setItem('car_manual_referrer_type', 'search');
    }
    
    // Execute search with appropriate limit
    const resultLimit = method === 'graph' ? 30 : 10;
    searchRef.current?.(method, queryParam, resultLimit, undefined, useReranker);
    
    // Record this search as executed
    lastSearchRef.current = {
      query: queryParam,
      method: method,
      useReranker: useReranker
    };
    
  // Dependencies: Only URL params and useReranker - query/searchMethod are derived state, not dependencies
  }, [queryParam, methodParam, useReranker]);
  
  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    params.set('method', searchMethod);
    
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
    
    // Clear multimodal results when switching away
    if (method !== 'multimodal' && multimodalResults) {
      setMultimodalResults(null);
      setMultimodalError(null);
    }
    
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
  
  // Handle multimodal search
  const handleMultimodalSearch = async (params: { query_type: 'text' | 'image'; query_text?: string; image_base64?: string }) => {
    setMultimodalLoading(true);
    setMultimodalError(null);
    setMultimodalResults(null);
    
    try {
      const response = await searchService.multimodalSearch({
        ...params,
        limit: 3,
        include_text_chunks: true,
        num_candidates_multiplier: 10
      });
      
      setMultimodalResults(response);
    } catch (err: any) {
      setMultimodalError(err.message || 'Failed to perform multimodal search');
      console.error('Multimodal search error:', err);
    } finally {
      setMultimodalLoading(false);
    }
  };
  
  
  
  return (
    <MainLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing[3] }}>
        <H1 style={{
          marginBottom: spacing[4],
          color: palette.gray.dark3,
          fontFamily: "'Euclid Circular A', sans-serif",
          fontSize: '36px',
          fontWeight: 400,
          letterSpacing: '-0.5px',
        }}>
          Car Manual Search
        </H1>
        
        {/* Search input - conditional based on method */}
        {searchMethod !== 'multimodal' ? (
          <Card style={{ padding: spacing[3], marginBottom: spacing[3] }}>
            <SearchInput 
              onSearch={handleSearch} 
              initialValue={query}
              loading={loading}
              placeholder={searchPlaceholder}
            />
            
            {/* Voyage AI Reranker Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              marginTop: spacing[3],
              paddingTop: spacing[3],
              borderTop: `1px solid ${palette.gray.light2}`,
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={useReranker}
                  onChange={(e) => setUseReranker(e.target.checked)}
                  style={{
                    width: '40px',
                    height: '24px',
                    cursor: 'pointer',
                    accentColor: palette.green.dark2,
                  }}
                />
                <Body weight="medium" style={{
                  color: palette.gray.dark2,
                  margin: 0,
                }}>
                  Voyage AI Reranker
                </Body>
              </label>
              
              {/* Status Badge */}
              <Badge variant={useReranker ? 'green' : 'lightgray'}>
                {useReranker ? 'ENABLED' : 'DISABLED'}
              </Badge>
              
              {useReranker && (
                <Badge variant="blue">Smart Relevance</Badge>
              )}
              
              <Body style={{
                color: palette.gray.dark1,
                fontSize: '13px',
                margin: 0,
                marginLeft: 'auto',
              }}>
                Improve result relevance using AI reranking
              </Body>
            </div>
          </Card>
        ) : (
          <MultimodalSearchInput 
            onSearch={handleMultimodalSearch}
            isLoading={multimodalLoading}
            initialTextQuery={multimodalTextQuery}
          />
        )}
        

        {/* Conditional Query Suggestions based on search method */}
        {searchMethod !== 'multimodal' ? (
          <>
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
                  variant="default"
                  onClick={() => handleSearch("Oil change procedure")}
                  leftGlyph={<Icon glyph="Wrench" size="small" />}
                  style={{
                    borderColor: palette.green.dark2,
                    color: palette.green.dark2
                  }}
                >
                  Oil change procedure
                </Button>

                <Button
                  size="small"
                  variant="default"
                  onClick={() => handleSearch("Check engine light")}
                  leftGlyph={<Icon glyph="Warning" size="small" />}
                  style={{
                    borderColor: palette.green.dark2,
                    color: palette.green.dark2
                  }}
                >
                  Check engine light
                </Button>


                <Button
                  size="small"
                  variant="default"
                  onClick={() => handleSearch("Battery replacement")}
                  leftGlyph={<Icon glyph="LightningBolt" size="small" />}
                  style={{
                    borderColor: palette.green.dark2,
                    color: palette.green.dark2
                  }}
                >
                  Battery replacement
                </Button>

              </div>
            </div>

            {/* Natural Language Search Suggestions */}
            <div style={{
              marginBottom: spacing[2]
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
                  style={{
                    borderColor: palette.blue.dark2,
                    color: palette.blue.dark2
                  }}
                >
                  Car won't start on cold morning
                </Button>

                <Button
                  size="small"
                  variant="default"
                  onClick={() => handleSearch("How can I improve my car's fuel efficiency?")}
                  leftGlyph={<Icon glyph="Bulb" size="small" />}
                  style={{
                    borderColor: palette.blue.dark2,
                    color: palette.blue.dark2
                  }}
                >
                  Improve fuel efficiency
                </Button>

                <Button
                  size="small"
                  variant="default"
                  onClick={() => handleSearch("What's the best way to clean the interior of my car?")}
                  leftGlyph={<Icon glyph="Bulb" size="small" />}
                  style={{
                    borderColor: palette.blue.dark2,
                    color: palette.blue.dark2
                  }}
                >
                  Best way to clean interior
                </Button>

              </div>
            </div>

            {/* Hybrid Graph Search Suggestions */}
            <div style={{
              marginBottom: spacing[3]
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
                  Hybrid Graph Queries (Vector + Graph)
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
                  onClick={() => handleSearch("Tire replacement steps")}
                  leftGlyph={<Icon glyph="Relationship" size="small" />}
                  style={{
                    borderColor: palette.red.dark2,
                    color: palette.red.dark2
                  }}
                >
                  Tire replacement steps
                </Button>

                <Button
                  size="small"
                  variant="default"
                  onClick={() => handleSearch("Electrical system troubleshooting")}
                  leftGlyph={<Icon glyph="Relationship" size="small" />}
                  style={{
                    borderColor: palette.red.dark2,
                    color: palette.red.dark2
                  }}
                >
                  Electrical system troubleshooting
                </Button>

                <Button
                  size="small"
                  variant="default"
                  onClick={() => handleSearch("Transmission fluid check")}
                  leftGlyph={<Icon glyph="Relationship" size="small" />}
                  style={{
                    borderColor: palette.red.dark2,
                    color: palette.red.dark2
                  }}
                >
                  Transmission fluid check
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Multimodal Search Suggestions - English */}
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
                  Quick Searches (English)
                </span>
              </div>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: spacing[2],
                paddingBottom: spacing[2]
              }}>
                {['Infotainment System', 'Climate Control', 'Electrical System', 'Transmission'].map((query) => (
                  <Button
                    key={query}
                    size="small"
                    variant="default"
                    onClick={() => {
                      setMultimodalTextQuery(query);
                      handleMultimodalSearch({ query_type: 'text', query_text: query });
                    }}
                    leftGlyph={<Icon glyph="Camera" size="small" />}
                    style={{
                      borderColor: palette.yellow.dark2,
                      color: palette.yellow.dark2
                    }}
                  >
                    {query}
                  </Button>
                ))}
              </div>
            </div>

            {/* Multimodal Search Suggestions - Other Languages */}
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
                  Multi-Language Searches
                </span>
              </div>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: spacing[2],
                paddingBottom: spacing[2]
              }}>
                {/* French */}
                <Button
                  size="small"
                  variant="default"
                  onClick={() => {
                    setMultimodalTextQuery('système d\'infodivertissement');
                    handleMultimodalSearch({ query_type: 'text', query_text: 'système d\'infodivertissement' });
                  }}
                  leftGlyph={<Icon glyph="Camera" size="small" />}
                  style={{
                    borderColor: palette.yellow.dark2,
                    color: palette.yellow.dark2
                  }}
                >
                  🇫🇷 Système d&apos;infodivertissement
                </Button>

                {/* German */}
                <Button
                  size="small"
                  variant="default"
                  onClick={() => {
                    setMultimodalTextQuery('Gangschaltung');
                    handleMultimodalSearch({ query_type: 'text', query_text: 'Gangschaltung' });
                  }}
                  leftGlyph={<Icon glyph="Camera" size="small" />}
                  style={{
                    borderColor: palette.yellow.dark2,
                    color: palette.yellow.dark2
                  }}
                >
                  🇩🇪 Gangschaltung
                </Button>

                {/* Japanese */}
                <Button
                  size="small"
                  variant="default"
                  onClick={() => {
                    setMultimodalTextQuery('氷が溶ける');
                    handleMultimodalSearch({ query_type: 'text', query_text: '氷が溶ける' });
                  }}
                  leftGlyph={<Icon glyph="Camera" size="small" />}
                  style={{
                    borderColor: palette.yellow.dark2,
                    color: palette.yellow.dark2
                  }}
                >
                  🇯🇵 氷が溶ける
                </Button>

                {/* Hindi */}
                <Button
                  size="small"
                  variant="default"
                  onClick={() => {
                    setMultimodalTextQuery('आपातकालीन किट');
                    handleMultimodalSearch({ query_type: 'text', query_text: 'आपातकालीन किट' });
                  }}
                  leftGlyph={<Icon glyph="Camera" size="small" />}
                  style={{
                    borderColor: palette.yellow.dark2,
                    color: palette.yellow.dark2
                  }}
                >
                  🇮🇳 आपातकालीन किट
                </Button>
              </div>
            </div>
          </>
        )}
        
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
              {/* Multimodal Search Results */}
              {searchMethod === 'multimodal' ? (
                <>
                  {/* Multimodal Error state */}
                  {multimodalError && (
                    <ErrorState 
                      title="Multimodal Search Error"
                      message={multimodalError}
                    />
                  )}
                  
                  {/* Multimodal Loading state */}
                  {multimodalLoading && (
                    <LoadingState message="Searching images with multimodal embeddings..." />
                  )}
                  
                  {/* Multimodal Results state */}
                  {!multimodalLoading && multimodalResults && (
                    <MultimodalSearchResults response={multimodalResults} />
                  )}
                  
                  {/* Multimodal Empty initial state */}
                  {!multimodalLoading && !multimodalResults && !multimodalError && (
                    <Card style={{ padding: spacing[3], textAlign: 'center' }}>
                      <Body>Enter a text query or upload/select an image to search</Body>
                    </Card>
                  )}
                </>
              ) : (
                <>
                  {/* Standard Search Error state */}
                  {error && (
                    <ErrorState 
                      title="Search Error"
                      message={error}
                    />
                  )}
                  
                  {/* Standard Search Loading state */}
                  {loading && (
                    <LoadingState message="Searching the car manual..." />
                  )}
                  
                  {/* Standard Search Results state */}
                  {!loading && results && (
                    <>
                      {/* Query Summary Card - matching multimodal search style */}
                      <div style={{
                        padding: spacing[3],
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        marginBottom: spacing[3],
                        border: `1px solid ${palette.gray.light2}`,
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}>
                        <Body weight="medium" style={{ fontSize: '16px', marginBottom: spacing[1] }}>
                          Found {results.total} result{results.total !== 1 ? 's' : ''} for &quot;{results.query}&quot; using MongoDB Atlas {
                            results.method === 'text' ? 'Full-text Search' :
                            results.method === 'vector' ? 'Vector Search' :
                            (results.method === 'hybrid' || results.method === 'hybrid_rrf') ? 'Hybrid RRF Search' :
                            results.method.includes('graph') ? 'Vector → Graph' :
                            results.method
                          }
                        </Body>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginTop: spacing[2], flexWrap: 'wrap' }}>
                          {/* Search Method Badge */}
                          <Badge variant={
                            results.method === 'text' ? 'green' :
                            results.method === 'vector' ? 'blue' :
                            (results.method === 'hybrid' || results.method === 'hybrid_rrf') ? 'purple' :
                            results.method.includes('graph') ? 'red' :
                            'darkgray'
                          }>
                            {results.method === 'text' && 'Full-text Search'}
                            {results.method === 'vector' && 'Vector Search'}
                            {(results.method === 'hybrid' || results.method === 'hybrid_rrf') && 'Hybrid RRF Search'}
                            {results.method.includes('graph') && 'Vector → Graph'}
                          </Badge>

                          {/* Technology badges */}
                          {results.method === 'text' && (
                            <Badge variant="lightgray">Atlas Search</Badge>
                          )}
                          {(results.method === 'vector' || results.method === 'hybrid' || results.method === 'hybrid_rrf' || results.method.includes('graph')) && (
                            <Badge variant="lightgray">Google Vertex AI Embeddings</Badge>
                          )}
                          {results.method.includes('graph') && (
                            <Badge variant="lightgray">$graphLookup</Badge>
                          )}

                          {/* Reranking Summary */}
                          {results.reranking_metadata?.reranking_applied && results.reranking_metadata.position_stats && (
                            <RerankingSummary
                              positionStats={results.reranking_metadata.position_stats}
                              reranking={results.reranking_metadata}
                            />
                          )}
                        </div>
                      </div>
                      
                      {/* MongoDB Query Visualization Panel */}
                      <QueryVisualizationPanel
                        searchMethod={results.method as SearchMethod}
                        query={results.query}
                        debugInfo={results.debug_info}
                      />
                      
                      <SearchResultList 
                        results={results.results}
                        highlight={query}
                        query={query}
                        searchMethod={results.method}
                      />
                    </>
                  )}
                  
                  {/* Standard Search Empty initial state */}
                  {!loading && !results && !error && (
                    <Card style={{ padding: spacing[3], textAlign: 'center' }}>
                      <Body>Enter a search term to find results in the car manual</Body>
                    </Card>
                  )}
                </>
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