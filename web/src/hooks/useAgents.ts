import { useState, useEffect } from 'react';
import { agentApi } from '@/lib/api';
import type { Agent } from '@/types/project';

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedAgents = await agentApi.getAgents();
        setAgents(fetchedAgents);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch agents');
        console.error('Failed to fetch agents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  return {
    agents,
    loading,
    error,
    refetch: () => {
      const fetchAgents = async () => {
        try {
          setLoading(true);
          setError(null);
          const fetchedAgents = await agentApi.getAgents();
          setAgents(fetchedAgents);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch agents');
          console.error('Failed to fetch agents:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchAgents();
    }
  };
}