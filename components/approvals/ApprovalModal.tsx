import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { X, Check, Bone as XIcon, User, Building, Calendar, DollarSign } from 'lucide-react-native';

interface ApprovalModalProps {
  visible: boolean;
  request: any;
  onClose: () => void;
  onApprove: (comments?: string) => void;
  onReject: (comments?: string) => void;
}

export function ApprovalModal({ visible, request, onClose, onApprove, onReject }: ApprovalModalProps) {
  const [comments, setComments] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');

  if (!request) return null;

  const handleApprove = () => {
    if (!comments.trim()) {
      Alert.alert('Comments Required', 'Please provide approval comments');
      return;
    }
    onApprove(comments);
    setComments('');
    setApprovedAmount('');
  };

  const handleReject = () => {
    if (!comments.trim()) {
      Alert.alert('Comments Required', 'Please provide rejection reason');
      return;
    }
    onReject(comments);
    setComments('');
    setApprovedAmount('');
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Request</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Request Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Request Details</Text>
            
            <View style={styles.detailCard}>
              <Text style={styles.requestTitle}>{request.title}</Text>
              
              <View style={styles.detailRow}>
                <User size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Requester:</Text>
                <Text style={styles.detailValue}>{request.requester}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Building size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Department:</Text>
                <Text style={styles.detailValue}>{request.department}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <DollarSign size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={styles.amountValue}>₹{request.amount.toLocaleString('en-IN')}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Calendar size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Submitted:</Text>
                <Text style={styles.detailValue}>
                  {getDaysAgo(request.submittedAt)} day{getDaysAgo(request.submittedAt) > 1 ? 's' : ''} ago
                </Text>
              </View>
            </View>
          </View>

          {/* Category Badge */}
          <View style={styles.categoryContainer}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{request.category}</Text>
            </View>
            {request.priority === 'urgent' && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>URGENT</Text>
              </View>
            )}
          </View>

          {/* Comments Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comments</Text>
            <TextInput
              style={styles.commentsInput}
              placeholder="Add your approval/rejection comments..."
              value={comments}
              onChangeText={setComments}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Approved Amount (for approvals) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Approved Amount (Optional)</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter approved amount if different"
              value={approvedAmount}
              onChangeText={setApprovedAmount}
              keyboardType="numeric"
            />
            <Text style={styles.amountHint}>
              Leave empty to approve full amount of ₹{request.amount.toLocaleString('en-IN')}
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton]} 
            onPress={handleReject}
          >
            <XIcon size={20} color="#ffffff" />
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.approveButton]} 
            onPress={handleApprove}
          >
            <Check size={20} color="#ffffff" />
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  amountValue: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '700',
    flex: 1,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  categoryBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textTransform: 'capitalize',
  },
  urgentBadge: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  urgentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  commentsInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    minHeight: 100,
  },
  amountInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  amountHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});