import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, User, Building, Calendar, TriangleAlert as AlertTriangle } from 'lucide-react-native';

interface ApprovalCardProps {
  request: {
    id: string;
    title: string;
    requester: string;
    department: string;
    amount: number;
    priority: string;
    submittedAt: string;
    category: string;
    status: string;
    currentLevel: string;
  };
  onPress: () => void;
}

export function ApprovalCard({ request, onPress }: ApprovalCardProps) {
  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysAgo = getDaysAgo(request.submittedAt);
  const isUrgent = request.priority === 'urgent';
  const isOverdue = daysAgo > 3;

  return (
    <TouchableOpacity style={[
      styles.card,
      isUrgent && styles.urgentCard,
      isOverdue && styles.overdueCard
    ]} onPress={onPress}>
      {/* Priority Indicator */}
      {(isUrgent || isOverdue) && (
        <View style={styles.priorityIndicator}>
          <AlertTriangle size={16} color={isUrgent ? '#ef4444' : '#f59e0b'} />
          <Text style={[
            styles.priorityText,
            { color: isUrgent ? '#ef4444' : '#f59e0b' }
          ]}>
            {isUrgent ? 'URGENT' : 'OVERDUE'}
          </Text>
        </View>
      )}

      {/* Request Header */}
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {request.title}
        </Text>
        <Text style={styles.amount}>₹{request.amount.toLocaleString('en-IN')}</Text>
      </View>

      {/* Request Details */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <User size={14} color="#6b7280" />
          <Text style={styles.detailText}>{request.requester}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Building size={14} color="#6b7280" />
          <Text style={styles.detailText}>{request.department}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Calendar size={14} color="#6b7280" />
          <Text style={styles.detailText}>
            {daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`}
          </Text>
        </View>
      </View>

      {/* Category and Status */}
      <View style={styles.footer}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{request.category}</Text>
        </View>
        
        <View style={styles.approvalLevel}>
          <Clock size={12} color="#f59e0b" />
          <Text style={styles.approvalLevelText}>
            {request.currentLevel.replace('_', ' ').toUpperCase()} Level
          </Text>
        </View>
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
    borderLeftWidth: 4,
    borderLeftColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  urgentCard: {
    borderLeftColor: '#ef4444',
    backgroundColor: '#fefefe',
  },
  overdueCard: {
    borderLeftColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  priorityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  details: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  approvalLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  approvalLevelText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#f59e0b',
  },
});