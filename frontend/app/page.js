'use client';

import { H1, H2, Body, Subtitle } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import ExpandableCard from '@leafygreen-ui/expandable-card';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import Button from '@leafygreen-ui/button';
import Icon from '@leafygreen-ui/icon';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Badge from '@leafygreen-ui/badge';
import dynamic from 'next/dynamic';
import Callout from '@leafygreen-ui/callout';

const MainLayout = dynamic(() =>
  import('@/components/layout/MainLayout')
);

export default function Home() {
  const router = useRouter();

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
            marginTop: spacing[4],
            background: `linear-gradient(to right, ${palette.green.light3}, ${palette.blue.light3})`,
            borderRadius: '12px',
            padding: `${spacing[4]}px ${spacing[3]}px`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: spacing[2],
            }}
          >
            <div
              style={{
                backgroundColor: palette.green.light2,
                borderRadius: '50%',
                padding: spacing[3],
                marginBottom: spacing[2],
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Icon
                glyph="Database"
                size={50}
                fill={palette.green.base}
              />
            </div>
          </div>

          <H1
            style={{ marginBottom: spacing[3], textAlign: 'center' }}
          >
            Technical Car Manual Explorer
          </H1>

          <Subtitle
            style={{
              marginBottom: spacing[4],
              maxWidth: '800px',
              textAlign: 'center',
            }}
          >
            An interactive demo showcasing intelligent search and RAG
            on technical documentation
          </Subtitle>

          <div
            style={{
              display: 'flex',
              gap: spacing[2],
              marginBottom: spacing[4],
            }}
          >
            <Link href="/search">
              <div style={{ display: 'inline-block' }}>
                <Button
                  variant="primary"
                  size="large"
                  leftGlyph={<Icon glyph="MagnifyingGlass" />}
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
                  leftGlyph={<Icon glyph="Table" />}
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
            <Badge variant="blue">Keyword Search</Badge>
            <Badge variant="green">Vector Search</Badge>
            <Badge variant="purple">Hybrid Methods</Badge>
          </div>
        </div>

        {/* Feature cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(250px, 1fr))',
            justifyContent: 'center',
            marginTop: spacing[4],
            gap: spacing[4],
            marginBottom: spacing[5],
          }}
        >
          <Card
            style={{
              padding: 0,
              textAlign: 'center',
              overflow: 'hidden',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              border: 'none',
            }}
          >
            <div
              style={{
                backgroundColor: palette.yellow.light2,
                padding: spacing[2],
                borderBottom: `3px solid ${palette.yellow.base}`,
              }}
            >
              <Icon
                glyph="Documents"
                size="large"
                fill={palette.yellow.dark1}
              />
            </div>
            <div style={{ padding: spacing[3] }}>
              <Body
                weight="medium"
                style={{ marginBottom: spacing[2] }}
              >
                Technical Manual Chunking
              </Body>
              <Body>
                See how technical manuals are chunked to optimize for
                search and contextual understanding
              </Body>
            </div>
          </Card>
          <Card
            style={{
              padding: 0,
              textAlign: 'center',
              overflow: 'hidden',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              border: 'none',
            }}
          >
            <div
              style={{
                backgroundColor: palette.green.light2,
                padding: spacing[2],
                borderBottom: `3px solid ${palette.green.base}`,
              }}
            >
              <Icon
                glyph="Diagram"
                size="large"
                fill={palette.green.dark1}
              />
            </div>
            <div style={{ padding: spacing[3] }}>
              <Body
                weight="medium"
                style={{ marginBottom: spacing[2] }}
              >
                Vector Search
              </Body>
              <Body>
                Uses vector embeddings to find results based on
                semantic meaning and context
              </Body>
            </div>
          </Card>

          <Card
            style={{
              padding: 0,
              textAlign: 'center',
              overflow: 'hidden',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              border: 'none',
            }}
          >
            <div
              style={{
                backgroundColor: palette.blue.light2,
                padding: spacing[2],
                borderBottom: `3px solid ${palette.blue.base}`,
              }}
            >
              <Icon
                glyph="String"
                size="large"
                fill={palette.blue.dark1}
              />
            </div>
            <div style={{ padding: spacing[3] }}>
              <Body
                weight="medium"
                style={{ marginBottom: spacing[2] }}
              >
                Keyword Search
              </Body>
              <Body>
                Traditional lexical search with exact and fuzzy
                matching capabilities
              </Body>
            </div>
          </Card>

          <Card
            style={{
              padding: 0,
              textAlign: 'center',
              overflow: 'hidden',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              border: 'none',
            }}
          >
            <div
              style={{
                backgroundColor: palette.purple.light2,
                padding: spacing[2],
                borderBottom: `3px solid ${palette.purple.base}`,
              }}
            >
              <Icon
                glyph="Settings"
                size="large"
                fill={palette.purple.dark1}
              />
            </div>
            <div style={{ padding: spacing[3] }}>
              <Body
                weight="medium"
                style={{ marginBottom: spacing[2] }}
              >
                Hybrid Search Methods
              </Body>
              <Body>
                Combine search approaches with methods like weighted,
                RRF, union, and intersection
              </Body>
            </div>
          </Card>
        </div>

        {/* Try it out section */}
        <div style={{ marginBottom: spacing[4] }}>
          <Callout variant="note" title="Try it yourself!">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[2],
              }}
            >
              <Body>
                Search for these topics to see how different search
                methods perform:
              </Body>
              <div
                style={{
                  display: 'flex',
                  gap: spacing[2],
                  flexWrap: 'wrap',
                }}
              >
                <Link href="/search?q=how%20to%20change%20a%20flat%20tire&method=hybrid">
                  <div style={{ display: 'inline-block' }}>
                    <Button variant="default" size="small">
                      Change flat tire
                    </Button>
                  </div>
                </Link>
                <Link href="/search?q=oil%20change%20procedure&method=hybrid">
                  <div style={{ display: 'inline-block' }}>
                    <Button variant="default" size="small">
                      Oil change procedure
                    </Button>
                  </div>
                </Link>
                <Link href="/search?q=engine%20warning%20light&method=hybrid">
                  <div style={{ display: 'inline-block' }}>
                    <Button variant="default" size="small">
                      Engine warning light
                    </Button>
                  </div>
                </Link>
                <Link href="/search?q=brake%20fluid%20replacement&method=hybrid">
                  <div style={{ display: 'inline-block' }}>
                    <Button variant="default" size="small">
                      Brake fluid
                    </Button>
                  </div>
                </Link>
              </div>
            </div>
          </Callout>
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
            }}
          >
            About This Demo
          </H2>

          <ExpandableCard
            title="Understanding Technical Manual Chunking"
            description="Learn how manuals are processed for optimal search"
            defaultOpen={true}
          >
            <Body style={{ marginBottom: spacing[3] }}>
              This application demonstrates how technical
              documentation like car manuals can be chunked, indexed,
              and searched using various approaches. The chunks shown
              here are extracted from real car manuals, processed into
              optimal segments for search and retrieval.
            </Body>
            <Body style={{ marginBottom: spacing[3] }}>
              <strong>What are chunks?</strong> Chunks are
              semantically meaningful sections of content that balance
              size, context, and coherence. Good chunks preserve
              procedural steps, safety notices, and related
              information.
            </Body>
          </ExpandableCard>

          <ExpandableCard
            title="Search Methodology Comparison"
            description="Compare different search techniques"
            defaultOpen={true}
            style={{ marginTop: spacing[3] }}
          >
            <Body>
              <strong>Search Approaches:</strong> Experiment with
              different search methods to see how they perform on
              technical content:
              <ul
                style={{
                  marginTop: spacing[2],
                  marginLeft: spacing[4],
                }}
              >
                <li>
                  <strong>Vector search</strong> uses vector
                  embeddings to find meaning-based matches
                </li>
                <li>
                  <strong>Full-text search</strong> looks for exact
                  text matches
                </li>
                <li>
                  <strong>Hybrid search</strong> combines both
                  approaches with various combining methods
                </li>
              </ul>
            </Body>
          </ExpandableCard>
        </div>
      </div>
    </MainLayout>
  );
}
