'use client';

import React from 'react';
import { H1, H2, H3, Body, Description } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import ExpandableCard from '@leafygreen-ui/expandable-card';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import Button from '@leafygreen-ui/button';
import Icon from '@leafygreen-ui/icon';
import Link from 'next/link';
import Badge from '@leafygreen-ui/badge';
import dynamic from 'next/dynamic';
import { APP_DESCRIPTION_DETAILED } from '@/constants/appConstants';
import { CARD_STYLES } from '@/lib/styleConstants';

const MainLayout = dynamic(() =>
  import('@/components/layout/MainLayout')
);
const PipelineVisualization = dynamic(
  () => import('@/components/content/PipelineVisualization'),
  { ssr: false }
);

export default function Home() {
  return (
    <MainLayout>
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: spacing[3],
        }}
      >
        {/* Simplified Hero Section */}
        <div
          style={{
            ...CARD_STYLES.base,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: spacing[5],
            marginTop: spacing[4],
            padding: `${spacing[5]}px ${spacing[4]}px`,
          }}
        >
          <H1
            style={{
              marginBottom: spacing[4],
              textAlign: 'center',
              color: palette.gray.dark3,
              fontFamily: "'Euclid Circular A', sans-serif",
              fontSize: '36px',
            }}
          >
            Car Manual Explorer
          </H1>

          {/* CTA Buttons - REORDERED */}
          <div
            style={{
              display: 'flex',
              gap: spacing[3],
              marginBottom: spacing[4],
            }}
          >
            <Link href="/browse">
              <div style={{ display: 'inline-block' }}>
                <Button
                  variant="default"
                  size="large"
                  leftGlyph={<Icon glyph="Visibility" />}
                  style={{ fontWeight: 600 }}
                >
                  Browse Chunks
                </Button>
              </div>
            </Link>

            <Link href="/search">
              <div style={{ display: 'inline-block' }}>
                <Button
                  variant="primary"
                  size="large"
                  leftGlyph={
                    <Icon
                      glyph="MagnifyingGlass"
                      fill={palette.gray.light3}
                    />
                  }
                  style={{
                    fontWeight: 600,
                    backgroundColor: palette.green.dark2,
                    color: palette.gray.light3,
                  }}
                >
                  Start Searching
                </Button>
              </div>
            </Link>
          </div>

          {/* Simplified Capabilities - 3 monochrome badges */}
          <div
            style={{
              display: 'flex',
              gap: spacing[2],
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Badge variant="darkgray">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Icon glyph="Database" size={14} />
                <span>MongoDB Atlas</span>
              </div>
            </Badge>
            <Badge variant="darkgray">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Icon glyph="Diagram" size={14} />
                <span>5 Retrieval Methods</span>
              </div>
            </Badge>
            <Badge variant="darkgray">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Icon glyph="Sparkle" size={14} />
                <span>Voyage AI Powered</span>
              </div>
            </Badge>
          </div>
        </div>

        {/* How It Works - Animated Pipeline */}
        <div style={{ marginBottom: spacing[5] }}>
          <H2
            style={{
              textAlign: 'center',
              marginBottom: spacing[2],
              color: palette.gray.dark3,
              fontFamily: "'Euclid Circular A', sans-serif",
              fontSize: '28px',
            }}
          >
            How It Works
          </H2>

          <PipelineVisualization />

          <Description
            style={{
              textAlign: 'center',
              marginTop: spacing[4],
              maxWidth: '800px',
              marginLeft: 'auto',
              marginRight: 'auto',
              color: palette.gray.dark1,
              lineHeight: '1.6',
            }}
          >
            {APP_DESCRIPTION_DETAILED}
          </Description>
        </div>

        {/* Use Case Section (MOVED UP) */}
        <div style={{ marginBottom: spacing[5] }}>
          <H2
            style={{
              textAlign: 'center',
              marginBottom: spacing[4],
              color: palette.gray.dark3,
              fontFamily: "'Euclid Circular A', sans-serif",
              fontSize: '28px',
            }}
          >
            Use Case: Automotive Technical Documentation
          </H2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(300px, 1fr))',
              gap: spacing[3],
            }}
          >
            {/* Challenge Card */}
            <Card
              style={{
                ...CARD_STYLES.base,
                padding: spacing[3],
                border: `1px solid ${palette.red.light2}`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  marginBottom: spacing[2],
                }}
              >
                <Icon
                  glyph="Warning"
                  size="small"
                  fill={palette.red.base}
                />
                <H3
                  style={{
                    color: palette.gray.dark3,
                    margin: 0,
                  }}
                >
                  The Challenge
                </H3>
              </div>
              <Body
                style={{
                  color: palette.gray.dark1,
                  lineHeight: '1.6',
                }}
              >
                Automotive technicians waste hours searching through
                fragmented documentation systems for repair
                procedures, while customers struggle with static PDF
                manuals for simple questions like dashboard warning
                explanations.
              </Body>
            </Card>

            {/* Opportunity Card */}
            <Card
              style={{
                ...CARD_STYLES.base,
                padding: spacing[3],
                border: `1px solid ${palette.blue.light2}`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  marginBottom: spacing[2],
                }}
              >
                <Icon
                  glyph="Bulb"
                  size="small"
                  fill={palette.blue.base}
                />
                <H3
                  style={{
                    color: palette.gray.dark3,
                    margin: 0,
                  }}
                >
                  The Opportunity
                </H3>
              </div>
              <Body
                style={{
                  color: palette.gray.dark1,
                  lineHeight: '1.6',
                }}
              >
                Transform static technical documentation into
                intelligent, searchable knowledge bases that serve
                both professional technicians and everyday customers
                through the same unified platform.
              </Body>
            </Card>

            {/* The Result Card */}
            <Card
              style={{
                ...CARD_STYLES.base,
                padding: spacing[3],
                border: `1px solid ${palette.green.light2}`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  marginBottom: spacing[2],
                }}
              >
                <Icon
                  glyph="Checkmark"
                  size="small"
                  fill={palette.green.base}
                />
                <H3
                  style={{
                    color: palette.gray.dark3,
                    margin: 0,
                  }}
                >
                  The Result
                </H3>
              </div>
              <Body
                style={{
                  color: palette.gray.dark1,
                  lineHeight: '1.6',
                }}
              >
                MongoDB's Unified Data Platform in action: flexible
                storage, intelligent chunking, and five specialized
                retrieval methods working together to transform static
                manuals into an intelligent search system.
              </Body>
            </Card>
          </div>
        </div>

        {/* Retrieval Methods & Reranking - 6 Expandable Cards (MOVED DOWN) */}
        <div style={{ marginBottom: spacing[5] }}>
          <H2
            style={{
              textAlign: 'center',
              marginBottom: spacing[4],
              color: palette.gray.dark3,
              fontFamily: "'Euclid Circular A', sans-serif",
              fontSize: '28px',
            }}
          >
            Retrieval Methods & Reranking
          </H2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(400px, 1fr))',
              gap: spacing[3],
            }}
          >
            {/* Card 1: Full-Text Search */}
            <ExpandableCard
              title="1. Full-Text Search"
              description="Lexical keyword matching"
              defaultOpen={false}
            >
              <Body
                style={{
                  color: palette.gray.dark1,
                  lineHeight: '1.6',
                }}
              >
                Atlas Search provides powerful full-text search with
                fuzzy matching, stemming, and typo tolerance. Ideal
                for exact phrase searches and keyword-based queries.
              </Body>
            </ExpandableCard>

            {/* Card 2: Vector Search */}
            <ExpandableCard
              title="2. Vector Search"
              description="Semantic similarity search"
              defaultOpen={false}
            >
              <Body
                style={{
                  color: palette.gray.dark1,
                  lineHeight: '1.6',
                }}
              >
                Dense vector embeddings enable semantic search that
                finds conceptually similar content even without
                keyword matches. Perfect for natural language queries.
              </Body>
            </ExpandableCard>

            {/* Card 3: Graph Search */}
            <ExpandableCard
              title="3. Graph Search (GraphRAG)"
              description="Relationship-aware traversal"
              defaultOpen={false}
            >
              <Body
                style={{
                  color: palette.gray.dark1,
                  lineHeight: '1.6',
                }}
              >
                MongoDB's $graphLookup enables knowledge graph
                traversal through document relationships. Discovers
                connected information and related procedures.
              </Body>
            </ExpandableCard>

            {/* Card 4: Multimodal Search */}
            <ExpandableCard
              title="4. Multimodal Search"
              description="Visual and text search"
              defaultOpen={false}
            >
              <Body
                style={{
                  color: palette.gray.dark1,
                  lineHeight: '1.6',
                }}
              >
                Voyage AI multimodal embeddings power both
                text-to-image and image-to-image search. Find
                diagrams, schematics, and visual content through
                natural language or similar images.
              </Body>
            </ExpandableCard>

            {/* Card 5: Hybrid Search */}
            <ExpandableCard
              title="5. Hybrid Search"
              description="Combined retrieval methods"
              defaultOpen={false}
            >
              <Body
                style={{
                  color: palette.gray.dark1,
                  lineHeight: '1.6',
                }}
              >
                MongoDB's native $rankFusion intelligently combines
                full-text and vector search results using Reciprocal
                Rank Fusion (RRF) for optimal accuracy across all
                query types.
              </Body>
            </ExpandableCard>

            {/* Card 6: Voyage AI Reranking */}
            <ExpandableCard
              title="6. Voyage AI Reranking"
              description="Intelligent result optimization"
              defaultOpen={false}
            >
              <Body
                style={{
                  color: palette.gray.dark1,
                  lineHeight: '1.6',
                }}
              >
                State-of-the-art reranking model re-scores results
                from any retrieval method based on semantic relevance
                to the query. Provides final optimization layer for
                maximum accuracy.
              </Body>
            </ExpandableCard>
          </div>
        </div>

        {/* Final CTA */}
        <div
          style={{
            textAlign: 'center',
            backgroundColor: palette.gray.light3,
            borderRadius: '16px',
            padding: `${spacing[5]}px ${spacing[4]}px`,
            marginBottom: spacing[4],
          }}
        >
          <H2
            style={{
              marginBottom: spacing[3],
              color: palette.gray.dark3,
              fontFamily: "'Euclid Circular A', sans-serif",
              fontSize: '28px',
            }}
          >
            Ready to Explore?
          </H2>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: spacing[3],
            }}
          >
            <Link href="/browse">
              <div style={{ display: 'inline-block' }}>
                <Button variant="default" size="large">
                  Browse Chunks
                </Button>
              </div>
            </Link>

            <Link href="/search">
              <div style={{ display: 'inline-block' }}>
                <Button
                  variant="primary"
                  size="large"
                  leftGlyph={
                    <Icon
                      glyph="MagnifyingGlass"
                      fill={palette.gray.light3}
                    />
                  }
                  style={{
                    backgroundColor: palette.green.dark2,
                    color: palette.gray.light3,
                  }}
                >
                  Start Searching
                </Button>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
