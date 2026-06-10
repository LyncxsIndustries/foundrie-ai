import { toPng } from 'html-to-image';
import type { ReactFlowJsonObject, Node, Edge } from '@xyflow/react';

/**
 * Captures a React Flow diagram canvas as PNG buffer.
 * 
 * This function is designed to be called client-side where the DOM is available.
 * It captures only the diagram viewport, ensuring all nodes and edges are visible.
 * 
 * @param element - The React Flow wrapper DOM element
 * @param nodes - All nodes in the diagram
 * @param edges - All edges in the diagram
 * @returns PNG as base64 data URL
 */
export async function captureDiagramToPNG(
  element: HTMLElement,
  nodes: Node[],
  edges: Edge[]
): Promise<string> {
  if (!element) {
    throw new Error('No element provided for capture');
  }

  if (nodes.length === 0) {
    throw new Error('Cannot capture empty diagram');
  }

  // Calculate bounds to ensure all nodes are visible
  const bounds = getNodesBounds(nodes);
  
  // Capture with high quality settings
  const dataUrl = await toPng(element, {
    backgroundColor: '#0a0a0a', // Dark workspace background
    quality: 0.95,
    pixelRatio: 2, // Retina quality
    cacheBust: true,
    style: {
      transform: 'none', // Reset any transforms
    },
    filter: (node) => {
      // Exclude UI controls (minimap, controls, etc.)
      if (node.classList) {
        return !node.classList.contains('react-flow__controls') &&
               !node.classList.contains('react-flow__minimap') &&
               !node.classList.contains('react-flow__panel');
      }
      return true;
    },
  });

  return dataUrl;
}

/**
 * Calculate bounding box for all nodes
 */
function getNodesBounds(nodes: Node[]): { x: number; y: number; width: number; height: number } {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 800, height: 600 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const x = node.position.x;
    const y = node.position.y;
    const width = (node.measured?.width || node.width) || 200;
    const height = (node.measured?.height || node.height) || 100;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }

  // Add padding
  const padding = 40;
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

/**
 * Convert base64 data URL to Buffer (server-side)
 */
export function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}
