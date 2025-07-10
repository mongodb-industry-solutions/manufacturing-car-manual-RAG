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
            marginBottom: spacing[4],
            marginTop: spacing[3],
            background: `linear-gradient(135deg, ${palette.gray.light3}, ${palette.blue.light3})`,
            borderRadius: '8px',
            padding: spacing[4],
            border: `1px solid ${palette.gray.light2}`,
          }}
        >
          <H1
            style={{
              marginBottom: spacing[2],
              textAlign: 'center',
              color: palette.gray.dark3,
            }}
          >
            {BRANDING.title}
          </H1>

          <Subtitle
            style={{
              marginBottom: spacing[3],
              maxWidth: '600px',
              textAlign: 'center',
              color: palette.gray.dark2,
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
            <Badge variant="red">Hybrid Search</Badge>
            <Badge variant="darkgray">MongoDB Atlas</Badge>
          </div>
        </div>

        {/* Context section */}
        <div style={{ marginBottom: spacing[4] }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: spacing[3],
            }}
          >
            {/* Challenge Card */}
            <Card
              style={{
                padding: spacing[3],
                border: `1px solid ${palette.gray.light2}`,
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
              <Body style={{ color: palette.gray.dark1 }}>
                Automotive technicians waste hours searching through fragmented documentation systems for repair procedures, while customers struggle with static PDF manuals for simple questions like dashboard warning explanations.
              </Body>
            </Card>

            {/* Opportunity Card */}
            <Card
              style={{
                padding: spacing[3],
                border: `1px solid ${palette.gray.light2}`,
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
              <Body style={{ color: palette.gray.dark1 }}>
                Transform static technical documentation into intelligent, searchable knowledge bases that serve both professional technicians and everyday customers through the same unified platform.
              </Body>
            </Card>

            {/* Demo Card */}
            <Card
              style={{
                padding: spacing[3],
                border: `1px solid ${palette.gray.light2}`,
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
                  glyph="Play"
                  size="small"
                  fill={palette.green.base}
                />
                <H3
                  style={{ 
                    color: palette.gray.dark3,
                    margin: 0,
                  }}
                >
                  This Demo Shows
                </H3>
              </div>
              <Body style={{ color: palette.gray.dark1 }}>
                How MongoDB Atlas enables semantic search across automotive manuals - finding relevant content whether you search for specific keywords or natural language like "why is my engine making a clicking noise."
              </Body>
            </Card>
          </div>
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
