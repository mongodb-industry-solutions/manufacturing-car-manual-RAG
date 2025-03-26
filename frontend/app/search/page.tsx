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
const WeightSlider = dynamic(() => import('@/components/search/WeightSlider'));
const SearchResultList = dynamic(() => import('@/components/search/SearchResultList'));
const AskQuestion = dynamic(() => import('@/components/search/AskQuestion'));
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
  const [hybridMethod, setHybridMethod] = useState<HybridMethod>('weighted');
  const [vectorWeight, setVectorWeight] = useState(0.7);
  const [textWeight, setTextWeight] = useState(0.3);
  const [activeTab, setActiveTab] = useState<'search' | 'ask'>(modeParam === 'ask' ? 'ask' : 'search');
  
  // Custom hooks
  const { search, loading, error, results } = useSearch();
  
  // Handle URL params
  useEffect(() => {
    if (queryParam) {
      setQuery(queryParam);
      
      // If we have a query, perform the search
      if (queryParam.trim() && activeTab === 'search') {
        performSearch(queryParam);
      }
    }
    
    if (methodParam && ['vector', 'text', 'hybrid'].includes(methodParam)) {
      setSearchMethod(methodParam as SearchMethod);
    }

    if (modeParam === 'ask') {
      setActiveTab('ask');
    }
  }, [queryParam, methodParam, modeParam]);
  
  // Update URL when search parameters change
  useEffect(() => {
    if (query) {
      updateSearchParams();
    }
  }, [searchMethod, activeTab]);
  
  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    params.set('method', searchMethod);
    if (activeTab === 'ask') params.set('mode', 'ask');
    
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
    
    if (activeTab === 'search') {
      performSearch(newQuery);
    }
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', newQuery);
    router.push(`/search?${params.toString()}`);
  };
  
  const handleMethodChange = (method: SearchMethod) => {
    setSearchMethod(method);
    
    // If we have a query, perform the search with the new method
    if (query.trim() && activeTab === 'search') {
      setTimeout(() => performSearch(), 0);
    }
  };
  
  const handleWeightChange = (newVectorWeight: number, newTextWeight: number) => {
    setVectorWeight(newVectorWeight);
    setTextWeight(newTextWeight);
    
    // If we have a query, perform the search with the new weights
    if (query.trim() && searchMethod === 'hybrid' && activeTab === 'search') {
      setTimeout(() => performSearch(), 0);
    }
  };

  // Handle source click from AskQuestion component
  const handleSourceClick = (sourceId: string) => {
    router.push(`/chunk/${sourceId}`);
  };
  
  // Handle tab change
  const handleTabChange = (tab: 'search' | 'ask') => {
    setActiveTab(tab);
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'ask') {
      params.set('mode', 'ask');
    } else {
      params.delete('mode');
    }
    router.push(`/search?${params.toString()}`);
    
    // If switching to search tab and we have a query, perform the search
    if (tab === 'search' && query.trim()) {
      setTimeout(() => performSearch(), 0);
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
        
        {/* Mode selector buttons */}
        <div style={{ 
          marginBottom: spacing[3],
          display: 'flex',
          gap: spacing[2],
          borderBottom: '1px solid #E1E1E1',
          paddingBottom: spacing[2]
        }}>
          <Button 
            leftGlyph={<Icon glyph="MagnifyingGlass" />}
            variant={activeTab === 'search' ? 'primary' : 'default'}
            onClick={() => handleTabChange('search')}
          >
            Search Manual
          </Button>
          <Button
            leftGlyph={<Icon glyph="Help" />}
            variant={activeTab === 'ask' ? 'primary' : 'default'}
            onClick={() => handleTabChange('ask')}
          >
            Ask a Question
          </Button>
        </div>
        
        {/* Search Mode */}
        {activeTab === 'search' && (
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
                  hybridMethod={hybridMethod}
                  onHybridMethodChange={(method) => {
                    setHybridMethod(method as HybridMethod);
                    if (query.trim() && searchMethod === 'hybrid') {
                      setTimeout(() => performSearch(), 0);
                    }
                  }}
                />
                
                {searchMethod === 'hybrid' && hybridMethod === 'weighted' && (
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
        )}
        
        {/* Ask Question Mode */}
        {activeTab === 'ask' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <AskQuestion 
              initialQuestion={query || "How do I perform routine maintenance on my car?"}
              onSourceClick={handleSourceClick}
            />
            
            <Card style={{ padding: spacing[3], marginTop: spacing[3] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                <Icon glyph="InfoWithCircle" />
                <Body>
                  Questions are answered using AI with information from your car manual. For more focused results, 
                  try the search tab to navigate directly to specific sections.
                </Body>
              </div>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}