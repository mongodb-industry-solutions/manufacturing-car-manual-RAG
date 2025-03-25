'use client';

import dynamic from 'next/dynamic';
const MainLayout = dynamic(() => import('@/components/layout/MainLayout'));
const SearchInput = dynamic(() => import('@/components/search/SearchInput'));
import { H1, Body } from "@leafygreen-ui/typography";
import Card from "@leafygreen-ui/card";
import { spacing } from "@leafygreen-ui/tokens";
import Button from "@leafygreen-ui/button";
import Icon from "@leafygreen-ui/icon";
import Link from "next/link";

export default function Home() {
  return (
    <MainLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing[3] }}>
        <div style={{ 
          textAlign: 'center', 
          marginBottom: spacing[5],
          marginTop: spacing[4]
        }}>
          <H1 style={{ marginBottom: spacing[3] }}>
            Car Manual Search
          </H1>
          <Body size="large" style={{ marginBottom: spacing[4], maxWidth: '800px', margin: '0 auto' }}>
            Search across your vehicle manual using keywords or natural language questions
          </Body>
          
          <Card style={{ 
            padding: spacing[4], 
            marginBottom: spacing[4],
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <SearchInput 
              onSearch={(query) => {
                window.location.href = `/search?q=${encodeURIComponent(query)}`;
              }}
              placeholder="How do I change a flat tire?" 
            />
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              marginTop: spacing[3],
              gap: spacing[2]
            }}>
              <Link href="/search?method=vector" passHref>
                <Button size="large" variant="default">
                  Semantic Search
                </Button>
              </Link>
              <Link href="/search?method=text" passHref>
                <Button size="large" variant="default">
                  Keyword Search
                </Button>
              </Link>
              <Link href="/search?method=hybrid" passHref>
                <Button size="large" variant="default">
                  Hybrid Search
                </Button>
              </Link>
            </div>
          </Card>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            marginTop: spacing[4],
            gap: spacing[4]
          }}>
            <Card style={{ 
              padding: spacing[3], 
              width: '250px',
              textAlign: 'center'
            }}>
              <Icon 
                glyph="VectorSearch" 
                size="large" 
                style={{ marginBottom: spacing[2] }}
              />
              <Body weight="medium" style={{ marginBottom: spacing[2] }}>
                Semantic Search
              </Body>
              <Body>
                Find results based on meaning, not just keywords
              </Body>
            </Card>
            
            <Card style={{ 
              padding: spacing[3], 
              width: '250px',
              textAlign: 'center'
            }}>
              <Icon 
                glyph="MagnifyingGlass" 
                size="large" 
                style={{ marginBottom: spacing[2] }}
              />
              <Body weight="medium" style={{ marginBottom: spacing[2] }}>
                Keyword Search
              </Body>
              <Body>
                Search by specific words and phrases
              </Body>
            </Card>
            
            <Card style={{ 
              padding: spacing[3], 
              width: '250px',
              textAlign: 'center'
            }}>
              <Icon 
                glyph="Lightbulb" 
                size="large" 
                style={{ marginBottom: spacing[2] }}
              />
              <Body weight="medium" style={{ marginBottom: spacing[2] }}>
                Ask Questions
              </Body>
              <Body>
                Get answers to your questions with RAG
              </Body>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}