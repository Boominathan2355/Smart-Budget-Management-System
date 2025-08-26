import { useState, useEffect } from 'react';
import { useRealtimeUpdates } from './useRealtimeUpdates';
import type { Request } from './useRequests';

interface Approval extends Request {
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export function useApprovals() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
      const response = await fetch('/api/approvals');
      const data = await response.json();
      setApprovals(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch approvals');
      console.error('Error fetching approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, notes: string) => {
    try {
      const response = await fetch(`/api/approvals/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve request');
      }

      const updatedApproval = await response.json();
      setApprovals(prev => prev.map(approval => 
        approval.id === id ? updatedApproval : approval
      ));
    } catch (err) {
      console.error('Error approving request:', err);
      throw err;
    }
  };

  const handleReject = async (id: string, notes: string) => {
    try {
      const response = await fetch(`/api/approvals/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject request');
      }

      const updatedApproval = await response.json();
      setApprovals(prev => prev.map(approval => 
        approval.id === id ? updatedApproval : approval
      ));
    } catch (err) {
      console.error('Error rejecting request:', err);
      throw err;
    }
  };

  // Subscribe to real-time updates
  useRealtimeUpdates('approval_created', (newApproval) => {
    setApprovals(prev => [newApproval, ...prev]);
  });

  useRealtimeUpdates('approval_updated', (updatedApproval) => {
    setApprovals(prev => prev.map(approval => 
      approval.id === updatedApproval.id ? updatedApproval : approval
    ));
  });

  return { 
    approvals, 
    loading, 
    error, 
    refetch: fetchApprovals,
    handleApprove,
    handleReject
  };
}
