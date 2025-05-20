/**
 * MongoDB Filter Visualization Component
 * Displays the MongoDB aggregation pipeline used for filtering car manual chunks
 */
import React from 'react';
import ExpandableCard from '@leafygreen-ui/expandable-card';
import { MyBody as Body, MyH3 as H3 } from '@/components/ui/TypographyWrapper';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import Code from '@leafygreen-ui/code';
import Icon from '@leafygreen-ui/icon';
import Badge from '@leafygreen-ui/badge';
import Tooltip from '@leafygreen-ui/tooltip';

interface MongoDBFilterVisualizationProps {
  filters: {
    contentType: string[];
    vehicleSystems: string[];
    hasSafetyNotices: boolean;
    hasProcedures: boolean;
  };
  textFilter: string;
  totalResults: number;
  filteredResults: number;
}

const MongoDBFilterVisualization: React.FC<MongoDBFilterVisualizationProps> = ({
  filters,
  textFilter,
  totalResults,
  filteredResults
}) => {
  // Check if any filters are active
  const hasActiveFilters = filters.contentType.length > 0 || 
                           filters.vehicleSystems.length > 0 || 
                           filters.hasSafetyNotices || 
                           filters.hasProcedures || 
                           textFilter.trim().length > 0;

  // Generate MongoDB aggregation pipeline based on active filters
  const generatePipeline = (): string => {
    const pipeline = ['db.chunks.aggregate(['];
    const stages = [];
    
    // Match stage for content type
    if (filters.contentType.length > 0) {
      stages.push(`  {
    $match: {
      content_type: { 
        $in: ${JSON.stringify(filters.contentType)} 
      }
    }
  }`);
    }
    
    // Match stage for vehicle systems - check both vehicle_systems and metadata.systems
    if (filters.vehicleSystems.length > 0) {
      stages.push(`  {
    $match: {
      $or: [
        { vehicle_systems: { $in: ${JSON.stringify(filters.vehicleSystems)} } },
        { "metadata.systems": { $in: ${JSON.stringify(filters.vehicleSystems)} } }
      ]
    }
  }`);
    }
    
    // Match stage for safety notices - check all safety indicators
    if (filters.hasSafetyNotices) {
      stages.push(`  {
    $match: {
      $or: [
        { "safety_notices.0": { $exists: true } },
        { "metadata.has_safety": true },
        { "content_type": "safety" },
        { text: { $regex: "⚠️|WARNING|CAUTION", $options: "i" } }
      ]
    }
  }`);
    }
    
    // Match stage for procedural steps - check all procedure indicators
    if (filters.hasProcedures) {
      stages.push(`  {
    $match: {
      $or: [
        { "procedural_steps.0": { $exists: true } },
        { "content_type": { $in: ["procedure", "procedural"] } },
        { text: { $regex: "\\\\d+\\\\.\\\\s+[A-Z]|Step\\\\s+\\\\d+", $options: "i" } }
      ]
    }
  }`);
    }
    
    // Match stage for text search
    if (textFilter.trim().length > 0) {
      stages.push(`  {
    $match: {
      $or: [
        { text: { $regex: "${textFilter}", $options: "i" } },
        { heading_level_1: { $regex: "${textFilter}", $options: "i" } },
        { heading_level_2: { $regex: "${textFilter}", $options: "i" } },
        { heading_level_3: { $regex: "${textFilter}", $options: "i" } }
      ]
    }
  }`);
    }
    
    // Add $count stage to show result count
    stages.push(`  {
    $count: "total_filtered"
  }`);
    
    // Join stages with commas
    pipeline.push(stages.join(',\n'));
    pipeline.push('])');
    
    return pipeline.join('\n');
  };

  // Generate explainer content based on active filters
  const generateExplainer = (): JSX.Element => {
    if (!hasActiveFilters) {
      return (
        <Body>
          No filters are currently active. When you apply filters, this panel will show the equivalent MongoDB aggregation pipeline.
        </Body>
      );
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
        <div>
          <H3 style={{ marginBottom: spacing[1] }}>Active MongoDB Filters</H3>
          <Body style={{ marginBottom: spacing[2] }}>
            The following MongoDB aggregation pipeline is used to filter the chunks:
          </Body>
        </div>
        
        <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap', marginBottom: spacing[2] }}>
          {filters.contentType.length > 0 && (
            <Tooltip
              trigger={
                <Badge variant="blue">$match content_type</Badge>
              }
              triggerEvent="hover"
            >
              Filters chunks by content type: {filters.contentType.join(', ')}
            </Tooltip>
          )}
          
          {filters.vehicleSystems.length > 0 && (
            <Tooltip
              trigger={
                <Badge variant="green">$match vehicle_systems</Badge>
              }
              triggerEvent="hover"
            >
              Filters chunks by vehicle systems using $or operator to check both vehicle_systems field and metadata.systems: {filters.vehicleSystems.join(', ')}
            </Tooltip>
          )}
          
          {filters.hasSafetyNotices && (
            <Tooltip
              trigger={
                <Badge variant="red">$match safety information</Badge>
              }
              triggerEvent="hover"
            >
              Filters for chunks containing safety information using multiple indicators: explicit safety_notices, metadata.has_safety flag, safety content type, and safety-related text (warnings, cautions)
            </Tooltip>
          )}
          
          {filters.hasProcedures && (
            <Tooltip
              trigger={
                <Badge variant="yellow">$match procedural content</Badge>
              }
              triggerEvent="hover"
            >
              Filters for chunks containing procedural content using multiple indicators: explicit procedural_steps, procedure content type, and text patterns for numbered steps
            </Tooltip>
          )}
          
          {textFilter.trim().length > 0 && (
            <Tooltip
              trigger={
                <Badge variant="darkGray">$match text search</Badge>
              }
              triggerEvent="hover"
            >
              Searches for "{textFilter}" in chunk text and headings
            </Tooltip>
          )}
        </div>
        
        <div style={{ backgroundColor: palette.gray.light3, padding: spacing[3], borderRadius: '4px' }}>
          <Code language="javascript" copyable="true">
            {generatePipeline()}
          </Code>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Body weight="medium">Filter Performance</Body>
            <Body size="small">
              {filteredResults} of {totalResults} chunks match these filters ({Math.round((filteredResults / totalResults) * 100)}%)
            </Body>
          </div>
          
          <div style={{ 
            padding: spacing[2], 
            backgroundColor: palette.green.light3, 
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2]
          }}>
            <Icon glyph="Database" fill={palette.green.base} />
            <Body size="small" style={{ color: palette.green.dark2 }}>
              Powered by MongoDB Aggregation
            </Body>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ExpandableCard
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
          <Icon glyph="Diagram" fill={palette.green.base} />
          <span>MongoDB Filter Pipeline</span>
          {hasActiveFilters && (
            <Badge variant="green">
              {filteredResults} matching chunks
            </Badge>
          )}
        </div>
      }
      description="View the MongoDB aggregation pipeline used to filter chunks"
      defaultOpen={hasActiveFilters}
      style={{ 
        marginBottom: spacing[3],
        border: `1px solid ${palette.green.light2}`,
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)'
      }}
    >
      {generateExplainer()}
    </ExpandableCard>
  );
};

export default MongoDBFilterVisualization;