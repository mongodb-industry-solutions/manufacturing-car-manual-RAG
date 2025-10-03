/**
 * Knowledge Graph Visualization Component using Cytoscape.js
 * Displays interactive knowledge graphs for GraphRAG search results
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';
import Modal from '@leafygreen-ui/modal';
import { MyButton as Button } from '@/components/ui/TypographyWrapper';
import { MyH3 as H3, MyBody as Body } from '@/components/ui/TypographyWrapper';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import Icon from '@leafygreen-ui/icon';
import { ParagraphSkeleton } from '@leafygreen-ui/skeleton-loader';
import { RadioGroup, Radio } from '@leafygreen-ui/radio-group';

import { searchService } from '@/services/searchService';
import { KnowledgeGraphResponse } from '@/types/Search';

interface KnowledgeGraphVisualizationProps {
  isOpen: boolean;
  onClose: () => void;
  query?: string;
  chunkIds?: string[];
  maxNodes?: number;
  maxDepth?: number;
}

const KnowledgeGraphVisualization: React.FC<KnowledgeGraphVisualizationProps> = ({
  isOpen,
  onClose,
  query,
  chunkIds,
  maxNodes = 50,
  maxDepth = 2
}) => {
  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<cytoscape.Core | null>(null);
  const [graphData, setGraphData] = useState<KnowledgeGraphResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<'cose' | 'circle' | 'breadthfirst'>('cose');
  
  // Fetch knowledge graph data from API
  const fetchKnowledgeGraph = useCallback(async () => {
    if (!query && (!chunkIds || chunkIds.length === 0)) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await searchService.getKnowledgeGraph(
        query,
        chunkIds,
        maxNodes,
        maxDepth
      );
      setGraphData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch knowledge graph';
      setError(errorMessage);
      console.error('Error fetching knowledge graph:', err);
    } finally {
      setLoading(false);
    }
  }, [query, chunkIds, maxNodes, maxDepth]);

  // Fetch data when modal opens and parameters change
  useEffect(() => {
    if (isOpen && (query || (chunkIds && chunkIds.length > 0))) {
      fetchKnowledgeGraph();
    }
  }, [isOpen, fetchKnowledgeGraph]);

  // Initialize and render Cytoscape graph
  useEffect(() => {
    if (graphData && cyRef.current && isOpen && !loading) {
      renderCytoscapeGraph(graphData);
    }

    // Cleanup on unmount or modal close
    return () => {
      if (cyInstance.current) {
        cyInstance.current.destroy();
        cyInstance.current = null;
      }
    };
  }, [graphData, isOpen, loading]);

  const getLayoutConfig = (layoutName: string) => {
    const baseConfig = {
      animate: true,
      animationDuration: 1000,
      fit: true,
      padding: 40
    };

    switch (layoutName) {
      case 'circle':
        return {
          ...baseConfig,
          name: 'circle',
          radius: 200,
          spacing: 20
        };
      case 'breadthfirst':
        return {
          ...baseConfig,
          name: 'breadthfirst',
          directed: true,
          spacingFactor: 1.5,
          avoidOverlap: true,
          nodeDimensionsIncludeLabels: true
        };
      case 'cose':
      default:
        return {
          ...baseConfig,
          name: 'cose',
          nodeOverlap: 20,
          idealEdgeLength: 100,
          edgeElasticity: 100,
          nestingFactor: 5,
          gravity: 80,
          numIter: 1000,
          coolingFactor: 0.99,
          minTemp: 1.0
        };
    }
  };

  const getModernStyle = (originalStyle: any[]) => {
    return [
      {
        selector: 'node',
        style: {
          'background-color': '#00ED64',
          'label': 'data(label)',
          'text-valign': 'center',
          'text-halign': 'center',
          'font-size': '12px',
          'font-weight': '600',
          'color': '#001E2B',
          'text-outline-width': '2px',
          'text-outline-color': '#FFFFFF',
          'width': '50px',
          'height': '50px',
          'border-width': '2px',
          'border-color': '#FFFFFF',
          'background-gradient-direction': 'to-bottom-right',
          'background-gradient-stop-colors': '#00ED64 #13AA52',
          'box-shadow': '0 4px 8px rgba(0,0,0,0.15)',
          'text-wrap': 'wrap',
          'text-max-width': '120px',
          'transition-property': 'background-color, border-color, width, height',
          'transition-duration': '0.3s'
        }
      },
      {
        selector: '.seed-node',
        style: {
          'background-gradient-stop-colors': '#001E2B #13274B',
          'color': '#FFFFFF',
          'border-width': '3px',
          'border-color': '#FFC010',
          'width': '60px',
          'height': '60px',
          'box-shadow': '0 6px 12px rgba(255,192,16,0.3)'
        }
      },
      {
        selector: '.system-node',
        style: {
          'background-gradient-stop-colors': '#FFC010 #E6AC00',
          'shape': 'round-rectangle',
          'width': '45px',
          'height': '35px',
          'color': '#001E2B'
        }
      },
      {
        selector: '.contenttype-node',
        style: {
          'background-gradient-stop-colors': '#FF6B47 #E85A42',
          'shape': 'diamond',
          'width': '40px',
          'height': '40px',
          'color': '#FFFFFF'
        }
      },
      {
        selector: 'node:hover, .hovered',
        style: {
          'width': '65px',
          'height': '65px',
          'box-shadow': '0 8px 16px rgba(0,0,0,0.25)',
          'border-width': '3px',
          'z-index': 999
        }
      },
      {
        selector: '.highlighted',
        style: {
          'border-color': '#FF6B47',
          'border-width': '4px',
          'box-shadow': '0 0 20px rgba(255,107,71,0.5)'
        }
      },
      {
        selector: '.connected',
        style: {
          'border-color': '#13AA52',
          'border-width': '3px',
          'opacity': 0.8
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 3,
          'line-color': '#89979B',
          'target-arrow-color': '#89979B',
          'target-arrow-shape': 'triangle',
          'target-arrow-size': '8px',
          'curve-style': 'bezier',
          'arrow-scale': 1.2,
          'opacity': 0.8,
          'transition-property': 'line-color, target-arrow-color, width',
          'transition-duration': '0.3s'
        }
      },
      {
        selector: 'edge:hover, .hovered',
        style: {
          'width': 4,
          'opacity': 1,
          'z-index': 999
        }
      },
      {
        selector: '.edge-sequential-to',
        style: {
          'line-color': '#00ED64',
          'target-arrow-color': '#00ED64',
          'width': 4,
          'line-style': 'solid'
        }
      },
      {
        selector: '.edge-related-to',
        style: {
          'line-color': '#001E2B',
          'target-arrow-color': '#001E2B',
          'width': 3
        }
      },
      {
        selector: '.edge-mentions-system',
        style: {
          'line-color': '#FFC010',
          'target-arrow-color': '#FFC010',
          'line-style': 'dashed',
          'width': 2
        }
      },
      {
        selector: '.edge-is-of-type',
        style: {
          'line-color': '#FF6B47',
          'target-arrow-color': '#FF6B47',
          'line-style': 'dotted',
          'width': 2
        }
      },
      {
        selector: '.highlighted',
        style: {
          'line-color': '#FF6B47',
          'target-arrow-color': '#FF6B47',
          'width': 5,
          'opacity': 1
        }
      }
    ];
  };

  const renderCytoscapeGraph = (data: KnowledgeGraphResponse) => {
    if (!cyRef.current || !data?.elements) return;

    // Destroy existing instance
    if (cyInstance.current) {
      cyInstance.current.destroy();
    }

    try {
      // Initialize Cytoscape with modern styling and selected layout
      cyInstance.current = cytoscape({
        container: cyRef.current,
        elements: data.elements,
        style: getModernStyle(data.style),
        layout: getLayoutConfig(selectedLayout),
        wheelSensitivity: 0.3,
        minZoom: 0.2,
        maxZoom: 4
      });

      // Add event handlers for interaction
      setupCytoscapeEventHandlers();

      // Highlight seed nodes if specified
      if (data.highlighted_node_ids && data.highlighted_node_ids.length > 0) {
        data.highlighted_node_ids.forEach(nodeId => {
          const node = cyInstance.current?.getElementById(nodeId);
          if (node) {
            node.addClass('highlighted');
          }
        });
      }

    } catch (err) {
      console.error('Error rendering Cytoscape graph:', err);
      setError('Failed to render knowledge graph visualization');
    }
  };

  const setupCytoscapeEventHandlers = () => {
    if (!cyInstance.current) return;

    // Node click handler - highlight connected nodes
    cyInstance.current.on('tap', 'node', (event) => {
      const node = event.target;
      const nodeData = node.data();
      
      // Clear previous highlights
      cyInstance.current!.nodes().removeClass('highlighted connected');
      cyInstance.current!.edges().removeClass('highlighted');
      
      // Highlight clicked node and its neighborhood
      const connectedNodes = node.neighborhood().nodes();
      const connectedEdges = node.neighborhood().edges();
      
      node.addClass('highlighted');
      connectedNodes.addClass('connected');
      connectedEdges.addClass('highlighted');
      
      console.log('Node clicked:', nodeData);
    });

    // Double-click to focus on node neighborhood
    cyInstance.current.on('dblclick', 'node', (event) => {
      const node = event.target;
      const neighborhood = node.neighborhood().union(node);
      
      cyInstance.current!.fit(neighborhood, 50);
    });

    // Hover effects for better interactivity
    cyInstance.current.on('mouseover', 'node', (event) => {
      const node = event.target;
      node.addClass('hovered');
      
      // Show basic tooltip (you could enhance this with a proper tooltip library)
      const nodeData = node.data();
      console.log('Hovering over:', nodeData.label, nodeData.type);
    });

    cyInstance.current.on('mouseout', 'node', (event) => {
      const node = event.target;
      node.removeClass('hovered');
    });

    // Edge hover effects
    cyInstance.current.on('mouseover', 'edge', (event) => {
      const edge = event.target;
      edge.addClass('hovered');
    });

    cyInstance.current.on('mouseout', 'edge', (event) => {
      const edge = event.target;
      edge.removeClass('hovered');
    });
  };

  // Graph control functions
  const fitToView = () => {
    if (cyInstance.current) {
      cyInstance.current.fit(undefined, 50);
    }
  };

  const resetHighlighting = () => {
    if (cyInstance.current) {
      cyInstance.current.nodes().removeClass('highlighted connected hovered');
      cyInstance.current.edges().removeClass('highlighted hovered');
    }
  };

  const exportGraph = () => {
    if (cyInstance.current) {
      try {
        const png = cyInstance.current.png({ 
          scale: 2,
          full: true,
          bg: '#FAFBFC'
        });
        
        // Create download link
        const link = document.createElement('a');
        link.download = `knowledge-graph-${query || 'export'}.png`;
        link.href = png;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Error exporting graph:', err);
      }
    }
  };

  const refreshGraph = () => {
    fetchKnowledgeGraph();
  };

  const changeLayout = (newLayout: 'cose' | 'circle' | 'breadthfirst') => {
    if (cyInstance.current) {
      const layoutConfig = getLayoutConfig(newLayout);
      const layout = cyInstance.current.layout(layoutConfig);
      layout.run();
    }
    setSelectedLayout(newLayout);
  };

  return (
    <Modal open={isOpen} setOpen={onClose} size="large">
      <div style={{ 
        width: '900px', 
        height: '700px', 
        padding: spacing[4],
        backgroundColor: '#FFFFFF'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: spacing[3],
          paddingBottom: spacing[2],
          borderBottom: `1px solid ${palette.gray.light2}`
        }}>
          <div>
            <H3>Knowledge Graph Visualization</H3>
            {query && (
              <Body size="small" style={{ color: palette.gray.dark1, marginTop: spacing[1] }}>
                Query: "{query}"
              </Body>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: spacing[3], alignItems: 'center' }}>
            {/* Layout Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
              <Body size="small" weight="medium">Layout:</Body>
              <RadioGroup
                size="small"
                value={selectedLayout}
                onChange={(e) => changeLayout(e.target.value as 'cose' | 'circle' | 'breadthfirst')}
                style={{ display: 'flex', gap: spacing[2] }}
              >
                <Radio value="cose" id="layout-cose">
                  <Body size="xsmall">Force</Body>
                </Radio>
                <Radio value="circle" id="layout-circle">
                  <Body size="xsmall">Circle</Body>
                </Radio>
                <Radio value="breadthfirst" id="layout-breadth">
                  <Body size="xsmall">Tree</Body>
                </Radio>
              </RadioGroup>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: spacing[2] }}>
              <Button 
                size="small" 
                variant="default"
                onClick={refreshGraph}
                leftGlyph={<Icon glyph="Refresh" size="small" />}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button 
                size="small" 
                variant="default"
                onClick={fitToView}
                leftGlyph={<Icon glyph="FullScreenEnter" size="small" />}
                disabled={!graphData}
              >
                Fit
              </Button>
              <Button 
                size="small" 
                variant="default"
                onClick={resetHighlighting}
                leftGlyph={<Icon glyph="Unsorted" size="small" />}
                disabled={!graphData}
              >
                Reset
              </Button>
              <Button 
                size="small" 
                variant="primaryOutline"
                onClick={exportGraph}
                leftGlyph={<Icon glyph="Download" size="small" />}
                disabled={!graphData}
              >
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Graph Container */}
        <div style={{ 
          height: '580px',
          border: `1px solid ${palette.gray.light2}`,
          borderRadius: '6px',
          backgroundColor: '#FAFBFC',
          position: 'relative'
        }}>
          {loading && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              gap: spacing[3]
            }}>
              <ParagraphSkeleton />
              <Body>Loading knowledge graph...</Body>
            </div>
          )}
          
          {error && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              gap: spacing[2],
              color: palette.red.base
            }}>
              <Icon glyph="Warning" size="large" />
              <Body>Error: {error}</Body>
              <Button 
                size="small" 
                variant="default" 
                onClick={refreshGraph}
              >
                Try Again
              </Button>
            </div>
          )}
          
          {!loading && !error && graphData && (
            <div 
              ref={cyRef}
              style={{ 
                width: '100%', 
                height: '100%'
              }}
            />
          )}
          
          {!loading && !error && !graphData && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              gap: spacing[2]
            }}>
              <Icon glyph="Diagram" size="large" fill={palette.gray.base} />
              <Body style={{ color: palette.gray.dark1 }}>
                No graph data available
              </Body>
            </div>
          )}
        </div>

        {/* Legend */}
        {!loading && !error && graphData && (
          <div style={{ 
            marginTop: spacing[3], 
            padding: spacing[3],
            backgroundColor: palette.gray.light3,
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            <Body weight="medium" style={{ marginBottom: spacing[2] }}>
              Legend:
            </Body>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: spacing[2]
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  backgroundColor: '#00ED64' 
                }} />
                <Body size="small">Document Chunks</Body>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: '#FFC010' 
                }} />
                <Body size="small">Vehicle Systems</Body>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: '#FF6B47',
                  transform: 'rotate(45deg)'
                }} />
                <Body size="small">Content Types</Body>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                <div style={{ 
                  width: '20px', 
                  height: '2px', 
                  backgroundColor: '#00ED64' 
                }} />
                <Body size="small">Sequential</Body>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                <div style={{ 
                  width: '20px', 
                  height: '2px', 
                  backgroundColor: '#001E2B' 
                }} />
                <Body size="small">Related</Body>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                <div style={{ 
                  width: '20px', 
                  height: '1px', 
                  backgroundColor: '#FFC010',
                  borderTop: '1px dashed #FFC010'
                }} />
                <Body size="small">System References</Body>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default KnowledgeGraphVisualization;