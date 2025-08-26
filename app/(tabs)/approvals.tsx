import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, X, Clock, CircleAlert as AlertCircle } from 'lucide-react-native';
import { ApprovalCard } from '@/components/approvals/ApprovalCard';
import { ApprovalModal } from '@/components/approvals/ApprovalModal';

const mockApprovals = [
  {
    id: '1',
    title: 'New Projector for Classroom 101',
    requester: 'Dr. Sarah Johnson',
    department: 'Computer Science',
    amount: 35000,
    priority: 'high',
    submittedAt: '2024-01-15T10:30:00Z',
    category: 'Equipment',
    status: 'pending',
    currentLevel: 'hod',
  },
  {
    id: '2',
    title: 'Research Conference Registration',
    requester: 'Prof. Michael Chen',
    department: 'Engineering',
    amount: 75000,
    priority: 'normal',
    submittedAt: '2024-01-14T14:20:00Z',
    category: 'Travel',
    status: 'pending',
    currentLevel: 'vice_principal',
  },
  {
    id: '3',
    title: 'Laboratory Safety Equipment',
    requester: 'Dr. Emily Davis',
    department: 'Chemistry',
    amount: 28000,
    priority: 'urgent',
    submittedAt: '2024-01-13T09:15:00Z',
    category: 'Equipment',
    status: 'pending',
    currentLevel: 'hod',
  },
];

export default function ApprovalsScreen() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const pendingCount = mockApprovals.filter(req => req.status === 'pending').length;
  const urgentCount = mockApprovals.filter(req => req.priority === 'urgent').length;

  const handleApprovalAction = (requestId: string, action: 'approve' | 'reject', comments?: string) => {
    // Handle approval logic
    console.log(`${action} request ${requestId} with comments: ${comments}`);
    setShowApprovalModal(false);
    setSelectedRequest(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pending Approvals</Text>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Clock size={16} color="#f59e0b" />
            <Text style={styles.statText}>{pendingCount} Pending</Text>
          </View>
          <View style={styles.statItem}>
            <AlertCircle size={16} color="#ef4444" />
            <Text style={styles.statText}>{urgentCount} Urgent</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={mockApprovals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ApprovalCard
            request={item}
            onPress={() => {
              setSelectedRequest(item);
              setShowApprovalModal(true);
            }}
          />
        )}
        contentContainerStyle={styles.requestsList}
        showsVerticalScrollIndicator={false}
      />

      <ApprovalModal
        visible={showApprovalModal}
        request={selectedRequest}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedRequest(null);
        }}
        onApprove={(comments) => handleApprovalAction(selectedRequest?.id, 'approve', comments)}
        onReject={(comments) => handleApprovalAction(selectedRequest?.id, 'reject', comments)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  requestsList: {
    padding: 16,
  },
});