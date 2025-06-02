'use client';

import {
  MyH1 as H1,
  MyH2 as H2,
  MyH3 as H3,
  MyBody as Body,
  MySubtitle as Subtitle,
} from '@/components/ui/TypographyWrapper';
import { InlineCode, Disclaimer } from '@leafygreen-ui/typography';
import { MyCard as Card } from '@/components/ui/TypographyWrapper';
import ExpandableCard from '@leafygreen-ui/expandable-card';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import { MyButton as Button } from '@/components/ui/TypographyWrapper';
import Icon from '@leafygreen-ui/icon';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Badge from '@leafygreen-ui/badge';
import dynamic from 'next/dynamic';
import Code from '@leafygreen-ui/code';
import { Tabs, Tab } from '@leafygreen-ui/tabs';
import { useState, useMemo } from 'react';
import { APP_DESCRIPTION, BRANDING } from '@/constants/appConstants';

const MainLayout = dynamic(() =>
  import('@/components/layout/MainLayout')
);

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);

  // Convert hex color to rgb for lighter background
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
      hex
    );
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  // Get the primary color from constants
  const primaryColor = BRANDING.primaryColor;
  const secondaryColor = BRANDING.secondaryColor;
  const accentColor = BRANDING.accentColor;

  const rgbColor = hexToRgb(primaryColor);
  const lightBgColor = rgbColor
    ? `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.1)`
    : palette.green.light3;

  return (
    <MainLayout>
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: spacing[3],
        }}
      >
        {/* Hero section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: spacing[5],
            marginTop: spacing[2],
            background: `linear-gradient(135deg, ${lightBgColor}, ${palette.blue.light2})`,
            borderRadius: '12px',
            padding: `${spacing[5]}px ${spacing[4]}px`,
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
            border: `1px solid ${palette.gray.light2}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: spacing[3],
            }}
          ></div>

          <H1
            style={{
              marginBottom: spacing[3],
              textAlign: 'center',
              color: palette.blue.dark1,
              fontWeight: 'bold',
              fontSize: '36px',
            }}
          >
            {BRANDING.title}
          </H1>

          <Subtitle
            style={{
              marginBottom: spacing[4],
              maxWidth: '800px',
              textAlign: 'center',
              fontSize: '18px',
              lineHeight: '28px',
              color: palette.gray.dark1,
            }}
          >
            {APP_DESCRIPTION}
          </Subtitle>

          <div
            style={{
              display: 'flex',
              gap: spacing[3],
              marginBottom: spacing[4],
            }}
          >
            <Link href="/search">
              <div style={{ display: 'inline-block' }}>
                <Button
                  variant="primary"
                  size="large"
                  leftGlyph={<Icon glyph="MagnifyingGlass" />}
                  style={{ fontWeight: 600 }}
                >
                  Start Searching
                </Button>
              </div>
            </Link>

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
          </div>

          <div
            style={{
              display: 'flex',
              gap: spacing[2],
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Badge variant="yellow">Intelligent Chunking</Badge>
            <Badge variant="blue">Full-Text Search</Badge>
            <Badge variant="green">Vector Search</Badge>
            <Badge variant="purple">Hybrid Search</Badge>
            <Badge variant="darkGray">MongoDB Atlas</Badge>
          </div>
        </div>

        {/* Technical overview */}
        <Card
          style={{
            padding: spacing[4],
            marginBottom: spacing[5],
            border: `1px solid ${palette.gray.light2}`,
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
          }}
        >
          <H2
            style={{
              marginBottom: spacing[3],
              color: palette.blue.dark1,
            }}
          >
            Technical Overview
          </H2>
          <Subtitle
            style={{
              marginBottom: spacing[4],
              color: palette.gray.dark1,
            }}
          >
            How MongoDB enables optimized RAG pipelines for automotive
            documentation
          </Subtitle>

          <Tabs
            selected={activeTab}
            setSelected={setActiveTab}
            aria-label="Technical overview tabs"
          >
            <Tab name="Document Processing">
              <div style={{ marginTop: spacing[3] }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: spacing[4],
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <H3
                      style={{
                        marginBottom: spacing[2],
                        color: palette.blue.dark2,
                      }}
                    >
                      Intelligent Chunking Strategy
                    </H3>
                    <Body
                      style={{
                        marginBottom: spacing[3],
                        lineHeight: '22px',
                      }}
                    >
                      Technical documentation requires specialized
                      chunking approaches that preserve procedural
                      integrity, safety warnings, and semantic
                      relationships. Our chunking pipeline processes
                      automotive manuals with:
                    </Body>
                    <ul style={{ marginBottom: spacing[3] }}>
                      <li style={{ marginBottom: spacing[1] }}>
                        <Body weight="medium">
                          Structure-aware segmentation
                        </Body>{' '}
                        - Respects document hierarchy
                      </li>
                      <li style={{ marginBottom: spacing[1] }}>
                        <Body weight="medium">
                          Context preservation
                        </Body>{' '}
                        - Maintains procedural steps together
                      </li>
                      <li style={{ marginBottom: spacing[1] }}>
                        <Body weight="medium">
                          Metadata extraction
                        </Body>{' '}
                        - Categorizes content type (procedure,
                        warning, specification)
                      </li>
                    </ul>
                  </div>
                  <div
                    style={{
                      backgroundColor: lightBgColor,
                      borderRadius: '8px',
                      padding: spacing[3],
                      border: `1px solid ${primaryColor}`,
                      minWidth: '300px',
                    }}
                  >
                    <Body
                      weight="medium"
                      style={{
                        marginBottom: spacing[2],
                        color: secondaryColor,
                      }}
                    >
                      MongoDB Document Structure
                    </Body>
                    <Code language="javascript" copyable="true">
                      {`{
  "_id": ObjectId("..."),
  "text": "Replacing automotive components...",
  "metadata": {
    "source": "manual",
    "section": "engine",
    "type": "procedure"
  },
  "embedding": [0.12, 0.35, ...]
}`}
                    </Code>
                  </div>
                </div>
              </div>
            </Tab>
            <Tab name="Vector Search">
              <div style={{ marginTop: spacing[3] }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: spacing[4],
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <H3
                      style={{
                        marginBottom: spacing[2],
                        color: palette.blue.dark2,
                      }}
                    >
                      MongoDB Vector Search
                    </H3>
                    <Body
                      style={{
                        marginBottom: spacing[3],
                        lineHeight: '22px',
                      }}
                    >
                      Vector search enables semantic understanding
                      beyond keyword matching. MongoDB Atlas Vector
                      Search provides:
                    </Body>
                    <ul style={{ marginBottom: spacing[3] }}>
                      <li style={{ marginBottom: spacing[1] }}>
                        <Body weight="medium">
                          Fully-managed vector indexes
                        </Body>{' '}
                        - Optimized for performance at scale
                      </li>
                      <li style={{ marginBottom: spacing[1] }}>
                        <Body weight="medium">
                          Efficient similarity search
                        </Body>{' '}
                        - Using approximate nearest neighbors
                        algorithms
                      </li>
                      <li style={{ marginBottom: spacing[1] }}>
                        <Body weight="medium">
                          Integrated with aggregation
                        </Body>{' '}
                        - Combine with other MongoDB operations
                      </li>
                    </ul>
                  </div>
                  <div
                    style={{
                      backgroundColor: palette.blue.light3,
                      borderRadius: '8px',
                      padding: spacing[3],
                      border: `1px solid ${palette.blue.light1}`,
                      minWidth: '300px',
                    }}
                  >
                    <Body
                      weight="medium"
                      style={{
                        marginBottom: spacing[2],
                        color: palette.blue.dark2,
                      }}
                    >
                      Vector Search Query
                    </Body>
                    <Code language="javascript" copyable="true">
                      {`db.manual_chunks.aggregate([
  {
    $vectorSearch: {
      index: "manual_vector_search_index",
      path: "embedding",
      queryVector: [0.1, 0.2, ...],
      numCandidates: 100,
      limit: 10
    }
  }
])`}
                    </Code>
                  </div>
                </div>
              </div>
            </Tab>
            <Tab name="Hybrid Search">
              <div style={{ marginTop: spacing[3] }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: spacing[4],
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <H3
                      style={{
                        marginBottom: spacing[2],
                        color: palette.blue.dark2,
                      }}
                    >
                      Hybrid Search Techniques
                    </H3>
                    <Body
                      style={{
                        marginBottom: spacing[3],
                        lineHeight: '22px',
                      }}
                    >
                      Combining multiple search approaches yields
                      superior results. MongoDB enables flexible
                      hybrid search methods:
                    </Body>
                    <ul style={{ marginBottom: spacing[3] }}>
                      <li style={{ marginBottom: spacing[1] }}>
                        <Body weight="medium">
                          RRF (Reciprocal Rank Fusion)
                        </Body>{' '}
                        - Combines result rankings
                      </li>
                      <li style={{ marginBottom: spacing[1] }}>
                        <Body weight="medium">
                          Weighted combination
                        </Body>{' '}
                        - Adjust influence of each search method
                      </li>
                      <li style={{ marginBottom: spacing[1] }}>
                        <Body weight="medium">Pre-filtering</Body> -
                        Limit vector search to relevant document
                        subsets
                      </li>
                      <li style={{ marginBottom: spacing[1] }}>
                        <Body weight="medium">Re-ranking</Body> -
                        Apply secondary scoring to initial results
                      </li>
                    </ul>
                  </div>
                  <div
                    style={{
                      backgroundColor: palette.purple.light3,
                      borderRadius: '8px',
                      padding: spacing[3],
                      border: `1px solid ${palette.purple.light1}`,
                      minWidth: '300px',
                    }}
                  >
                    <Body
                      weight="medium"
                      style={{
                        marginBottom: spacing[2],
                        color: palette.purple.dark2,
                      }}
                    >
                      Hybrid Pipeline
                    </Body>
                    <Code language="javascript" copyable="true">
                      {`// Combined approach
const hybridResults = await 
  combineResults({
    vectorResults,
    keywordResults,
    method: 'weighted',
    weights: {
      vector: 0.7,
      keyword: 0.3
    }
  });`}
                    </Code>
                  </div>
                </div>
              </div>
            </Tab>
          </Tabs>
        </Card>

        {/* Feature cards */}
        <div style={{ marginBottom: spacing[4] }}>
          <H2
            style={{
              marginBottom: spacing[3],
              color: palette.blue.dark1,
              textAlign: 'center',
            }}
          >
            Key Features
          </H2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(280px, 1fr))',
              gap: spacing[4],
              marginBottom: spacing[4],
            }}
          >
            <Card
              style={{
                padding: 0,
                overflow: 'hidden',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                border: `1px solid ${palette.yellow.light1}`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  backgroundColor: palette.yellow.light2,
                  padding: spacing[3],
                  borderBottom: `3px solid ${palette.yellow.base}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                }}
              >
                <Body
                  weight="medium"
                  style={{ color: palette.yellow.dark2 }}
                >
                  Automotive Manual Chunking
                </Body>
              </div>
              <div style={{ padding: spacing[3], flex: 1 }}>
                <Body>
                  See how automotive manuals are intelligently
                  segmented into semantically coherent chunks that
                  preserve procedural integrity and technical context.
                  Optimal chunking ensures both precise retrieval and
                  comprehensive context.
                </Body>
              </div>
              <div
                style={{
                  padding: spacing[3],
                  borderTop: `1px solid ${palette.gray.light2}`,
                }}
              >
                <Link href="/browse">
                  <Button
                    variant="default"
                    size="small"
                    rightGlyph={<Icon glyph="ArrowRight" />}
                  >
                    Explore Chunks
                  </Button>
                </Link>
              </div>
            </Card>

            <Card
              style={{
                padding: 0,
                overflow: 'hidden',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                border: `1px solid ${palette.green.light1}`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  backgroundColor: palette.green.light2,
                  padding: spacing[3],
                  borderBottom: `3px solid ${palette.green.base}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                }}
              >
                <Icon
                  glyph="Diagram"
                  size={32}
                  fill={palette.green.dark1}
                />
                <Body
                  weight="medium"
                  style={{ color: palette.green.dark2 }}
                >
                  Vector Search
                </Body>
              </div>
              <div style={{ padding: spacing[3], flex: 1 }}>
                <Body>
                  MongoDB's vector search finds semantically similar
                  content even when keywords don't match. Embeddings
                  capture the meaning of text, enabling the system to
                  understand conceptual relationships and technical
                  terminology context.
                </Body>
              </div>
              <div
                style={{
                  padding: spacing[3],
                  borderTop: `1px solid ${palette.gray.light2}`,
                }}
              >
                <Link href="/search?method=vector">
                  <Button
                    variant="default"
                    size="small"
                    rightGlyph={<Icon glyph="ArrowRight" />}
                  >
                    Try Vector Search
                  </Button>
                </Link>
              </div>
            </Card>

            <Card
              style={{
                padding: 0,
                overflow: 'hidden',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                border: `1px solid ${palette.blue.light1}`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  backgroundColor: palette.blue.light2,
                  padding: spacing[3],
                  borderBottom: `3px solid ${palette.blue.base}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                }}
              >
                <Icon
                  glyph="String"
                  size={32}
                  fill={palette.blue.dark1}
                />
                <Body
                  weight="medium"
                  style={{ color: palette.blue.dark2 }}
                >
                  Keyword Search
                </Body>
              </div>
              <div style={{ padding: spacing[3], flex: 1 }}>
                <Body>
                  Traditional text search excels at finding exact
                  terminology matches with MongoDB's Atlas Search.
                  Full-text search capabilities include fuzzy
                  matching, term boosting, and relevance scoring
                  optimized for technical documentation.
                </Body>
              </div>
              <div
                style={{
                  padding: spacing[3],
                  borderTop: `1px solid ${palette.gray.light2}`,
                }}
              >
                <Link href="/search?method=keyword">
                  <Button
                    variant="default"
                    size="small"
                    rightGlyph={<Icon glyph="ArrowRight" />}
                  >
                    Try Keyword Search
                  </Button>
                </Link>
              </div>
            </Card>

            <Card
              style={{
                padding: 0,
                overflow: 'hidden',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                border: `1px solid ${palette.purple.light1}`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  backgroundColor: palette.purple.light2,
                  padding: spacing[3],
                  borderBottom: `3px solid ${palette.purple.base}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                }}
              >
                <Icon
                  glyph="Settings"
                  size={32}
                  fill={palette.purple.dark1}
                />
                <Body
                  weight="medium"
                  style={{ color: palette.purple.dark2 }}
                >
                  Hybrid Search Methods
                </Body>
              </div>
              <div style={{ padding: spacing[3], flex: 1 }}>
                <Body>
                  Combine search approaches with customizable fusion
                  methods. MongoDB's flexible aggregation framework
                  enables sophisticated hybrid search techniques
                  including weighted combinations, reciprocal rank
                  fusion, and metadata filtering.
                </Body>
              </div>
              <div
                style={{
                  padding: spacing[3],
                  borderTop: `1px solid ${palette.gray.light2}`,
                }}
              >
                <Link href="/search?method=hybrid">
                  <Button
                    variant="default"
                    size="small"
                    rightGlyph={<Icon glyph="ArrowRight" />}
                  >
                    Try Hybrid Search
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* MongoDB integration */}
        <div style={{ marginBottom: spacing[5] }}>
          <Card
            style={{
              padding: spacing[4],
              border: `1px solid ${palette.green.light2}`,
              background: `linear-gradient(to right, white, ${lightBgColor})`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[4],
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: '1', minWidth: '280px' }}>
                <H2
                  style={{
                    color: palette.blue.dark1,
                    marginBottom: spacing[2],
                  }}
                >
                  Powered by MongoDB Atlas
                </H2>
                <Body style={{ marginBottom: spacing[3] }}>
                  This demo showcases how MongoDB Atlas provides a
                  unified platform for RAG applications, eliminating
                  the need for multiple specialized databases or
                  vector stores.
                </Body>
                <div
                  style={{
                    display: 'flex',
                    gap: spacing[2],
                    flexWrap: 'wrap',
                  }}
                >
                  <Badge variant="darkGray">Document Database</Badge>
                  <Badge variant="darkGray">Vector Search</Badge>
                  <Badge variant="darkGray">Full-Text Search</Badge>
                  <Badge variant="darkGray">
                    Aggregation Framework
                  </Badge>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '180px',
                  flex: '0 0 auto',
                }}
              >
                <div
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    padding: spacing[3],
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: `1px solid ${palette.green.light2}`,
                  }}
                >
                  <img
                    src={BRANDING.logoPath}
                    alt="Logo"
                    width={100}
                    height={100}
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* About section */}
        <div
          style={{
            marginTop: spacing[4],
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'left',
          }}
        >
          <H2
            style={{
              marginBottom: spacing[3],
              textAlign: 'center',
              color: palette.blue.dark1,
            }}
          >
            Technical Implementation Details
          </H2>

          <ExpandableCard
            title="Understanding Automotive Manual Chunking"
            description="Learn how manuals are processed for optimal search"
            defaultOpen={false}
            style={{
              marginBottom: spacing[3],
              border: `1px solid ${palette.gray.light2}`,
            }}
          >
            <Body style={{ marginBottom: spacing[3] }}>
              This application demonstrates how technical
              documentation like automotive manuals can be chunked,
              indexed, and searched using various approaches. The
              chunks shown here are extracted from real automotive
              manuals, processed into optimal segments for search and
              retrieval.
            </Body>
            <Body style={{ marginBottom: spacing[3] }}>
              <strong>What are chunks?</strong> Chunks are
              semantically meaningful sections of content that balance
              size, context, and coherence. Good chunks preserve
              procedural steps, safety notices, and related
              information.
            </Body>
            <div
              style={{
                backgroundColor: palette.gray.light3,
                padding: spacing[3],
                borderRadius: '4px',
                border: `1px solid ${palette.gray.light1}`,
              }}
            >
              <Body
                weight="medium"
                style={{ marginBottom: spacing[2] }}
              >
                Key chunking considerations for technical content:
              </Body>
              <ul style={{ marginLeft: spacing[3] }}>
                <li>
                  <Body>
                    Preserve procedure integrity - keep steps together
                  </Body>
                </li>
                <li>
                  <Body>
                    Maintain warning and safety notice context
                  </Body>
                </li>
                <li>
                  <Body>
                    Balance chunk size with contextual completeness
                  </Body>
                </li>
                <li>
                  <Body>
                    Extract metadata for enhanced filtering and
                    retrieval
                  </Body>
                </li>
              </ul>
            </div>
          </ExpandableCard>

          <ExpandableCard
            title="Search Methodology Comparison"
            description="Compare different search techniques"
            defaultOpen={false}
            style={{
              marginBottom: spacing[3],
              border: `1px solid ${palette.gray.light2}`,
            }}
          >
            <Body style={{ marginBottom: spacing[3] }}>
              <strong>Search Approaches:</strong> This demo implements
              multiple search strategies, each with distinct
              advantages:
            </Body>

            <div style={{ marginBottom: spacing[3] }}>
              <Body
                weight="medium"
                style={{
                  color: palette.green.dark2,
                  marginBottom: spacing[1],
                }}
              >
                Vector Search
              </Body>
              <Body style={{ marginBottom: spacing[2] }}>
                Uses dense vector embeddings to capture semantic
                meaning, enabling matches based on conceptual
                similarity even when exact keywords are missing.
              </Body>
              <InlineCode>
                db.manual_chunks.aggregate([
                {'{'}$vectorSearch: {'{'} ... {'}'}
                {'}'} ])
              </InlineCode>
            </div>

            <div style={{ marginBottom: spacing[3] }}>
              <Body
                weight="medium"
                style={{
                  color: palette.blue.dark2,
                  marginBottom: spacing[1],
                }}
              >
                Full-text Search
              </Body>
              <Body style={{ marginBottom: spacing[2] }}>
                Traditional lexical search that finds exact text
                matches with fuzzy matching capabilities for handling
                misspellings and variations.
              </Body>
              <InlineCode>
                db.manual_chunks.aggregate([
                {'{'}$search: {'{'} ... {'}'}
                {'}'} ])
              </InlineCode>
            </div>

            <div>
              <Body
                weight="medium"
                style={{
                  color: palette.purple.dark2,
                  marginBottom: spacing[1],
                }}
              >
                Hybrid Methods
              </Body>
              <Body style={{ marginBottom: spacing[2] }}>
                Combines both approaches using various techniques:
              </Body>
              <ul
                style={{
                  marginLeft: spacing[3],
                  marginBottom: spacing[2],
                }}
              >
                <li>
                  <Body>
                    <strong>Weighted:</strong> Adjustable weights for
                    vector and keyword results
                  </Body>
                </li>
                <li>
                  <Body>
                    <strong>RRF:</strong> Reciprocal Rank Fusion for
                    robust rank combination
                  </Body>
                </li>
                <li>
                  <Body>
                    <strong>Union/Intersection:</strong> Set
                    operations on result sets
                  </Body>
                </li>
                <li>
                  <Body>
                    <strong>Reranking:</strong> Initial broad search
                    refined by secondary precision search
                  </Body>
                </li>
              </ul>
            </div>
          </ExpandableCard>
        </div>

        {/* Footer notice */}
        <div
          style={{
            marginTop: spacing[5],
            textAlign: 'center',
            padding: spacing[3],
            backgroundColor: palette.blue.light3,
            borderRadius: '4px',
            border: `1px solid ${palette.blue.light1}`,
          }}
        >
          <Disclaimer style={{ color: palette.blue.dark2 }}>
            This is a technical demonstration using MongoDB Atlas for
            RAG applications on automotive manuals. The demonstration
            is intended for educational purposes only.
          </Disclaimer>
        </div>
      </div>
    </MainLayout>
  );
}

// Example card component for the "Try it" section
function ExampleCard({ title, description, href, icon, color }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <Card
        style={{
          padding: spacing[3],
          height: '100%',
          border: `1px solid ${color.light1}`,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[2],
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)',
          // Using inline hover styles with :hover won't work in React
          // Instead we'll use slightly elevated initial styling
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            marginBottom: spacing[1],
          }}
        >
          <Body weight="medium">{title}</Body>
        </div>
        <Body>{description}</Body>
      </Card>
    </Link>
  );
}

// Note: We're not using global styles directly anymore to avoid potential issues
