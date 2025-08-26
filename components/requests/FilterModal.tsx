import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, Check } from 'lucide-react-native';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilter: (filters: any) => void;
}

export function FilterModal({ visible, onClose, onApplyFilter }: FilterModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<string[]>([]);

  const statusOptions = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'hod_approved', label: 'HOD Approved' },
  ];

  const categoryOptions = [
    { key: 'equipment', label: 'Equipment' },
    { key: 'supplies', label: 'Supplies' },
    { key: 'services', label: 'Services' },
    { key: 'travel', label: 'Travel' },
    { key: 'training', label: 'Training' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'other', label: 'Other' },
  ];

  const priorityOptions = [
    { key: 'low', label: 'Low' },
    { key: 'normal', label: 'Normal' },
    { key: 'high', label: 'High' },
    { key: 'urgent', label: 'Urgent' },
  ];

  const toggleSelection = (value: string, selectedArray: string[], setSelected: (arr: string[]) => void) => {
    if (selectedArray.includes(value)) {
      setSelected(selectedArray.filter(item => item !== value));
    } else {
      setSelected([...selectedArray, value]);
    }
  };

  const clearAllFilters = () => {
    setSelectedStatus([]);
    setSelectedCategory([]);
    setSelectedPriority([]);
  };

  const applyFilters = () => {
    const filters = {
      status: selectedStatus,
      category: selectedCategory,
      priority: selectedPriority,
    };
    onApplyFilter(filters);
  };

  const renderFilterSection = (
    title: string,
    options: { key: string; label: string }[],
    selected: string[],
    onToggle: (value: string) => void
  ) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionTitle}>{title}</Text>
      <View style={styles.filterOptions}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterOption,
              selected.includes(option.key) && styles.filterOptionSelected
            ]}
            onPress={() => onToggle(option.key)}
          >
            <Text style={[
              styles.filterOptionText,
              selected.includes(option.key) && styles.filterOptionTextSelected
            ]}>
              {option.label}
            </Text>
            {selected.includes(option.key) && (
              <Check size={16} color="#ffffff" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      transparent={true}
    >
      <View 
        style={styles.container}
        onStartShouldSetResponder={() => true}
        onResponderGrant={e => e.stopPropagation()}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filter Requests</Text>
          <TouchableOpacity onPress={clearAllFilters}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderFilterSection(
            'Status',
            statusOptions,
            selectedStatus,
            (value) => toggleSelection(value, selectedStatus, setSelectedStatus)
          )}

          {renderFilterSection(
            'Category',
            categoryOptions,
            selectedCategory,
            (value) => toggleSelection(value, selectedCategory, setSelectedCategory)
          )}

          {renderFilterSection(
            'Priority',
            priorityOptions,
            selectedPriority,
            (value) => toggleSelection(value, selectedPriority, setSelectedPriority)
          )}
        </ScrollView>

        {/* Apply Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
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
    touchAction: 'none',
    userSelect: 'none',
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
  clearText: {
    fontSize: 16,
    color: '#ef4444',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
  },
  filterOptionSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#111827',
  },
  filterOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  applyButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});