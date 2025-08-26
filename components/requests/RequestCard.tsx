import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { createBoxShadow } from '../../utils/shadow';

import { Request } from '../../hooks/useRequests';

interface RequestCardProps {
  request: Request;
  onPress?: (request: Request) => void;
}

export function RequestCard({ request }: RequestCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} color="#f59e0b" />;
      case 'approved':
        return <CheckCircle size={16} color="#10b981" />;
      case 'rejected':
        return <XCircle size={16} color="#ef4444" />;
      case 'hod_approved':
        return <AlertCircle size={16} color="#3b82f6" />;
      default:
        return <Clock size={16} color="#6b7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      case 'hod_approved':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'normal':
        return '#6b7280';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  return (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {request.title}
          </Text>
          {request.priority === 'high' && (
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>HIGH</Text>
            </View>
          )}
        </View>
        
        <View style={styles.statusContainer}>
          {getStatusIcon(request.status)}
          <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
            {request.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.amountRow}>
          <Text style={styles.amount}>₹{request.amount.toLocaleString('en-IN')}</Text>
          <Text style={styles.department}>{request.department}</Text>
        </View>
        
        <Text style={styles.submittedAt}>
          Submitted on {new Date(request.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </Text>
      </View>

      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill,
            { 
              backgroundColor: getStatusColor(request.status),
              width: request.status === 'approved' ? '100%' : 
                     request.status === 'hod_approved' ? '60%' : '30%'
            }
          ]} 
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleRow: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
  },
  priorityBadge: {
    backgroundColor: '#fef2f2',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ef4444',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardContent: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  department: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  submittedAt: {
    fontSize: 12,
    color: '#9ca3af',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});