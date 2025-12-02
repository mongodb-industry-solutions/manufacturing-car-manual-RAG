'use client';

import React from 'react';
import {
  H1,
  H2,
  H3,
  Body,
  Description,
} from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import Button from '@leafygreen-ui/button';
import Icon from '@leafygreen-ui/icon';
import Link from 'next/link';
import Badge from '@leafygreen-ui/badge';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { APP_DESCRIPTION_DETAILED } from '@/constants/appConstants';
import { CARD_STYLES } from '@/lib/styleConstants';

const MainLayout = dynamic(() =>
  import('@/components/layout/MainLayout')
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
        {/* Enhanced Hero Section */}
        <div
          style={{
            ...CARD_STYLES.base,
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: spacing[6],
            marginTop: spacing[5],
            padding: `${spacing[6]}px ${spacing[5]}px`,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              marginBottom: spacing[3],
            }}
          >
            <Icon
              glyph="Resource"
              size={54}
              fill={palette.green.dark2}
            />
            <H1
              style={{
                margin: 0,
                textAlign: 'center',
                color: palette.gray.dark3,
                fontFamily: "'Euclid Circular A', sans-serif",
                fontSize: '52px',
                fontWeight: 400,
                lineHeight: '60px',
              }}
            >
              Car Manual Explorer
            </H1>
          </div>

          <H2
            style={{
              marginBottom: spacing[2],
              textAlign: 'center',
              color: palette.gray.dark1,
              fontFamily: "'Euclid Circular A', sans-serif",
              fontSize: '22px',
              fontWeight: 400,
              lineHeight: '30px',
            }}
          >
            Context-Aware Multimodal Retrieval for Technical Docs
          </H2>

          <Description
            style={{
              marginBottom: spacing[5],
              textAlign: 'center',
              color: palette.gray.base,
              fontFamily: "'Euclid Circular A', sans-serif",
              fontSize: '16px',
              fontWeight: 400,
            }}
          >
            Powered by MongoDB
          </Description>

          {/* CTA Buttons - REORDERED */}
          <div
            style={{
              display: 'flex',
              gap: spacing[4],
              marginBottom: spacing[5],
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

          {/* Professional Monochrome Badges */}
          <div
            style={{
              display: 'flex',
              gap: spacing[3],
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: spacing[2],
                padding: `${spacing[2]}px ${spacing[3]}px`,
                borderRadius: '20px',
                backgroundColor: 'white',
                border: `1.5px solid ${palette.gray.dark1}`,
                fontSize: '14px',
                fontWeight: 500,
                color: palette.gray.dark2,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
              }}
            >
              <Icon
                glyph="Database"
                size={18}
                fill={palette.gray.dark1}
              />
              <span>MongoDB Atlas</span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: spacing[2],
                padding: `${spacing[2]}px ${spacing[3]}px`,
                borderRadius: '20px',
                backgroundColor: 'white',
                border: `1.5px solid ${palette.gray.dark1}`,
                fontSize: '14px',
                fontWeight: 500,
                color: palette.gray.dark2,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
              }}
            >
              <Icon
                glyph="Diagram"
                size={18}
                fill={palette.gray.dark1}
              />
              <span>5 Retrieval Methods</span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: spacing[2],
                padding: `${spacing[2]}px ${spacing[3]}px`,
                borderRadius: '20px',
                backgroundColor: 'white',
                border: `1.5px solid ${palette.gray.dark1}`,
                fontSize: '14px',
                fontWeight: 500,
                color: palette.gray.dark2,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
              }}
            >
              <Icon
                glyph="Sparkle"
                size={18}
                fill={palette.gray.dark1}
              />
              <span>Voyage AI Powered</span>
            </div>
          </div>
        </div>

        {/* How It Works - Architecture Diagram */}
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
            How It Works
          </H2>

          <div
            style={{
              ...CARD_STYLES.base,
              padding: spacing[5],
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'white',
              marginBottom: spacing[4],
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '1000px',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
              }}
            >
              <Image
                src="/architecture-diagram.png"
                alt="Solution Architecture Diagram"
                width={1000}
                height={600}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
                priority
              />
            </div>
          </div>

          <Description
            style={{
              textAlign: 'center',
              maxWidth: '900px',
              marginLeft: 'auto',
              marginRight: 'auto',
              color: palette.gray.dark1,
              lineHeight: '1.7',
              fontSize: '16px',
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

        {/* Retrieval Methods & Reranking - Always Visible Cards */}
        <div
          style={{ marginBottom: spacing[5], marginTop: spacing[6] }}
        >
          <H2
            style={{
              textAlign: 'center',
              marginBottom: spacing[4],
              marginTop: spacing[5],
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
                'repeat(auto-fit, minmax(320px, 1fr))',
              gap: spacing[4],
            }}
          >
            {/* Card 1: Full-Text Search */}
            <div
              className="hover-lift"
              style={{
                ...CARD_STYLES.base,
                padding: spacing[4],
                border: `2px solid ${palette.green.base}`,
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[3],
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                }}
              >
                <Icon
                  glyph="MagnifyingGlass"
                  size={32}
                  fill={palette.green.base}
                />
                <div>
                  <H3
                    style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 700,
                      color: palette.gray.dark3,
                      fontFamily: "'Euclid Circular A', sans-serif",
                    }}
                  >
                    Full-Text Search
                  </H3>
                  <Body
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      color: palette.gray.dark1,
                    }}
                  >
                    Lexical keyword matching
                  </Body>
                </div>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: `${spacing[1]}px ${spacing[2]}px`,
                  backgroundColor: palette.blue.light2,
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: palette.green.dark2,
                  alignSelf: 'flex-start',
                }}
              >
                🔍 Atlas Search
              </div>

              <ul
                style={{
                  margin: 0,
                  paddingLeft: spacing[3],
                  color: palette.gray.dark1,
                  lineHeight: '1.6',
                  fontSize: '14px',
                }}
              >
                <li>Fuzzy matching & typo tolerance</li>
                <li>Stemming & synonyms</li>
                <li>Exact phrase searches</li>
              </ul>

              <Body
                style={{
                  fontSize: '13px',
                  fontStyle: 'italic',
                  color: palette.gray.base,
                  marginTop: 'auto',
                }}
              >
                Perfect for keyword-based queries
              </Body>
            </div>

            {/* Card 2: Vector Search */}
            <div
              className="hover-lift"
              style={{
                ...CARD_STYLES.base,
                padding: spacing[4],
                border: `2px solid ${palette.blue.base}`,
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[3],
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                }}
              >
                <Icon
                  glyph="Diagram"
                  size={32}
                  fill={palette.blue.base}
                />
                <div>
                  <H3
                    style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 700,
                      color: palette.gray.dark3,
                      fontFamily: "'Euclid Circular A', sans-serif",
                    }}
                  >
                    Vector Search
                  </H3>
                  <Body
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      color: palette.gray.dark1,
                    }}
                  >
                    Semantic similarity search
                  </Body>
                </div>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: `${spacing[1]}px ${spacing[2]}px`,
                  backgroundColor: palette.blue.light2,
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: palette.blue.dark2,
                  alignSelf: 'flex-start',
                }}
              >
                🧠 Vector Embeddings
              </div>

              <ul
                style={{
                  margin: 0,
                  paddingLeft: spacing[3],
                  color: palette.gray.dark1,
                  lineHeight: '1.6',
                  fontSize: '14px',
                }}
              >
                <li>Dense 768-dim embeddings</li>
                <li>Semantic similarity matching</li>
                <li>Conceptual understanding</li>
              </ul>

              <Body
                style={{
                  fontSize: '13px',
                  fontStyle: 'italic',
                  color: palette.gray.base,
                  marginTop: 'auto',
                }}
              >
                Ideal for natural language queries
              </Body>
            </div>

            {/* Card 3: Hybrid Search */}
            <div
              className="hover-lift"
              style={{
                ...CARD_STYLES.base,
                padding: spacing[4],
                border: `2px solid transparent`,
                backgroundImage: `linear-gradient(white, white), linear-gradient(135deg, ${palette.blue.base}, ${palette.green.base})`,
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[3],
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                }}
              >
                <Icon
                  glyph="Sparkle"
                  size={32}
                  fill={palette.purple.dark1}
                />
                <div>
                  <H3
                    style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 700,
                      color: palette.gray.dark3,
                      fontFamily: "'Euclid Circular A', sans-serif",
                    }}
                  >
                    Hybrid Search
                  </H3>
                  <Body
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      color: palette.gray.dark1,
                    }}
                  >
                    Combined retrieval methods
                  </Body>
                </div>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: `${spacing[1]}px ${spacing[2]}px`,
                  background: `linear-gradient(135deg, ${palette.blue.light2}, ${palette.green.light2})`,
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: palette.gray.dark3,
                  alignSelf: 'flex-start',
                }}
              >
                🔀 $rankFusion
              </div>

              <ul
                style={{
                  margin: 0,
                  paddingLeft: spacing[3],
                  color: palette.gray.dark1,
                  lineHeight: '1.6',
                  fontSize: '14px',
                }}
              >
                <li>Combines vector + full-text</li>
                <li>Reciprocal Rank Fusion (RRF)</li>
                <li>Optimal accuracy across queries</li>
              </ul>

              <Body
                style={{
                  fontSize: '13px',
                  fontStyle: 'italic',
                  color: palette.gray.base,
                  marginTop: 'auto',
                }}
              >
                Best of both semantic & lexical
              </Body>
            </div>

            {/* Card 4: Graph Search */}
            <div
              className="hover-lift"
              style={{
                ...CARD_STYLES.base,
                padding: spacing[4],
                border: `2px solid ${palette.red.base}`,
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[3],
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                }}
              >
                <Icon
                  glyph="Relationship"
                  size={32}
                  fill={palette.red.base}
                />
                <div>
                  <H3
                    style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 700,
                      color: palette.gray.dark3,
                      fontFamily: "'Euclid Circular A', sans-serif",
                    }}
                  >
                    Graph Search (GraphRAG)
                  </H3>
                  <Body
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      color: palette.gray.dark1,
                    }}
                  >
                    Relationship-aware traversal
                  </Body>
                </div>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: `${spacing[1]}px ${spacing[2]}px`,
                  backgroundColor: palette.red.light2,
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: palette.red.dark2,
                  alignSelf: 'flex-start',
                }}
              >
                🔗 $graphLookup
              </div>

              <ul
                style={{
                  margin: 0,
                  paddingLeft: spacing[3],
                  color: palette.gray.dark1,
                  lineHeight: '1.6',
                  fontSize: '14px',
                }}
              >
                <li>Knowledge graph traversal</li>
                <li>Document relationships</li>
                <li>Connected information discovery</li>
              </ul>

              <Body
                style={{
                  fontSize: '13px',
                  fontStyle: 'italic',
                  color: palette.gray.base,
                  marginTop: 'auto',
                }}
              >
                Discovers related procedures
              </Body>
            </div>

            {/* Card 5: Multimodal Search */}
            <div
              className="hover-lift"
              style={{
                ...CARD_STYLES.base,
                padding: spacing[4],
                border: `2px solid ${palette.yellow.base}`,
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[3],
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                }}
              >
                <Icon
                  glyph="Camera"
                  size={32}
                  fill={palette.yellow.dark2}
                />
                <div>
                  <H3
                    style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 700,
                      color: palette.gray.dark3,
                      fontFamily: "'Euclid Circular A', sans-serif",
                    }}
                  >
                    Multimodal Search
                  </H3>
                  <Body
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      color: palette.gray.dark1,
                    }}
                  >
                    Visual and text search
                  </Body>
                </div>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: `${spacing[1]}px ${spacing[2]}px`,
                  backgroundColor: palette.yellow.light2,
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: palette.yellow.dark2,
                  alignSelf: 'flex-start',
                }}
              >
                📸 Voyage Multimodal
              </div>

              <ul
                style={{
                  margin: 0,
                  paddingLeft: spacing[3],
                  color: palette.gray.dark1,
                  lineHeight: '1.6',
                  fontSize: '14px',
                }}
              >
                <li>Text-to-image search</li>
                <li>Image-to-image search</li>
                <li>1024-dim embeddings</li>
              </ul>

              <Body
                style={{
                  fontSize: '13px',
                  fontStyle: 'italic',
                  color: palette.gray.base,
                  marginTop: 'auto',
                }}
              >
                Find diagrams & schematics visually
              </Body>
            </div>

            {/* Card 6: Voyage AI Reranking */}
            <div
              className="hover-lift"
              style={{
                ...CARD_STYLES.base,
                padding: spacing[4],
                border: `2px solid ${palette.purple.dark1}`,
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[3],
                background: `linear-gradient(135deg, white 0%, ${palette.purple.light2} 100%)`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                }}
              >
                <Icon
                  glyph="Sparkle"
                  size={32}
                  fill={palette.purple.dark1}
                />
                <div>
                  <H3
                    style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 700,
                      color: palette.gray.dark3,
                      fontFamily: "'Euclid Circular A', sans-serif",
                    }}
                  >
                    Voyage AI Reranking
                  </H3>
                  <Body
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      color: palette.gray.dark1,
                    }}
                  >
                    Intelligent result optimization
                  </Body>
                </div>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: `${spacing[1]}px ${spacing[2]}px`,
                  backgroundColor: palette.purple.light1,
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: palette.purple.dark2,
                  alignSelf: 'flex-start',
                }}
              >
                ✨ Rerank-2.5
              </div>

              <ul
                style={{
                  margin: 0,
                  paddingLeft: spacing[3],
                  color: palette.gray.dark1,
                  lineHeight: '1.6',
                  fontSize: '14px',
                }}
              >
                <li>Re-scores all results</li>
                <li>Semantic relevance boost</li>
                <li>Works with text-based methods</li>
              </ul>

              <Body
                style={{
                  fontSize: '13px',
                  fontStyle: 'italic',
                  color: palette.gray.base,
                  marginTop: 'auto',
                }}
              >
                Final optimization for max accuracy
              </Body>
            </div>
          </div>
        </div>

        {/* Engaging CTA Section */}
        <div
          style={{
            textAlign: 'center',
            background: `linear-gradient(135deg, ${palette.green.light3} 0%, ${palette.blue.light3} 100%)`,
            borderRadius: '16px',
            padding: `${spacing[6]}px ${spacing[5]}px`,
            marginBottom: spacing[4],
            border: `1px solid ${palette.gray.light2}`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          }}
        >
          <H2
            style={{
              marginBottom: spacing[3],
              color: palette.gray.dark3,
              fontFamily: "'Euclid Circular A', sans-serif",
              fontSize: '32px',
              fontWeight: 450,
            }}
          >
            Ready to Explore?
          </H2>

          {/* CTA Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: spacing[3],
            }}
          >
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

            <Link href="/browse">
              <div style={{ display: 'inline-block' }}>
                <Button variant="default" size="large">
                  Browse Chunks
                </Button>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
