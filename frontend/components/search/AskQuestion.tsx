/**
 * Ask question component for RAG-powered Q&A
 */
import React, { useState } from 'react';
import { MyCard as Card } from '@/components/ui/TypographyWrapper';
import { MyH3 as H3, MyBody as Body, MySubtitle as Subtitle } from '@/components/ui/TypographyWrapper';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import { MyButton as Button } from '@/components/ui/TypographyWrapper';
import Icon from '@leafygreen-ui/icon';
import TextInput from '@leafygreen-ui/text-input';
import { MySpinner as Spinner } from '@/components/ui/TypographyWrapper';
import Tooltip from '@leafygreen-ui/tooltip';
import Callout from '@leafygreen-ui/callout';
import ExpandableCard from '@leafygreen-ui/expandable-card';
import { AskResponse } from '../../types/Search';
import { useRAG } from '../../hooks/useRAG';

interface AskQuestionProps {
  initialQuestion?: string;
  onSourceClick?: (sourceId: string) => void;
}

const AskQuestion: React.FC<AskQuestionProps> = ({ 
  initialQuestion = '',
  onSourceClick
}) => {
  const [question, setQuestion] = useState(initialQuestion);
  const { askQuestion, answer, loading, error } = useRAG();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      try {
        await askQuestion(question);
      } catch (err) {
        console.error('Failed to get answer:', err);
      }
    }
  };

  return (
    <div>
      <Card style={{ marginBottom: spacing[3], padding: spacing[3] }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] }}>
          <Icon glyph="Support" size="large" fill={palette.green.base} />
          <div>
            <H3 style={{ margin: 0 }}>Ask about your car manual</H3>
            <Body size="small">
              Get AI-powered answers based on your car manual
            </Body>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: spacing[3] }}>
            <TextInput
              label="Your Question"
              description="Ask any question about your vehicle"
              placeholder="How do I check the oil level in my car?"
              onChange={e => setQuestion(e.target.value)}
              value={question}
              disabled={loading}
            />
          </div>

          <Button
            variant="primary"
            type="submit"
            disabled={loading || !question.trim()}
            leftGlyph={loading ? <Spinner /> : <Icon glyph="Help" />}
          >
            {loading ? 'Getting Answer...' : 'Ask Question'}
          </Button>
        </form>
      </Card>

      {/* Error state */}
      {error && (
        <div style={{ marginBottom: spacing[3] }}>
          <Callout
            variant="warning"
            title="Error"
          >
            <Body>{error}</Body>
          </Callout>
        </div>
      )}

      {/* Answer display */}
      {answer && (
        <Card style={{ marginBottom: spacing[3], padding: spacing[3] }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: spacing[2], 
            marginBottom: spacing[3],
            borderBottom: `1px solid ${palette.gray.light2}`,
            paddingBottom: spacing[3]
          }}>
            <Icon glyph="Person" size="large" />
            <div>
              <Subtitle>Your Question</Subtitle>
              <Body>{answer.query}</Body>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: spacing[2], 
            marginBottom: spacing[3] 
          }}>
            <Icon glyph="Person" size="large" fill={palette.green.base} />
            <div>
              <Subtitle>Answer</Subtitle>
              <Body>{answer.answer}</Body>
            </div>
          </div>

          {/* Sources expandable section */}
          {answer.sources && answer.sources.length > 0 && (
            <ExpandableCard 
              title={`Sources (${answer.sources.length})`}
              defaultOpen={false}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                {answer.sources.map((source, index) => (
                  <Card 
                    key={source.id}
                    style={{ 
                      padding: spacing[2],
                      cursor: onSourceClick ? 'pointer' : 'default'
                    }}
                    onClick={() => onSourceClick && onSourceClick(source.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing[1] }}>
                      <Body weight="medium">{source.heading || `Source ${index + 1}`}</Body>
                      <Body size="small" style={{ color: palette.gray.dark1 }}>
                        {Math.round(source.score * 100)}% match
                      </Body>
                    </div>
                    <Body size="small" style={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {source.text}
                    </Body>
                  </Card>
                ))}
              </div>
            </ExpandableCard>
          )}
        </Card>
      )}
    </div>
  );
};

export default AskQuestion;