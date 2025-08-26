import { useState, useEffect } from 'react';
import { useRealtimeUpdates } from './useRealtimeUpdates';

export interface Request {
  id: string;
  title: string;
  amount: number;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'hod_approved';
  createdAt: string;
  department: string;
  priority: 'low' | 'medium' | 'high';
  attachments?: string[];
}

export function useRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
      const response = await fetch('/api/requests');
      const data = await response.json();
      setRequests(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch requests');
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time updates
  useRealtimeUpdates('request_created', (newRequest) => {
    setRequests(prev => [newRequest, ...prev]);
  });

  useRealtimeUpdates('request_updated', (updatedRequest) => {
    setRequests(prev => prev.map(request => 
      request.id === updatedRequest.id ? updatedRequest : request
    ));
  });

  useRealtimeUpdates('request_deleted', (deletedId) => {
    setRequests(prev => prev.filter(request => request.id !== deletedId));
  });

  return { requests, loading, error, refetch: fetchRequests };
}
