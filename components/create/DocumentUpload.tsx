import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { FileText, X, Image } from 'lucide-react-native';

interface DocumentUploadProps {
  attachments: any[];
  onRemoveAttachment: (index: number) => void;
}

export function DocumentUpload({ attachments, onRemoveAttachment }: DocumentUploadProps) {
  if (attachments.length === 0) {
    return null;
  }

  const renderAttachment = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.attachmentItem}>
      <View style={styles.attachmentInfo}>
        <View style={styles.attachmentIcon}>
          {item.type === 'image' ? (
            <Image size={20} color="#2563eb" />
          ) : (
            <FileText size={20} color="#2563eb" />
          )}
        </View>
        <View style={styles.attachmentDetails}>
          <Text style={styles.attachmentName}>
            {item.name || `${item.type === 'image' ? 'Photo' : 'Document'} ${index + 1}`}
          </Text>
          <Text style={styles.attachmentSize}>
            {item.size ? `${(item.size / 1024).toFixed(1)} KB` : 'Unknown size'}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => onRemoveAttachment(index)}
      >
        <X size={16} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attached Documents ({attachments.length})</Text>
      
      <FlatList
        data={attachments}
        keyExtractor={(item, index) => `${item.uri || item.id}-${index}`}
        renderItem={renderAttachment}
        style={styles.attachmentsList}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  attachmentsList: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  attachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  attachmentDetails: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  attachmentSize: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});