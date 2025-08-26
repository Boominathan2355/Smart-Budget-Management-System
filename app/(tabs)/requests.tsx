import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Clock, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';
import { RequestCard } from '@/components/requests/RequestCard';
import { SearchHeader } from '@/components/requests/SearchHeader';
import { FilterModal } from '@/components/requests/FilterModal';

const mockRequests = [
  {
    id: '1',
    title: 'Laboratory Equipment Purchase',
    amount: 45000,
    status: 'pending',
    createdAt: '2024-01-15',
    department: 'Computer Science',
    priority: 'high',
  },
  {
    id: '2',
    title: 'Office Supplies',
    amount: 12500,
    status: 'approved',
    createdAt: '2024-01-14',
    department: 'Administration',
    priority: 'normal',
  },
  {
    id: '3',
    title: 'Conference Travel',
    amount: 85000,
    status: 'hod_approved',
    createdAt: '2024-01-13',
    department: 'Engineering',
    priority: 'normal',
  },
];

export default function RequestsScreen() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const filterTabs = [
    { key: 'all', label: 'All', count: 24 },
    { key: 'pending', label: 'Pending', count: 8 },
    { key: 'approved', label: 'Approved', count: 12 },
    { key: 'rejected', label: 'Rejected', count: 4 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <SearchHeader 
        onFilterPress={() => setShowFilterModal(true)}
      />
      
      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterTabs}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterTabsContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                selectedFilter === item.key && styles.filterTabActive
              ]}
              onPress={() => setSelectedFilter(item.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedFilter === item.key && styles.filterTabTextActive
                ]}
              >
                {item.label}
              </Text>
              <View style={[
                styles.filterTabBadge,
                selectedFilter === item.key && styles.filterTabBadgeActive
              ]}>
                <Text style={[
                  styles.filterTabBadgeText,
                  selectedFilter === item.key && styles.filterTabBadgeTextActive
                ]}>
                  {item.count}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Requests List */}
      <FlatList
        data={mockRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RequestCard request={item} />}
        contentContainerStyle={styles.requestsList}
        showsVerticalScrollIndicator={false}
      />

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilter={(filters) => {
          // Apply filters logic
          setShowFilterModal(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  filterTabs: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterTabsContent: {
    paddingHorizontal: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterTabActive: {
    backgroundColor: '#2563eb',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginRight: 6,
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  filterTabBadge: {
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterTabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterTabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  filterTabBadgeTextActive: {
    color: '#ffffff',
  },
  requestsList: {
    padding: 16,
  },
});