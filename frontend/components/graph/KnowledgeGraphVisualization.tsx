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
import Button from '@leafygreen-ui/button';
import Card from '@leafygreen-ui/card';
import { H3, Body, Label } from '@leafygreen-ui/typography';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import Icon from '@leafygreen-ui/icon';
import Badge from '@leafygreen-ui/badge';
import { ParagraphSkeleton } from '@leafygreen-ui/skeleton-loader';
import { RadioGroup, Radio } from '@leafygreen-ui/radio-group';
import { CARD_STYLES } from '@/lib/styleConstants';
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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<'cose' | 'dagre' | 'circle'>('cose');
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Graph mode state
  const [graphMode, setGraphMode] = useState<'query' | 'full'>('query');
  const [appliedFilters, setAppliedFilters] = useState({
    systems: [] as string[],
    contentTypes: [] as string[],
    minConnections: 0
  });
  
  // Layout caching state (only used for full graph mode with dagre)
  const [cachedLayouts, setCachedLayouts] = useState<{
    dagre?: Map<string, {x: number, y: number}>
  }>({});
  const [layoutsCalculated, setLayoutsCalculated] = useState(false);
  const [cacheMode, setCacheMode] = useState<'query' | 'full' | null>(null);
  const [calculationMessage, setCalculationMessage] = useState<string>('');
  
  // Fetch knowledge graph data from API
  const fetchKnowledgeGraph = useCallback(async () => {
    // Query mode requires query or chunk IDs
    if (graphMode === 'query' && !query && (!chunkIds || chunkIds.length === 0)) return;
    
    setLoading(true);
    setLoadingProgress(0);
    setError(null);
    
    try {
      const options = graphMode === 'full' 
        ? {
            includeAll: true,
            maxNodes: 1000, // Higher limit for full graph
            filterSystems: appliedFilters.systems.length > 0 ? appliedFilters.systems : undefined,
            filterContentTypes: appliedFilters.contentTypes.length > 0 ? appliedFilters.contentTypes : undefined,
            minConnections: appliedFilters.minConnections > 0 ? appliedFilters.minConnections : undefined
          }
        : {
            query,
            chunkIds,
            maxNodes
          };
      
      const data = await searchService.getKnowledgeGraph(options);
      setGraphData(data);
      setLoadingProgress(100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch knowledge graph';
      setError(errorMessage);
      console.error('Error fetching knowledge graph:', err);
    } finally {
      setLoading(false);
    }
  }, [graphMode, query, chunkIds, maxNodes, appliedFilters]);

  // Fetch data when modal opens and parameters change
  useEffect(() => {
    if (isOpen && (graphMode === 'full' || query || (chunkIds && chunkIds.length > 0))) {
      fetchKnowledgeGraph();
    }
  }, [isOpen, graphMode, fetchKnowledgeGraph]);

  // Set default layout based on graph mode
  useEffect(() => {
    if (graphMode === 'full') {
      setSelectedLayout('circle');  // Circle default for full graphs (instant, no freezing)
    } else {
      setSelectedLayout('cose');  // Force-directed default for query graphs (existing behavior)
    }
  }, [graphMode]);

  // Clear cache when switching between query and full mode to prevent contamination
  useEffect(() => {
    if (cacheMode !== null && cacheMode !== graphMode) {
      // Mode changed, clear cache to prevent mixing query and full graph layouts
      setCachedLayouts({});
      setLayoutsCalculated(false);
      setCacheMode(null);
    }
  }, [graphMode, cacheMode]);

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

  const getLayoutConfig = (layoutName: string, isLargeGraph: boolean = false) => {
    const baseConfig = {
      animate: !isLargeGraph,  // No animation for large graphs - instant display
      animationDuration: isLargeGraph ? 0 : 500,
      fit: true,
      padding: 40
    };

    switch (layoutName) {
      case 'circle':
        return {
          ...baseConfig,
          name: 'circle',
          animate: false,  // Always instant for circle
          fit: true,
          padding: 40,
          startAngle: Math.PI * 0.5,  // Start at top (12 o'clock)
          sweep: Math.PI * 2,  // Full circle
          clockwise: true,
          spacingFactor: isLargeGraph ? 1.4 : 1.2,  // More spacing for large graphs
          avoidOverlap: true
        };
      case 'dagre':
        return {
          ...baseConfig,
          name: 'dagre',
          directed: true,
          rankDir: 'TB',
          nodeSep: isLargeGraph ? 80 : 50,      // Increased spacing for large graphs
          rankSep: isLargeGraph ? 180 : 100,    // Increased vertical space
          ranker: 'network-simplex',  // Always use fastest algorithm
          edgeSep: isLargeGraph ? 20 : 10,
          marginX: 20,
          marginY: 20
        };
      case 'cose':
        // Aggressive reduction for very large graphs
        const iterations = isLargeGraph ? 50 : 500;   // 50 iterations for 750 nodes
        const cooling = isLargeGraph ? 0.85 : 0.99;   // Faster cooling
        
        return {
          ...baseConfig,
          name: 'cose',
          numIter: iterations,
          coolingFactor: cooling,
          nodeOverlap: 20,
          idealEdgeLength: isLargeGraph ? 120 : 100,
          edgeElasticity: isLargeGraph ? 50 : 100,
          gravity: isLargeGraph ? 40 : 80,
          nestingFactor: 5,
          minTemp: 1.0
        };
      default:
        return { ...baseConfig, name: 'circle' };  // Default to circle for safety
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

  // Calculate dagre layout with manual yielding for responsiveness
  // Note: Circle layout is instant and doesn't need pre-calculation
  const calculateSingleLayout = async (
    layoutName: 'dagre',  // Only dagre needs pre-calculation for full graphs
    elements: any[], 
    isLargeGraph: boolean,
    onProgress?: (message: string) => void
  ) => {
    // Yield to browser before starting
    await new Promise(resolve => setTimeout(resolve, 100));
    
    onProgress?.('Calculating hierarchical layout...');
    
    // Create temporary Cytoscape instance for calculation
    const tempDiv = document.createElement('div');
    tempDiv.style.width = '1px';
    tempDiv.style.height = '1px';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    try {
      const tempCy = cytoscape({
        container: tempDiv,
        elements: elements,
        headless: true
      });

      // Run dagre layout
      const layout = tempCy.layout(getLayoutConfig('dagre', isLargeGraph));
      await new Promise(resolve => {
        layout.on('layoutstop', resolve);
        layout.run();
      });

      // Extract positions
      const positions = new Map();
      tempCy.nodes().forEach((node: any) => {
        positions.set(node.id(), { x: node.position().x, y: node.position().y });
      });

      tempCy.destroy();
      document.body.removeChild(tempDiv);

      // Cache dagre positions for full graph
      setCachedLayouts({ dagre: positions });
      
      return positions;
      
    } catch (err) {
      console.error('Error calculating dagre layout:', err);
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv);
      }
      throw err;
    }
  };

  // Apply cached dagre layout positions instantly
  const applyLayoutPositions = (layoutName: 'dagre') => {
    if (!cyInstance.current || !cachedLayouts.dagre) return;

    console.log('Applying cached dagre positions');
    
    cyInstance.current.nodes().forEach((node: any) => {
      const pos = cachedLayouts.dagre.get(node.id());
      if (pos) {
        node.position(pos);
      }
    });

    cyInstance.current.fit(undefined, 40);
  };

  // Render graph in batches for better performance with large graphs
  const renderGraphInBatches = async (elements: any[], batchSize: number = 150) => {
    if (!cyInstance.current) return;
    
    const batches = Math.ceil(elements.length / batchSize);
    setLoadingProgress(0);
    
    for (let i = 0; i < batches; i++) {
      const batch = elements.slice(i * batchSize, (i + 1) * batchSize);
      cyInstance.current.add(batch);
      
      // Update progress
      const progress = Math.round(((i + 1) / batches) * 50); // 0-50% for adding elements
      setLoadingProgress(progress);
      
      // Longer delay to let browser breathe and update UI
      await new Promise(resolve => setTimeout(resolve, 50));  // 50ms per batch
    }
    
    setLoadingProgress(50);
  };

  const renderCytoscapeGraph = async (data: KnowledgeGraphResponse) => {
    if (!cyRef.current || !data?.elements) return;

    // Destroy existing instance
    if (cyInstance.current) {
      cyInstance.current.destroy();
    }

    try {
      const isLargeGraph = data.elements.length > 200;
      
      // Performance settings for large graphs
      const performanceSettings = isLargeGraph ? {
        hideEdgesOnViewport: false,  // Keep edges visible during pan/zoom
        hideLabelsOnViewport: true,   // Can hide labels for performance
        textureOnViewport: true,
        motionBlur: false,
        wheelSensitivity: 0.2
      } : {
        wheelSensitivity: 0.3
      };
      
      // Initialize Cytoscape with preset layout (we'll set positions manually)
      // @ts-ignore - Cytoscape style typing is overly strict for our use case
      cyInstance.current = cytoscape({
        container: cyRef.current,
        elements: isLargeGraph ? [] : data.elements, // Start empty for large graphs
        // @ts-ignore - Style type incompatibility with Cytoscape definitions
        style: getModernStyle(data.style),
        layout: { name: 'preset' },  // Always use preset
        minZoom: 0.2,
        maxZoom: 4,
        ...performanceSettings
      });

      // For large graphs, render in batches
      if (isLargeGraph) {
        await renderGraphInBatches(data.elements);
      }

      // Handle layout based on graph mode
      if (graphMode === 'full' && isLargeGraph) {
        // Full graph mode with large dataset
        
        if (selectedLayout === 'circle') {
          // Circle is always instant, no caching needed
          console.log(`Full graph - using instant circle layout (${data.elements.length} elements)`);
          const circleLayout = cyInstance.current.layout(getLayoutConfig('circle', isLargeGraph));
          circleLayout.run();
          setLoadingProgress(100);
          
        } else if (selectedLayout === 'dagre') {
          // Dagre: use cache if available, otherwise calculate and cache
          if (!cachedLayouts.dagre || cacheMode !== 'full') {
            setLoadingProgress(50);
            setCalculationMessage('Calculating hierarchical layout...');
            
            await calculateSingleLayout(
              'dagre', 
              data.elements, 
              isLargeGraph,
              (msg) => setCalculationMessage(msg)
            );
            
            setCacheMode('full');
            setLayoutsCalculated(true);
            setLoadingProgress(75);
            setCalculationMessage('');
          }
          
          applyLayoutPositions('dagre');
          setLoadingProgress(100);
        }
        
      } else {
        // Query mode: use selected layout directly (always fast for small graphs)
        // No caching needed for query graphs
        const layout = cyInstance.current.layout(getLayoutConfig(selectedLayout, isLargeGraph));
        layout.run();
        setLoadingProgress(100);
      }

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

  const changeLayout = async (newLayout: 'cose' | 'dagre' | 'circle') => {
    if (!cyInstance.current || newLayout === selectedLayout) return;
    
    setSelectedLayout(newLayout);
    
    const elementCount = cyInstance.current.elements().length;
    const isLargeGraph = elementCount > 200;
    
    // Handle based on graph mode
    if (graphMode === 'full') {
      // Full graph mode
      
      if (newLayout === 'circle') {
        // Circle is always instant
        const layout = cyInstance.current.layout(getLayoutConfig('circle', isLargeGraph));
        layout.run();
        
      } else if (newLayout === 'dagre') {
        // Dagre: check cache for large graphs
        if (isLargeGraph && cachedLayouts.dagre && cacheMode === 'full') {
          // Use cached positions
          applyLayoutPositions('dagre');
        } else if (isLargeGraph) {
          // Calculate and cache
          setLoading(true);
          setCalculationMessage('Calculating hierarchical layout...');
          
          try {
            await calculateSingleLayout(
              'dagre',
              cyInstance.current.elements().jsons(),
              true,
              (msg) => setCalculationMessage(msg)
            );
            
            applyLayoutPositions('dagre');
            setCalculationMessage('');
          } catch (err) {
            console.error('Error calculating dagre layout:', err);
          } finally {
            setLoading(false);
          }
        } else {
          // Small graph: calculate directly
          const layout = cyInstance.current.layout(getLayoutConfig('dagre', false));
          layout.run();
        }
      }
      
    } else {
      // Query mode: always calculate directly (small graphs, fast)
      const layout = cyInstance.current.layout(getLayoutConfig(newLayout, isLargeGraph));
      layout.run();
    }
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
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            <H3>Knowledge Graph Visualization</H3>
            <Badge variant={graphMode === 'full' ? 'blue' : 'green'}>
              {graphMode === 'full' ? 'Full Graph' : 'Query Graph'}
            </Badge>
            {graphData?.total_nodes && (
              <Badge variant="lightgray">{graphData.total_nodes} nodes</Badge>
            )}
            {query && graphMode === 'query' && (
              <Body size="small" style={{ color: palette.gray.dark1, marginLeft: spacing[2] }}>
                Query: "{query}"
              </Body>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: spacing[3], alignItems: 'center' }}>
            {/* Mode Toggle Button */}
            <Button
              size="small"
              variant={graphMode === 'full' ? 'primary' : 'default'}
              onClick={() => {
                const newMode = graphMode === 'query' ? 'full' : 'query';
                setGraphMode(newMode);
              }}
              leftGlyph={<Icon glyph={graphMode === 'full' ? 'Diagram3' : 'Diagram'} size="small" />}
            >
              {graphMode === 'full' ? 'Switch to Query' : 'View Full Graph'}
            </Button>
            
            {/* Layout Selector */}
            <div style={{ display: 'flex', flexDirection: 'row', gap: spacing[2], alignItems: 'center' }}>
              <Body size="small" weight="medium">Layout:</Body>
              <RadioGroup
                size="small"
                value={selectedLayout}
                onChange={(e) => changeLayout(e.target.value as 'cose' | 'dagre' | 'circle')}
                style={{ display: 'flex', flexDirection: 'row', gap: spacing[2] }}
              >
                {graphMode === 'full' ? (
                  // Full graph mode: Circle and Hierarchical only
                  <>
                    <Radio value="circle" id="layout-circle">
                      <Body size="xsmall">Circle</Body>
                    </Radio>
                    <Radio value="dagre" id="layout-dagre">
                      <Body size="xsmall">Hierarchical</Body>
                    </Radio>
                  </>
                ) : (
                  // Query mode: Keep existing options (Force-Directed and Hierarchical)
                  <>
                    <Radio value="cose" id="layout-cose">
                      <Body size="xsmall">Force-Directed</Body>
                    </Radio>
                    <Radio value="dagre" id="layout-dagre">
                      <Body size="xsmall">Hierarchical</Body>
                    </Radio>
                  </>
                )}
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
              gap: spacing[3],
              position: 'relative',
              zIndex: 1000
            }}>
              <div style={{
                padding: spacing[4],
                background: palette.white,
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                textAlign: 'center',
                minWidth: '300px'
              }}>
                <ParagraphSkeleton />
                <Body weight="medium" style={{ marginTop: spacing[2] }}>
                  {calculationMessage || (
                    graphMode === 'full' && !layoutsCalculated 
                      ? 'Preparing full knowledge graph...'
                      : loadingProgress > 0 
                        ? `Loading... ${loadingProgress}%` 
                        : 'Loading graph...'
                  )}
                </Body>
                {graphMode === 'full' && !layoutsCalculated && !calculationMessage && (
                  <Body size="small" style={{ color: palette.gray.dark1, marginTop: spacing[2] }}>
                    Calculating layout for 750+ nodes...
                    <br />
                    This may take 5-10 seconds
                  </Body>
                )}
                {calculationMessage && (
                  <Body size="small" style={{ color: palette.gray.dark1, marginTop: spacing[2] }}>
                    Please wait while we optimize the layout
                  </Body>
                )}
              </div>
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