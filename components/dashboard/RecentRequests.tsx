import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Clock, CircleCheck as CheckCircle, Circle as XCircle, ChevronRight } from 'lucide-react-native';

const mockRequests = [
  {
    id: '1',
    title: 'Laboratory Equipment',
    amount: 45000,
    status: 'pending',
    submittedAt: '2024-01-15',
    department: 'Computer Science',
  },
  {
    id: '2',
    title: 'Office Supplies',
    amount: 12500,
    status: 'approved',
    submittedAt: '2024-01-14',
    department: 'Administration',
  },
  {
    id: '3',
    title: 'Conference Travel',
    amount: 28000,
    status: 'rejected',
    submittedAt: '2024-01-13',
    department: 'Engineering',
  },
];

export function RecentRequests() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} color="#f59e0b" />;
      case 'approved':
        return <CheckCircle size={16} color="#10b981" />;
      case 'rejected':
        return <XCircle size={16} color="#ef4444" />;
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
      default:
        return '#6b7280';
    }
  };

  const renderRequestItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.requestItem}>
      <View style={styles.requestMain}>
        <View style={styles.requestHeader}>
          <Text style={styles.requestTitle}>{item.title}</Text>
          <View style={styles.statusContainer}>
            {getStatusIcon(item.status)}
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.requestDetails}>
          <Text style={styles.amount}>₹{item.amount.toLocaleString('en-IN')}</Text>
          <Text style={styles.department}>{item.department}</Text>
        </View>
        
        <Text style={styles.submittedAt}>
          Submitted on {new Date(item.submittedAt).toLocaleDateString('en-IN')}
        </Text>
      </View>
      
      <ChevronRight size={16} color="#d1d5db" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Requests</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.requestsList}>
        <FlatList
          data={mockRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequestItem}
          scrollEnabled={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  requestsList: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  requestMain: {
    flex: 1,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  requestDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  department: {
    fontSize: 14,
    color: '#6b7280',
  },
  submittedAt: {
    fontSize: 12,
    color: '#9ca3af',
  },
});