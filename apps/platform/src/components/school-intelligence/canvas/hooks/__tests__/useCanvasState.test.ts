import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasState } from '../useCanvasState';
import type { Connector } from '@/lib/data-connectors/types';

function makeConnector(id: string, joinKeys: Connector['joinKeys']): Connector {
  return {
    id,
    layer: 1,
    category: 'dfe-historic',
    name: id,
    description: '',
    icon: '🏛',
    colour: '#1d70b8',
    dataController: 'us',
    setupType: 'auto',
    status: 'active',
    joinKeys,
    consumers: [],
  };
}

describe('useCanvasState', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useCanvasState());
    expect(result.current.nodes).toEqual([]);
    expect(result.current.edges).toEqual([]);
  });

  it('adds a connector node', () => {
    const { result } = renderHook(() => useCanvasState());
    act(() => {
      result.current.addConnector(makeConnector('dfe-attendance', ['urn', 'laestab']));
    });
    expect(result.current.nodes).toHaveLength(1);
    expect(result.current.placedConnectorIds).toContain('dfe-attendance');
  });

  it('prevents duplicate connectors', () => {
    const { result } = renderHook(() => useCanvasState());
    const conn = makeConnector('dfe-attendance', ['urn']);
    act(() => result.current.addConnector(conn));
    act(() => result.current.addConnector(conn));
    expect(result.current.nodes).toHaveLength(1);
  });

  it('auto-detects edges on shared join keys', () => {
    const { result } = renderHook(() => useCanvasState());
    act(() => {
      result.current.addConnector(makeConnector('dfe-attendance', ['urn']));
      result.current.addConnector(makeConnector('dfe-census', ['urn', 'postcode']));
    });
    expect(result.current.edges).toHaveLength(1);
    expect(result.current.edges[0].sharedKey).toBe('urn');
  });

  it('draws multiple edges when connectors share multiple keys', () => {
    const { result } = renderHook(() => useCanvasState());
    act(() => {
      result.current.addConnector(makeConnector('a', ['urn', 'postcode']));
      result.current.addConnector(makeConnector('b', ['urn', 'postcode']));
    });
    expect(result.current.edges).toHaveLength(2);
    const keys = result.current.edges.map((e) => e.sharedKey).sort();
    expect(keys).toEqual(['postcode', 'urn']);
  });

  it('draws no edges when no join keys match', () => {
    const { result } = renderHook(() => useCanvasState());
    act(() => {
      result.current.addConnector(makeConnector('a', ['urn']));
      result.current.addConnector(makeConnector('b', ['pupil_hash']));
    });
    expect(result.current.edges).toEqual([]);
  });

  it('removes nodes', () => {
    const { result } = renderHook(() => useCanvasState());
    act(() => {
      result.current.addConnector(makeConnector('a', ['urn']));
    });
    const nodeId = result.current.nodes[0].id;
    act(() => result.current.removeNode(nodeId));
    expect(result.current.nodes).toHaveLength(0);
  });

  it('moves a node to new position', () => {
    const { result } = renderHook(() => useCanvasState());
    act(() => result.current.addConnector(makeConnector('a', ['urn'])));
    const nodeId = result.current.nodes[0].id;
    act(() => result.current.moveNode(nodeId, { x: 200, y: 300 }));
    expect(result.current.nodes[0].position).toEqual({ x: 200, y: 300 });
  });
});
