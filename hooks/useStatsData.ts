import { useEffect, useState } from 'react';
import { useRealtimeUpdates } from './useRealtimeUpdates';

interface Stats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  totalBudget: number;
}

export function useStatsData() {
  const [stats, setStats] = useState<Stats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    totalBudget: 0
  });

  useEffect(() => {
    // Initial fetch of stats
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        // Use mock data in development
        setStats({
          totalRequests: 24500,
          pendingRequests: 12,
          approvedRequests: 45,
          totalBudget: 6800000
        });
        return;
      }

      const response = await fetch('/api/stats');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default data on error
      setStats({
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        totalBudget: 0
      });
    }
  };

  // Subscribe to real-time updates
  useRealtimeUpdates('stats_updated', (newStats: Stats) => {
    setStats(newStats);
  });

  return stats;
}
