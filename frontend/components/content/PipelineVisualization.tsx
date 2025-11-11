'use client';

/**
 * Pipeline Visualization Component
 * Shows the end-to-end retrieval pipeline with animated data flow
 * Horizontal left-to-right flow matching architecture diagram
 */
import React from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import Icon from '@leafygreen-ui/icon';
import { palette } from '@leafygreen-ui/palette';
import styles from './PipelineVisualization.module.css';

// Custom node component
const AnimatedPipelineNode = ({ data }: { data: any }) => (
  <div className={styles.pipelineNode}>
    <div className={styles.nodeIcon}>{data.icon}</div>
    <div className={styles.nodeTitle}>{data.title}</div>
    <div className={styles.nodeDesc}>{data.description}</div>
  </div>
);

const nodeTypes = {
  custom: AnimatedPipelineNode,
};

// Pipeline stages in correct order - Horizontal left-to-right flow
const initialNodes: Node[] = [
  // Stage 1: Chunking (Far Left)
  {
    id: '1-chunking',
    type: 'custom',
    position: { x: 0, y: 200 },
    data: {
      title: 'Smart Chunking',
      description: 'Context-aware document segmentation',
      icon: <Icon glyph="Menu" fill={palette.green.dark2} />,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  
  // Stage 2: Vectorization (Center-Left)
  {
    id: '2-vectorization',
    type: 'custom',
    position: { x: 200, y: 200 },
    data: {
      title: 'Vectorization',
      description: 'Generate embeddings',
      icon: <Icon glyph="Diagram" fill={palette.green.dark2} />,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  
  // Stage 3: MongoDB Atlas (Center)
  {
    id: '3-storage',
    type: 'custom',
    position: { x: 400, y: 200 },
    data: {
      title: 'MongoDB Atlas',
      description: 'Store with metadata',
      icon: <Icon glyph="Database" fill={palette.green.dark2} />,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  
  // Stage 4: Retrieval Methods (Right - stacked vertically)
  {
    id: '4-fulltext',
    type: 'custom',
    position: { x: 600, y: 0 },
    data: {
      title: 'Full-Text Search',
      description: 'Lexical matching',
      icon: <Icon glyph="MagnifyingGlass" fill={palette.green.dark2} />,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: '4-vector',
    type: 'custom',
    position: { x: 600, y: 90 },
    data: {
      title: 'Vector Search',
      description: 'Semantic similarity',
      icon: <Icon glyph="Diagram" fill={palette.green.dark2} />,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: '4-graph',
    type: 'custom',
    position: { x: 600, y: 180 },
    data: {
      title: 'Graph Search',
      description: 'Knowledge traversal',
      icon: <Icon glyph="Relationship" fill={palette.green.dark2} />,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: '4-multimodal',
    type: 'custom',
    position: { x: 600, y: 270 },
    data: {
      title: 'Multimodal Search',
      description: 'Visual similarity',
      icon: <Icon glyph="Camera" fill={palette.green.dark2} />,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: '4-hybrid',
    type: 'custom',
    position: { x: 600, y: 360 },
    data: {
      title: 'Hybrid Search',
      description: 'Combined methods',
      icon: <Icon glyph="Sparkle" fill={palette.green.dark2} />,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  
  // Stage 5: Reranking (Far Right)
  {
    id: '5-reranking',
    type: 'custom',
    position: { x: 800, y: 180 },
    data: {
      title: 'Voyage Reranking',
      description: 'Result fusion',
      icon: <Icon glyph="Sparkle" fill={palette.green.dark2} />,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
];

// Linear flow edges
const initialEdges: Edge[] = [
  // Chunking → Vectorization
  {
    id: 'e1',
    source: '1-chunking',
    target: '2-vectorization',
    animated: true,
    style: { stroke: palette.green.dark2, strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: palette.green.dark2,
    },
  },
  
  // Vectorization → MongoDB Atlas
  {
    id: 'e2',
    source: '2-vectorization',
    target: '3-storage',
    animated: true,
    style: { stroke: palette.green.dark2, strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: palette.green.dark2,
    },
  },
  
  // MongoDB Atlas → All Retrieval Methods
  {
    id: 'e3-1',
    source: '3-storage',
    target: '4-fulltext',
    animated: true,
    style: { stroke: palette.green.dark2, strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: palette.green.dark2,
    },
  },
  {
    id: 'e3-2',
    source: '3-storage',
    target: '4-vector',
    animated: true,
    style: { stroke: palette.green.dark2, strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: palette.green.dark2,
    },
  },
  {
    id: 'e3-3',
    source: '3-storage',
    target: '4-graph',
    animated: true,
    style: { stroke: palette.green.dark2, strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: palette.green.dark2,
    },
  },
  {
    id: 'e3-4',
    source: '3-storage',
    target: '4-multimodal',
    animated: true,
    style: { stroke: palette.green.dark2, strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: palette.green.dark2,
    },
  },
  {
    id: 'e3-5',
    source: '3-storage',
    target: '4-hybrid',
    animated: true,
    style: { stroke: palette.green.dark2, strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: palette.green.dark2,
    },
  },
  
  // All Retrieval Methods → Reranking
  {
    id: 'e4-1',
    source: '4-fulltext',
    target: '5-reranking',
    animated: true,
    style: { stroke: palette.green.dark2, strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: palette.green.dark2,
    },
  },
  {
    id: 'e4-2',
    source: '4-vector',
    target: '5-reranking',
    animated: true,
    style: { stroke: palette.green.dark2, strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: palette.green.dark2,
    },
  },
  {
    id: 'e4-3',
    source: '4-graph',
    target: '5-reranking',
    animated: true,
    style: { stroke: palette.green.dark2, strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: palette.green.dark2,
    },
  },
  {
    id: 'e4-5',
    source: '4-hybrid',
    target: '5-reranking',
    animated: true,
    style: { stroke: palette.green.dark2, strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: palette.green.dark2,
    },
  },
];

export const PipelineVisualization: React.FC = () => {
  return (
    <div style={{ height: '550px', width: '100%', backgroundColor: palette.gray.light3, borderRadius: '8px' }}>
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        preventScrolling={true}
      >
        <Background color={palette.gray.light1} gap={16} />
      </ReactFlow>
    </div>
  );
};

export default PipelineVisualization;
