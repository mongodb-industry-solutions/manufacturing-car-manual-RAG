/**
 * Knowledge Graph Visualization Component using Cytoscape.js
 * Displays interactive knowledge graphs for GraphRAG search results
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';
// @ts-ignore - cytoscape-dagre doesn't have types
import dagre from 'cytoscape-dagre';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';
import * as Dialog from '@radix-ui/react-dialog';
import { MyButton as Button, MyCard as Card } from '@/components/ui/TypographyWrapper';
import { MyH3 as H3, MyBody as Body, MyLabel as Label } from '@/components/ui/TypographyWrapper';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import Icon from '@leafygreen-ui/icon';
import Badge from '@leafygreen-ui/badge';
import { ParagraphSkeleton } from '@leafygreen-ui/skeleton-loader';
import { RadioGroup, Radio } from '@leafygreen-ui/radio-group';
import ExpandableCard from '@leafygreen-ui/expandable-card';

import { searchService } from '@/services/searchService';
import { KnowledgeGraphResponse } from '@/types/Search';

// Register the dagre layout extension
cytoscape.use(dagre);

interface KnowledgeGraphVisualizationProps {
  isOpen: boolean;
  onClose: () => void;
  query?: string;
  chunkIds?: string[];
  maxNodes?: number;
}

const KnowledgeGraphVisualization: React.FC<KnowledgeGraphVisualizationProps> = ({
  isOpen,
  onClose,
  query,
  chunkIds,
  maxNodes = 50
}) => {
  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<cytoscape.Core | null>(null);
  const tippyInstances = useRef<TippyInstance[]>([]);
  const [graphData, setGraphData] = useState<KnowledgeGraphResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<'cose' | 'circle' | 'breadthfirst' | 'dagre'>('cose');
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch knowledge graph data from API
  const fetchKnowledgeGraph = useCallback(async () => {
    if (!query && (!chunkIds || chunkIds.length === 0)) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await searchService.getKnowledgeGraph(
        query,
        chunkIds,
        maxNodes
      );
      setGraphData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch knowledge graph';
      setError(errorMessage);
      console.error('Error fetching knowledge graph:', err);
    } finally {
      setLoading(false);
    }
  }, [query, chunkIds, maxNodes]);

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
      // Destroy all tooltips
      tippyInstances.current.forEach(instance => instance.destroy());
      tippyInstances.current = [];
      
      if (cyInstance.current) {
        cyInstance.current.destroy();
        cyInstance.current = null;
      }
    };
  }, [graphData, isOpen, loading]);

  const getLayoutConfig = (layoutName: string) => {
    const baseConfig = {
      animate: true,
      animationDuration: 800,
      animationEasing: 'ease-in-out-cubic',
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
      case 'dagre':
        return {
          ...baseConfig,
          name: 'dagre',
          directed: true,
          rankDir: 'TB',
          nodeSep: 50,
          rankSep: 100,
          ranker: 'tight-tree'
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
          'background-color': palette.blue.light2,
          'label': 'data(label)',
          'text-valign': 'center',
          'text-halign': 'center',
          'font-size': (ele: any) => {
            const depth = ele.data('depth') || 0;
            if (depth === 0) return '13px';
            if (depth === 1) return '12px';
            return '11px';
          },
          'font-weight': '600',
          'color': palette.gray.dark3,
          'text-outline-width': '0px',
          'width': (ele: any) => {
            const depth = ele.data('depth');
            const isSeed = ele.data('is_seed');
            if (isSeed) return '70px';
            if (depth === 0) return '60px';
            if (depth === 1) return '50px';
            return '40px';
          },
          'height': (ele: any) => {
            const depth = ele.data('depth');
            const isSeed = ele.data('is_seed');
            if (isSeed) return '70px';
            if (depth === 0) return '60px';
            if (depth === 1) return '50px';
            return '40px';
          },
          'border-width': '2px',
          'border-color': palette.blue.base,
          'background-gradient-direction': 'to-bottom-right',
          'background-gradient-stop-colors': `${palette.blue.light2} ${palette.blue.base}`,
          'text-wrap': 'wrap',
          'text-max-width': '120px',
          'transition-property': 'background-color, border-color, width, height',
          'transition-duration': '0.2s',
          'transition-timing-function': 'ease-in-out'
        }
      },
      {
        selector: '.seed-node',
        style: {
          'background-gradient-stop-colors': `${palette.blue.light2} ${palette.blue.light1}`,
          'color': palette.gray.dark3,
          'border-width': '4px',
          'border-color': palette.yellow.base,
          'font-size': '14px',
          'text-outline-width': '0px'
        }
      },
      {
        selector: '.system-node',
        style: {
          'background-gradient-stop-colors': `${palette.purple.light2} ${palette.purple.base}`,
          'shape': 'round-rectangle',
          'width': (ele: any) => {
            const label = ele.data('label') || '';
            // Dynamic width based on label length: min 55px, grows with text
            return Math.max(55, label.length * 7 + 15) + 'px';
          },
          'height': '40px',
          'color': palette.gray.dark3,
          'text-outline-width': '0px',
          'text-wrap': 'wrap',
          'text-max-width': (ele: any) => {
            const label = ele.data('label') || '';
            return Math.max(50, label.length * 7 + 10) + 'px';
          }
        }
      },
      {
        selector: '.contenttype-node',
        style: {
          'background-gradient-stop-colors': `${palette.red.base} ${palette.red.dark2}`,
          'shape': 'diamond',
          'width': (ele: any) => {
            const label = ele.data('label') || '';
            // Dynamic width based on label length: min 50px, grows with text
            return Math.max(50, label.length * 6 + 20) + 'px';
          },
          'height': (ele: any) => {
            const label = ele.data('label') || '';
            // Keep diamond proportional
            return Math.max(50, label.length * 6 + 20) + 'px';
          },
          'color': palette.gray.dark3,
          'text-outline-width': '0px',
          'text-wrap': 'wrap',
          'text-max-width': (ele: any) => {
            const label = ele.data('label') || '';
            return Math.max(45, label.length * 6 + 15) + 'px';
          }
        }
      },
      {
        selector: 'node:active',
        style: {
          'width': (ele: any) => {
            const depth = ele.data('depth');
            const isSeed = ele.data('is_seed');
            if (isSeed) return '80px';
            if (depth === 0) return '70px';
            if (depth === 1) return '60px';
            return '50px';
          },
          'height': (ele: any) => {
            const depth = ele.data('depth');
            const isSeed = ele.data('is_seed');
            if (isSeed) return '80px';
            if (depth === 0) return '70px';
            if (depth === 1) return '60px';
            return '50px';
          },
          'border-width': '3px',
          'z-index': 999
        }
      },
      {
        selector: 'node.hover',
        style: {
          'border-width': '3px',
          'border-color': palette.blue.dark1,
          'z-index': 998,
          'color': palette.gray.dark3
        }
      },
      {
        selector: '.highlighted',
        style: {
          'border-color': palette.red.base,
          'border-width': '4px',
          'text-outline-width': '0px',
          'color': palette.gray.dark3
        }
      },
      {
        selector: '.connected',
        style: {
          'border-color': palette.green.dark1,
          'border-width': '3px',
          'opacity': 0.8,
          'color': palette.gray.dark3,
          'text-outline-width': '0px'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': palette.gray.base,
          'target-arrow-color': palette.gray.base,
          'target-arrow-shape': 'triangle-backcurve',
          'arrow-scale': 1.2,
          'opacity': 0.7,
          'curve-style': 'bezier',
          'transition-property': 'line-color, target-arrow-color, width, opacity',
          'transition-duration': '0.2s',
          // Edge labels
          'label': 'data(relationship_type)',
          'font-size': '9px',
          'text-rotation': 'autorotate',
          'text-margin-y': -8,
          'text-background-color': palette.white,
          'text-background-opacity': 0.95,
          'text-background-padding': '3px',
          'text-background-shape': 'roundrectangle',
          'text-border-width': 1,
          'text-border-color': palette.gray.light2,
          'text-border-opacity': 0.5,
          'color': palette.gray.dark2,
          'font-weight': '600',
          'text-wrap': 'wrap',
          'text-max-width': '100px'
        }
      },
      {
        selector: 'edge:active',
        style: {
          'width': 4,
          'opacity': 1,
          'z-index': 999
        }
      },
      {
        selector: '.edge-sequential-to',
        style: {
          'line-color': palette.green.base,
          'target-arrow-color': palette.green.base,
          'width': 3,
          'line-style': 'solid',
          'opacity': 0.9
        }
      },
      {
        selector: '.edge-related-to',
        style: {
          'line-color': palette.blue.base,
          'target-arrow-color': palette.blue.base,
          'width': 2.5,
          'line-style': 'solid',
          'opacity': 0.8
        }
      },
      {
        selector: '.edge-mentions-system',
        style: {
          'line-color': palette.purple.base,
          'target-arrow-color': palette.purple.base,
          'line-style': 'dashed',
          'line-dash-pattern': [6, 3],
          'width': 2,
          'opacity': 0.7
        }
      },
      {
        selector: '.edge-is-of-type',
        style: {
          'line-color': palette.gray.dark2,
          'target-arrow-color': palette.gray.dark2,
          // Using line-dash-pattern instead of line-style for consistent rendering
          'line-dash-pattern': [2, 4],
          'width': 2,
          'opacity': 0.7
        }
      },
      {
        selector: 'edge.highlighted',
        style: {
          'line-color': palette.red.base,
          'target-arrow-color': palette.red.base,
          'width': 4,
          'opacity': 1
        }
      },
      {
        selector: 'edge.hovered',
        style: {
          'width': 3,
          'opacity': 1,
          'line-color': palette.blue.dark1,
          'target-arrow-color': palette.blue.dark1,
          'z-index': 999
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
      // @ts-ignore - Cytoscape style typing is overly strict for our use case
      cyInstance.current = cytoscape({
        container: cyRef.current,
        elements: data.elements,
        // @ts-ignore - Style type incompatibility with Cytoscape definitions
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

  // Helper function to create tooltip HTML content
  const createTooltipContent = (node: any) => {
    const data = node.data();
    
    // Determine node type for color coordination
    const isSystemNode = node.hasClass('system-node');
    const isContentTypeNode = node.hasClass('contenttype-node');
    
    // Set badge colors to match node type
    let badgeBackground, badgeColor;
    if (isSystemNode) {
      badgeBackground = palette.purple.light2;
      badgeColor = palette.purple.dark2;
    } else if (isContentTypeNode) {
      badgeBackground = palette.gray.light2;
      badgeColor = palette.gray.dark2;
    } else {
      // Default document chunks
      badgeBackground = palette.blue.light2;
      badgeColor = palette.blue.dark2;
    }
    
    const tooltipDiv = document.createElement('div');
    tooltipDiv.style.cssText = `
      max-width: 320px;
      padding: ${spacing[3]}px;
      background: ${palette.white};
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: Euclid Circular A, sans-serif;
    `;
    
    // Title
    const title = document.createElement('div');
    title.style.cssText = `
      font-weight: 600;
      font-size: 14px;
      margin-bottom: ${spacing[2]}px;
      color: ${palette.gray.dark3};
      word-wrap: break-word;
    `;
    title.textContent = data.breadcrumb_trail || data.label || data.id;
    tooltipDiv.appendChild(title);
    
    // Pages
    if (data.page_numbers && data.page_numbers.length > 0) {
      const pagesDiv = document.createElement('div');
      pagesDiv.style.cssText = `margin-bottom: ${spacing[2]}px;`;
      
      const pagesLabel = document.createElement('span');
      pagesLabel.style.cssText = `font-size: 12px; font-weight: 600; color: ${palette.gray.dark1};`;
      pagesLabel.textContent = 'Pages: ';
      pagesDiv.appendChild(pagesLabel);
      
      const pagesValue = document.createElement('span');
      pagesValue.style.cssText = `font-size: 12px; color: ${palette.blue.dark2};`;
      pagesValue.textContent = data.page_numbers.join(', ');
      pagesDiv.appendChild(pagesValue);
      
      tooltipDiv.appendChild(pagesDiv);
    }
    
    // Content preview
    if (data.text) {
      const textPreview = document.createElement('div');
      textPreview.style.cssText = `
        font-size: 11px;
        line-height: 1.4;
        color: ${palette.gray.dark1};
        max-height: 100px;
        overflow-y: auto;
        padding: ${spacing[2]}px;
        background: ${palette.gray.light3};
        border-radius: 4px;
        margin-bottom: ${spacing[2]}px;
      `;
      textPreview.textContent = data.text.length > 200 ? data.text.substring(0, 200) + '...' : data.text;
      tooltipDiv.appendChild(textPreview);
    }
    
    // Content types
    if (data.content_type && data.content_type.length > 0) {
      const typesDiv = document.createElement('div');
      typesDiv.style.cssText = `display: flex; gap: ${spacing[1]}px; flex-wrap: wrap;`;
      
      data.content_type.forEach((type: string) => {
        const badge = document.createElement('span');
        badge.style.cssText = `
          display: inline-block;
          padding: 2px ${spacing[2]}px;
          background: ${badgeBackground};
          color: ${badgeColor};
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
        `;
        badge.textContent = type;
        typesDiv.appendChild(badge);
      });
      
      tooltipDiv.appendChild(typesDiv);
    }
    
    return tooltipDiv;
  };

  const setupCytoscapeEventHandlers = () => {
    if (!cyInstance.current) return;
    
    // Clear existing tooltips
    tippyInstances.current.forEach(instance => instance.destroy());
    tippyInstances.current = [];
    
    // Create tooltips for all nodes using manual positioning
    cyInstance.current.nodes().forEach((node) => {
      const dummyDomEle = document.createElement('div');
      
      // Function to get node's screen position
      const getNodePosition = () => {
        const position = node.renderedPosition();
        const rect = {
          width: 0,
          height: 0,
          top: position.y,
          bottom: position.y,
          left: position.x,
          right: position.x,
          x: position.x,
          y: position.y,
          toJSON: () => rect
        };
        return {
          getBoundingClientRect: () => rect as DOMRect
        };
      };
      
      const tip = tippy(dummyDomEle, {
        getReferenceClientRect: () => getNodePosition().getBoundingClientRect(),
        content: () => createTooltipContent(node),
        trigger: 'manual',
        arrow: true,
        placement: 'top',
        theme: 'light-border',
        interactive: true,
        maxWidth: 320,
        appendTo: document.body
      });
      
      tippyInstances.current.push(tip);
      
      // Show tooltip on hover
      node.on('mouseover', () => {
        tip.show();
      });
      
      node.on('mouseout', () => {
        tip.hide();
      });
      
      // Update position on pan/zoom or node movement
      node.on('position', () => {
        if (tip.state.isVisible) {
          tip.setProps({
            getReferenceClientRect: () => getNodePosition().getBoundingClientRect()
          });
        }
      });
    });

    // Hide all tooltips on pan/zoom
    cyInstance.current.on('pan zoom', () => {
      tippyInstances.current.forEach(tip => {
        if (tip.state.isVisible) {
          tip.hide();
        }
      });
    });

    // Node click handler - highlight connected nodes and show detail panel
    cyInstance.current.on('tap', 'node', (event) => {
      const node = event.target;
      const nodeData = node.data();
      
      console.log('Node clicked:', nodeData);
      
      // Clear previous highlights
      cyInstance.current!.nodes().removeClass('highlighted connected');
      cyInstance.current!.edges().removeClass('highlighted');
      
      // Highlight clicked node and its neighborhood
      const connectedNodes = node.neighborhood().nodes();
      const connectedEdges = node.neighborhood().edges();
      
      node.addClass('highlighted');
      connectedNodes.addClass('connected');
      connectedEdges.addClass('highlighted');
      
      // Set selected node to show detail panel
      const incomingCount = node.incomers('edge').length;
      const outgoingCount = node.outgoers('edge').length;
      
      // Always set the selected node with complete data
      const selectedNodeData = {
        id: nodeData.id || 'unknown',
        label: nodeData.label || 'Unknown Node',
        type: nodeData.type || 'Node',
        breadcrumb_trail: nodeData.breadcrumb_trail || null,
        text: nodeData.text || null,
        page_numbers: nodeData.page_numbers || [],
        content_type: nodeData.content_type || [],
        context: nodeData.context || null,
        is_seed: nodeData.is_seed || false,
        depth: nodeData.depth || 0,
        is_concept: nodeData.is_concept || false,
        incoming: incomingCount,
        outgoing: outgoingCount
      };
      
      console.log('Setting selectedNode with data:', selectedNodeData);
      setSelectedNode(selectedNodeData);
    });

    // Double-click to focus on node neighborhood
    cyInstance.current.on('dblclick', 'node', (event) => {
      const node = event.target;
      const neighborhood = node.neighborhood().union(node);
      
      cyInstance.current!.fit(neighborhood, 50);
    });

    // Node hover effects
    cyInstance.current.on('mouseover', 'node', (event) => {
      const node = event.target;
      node.addClass('hover');
    });

    cyInstance.current.on('mouseout', 'node', (event) => {
      const node = event.target;
      node.removeClass('hover');
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
    
    // Update tooltips on viewport changes
    cyInstance.current.on('pan zoom', () => {
      tippyInstances.current.forEach(tip => tip.hide());
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

  const refreshGraph = async () => {
    setIsRefreshing(true);
    await fetchKnowledgeGraph();
    setIsRefreshing(false);
  };

  const changeLayout = (newLayout: 'cose' | 'circle' | 'breadthfirst' | 'dagre') => {
    if (cyInstance.current) {
      const layoutConfig = getLayoutConfig(newLayout);
      const layout = cyInstance.current.layout(layoutConfig);
      layout.run();
    }
    setSelectedLayout(newLayout);
  };

  const focusOnNode = (nodeId: string) => {
    if (cyInstance.current) {
      const node = cyInstance.current.getElementById(nodeId);
      if (node.length > 0) {
        const neighborhood = node.neighborhood().union(node);
        cyInstance.current.fit(neighborhood, 50);
        cyInstance.current.animate({
          zoom: cyInstance.current.zoom() * 1.5,
          center: { eles: node }
        }, { duration: 500 });
      }
    }
  };

  const copyNodeContent = (node: any) => {
    if (node && node.text) {
      navigator.clipboard.writeText(node.text).then(() => {
        console.log('Content copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy content:', err);
      });
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        {/* Backdrop overlay with blur effect */}
        <Dialog.Overlay style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
          animation: 'fadeIn 200ms ease-out'
        }} />
        
        {/* Modal content with modern styling */}
        <Dialog.Content style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90vw',
          maxWidth: '1400px',
          minWidth: '1000px',
          height: '88vh',
          maxHeight: '1100px',
          minHeight: '700px',
          backgroundColor: palette.white,
          borderRadius: '16px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.16), 0 8px 16px rgba(0, 0, 0, 0.08)',
          zIndex: 9999,
          padding: spacing[4],
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideIn 250ms cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
        {/* Header - Fixed */}
        <div style={{ 
          flexShrink: 0,
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: spacing[2],
          paddingBottom: spacing[1],
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
            <div style={{ display: 'flex', flexDirection: 'row', gap: spacing[2], alignItems: 'center' }}>
              <Body size="small" weight="medium">Layout:</Body>
              <RadioGroup
                size="small"
                value={selectedLayout}
                onChange={(e) => changeLayout(e.target.value as 'cose' | 'circle' | 'breadthfirst' | 'dagre')}
                style={{ display: 'flex', flexDirection: 'row', gap: spacing[2] }}
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
                <Radio value="dagre" id="layout-dagre">
                  <Body size="xsmall">Hierarchy</Body>
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
                disabled={loading || isRefreshing}
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
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
            </div>
          </div>
        </div>

        {/* Main Content - Flexible split view */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          gap: spacing[3],
          minHeight: 0
        }}>
          {/* Graph Container */}
          <div style={{ 
            flex: selectedNode ? 2 : 3,
            border: `1px solid ${palette.gray.light2}`,
            borderRadius: '6px',
            backgroundColor: palette.gray.light3,
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

          {/* Detail Panel - Conditional */}
          {selectedNode && (
            <Card style={{ 
              flex: 1,
              minWidth: '320px',
              maxWidth: '400px',
              overflowY: 'auto'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing[3]
              }}>
                <H3>Node Details</H3>
                <button 
                  aria-label="Close panel"
                  onClick={() => setSelectedNode(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: spacing[1],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = palette.gray.light2}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Icon glyph="X" />
                </button>
              </div>
              
              {/* Node Type */}
              {selectedNode.type && (
                <>
                  <Label htmlFor="node-type" style={{ marginBottom: spacing[1] }}>
                    Type:
                  </Label>
                  <Body size="small" style={{ 
                    color: palette.gray.dark2,
                    marginBottom: spacing[2]
                  }}>
                    {selectedNode.type}
                  </Body>
                </>
              )}
              
              {/* Breadcrumb trail / Label */}
              <Label htmlFor="node-location" style={{ marginBottom: spacing[1] }}>
                {selectedNode.is_concept ? 'Name:' : 'Location:'}
              </Label>
              <Body size="small" style={{ 
                color: palette.blue.dark2,
                marginBottom: spacing[3]
              }}>
                {selectedNode.breadcrumb_trail || selectedNode.label || selectedNode.id}
              </Body>
              
              {/* Page numbers */}
              {selectedNode.page_numbers && selectedNode.page_numbers.length > 0 && (
                <>
                  <Label htmlFor="node-pages" style={{ marginBottom: spacing[1] }}>
                    Pages:
                  </Label>
                  <div style={{ display: 'flex', gap: spacing[1], marginBottom: spacing[3], flexWrap: 'wrap' }}>
                    {selectedNode.page_numbers.map((page: number) => (
                      <Badge key={page} variant="blue">{page}</Badge>
                    ))}
                  </div>
                </>
              )}
              
              {/* Content types */}
              {selectedNode.content_type && selectedNode.content_type.length > 0 && (
                <>
                  <Label htmlFor="node-content-types" style={{ marginBottom: spacing[1] }}>
                    Content Types:
                  </Label>
                  <div style={{ display: 'flex', gap: spacing[1], flexWrap: 'wrap', marginBottom: spacing[3] }}>
                    {selectedNode.content_type.map((type: string) => (
                      <Badge key={type} variant="green">{type}</Badge>
                    ))}
                  </div>
                </>
              )}
              
              {/* Full text content or concept description */}
              {selectedNode.text ? (
                <>
                  <Label htmlFor="node-content" style={{ marginBottom: spacing[1] }}>
                    Content:
                  </Label>
                  <div style={{ 
                    padding: spacing[2],
                    backgroundColor: palette.gray.light3,
                    borderRadius: '6px',
                    border: `1px solid ${palette.gray.light2}`,
                    maxHeight: '300px',
                    overflowY: 'auto',
                    marginBottom: spacing[3]
                  }}>
                    <Body size="small" style={{ lineHeight: '1.6' }}>
                      {selectedNode.text}
                    </Body>
                  </div>
                </>
              ) : selectedNode.is_concept ? (
                <>
                  <Label htmlFor="node-description" style={{ marginBottom: spacing[1] }}>
                    Description:
                  </Label>
                  <Body size="small" style={{ 
                    color: palette.gray.dark1,
                    marginBottom: spacing[3],
                    fontStyle: 'italic'
                  }}>
                    This is a {selectedNode.type === 'System' ? 'vehicle system' : 'content type'} node that represents a category or classification in the knowledge graph.
                  </Body>
                </>
              ) : null}
              
              {/* Connections summary */}
              <Label htmlFor="node-connections" style={{ marginBottom: spacing[1] }}>
                Connections:
              </Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1], marginBottom: spacing[3] }}>
                <Body size="small">
                  <Icon glyph="ArrowRight" size="small" /> {selectedNode.outgoing} outgoing
                </Body>
                <Body size="small">
                  <Icon glyph="ArrowLeft" size="small" /> {selectedNode.incoming} incoming
                </Body>
              </div>
              
              {/* Action buttons */}
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[2]
              }}>
                <Button 
                  size="small" 
                  variant="primary"
                  leftGlyph={<Icon glyph="MagnifyingGlass" size="small" />}
                  onClick={() => focusOnNode(selectedNode.id)}
                >
                  Focus on Node
                </Button>
                <Button 
                  size="small" 
                  variant="default"
                  leftGlyph={<Icon glyph="Copy" size="small" />}
                  onClick={() => copyNodeContent(selectedNode)}
                >
                  Copy Content
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Legend - Fixed */}
        <div style={{ flexShrink: 0 }}>
        {/* Legend */}
        {!loading && !error && graphData && (
          <ExpandableCard 
            title="Legend"
            defaultOpen={false}
            style={{ marginTop: spacing[2] }}
          >
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: spacing[2],
              padding: spacing[2]
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  backgroundColor: palette.blue.light2,
                  border: `2px solid ${palette.blue.base}`
                }} />
                <Body size="small">Document Chunks</Body>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: palette.purple.base 
                }} />
                <Body size="small">Vehicle Systems</Body>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: palette.red.base,
                  transform: 'rotate(45deg)'
                }} />
                <Body size="small">Content Types</Body>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                <div style={{ 
                  width: '20px', 
                  height: '2px', 
                  backgroundColor: palette.green.base 
                }} />
                <Body size="small">Sequential</Body>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                <div style={{ 
                  width: '20px', 
                  height: '2px', 
                  backgroundColor: palette.blue.base 
                }} />
                <Body size="small">Related</Body>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                <div style={{ 
                  width: '20px', 
                  height: '1px', 
                  backgroundColor: palette.purple.base,
                  borderTop: `1px dashed ${palette.purple.base}`
                }} />
                <Body size="small">System References</Body>
              </div>
            </div>
          </ExpandableCard>
        )}
        </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default KnowledgeGraphVisualization;