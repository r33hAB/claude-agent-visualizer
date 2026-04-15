import { useState, useEffect, useRef, useCallback } from 'react';
import type { AgentState, InteractionEvent, SwarmState } from '../types/agent';

const WS_URL = `ws://${window.location.hostname}:${window.location.port}/ws`;
const RECONNECT_DELAY = 2000;

export function useAgentData() {
  const [agents, setAgents] = useState<Map<string, AgentState>>(new Map());
  const [interactions, setInteractions] = useState<InteractionEvent[]>([]);
  const [swarm, setSwarm] = useState<SwarmState>({
    environment: 'idle',
    totalAgents: 0,
    activeAgents: 0,
    errorCount: 0,
    elapsedMs: 0,
  });
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          agents: Record<string, AgentState>;
          interactions: InteractionEvent[];
          swarm: SwarmState;
        };
        setAgents(new Map(Object.entries(data.agents)));
        setInteractions(data.interactions);
        setSwarm(data.swarm);
      } catch { /* ignore malformed */ }
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  return { agents, interactions, swarm, connected };
}
